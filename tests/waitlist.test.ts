import { describe, expect, it } from "vitest";
import {
  POLICY_VERSION,
  WAITLIST_SOCIAL_PROOF,
  canSubmit,
  consentRecord,
  isValidEmail,
  normalizeEmail,
  sanitizeRef,
} from "../src/lib/waitlist";

describe("sanitizeRef", () => {
  it("falls back to direct when the tag is missing or empty", () => {
    expect(sanitizeRef(null)).toBe("direct");
    expect(sanitizeRef(undefined)).toBe("direct");
    expect(sanitizeRef("")).toBe("direct");
    expect(sanitizeRef("!!!")).toBe("direct");
  });

  it("keeps ordinary campaign tags", () => {
    expect(sanitizeRef("ProductHunt")).toBe("producthunt");
    expect(sanitizeRef("x_post_2")).toBe("x_post_2");
    expect(sanitizeRef(" friend-of-a-friend ")).toBe("friend-of-a-friend");
  });

  it("strips anything that could become markup, a URL or a payload", () => {
    expect(sanitizeRef("javascript:alert(1)")).toBe("javascriptalert1");
    expect(sanitizeRef("<script>alert(1)</script>")).toBe("scriptalert1script");
    expect(sanitizeRef("https://evil.example")).toBe("httpsevilexample");
    expect(sanitizeRef("a&b=c?d#e")).toBe("abcde");
    expect(sanitizeRef("%00%0d%0a")).toBe("000d0a");
  });

  it("bounds the length so the field cannot be used to smuggle data", () => {
    expect(sanitizeRef("a".repeat(200)).length).toBe(32);
  });
});

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Someone@Example.COM \n")).toBe("someone@example.com");
  });
});

describe("isValidEmail", () => {
  it.each([
    "you@example.com",
    "first.last+tag@sub.example.co.uk",
    "a_b-c@my-domain.io",
  ])("accepts %s", (value) => {
    expect(isValidEmail(value)).toBe(true);
  });

  it.each([
    "",
    "you@example",
    "you example@test.com",
    "you@@example.com",
    "you@example..com",
    "you@.com",
    "you@-example.com",
    "@example.com",
    "you@exam ple.com",
  ])("rejects %s", (value) => {
    expect(isValidEmail(value)).toBe(false);
  });

  it("rejects an over-long address", () => {
    expect(isValidEmail(`${"a".repeat(64)}@${"b".repeat(190)}.com`)).toBe(false);
  });

  it("rejects markup and scripts", () => {
    expect(isValidEmail('<img src=x onerror="alert(1)">@example.com')).toBe(false);
  });
});

describe("consent gate", () => {
  it("refuses submission until the privacy box is ticked", () => {
    expect(canSubmit({ privacy: false, marketing: false })).toBe(false);
    expect(canSubmit({ privacy: false, marketing: true })).toBe(false);
    expect(canSubmit({ privacy: true, marketing: false })).toBe(true);
  });

  it("keeps marketing opt-in separate and unticked by default", () => {
    const receipt = consentRecord({ privacy: true, marketing: false }, new Date("2026-11-17T10:00:00Z"));
    expect(receipt.marketing_updates).toBe("no");
    expect(receipt.privacy_accepted).toBe("yes");
  });

  it("records the policy version and a timestamp as proof of consent", () => {
    const receipt = consentRecord({ privacy: true, marketing: true }, new Date("2026-11-17T10:00:00Z"));
    expect(receipt).toEqual({
      privacy_accepted: "yes",
      privacy_accepted_at: "2026-11-17T10:00:00.000Z",
      marketing_updates: "yes",
      policy_version: POLICY_VERSION,
    });
    expect(POLICY_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("social proof", () => {
  it("is a fixed sentence, not a number fetched at runtime", () => {
    expect(WAITLIST_SOCIAL_PROOF).toContain("30");
    expect(WAITLIST_SOCIAL_PROOF).toMatch(/joined the waitlist\.$/);
  });
});
