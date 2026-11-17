import {
  MAX_BODY_BYTES,
  RATE_LIMIT,
  TOKEN_TTL_MS,
  decide,
  hashIp,
  looksAutomated,
  parseSignup,
  randomToken,
  rateWindowStart,
  sha256Hex,
} from "./core";
import { sendConfirmation } from "./email";
import { confirmationPage, unsubscribePage } from "./pages";
import { d1Store, type WaitlistStore } from "./store";
import type { Env } from "./types";

export type { Env } from "./types";

const JSON_HEADERS: Record<string, string> = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "strict-transport-security": "max-age=31536000",
};

const PAGE_HEADERS: Record<string, string> = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  // A token lives in the URL: it must never travel in a Referer header.
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "strict-transport-security": "max-age=31536000",
  "content-security-policy":
    "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
};

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extra } });
}

function html(body: string): Response {
  return new Response(body, { status: 200, headers: PAGE_HEADERS });
}

/**
 * Only the site itself may post here; a browser always sends Origin on cross-site
 * POSTs. APP_ORIGIN may hold a comma-separated allow-list, which is what makes
 * the local Vite server work when it proxies to `wrangler dev` on another port.
 */
function sameOrigin(request: Request, env: Env): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const allowed = new Set([new URL(request.url).origin]);
  for (const entry of (env.APP_ORIGIN ?? "").split(",")) {
    const trimmed = entry.trim();
    if (trimmed) allowed.add(trimmed);
  }
  return allowed.has(origin);
}

async function readJson(request: Request): Promise<unknown> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) return null;
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export type Deps = {
  store: WaitlistStore;
  now: () => number;
  send: typeof sendConfirmation;
};

export async function handle(request: Request, env: Env, deps?: Partial<Deps>): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const now = deps?.now?.() ?? Date.now();

  if (path === "/confirm" || path === "/unsubscribe") {
    if (request.method !== "GET") return json({ ok: false, error: "method" }, 405);
    return html(path === "/confirm" ? confirmationPage() : unsubscribePage());
  }

  if (!path.startsWith("/api/")) {
    // Defensive: if routing ever sends a page request here, serve the asset
    // rather than a JSON 404. `_headers` still applies to asset responses.
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return json({ ok: false, error: "not-found" }, 404);
  }

  if (!env.DB && !deps?.store) return json({ ok: false, error: "not-configured" }, 503);
  const store = deps?.store ?? d1Store(env.DB);
  const send = deps?.send ?? sendConfirmation;

  if (request.method === "POST" && !sameOrigin(request, env)) {
    return json({ ok: false, error: "origin" }, 403);
  }

  if (path === "/api/waitlist") {
    if (request.method !== "POST") return json({ ok: false, error: "method" }, 405);

    const body = await readJson(request);
    if (body === null) return json({ ok: false, error: "payload" }, 400);

    const parsed = parseSignup(body);
    if (!parsed.ok) return json({ ok: false, error: parsed.reason }, 400);
    const signup = parsed.value;

    // Bots get the success shape and nothing else: no row, no email, no signal.
    if (looksAutomated(signup, now)) return json({ ok: true }, 202);

    const ipHash = await hashIp(
      request.headers.get("cf-connecting-ip") ?? "unknown",
      env.IP_SALT ?? "unset-salt",
    );
    const attempts = await store.bumpRate(ipHash, rateWindowStart(now));
    if (attempts > RATE_LIMIT) {
      return json({ ok: false, error: "rate" }, 429, { "retry-after": "3600" });
    }

    const existing = await store.findByEmail(signup.email);
    const action = decide(existing, now);
    if (action === "suppress") return json({ ok: true }, 202);

    const token = randomToken();
    const manageToken = randomToken();
    const tokenHash = await sha256Hex(token);
    const manageHash = await sha256Hex(manageToken);
    const expiresAt = now + TOKEN_TTL_MS;

    if (action === "resend" && existing) {
      await store.reissueToken(existing.id, tokenHash, expiresAt, manageHash);
    } else {
      await store.insert({
        id: crypto.randomUUID(),
        email: signup.email,
        status: "pending",
        ref: signup.ref,
        marketing: signup.marketing ? 1 : 0,
        policy_version: signup.policyVersion,
        consent_at: new Date(now).toISOString(),
        token_hash: tokenHash,
        token_expires_at: expiresAt,
        manage_hash: manageHash,
        created_at: now,
        ip_hash: ipHash,
      });
    }

    const origin = env.APP_ORIGIN ?? url.origin;
    await send(env, {
      to: signup.email,
      confirmUrl: `${origin}/confirm?t=${token}`,
      ignoreUrl: `${origin}/unsubscribe?t=${manageToken}`,
    });

    // Uniform answer for new, resent and already-known addresses: the form
    // cannot be used to find out whether an address is on the list.
    return json({ ok: true }, 202);
  }

  if (path === "/api/confirm") {
    if (request.method !== "POST") return json({ ok: false, error: "method" }, 405);

    const body = (await readJson(request)) as { token?: unknown } | null;
    const token = typeof body?.token === "string" ? body.token : "";
    if (token.length < 16 || token.length > 128) return json({ ok: false, error: "invalid" }, 400);

    const row = await store.findByTokenHash(await sha256Hex(token));
    if (!row) return json({ ok: false, error: "invalid" }, 400);
    if (row.status === "confirmed") return json({ ok: true, state: "already" }, 200);
    if (row.status === "unsubscribed") return json({ ok: false, error: "invalid" }, 400);
    if (row.token_expires_at < now) return json({ ok: false, error: "expired" }, 410);

    await store.markConfirmed(row.id, now);
    return json({ ok: true, state: "confirmed" }, 200);
  }

  if (path === "/api/unsubscribe") {
    if (request.method !== "POST") return json({ ok: false, error: "method" }, 405);

    const body = (await readJson(request)) as { token?: unknown } | null;
    const token = typeof body?.token === "string" ? body.token : "";
    if (token.length < 16 || token.length > 128) return json({ ok: false, error: "invalid" }, 400);

    const row = await store.findByManageHash(await sha256Hex(token));
    if (!row) return json({ ok: false, error: "invalid" }, 400);

    await store.markUnsubscribed(row.id);
    return json({ ok: true, state: "removed" }, 200);
  }

  return json({ ok: false, error: "not-found" }, 404);
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handle(request, env);
  },
};
