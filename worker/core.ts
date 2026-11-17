import { POLICY_VERSION, isValidEmail, normalizeEmail, sanitizeRef } from "../src/lib/waitlist";
import type { WaitlistRow } from "./store";

export const TOKEN_TTL_MS = 48 * 60 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const RATE_WINDOW_MS = 60 * 60 * 1000;
export const RATE_LIMIT = 8;
/** A human cannot read the form and type an address in under two seconds. */
export const MIN_FILL_MS = 2000;
export const MAX_BODY_BYTES = 4096;

export type Signup = {
  email: string;
  ref: string;
  marketing: boolean;
  policyVersion: string;
  startedAt: number;
  honeypot: boolean;
};

export type Parsed =
  | { ok: true; value: Signup }
  | { ok: false; reason: "payload" | "email" | "consent" };

/** Never trusts the shape it is given: consent must be an explicit boolean true. */
export function parseSignup(input: unknown): Parsed {
  if (typeof input !== "object" || input === null) return { ok: false, reason: "payload" };
  const body = input as Record<string, unknown>;

  if (body.privacyAccepted !== true) return { ok: false, reason: "consent" };
  if (typeof body.email !== "string") return { ok: false, reason: "email" };

  const email = normalizeEmail(body.email);
  if (!isValidEmail(email)) return { ok: false, reason: "email" };

  const startedAt = typeof body.startedAt === "number" && Number.isFinite(body.startedAt)
    ? body.startedAt
    : 0;

  return {
    ok: true,
    value: {
      email,
      ref: sanitizeRef(typeof body.ref === "string" ? body.ref : null),
      marketing: body.marketing === true,
      policyVersion:
        typeof body.policyVersion === "string" ? body.policyVersion.slice(0, 32) : POLICY_VERSION,
      startedAt,
      honeypot: typeof body.botcheck === "string" && body.botcheck.length > 0,
    },
  };
}

/**
 * A bot filling a hidden field, or a form posted faster than anyone can type,
 * gets the same reply as a success and no email: it learns nothing and cannot
 * use the endpoint to send mail.
 */
export function looksAutomated(signup: Signup, now: number): boolean {
  if (signup.honeypot) return true;
  if (!signup.startedAt) return false;
  return now - signup.startedAt < MIN_FILL_MS;
}

export type Action = "insert" | "resend" | "suppress";

/**
 * Suppression is deliberate: an address that is already confirmed, or already
 * unsubscribed, must not produce another email, so the form can never be used
 * to flood a stranger's inbox.
 */
export function decide(existing: WaitlistRow | null, now: number): Action {
  if (!existing) return "insert";
  if (existing.status !== "pending") return "suppress";
  const fresh = existing.token_expires_at > now && now - existing.created_at < RESEND_COOLDOWN_MS;
  return fresh ? "suppress" : "resend";
}

export function rateWindowStart(now: number): number {
  return Math.floor(now / RATE_WINDOW_MS) * RATE_WINDOW_MS;
}

export function randomToken(bytes = 32): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  let binary = "";
  for (const byte of buffer) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** IPs are only ever stored as a salted hash, so the table is useless if it leaks. */
export async function hashIp(ip: string, salt: string): Promise<string> {
  return sha256Hex(`${ip}|${salt}`);
}
