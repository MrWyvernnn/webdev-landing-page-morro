import { beforeEach, describe, expect, it } from "vitest";
import { handle } from "../worker/index";
import { memoryStore, type WaitlistRow } from "../worker/store";
import type { Env } from "../worker/types";

const ORIGIN = "https://morro.test";
let clock = 1_760_000_000_000;
const sent: { to: string; confirmUrl: string; ignoreUrl: string }[] = [];

function makeEnv(): Env {
  return {
    DB: undefined as unknown as Env["DB"],
    IP_SALT: "test-salt",
    APP_ORIGIN: ORIGIN,
    RESEND_API_KEY: "re_test",
    FROM_EMAIL: "Morro <hi@morro.test>",
  };
}

function deps(store = memoryStore()) {
  return {
    store,
    now: () => clock,
    send: async (_env: Env, options: { to: string; confirmUrl: string; ignoreUrl: string }) => {
      sent.push(options);
      return { ok: true as const };
    },
  };
}

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`${ORIGIN}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function signupBody(overrides: Record<string, unknown> = {}) {
  return {
    email: "person@example.com",
    ref: "ProductHunt",
    marketing: false,
    privacyAccepted: true,
    policyVersion: "2026-11-17",
    startedAt: clock - 10_000,
    botcheck: "",
    ...overrides,
  };
}

const token = (url: string) => new URL(url).searchParams.get("t") ?? "";
const json = async (response: Response) => (await response.json()) as Record<string, unknown>;

beforeEach(() => {
  clock = 1_760_000_000_000;
  sent.length = 0;
});

describe("signup creates a pending row and sends one confirmation", () => {
  it("responds with a uniform 202 and mails only the confirm link", async () => {
    const store = memoryStore();
    const response = await handle(post("/api/waitlist", signupBody()), makeEnv(), deps(store));
    expect(response.status).toBe(202);
    expect(await json(response)).toEqual({ ok: true });
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("person@example.com");
    expect(sent[0].confirmUrl).toContain("/confirm?t=");
    expect(token(sent[0].confirmUrl)).toHaveLength(43);
  });

  it("stores the address as pending, never confirmed, without the raw token", async () => {
    const store = memoryStore();
    await handle(post("/api/waitlist", signupBody()), makeEnv(), deps(store));
    const row = (await store.findByEmail("person@example.com")) as WaitlistRow;
    expect(row.status).toBe("pending");
    expect(row.confirmed_at).toBeNull();
    expect(row.marketing).toBe(0);
    expect(row.policy_version).toBe("2026-11-17");
    expect(row.token_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(row.token_hash).not.toBe(token(sent[0].confirmUrl));
    expect(row.ip_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("keeps the optional marketing opt-in out of the beta consent", async () => {
    const store = memoryStore();
    await handle(post("/api/waitlist", signupBody({ marketing: true })), makeEnv(), deps(store));
    const row = (await store.findByEmail("person@example.com")) as WaitlistRow;
    expect(row.marketing).toBe(1);
  });
});

describe("abuse paths", () => {
  it("drops a honeypot submission without storing or mailing", async () => {
    const store = memoryStore();
    const response = await handle(post("/api/waitlist", signupBody({ botcheck: "1" })), makeEnv(), deps(store));
    expect(response.status).toBe(202);
    expect(await store.findByEmail("person@example.com")).toBeNull();
    expect(sent).toHaveLength(0);
  });

  it("drops a form submitted faster than a human can read it", async () => {
    const store = memoryStore();
    const response = await handle(
      post("/api/waitlist", signupBody({ startedAt: clock - 200 })),
      makeEnv(),
      deps(store),
    );
    expect(response.status).toBe(202);
    expect(await store.findByEmail("person@example.com")).toBeNull();
    expect(sent).toHaveLength(0);
  });

  it("rate limits one connection after eight attempts in the window", async () => {
    const store = memoryStore();
    const run = deps(store);
    const env = makeEnv();
    const headers = { "cf-connecting-ip": "203.0.113.9" };
    const statuses: number[] = [];
    for (let index = 0; index < 9; index += 1) {
      const response = await handle(
        post("/api/waitlist", signupBody({ email: `person${index}@example.com` }), headers),
        env,
        run,
      );
      statuses.push(response.status);
    }
    expect(statuses.slice(0, 8)).toEqual(Array(8).fill(202));
    expect(statuses[8]).toBe(429);
    expect(sent).toHaveLength(8);
  });

  it("rejects a cross-site post", async () => {
    const store = memoryStore();
    const response = await handle(
      post("/api/waitlist", signupBody(), { origin: "https://evil.example" }),
      makeEnv(),
      deps(store),
    );
    expect(response.status).toBe(403);
    expect(sent).toHaveLength(0);
  });

  it("accepts an allow-listed origin from another port", async () => {
    const store = memoryStore();
    const env = { ...makeEnv(), APP_ORIGIN: "https://a.test, http://127.0.0.1:5173" };
    const response = await handle(
      post("/api/waitlist", signupBody(), { origin: "http://127.0.0.1:5173" }),
      env,
      deps(store),
    );
    expect(response.status).toBe(202);
    expect(sent).toHaveLength(1);
  });

  it("rejects an oversized body", async () => {
    const response = await handle(
      post("/api/waitlist", { ...signupBody(), padding: "x".repeat(5000) }),
      makeEnv(),
      deps(),
    );
    expect(response.status).toBe(400);
  });

  it("refuses to store an address without explicit privacy consent", async () => {
    const response = await handle(
      post("/api/waitlist", signupBody({ privacyAccepted: false })),
      makeEnv(),
      deps(),
    );
    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ ok: false, error: "consent" });
  });

  it("answers an existing address exactly like a new one", async () => {
    const store = memoryStore();
    const run = deps(store);
    const env = makeEnv();
    const first = await handle(post("/api/waitlist", signupBody()), env, run);
    const second = await handle(post("/api/waitlist", signupBody()), env, run);
    expect(second.status).toBe(first.status);
    expect(await json(second)).toEqual(await json(first));
  });
});

describe("resend behaviour", () => {
  it("does not mail twice inside the cooldown", async () => {
    const store = memoryStore();
    const run = deps(store);
    const env = makeEnv();
    await handle(post("/api/waitlist", signupBody()), env, run);
    clock += 30_000;
    await handle(post("/api/waitlist", signupBody()), env, run);
    expect(sent).toHaveLength(1);
  });

  it("issues a fresh single-use token after the cooldown", async () => {
    const store = memoryStore();
    const run = deps(store);
    const env = makeEnv();
    await handle(post("/api/waitlist", signupBody()), env, run);
    const firstToken = token(sent[0].confirmUrl);

    clock += 5 * 60_000;
    await handle(post("/api/waitlist", signupBody()), env, run);
    expect(sent).toHaveLength(2);
    const secondToken = token(sent[1].confirmUrl);
    expect(secondToken).not.toBe(firstToken);

    const stale = await handle(post("/api/confirm", { token: firstToken }), env, run);
    expect(stale.status).toBe(400);
    const fresh = await handle(post("/api/confirm", { token: secondToken }), env, run);
    expect(fresh.status).toBe(200);
  });

  it("never mails a confirmed or unsubscribed address again", async () => {
    const store = memoryStore();
    const run = deps(store);
    const env = makeEnv();
    await handle(post("/api/waitlist", signupBody()), env, run);
    const confirmToken = token(sent[0].confirmUrl);
    await handle(post("/api/confirm", { token: confirmToken }), env, run);

    const before = sent.length;
    clock += 10 * 60_000;
    const again = await handle(post("/api/waitlist", signupBody()), env, run);
    expect(again.status).toBe(202);
    expect(sent).toHaveLength(before);
  });
});

describe("confirmation", () => {
  it("confirms once, then reports already-confirmed", async () => {
    const store = memoryStore();
    const run = deps(store);
    const env = makeEnv();
    await handle(post("/api/waitlist", signupBody()), env, run);
    const confirmToken = token(sent[0].confirmUrl);

    const first = await handle(post("/api/confirm", { token: confirmToken }), env, run);
    expect(first.status).toBe(200);
    expect(await json(first)).toEqual({ ok: true, state: "confirmed" });

    const row = (await store.findByEmail("person@example.com")) as WaitlistRow;
    expect(row.status).toBe("confirmed");
    expect(row.confirmed_at).toBe(clock);
    expect(row.token_hash).toBeNull();

    const second = await handle(post("/api/confirm", { token: confirmToken }), env, run);
    expect(second.status).toBe(400);
  });

  it("rejects an expired token after 48 hours", async () => {
    const store = memoryStore();
    const run = deps(store);
    const env = makeEnv();
    await handle(post("/api/waitlist", signupBody()), env, run);
    const confirmToken = token(sent[0].confirmUrl);

    clock += 48 * 60 * 60 * 1000 + 1;
    const response = await handle(post("/api/confirm", { token: confirmToken }), env, run);
    expect(response.status).toBe(410);
    expect(await json(response)).toEqual({ ok: false, error: "expired" });
    expect((await store.findByEmail("person@example.com"))?.status).toBe("pending");
  });

  it("rejects a made-up token", async () => {
    const response = await handle(
      post("/api/confirm", { token: "a".repeat(43) }),
      makeEnv(),
      deps(),
    );
    expect(response.status).toBe(400);
  });
});

describe("unsubscribe", () => {
  it("removes the address with the manage link and stops future mail", async () => {
    const store = memoryStore();
    const run = deps(store);
    const env = makeEnv();
    await handle(post("/api/waitlist", signupBody()), env, run);
    const manage = token(sent[0].ignoreUrl);

    const response = await handle(post("/api/unsubscribe", { token: manage }), env, run);
    expect(response.status).toBe(200);
    expect((await store.findByEmail("person@example.com"))?.status).toBe("unsubscribed");

    const before = sent.length;
    clock += 10 * 60_000;
    await handle(post("/api/waitlist", signupBody()), env, run);
    expect(sent).toHaveLength(before);
  });

  it("rejects an unknown manage token", async () => {
    const response = await handle(
      post("/api/unsubscribe", { token: "b".repeat(43) }),
      makeEnv(),
      deps(),
    );
    expect(response.status).toBe(400);
  });
});

describe("pages and routing", () => {
  it("serves a confirm page that only spends the token on a click", async () => {
    const response = await handle(new Request(`${ORIGIN}/confirm?t=abc`), makeEnv(), deps());
    expect(response.status).toBe(200);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.text();
    expect(body).toContain("Confirm my spot");
    expect(body).toContain("/api/confirm");
    expect(body).not.toMatch(/<meta[^>]+http-equiv="refresh"/i);
  });

  it("404s unknown API paths and 405s the wrong method", async () => {
    expect((await handle(new Request(`${ORIGIN}/api/nope`), makeEnv(), deps())).status).toBe(404);
    expect((await handle(new Request(`${ORIGIN}/api/waitlist`), makeEnv(), deps())).status).toBe(405);
  });

  it("reports not-configured instead of crashing without a database", async () => {
    const response = await handle(post("/api/waitlist", signupBody()), makeEnv());
    expect(response.status).toBe(503);
  });
});
