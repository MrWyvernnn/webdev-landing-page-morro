/**
 * Pure rules for the waitlist form, kept free of React and browser APIs so they
 * can be unit tested. Nothing here reads or writes storage, and nothing here can
 * report how many people have joined: the total is a static string on the page.
 */

/** Bumped when the privacy notice changes; sent with each signup as proof of what was agreed to. */
export const POLICY_VERSION = "2026-11-17";

/**
 * Shown as fixed text. There is no endpoint, form field or API that returns the
 * real number of signups, so the size of the list cannot be queried or scraped.
 */
export const WAITLIST_SOCIAL_PROOF = "More than 30 people have already joined the waitlist.";

const MAX_REF_LENGTH = 32;
const FALLBACK_REF = "direct";

/** Keeps referral tags inert: lowercase, URL-safe, bounded, never empty. */
export function sanitizeRef(raw: string | null | undefined): string {
  if (!raw) return FALLBACK_REF;
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, MAX_REF_LENGTH);
  return cleaned || FALLBACK_REF;
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

const EMAIL_PATTERN =
  /^[^\s@]{1,64}@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;

/** Deliberately stricter than the browser's loose `type="email"` check. */
export function isValidEmail(raw: string): boolean {
  const value = normalizeEmail(raw);
  return value.length > 3 && value.length <= 254 && EMAIL_PATTERN.test(value);
}

export type ConsentChoice = {
  /** Required: they read the notice and agreed to the email being used for the beta. */
  privacy: boolean;
  /** Optional, unticked by default: separate opt-in for launch marketing. */
  marketing: boolean;
};

export function canSubmit(choice: ConsentChoice): boolean {
  return choice.privacy === true;
}

/** The audit trail sent to the list owner alongside the address. */
export function consentRecord(choice: ConsentChoice, now: Date = new Date()) {
  return {
    privacy_accepted: choice.privacy ? "yes" : "no",
    privacy_accepted_at: now.toISOString(),
    marketing_updates: choice.marketing ? "yes" : "no",
    policy_version: POLICY_VERSION,
  };
}
