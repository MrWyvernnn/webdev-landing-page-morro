import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WAITLIST_SOCIAL_PROOF } from "../src/lib/waitlist";

const root = process.cwd();

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function sourceFiles(dir = "src"): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(join(root, dir))) {
    const relative = `${dir}/${entry}`;
    const stats = statSync(join(root, relative));
    if (stats.isDirectory()) out.push(...sourceFiles(relative));
    else if (/\.(tsx?|css)$/.test(entry)) out.push(relative);
  }
  return out;
}

const sources = sourceFiles();
const sourceText = sources.map((file) => ({ file, text: read(file) }));

describe("security headers", () => {
  const headers = read("public/_headers");

  it("locks the site down against injection and framing", () => {
    expect(headers).toContain("default-src 'self'");
    expect(headers).toContain("script-src 'self'");
    expect(headers).toContain("frame-ancestors 'none'");
    expect(headers).toContain("object-src 'none'");
    expect(headers).toContain("base-uri 'none'");
    expect(headers).toContain("X-Content-Type-Options: nosniff");
    expect(headers).toContain("X-Frame-Options: DENY");
    expect(headers).toContain("Referrer-Policy: strict-origin-when-cross-origin");
    expect(headers).toContain("Strict-Transport-Security");
    expect(headers).toContain("Permissions-Policy:");
  });

  it("only lets the page talk to its own origin", () => {
    const connect = headers.match(/connect-src ([^;\n]+)/)?.[1].split(/\s+/).filter(Boolean) ?? [];
    // The form posts to this origin; mail leaves from the Worker, not the page.
    expect(connect).toEqual(["'self'"]);
    expect(headers).not.toContain("web3forms");
    expect(headers).not.toContain("'unsafe-eval'");
    expect(headers).not.toMatch(/script-src[^;]*https:/);
    expect(headers).toContain("upgrade-insecure-requests");
  });
});

describe("no injection sinks in the app", () => {
  it("never renders raw HTML or evaluates strings", () => {
    for (const { file, text } of sourceText) {
      expect(text, file).not.toMatch(/dangerouslySetInnerHTML/);
      expect(text, file).not.toMatch(/\.innerHTML\s*=/);
      expect(text, file).not.toMatch(/\bdocument\.write\b/);
      expect(text, file).not.toMatch(/\beval\s*\(/);
      expect(text, file).not.toMatch(/new Function\s*\(/);
      expect(text, file).not.toMatch(/insertAdjacentHTML/);
    }
  });

  it("keeps every outbound request on the form endpoint", () => {
    const fetches = sourceText.flatMap(({ file, text }) =>
      [...text.matchAll(/fetch\(\s*([^,)]+)/g)].map((m) => ({ file, target: m[1].trim() })),
    );
    expect(fetches.length).toBeGreaterThan(0);
    for (const { file, target } of fetches) expect(target, file).toBe("ENDPOINT");
  });

  it("loads no third-party script, style or iframe", () => {
    const html = read("index.html");
    expect(html).not.toMatch(/https?:\/\/[^"']*\.(js|css)/);
    expect(html).not.toMatch(/<iframe/i);
    expect(html).toMatch(/<script type="module" src="\/src\/main\.tsx"><\/script>/);
  });

  it("ships no insecure http:// asset in the app", () => {
    for (const { file, text } of sourceText) expect(text, file).not.toMatch(/http:\/\//);
  });
});

describe("waitlist privacy", () => {
  const signup = read("src/sections/Signup.tsx");

  it("stores only the consent choice, never the address", () => {
    expect(signup).toContain('const STORAGE_KEY = "morro_consent_v1"');
    const call = signup.match(/localStorage\.setItem\([\s\S]*?\);/)?.[0] ?? "";
    expect(call).toContain("JSON.stringify");
    expect(call).not.toMatch(/email|address|value/i);
    expect(read("src/lib/waitlist.ts")).not.toMatch(/localStorage|sessionStorage|document\.cookie/);
  });

  it("sanitises the referral tag and normalises the address before sending", () => {
    expect(signup).toContain("sanitizeRef(");
    expect(signup).toContain("normalizeEmail(");
  });

  it("sends the consent decision and policy version with every signup", () => {
    expect(signup).toContain("privacyAccepted: consent.privacy");
    expect(signup).toContain("marketing: consent.marketing");
    expect(signup).toContain("policyVersion: POLICY_VERSION");
    const worker = read("worker/index.ts");
    expect(worker).toContain("consent_at");
    expect(worker).toContain("policy_version");
  });

  it("guards against double submits", () => {
    expect(signup).toContain("sendingRef");
    expect(signup).toMatch(/if \(!form \|\| sendingRef\.current\) return;/);
  });

  it("has no endpoint that could report the number of signups", () => {
    const everything = `${sourceText.map((s) => s.text).join("\n")}\n${read("public/sitemap.xml")}`;
    expect(everything).not.toMatch(/\/count\b|subscriber-count|waitlist-count|signup-count/);
    expect(everything).not.toMatch(/[?&](count|total)=/);
    // The number on the page is a literal, so it cannot be queried or scraped.
    expect(WAITLIST_SOCIAL_PROOF).toBe("More than 30 people have already joined the waitlist.");
  });
});

describe("legal page covers what a waitlist needs", () => {
  const privacy = read("public/privacy.html");

  it("names purpose, processor, retention, rights, opt-out and version", () => {
    expect(privacy).toContain("Cloudflare");
    expect(privacy).toContain("Resend");
    expect(privacy).toMatch(/pending/i);
    expect(privacy).toMatch(/one-way hashes/i);
    expect(privacy).toMatch(/48 hours/);
    expect(privacy).toMatch(/24 months/);
    expect(privacy).toMatch(/withdraw consent|ask us to delete/i);
    expect(privacy).toMatch(/separate, optional/i);
    expect(privacy).toMatch(/10 business days/);
    expect(privacy).toContain("2026-11-17");
    expect(privacy).toMatch(/never public/i);
  });

  it("links back to the site and the terms from every legal page", () => {
    for (const page of ["public/privacy.html", "public/terms.html"]) {
      const html = read(page);
      expect(html, page).toContain("index.html");
      const other = page.endsWith("privacy.html") ? "terms.html" : "privacy.html";
      expect(html, page).toContain(other);
    }
  });
});
