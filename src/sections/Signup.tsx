import { useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MorroMascot } from "../components/MorroMascot";
import { PrivacyModal } from "../components/PrivacyModal";
import { PrimaryButton } from "../components/PrimaryButton";
import { CheckIcon } from "../components/Icons";
import { expoOut, springs, useReduced } from "../lib/motion";
import {
  POLICY_VERSION,
  WAITLIST_SOCIAL_PROOF,
  canSubmit,
  normalizeEmail,
  sanitizeRef,
  type ConsentChoice,
} from "../lib/waitlist";

const ENDPOINT = "/api/waitlist";
const STORAGE_KEY = "morro_consent_v1";

const MESSAGES: Record<string, string> = {
  rate: "Too many attempts from this connection. Try again in an hour.",
  email: "That address doesn’t look right. Check it and try again.",
  "not-configured": "The waitlist isn’t taking signups yet. Try again shortly.",
};

type Status = "idle" | "loading" | "success" | "error";

const NO_CONSENT: ConsentChoice = { privacy: false, marketing: false };

function readConsent(): ConsentChoice {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return NO_CONSENT;
    const parsed = JSON.parse(raw) as { policy?: string; marketing?: boolean };
    // A new policy version asks again: the old acceptance covered older wording.
    if (parsed.policy !== POLICY_VERSION) return NO_CONSENT;
    return { privacy: true, marketing: parsed.marketing === true };
  } catch {
    return NO_CONSENT;
  }
}

function writeConsent(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ policy: POLICY_VERSION, marketing: choice.marketing }),
    );
  } catch {
    // Storage blocked: the in-memory choice still gates the form this session.
  }
}

export function Signup() {
  const reduced = useReduced();
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const sendingRef = useRef(false);
  const promptedRef = useRef(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [consent, setConsent] = useState<ConsentChoice>(() => readConsent());
  const startedAt = useRef(Date.now());

  const send = async () => {
    const form = formRef.current;
    if (!form || sendingRef.current) return;

    sendingRef.current = true;
    setStatus("loading");
    setError("");

    try {
      const email = form.elements.namedItem("email");
      const honey = form.elements.namedItem("botcheck");
      const payload = {
        email: normalizeEmail(email instanceof HTMLInputElement ? email.value : ""),
        ref: sanitizeRef(new URLSearchParams(window.location.search).get("ref")),
        marketing: consent.marketing,
        privacyAccepted: consent.privacy,
        policyVersion: POLICY_VERSION,
        startedAt: startedAt.current,
        botcheck: honey instanceof HTMLInputElement && honey.checked ? "1" : "",
      };

      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setStatus("error");
        setError(MESSAGES[result.error ?? ""] ?? "That didn’t go through. Check your connection and try again.");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setError("That didn’t go through. Check your connection and try again.");
    } finally {
      sendingRef.current = false;
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = formRef.current;
    if (!form || status === "loading") return;
    if (!form.reportValidity()) return;
    if (!canSubmit(consent)) {
      setModalOpen(true);
      return;
    }
    void send();
  };

  const onEmailFocus = () => {
    if (consent.privacy || promptedRef.current) return;
    promptedRef.current = true;
    setModalOpen(true);
  };

  const acceptConsent = (choice: ConsentChoice) => {
    setConsent(choice);
    writeConsent(choice);
    setModalOpen(false);
    window.setTimeout(() => {
      emailRef.current?.focus();
    }, 0);
  };

  const declineConsent = () => {
    setModalOpen(false);
    promptedRef.current = true;
    emailRef.current?.blur();
  };

  const toggleMarketing = (marketing: boolean) => {
    const next = { ...consent, marketing };
    setConsent(next);
    if (next.privacy) writeConsent(next);
  };

  return (
    <section className="section" id="waitlist" aria-labelledby="waitlist-title">
      <div className="shell" style={{ maxWidth: 560 }}>
        <motion.div
          style={{ display: "flex", justifyContent: "center" }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={reduced ? { duration: 0.15 } : springs.playful}
        >
          <MorroMascot size={64} amplitude={0.6} />
        </motion.div>

        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={reduced ? { duration: 0.15 } : springs.default}
          style={{ textAlign: "center", marginTop: 16 }}
        >
          <h2 className="t-display" id="waitlist-title">
            Tomorrow-you is already waiting.
          </h2>
          <p className="t-body" style={{ marginTop: 16, color: "var(--text-secondary)" }}>
            Get first word when the closed Android beta opens. Free to join the list. Android 8.0
            and up.
          </p>
        </motion.div>

        <div className="card" style={{ marginTop: 32, padding: 24 }}>
          <AnimatePresence mode="wait" initial={false}>
            {status === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.22, ease: expoOut }}
                tabIndex={-1}
                role="status"
                aria-live="polite"
              >
                <span
                  aria-hidden="true"
                  style={{ color: "var(--honey)", display: "inline-flex", marginBottom: 12 }}
                >
                  <CheckIcon size={22} />
                </span>
                <h3 className="t-headline">Check your inbox.</h3>
                <p className="t-secondary" style={{ marginTop: 8, color: "var(--text-secondary)" }}>
                  One tap on the link confirms your place. It works once and expires in 48 hours —
                  and nothing else is sent until you tap it.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                ref={formRef}
                onSubmit={onSubmit}
                noValidate={false}
                initial={false}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.18, ease: expoOut }}
                style={{ display: "grid", gap: 12 }}
              >
                <div className="honeypot" aria-hidden="true">
                  <label>
                    Leave this field empty
                    <input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>

                <p
                  className="t-label"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "var(--text-secondary)",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 6,
                      height: 6,
                      flex: "0 0 6px",
                      borderRadius: 999,
                      background: "var(--honey)",
                    }}
                  />
                  {WAITLIST_SOCIAL_PROOF}
                </p>

                <label className="t-label" htmlFor="beta-email" style={{ color: "var(--text-secondary)" }}>
                  Your email address
                </label>
                <input
                  className="field"
                  id="beta-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  aria-describedby="beta-help"
                  onFocus={onEmailFocus}
                  ref={emailRef}
                />

                <label className="check">
                  <input type="checkbox" name="android_confirmed" value="Yes" required />
                  <span className="check__box" aria-hidden="true">
                    <CheckIcon size={12} />
                  </span>
                  <span>I’m on Android 8.0 or newer.</span>
                </label>

                <label className="check">
                  <input
                    type="checkbox"
                    checked={consent.marketing}
                    onChange={(event) => toggleMarketing(event.target.checked)}
                  />
                  <span className="check__box" aria-hidden="true">
                    <CheckIcon size={12} />
                  </span>
                  <span>Send me occasional launch updates. Optional.</span>
                </label>

                <p className="t-label" id="beta-help" style={{ color: "var(--text-tertiary)" }}>
                  We email you once to confirm, then only your invite and any launch updates you
                  asked for. Nobody can see who is on the list. Read the{" "}
                  <a href="/privacy.html" className="link-underline">
                    privacy policy
                  </a>
                  .
                </p>

                {error && (
                  <p role="alert" className="t-secondary" style={{ color: "var(--error)" }}>
                    {error}
                  </p>
                )}

                <PrimaryButton
                  type="submit"
                  block
                  disabled={status === "loading"}
                  ariaBusy={status === "loading"}
                >
                  {status === "loading" ? "Joining…" : "Join the waitlist"}
                </PrimaryButton>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="t-label" style={{ marginTop: 16, textAlign: "center", color: "var(--text-tertiary)" }}>
          Beta access is invite-only. Pricing announced before launch.
        </p>
      </div>

      <PrivacyModal open={modalOpen} onAccept={acceptConsent} onDecline={declineConsent} />
    </section>
  );
}
