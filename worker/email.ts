import type { Env } from "./types";

export type SendResult = { ok: true } | { ok: false; reason: string };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * One place that knows how mail leaves the system. It speaks the provider's
 * plain HTTP API from `fetch`, so no SDK or Node shim is bundled into the
 * Worker. Swap this function to change provider; nothing else moves.
 */
export async function sendConfirmation(
  env: Env,
  options: { to: string; confirmUrl: string; ignoreUrl: string },
): Promise<SendResult> {
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL) return { ok: false, reason: "not-configured" };

  const { to, confirmUrl, ignoreUrl } = options;
  const subject = "Confirm your Morro beta spot";
  const text = [
    "You asked for a place in the closed Morro beta.",
    "",
    "Open this link to confirm your address:",
    confirmUrl,
    "",
    "The link works once and expires in 48 hours. If you didn't ask for this, ignore this",
    `message or tell us at ${ignoreUrl} and nothing further will be sent.`,
    "",
    "Morro",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en"><body style="margin:0;padding:32px;background:#000000;color:#EFE7D6;font:16px/1.55 system-ui,-apple-system,Segoe UI,sans-serif">
  <div style="max-width:520px;margin:0 auto">
    <p style="margin:0 0 24px;font-size:13px;letter-spacing:0.02em;color:#A79F90">Morro · closed Android beta</p>
    <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;font-weight:600">One tap and you're on the list.</h1>
    <p style="margin:0 0 24px;color:#CFC6B4">You asked for a place in the closed Morro beta. Confirm this address and we'll send your invite when it opens.</p>
    <p style="margin:0 0 28px">
      <a href="${escapeHtml(confirmUrl)}" style="display:inline-block;background:#EFE7D6;color:#000000;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:600">Confirm my spot</a>
    </p>
    <p style="margin:0 0 8px;color:#8F8778;font-size:13px">The link works once and expires in 48 hours.</p>
    <p style="margin:0;color:#8F8778;font-size:13px">If this wasn't you, <a href="${escapeHtml(ignoreUrl)}" style="color:#CFC6B4">tell us</a> and nothing further is sent.</p>
  </div>
</body></html>`;

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: env.FROM_EMAIL, to: [to], subject, text, html }),
    });
  } catch {
    return { ok: false, reason: "network" };
  }

  if (!response.ok) return { ok: false, reason: `status-${response.status}` };
  return { ok: true };
}
