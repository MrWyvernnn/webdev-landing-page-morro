import { useEffect, useRef, useState } from "react";
import { CheckIcon } from "./Icons";
import { PrimaryButton } from "./PrimaryButton";
import type { ConsentChoice } from "../lib/waitlist";

type Props = {
  open: boolean;
  onAccept: (choice: ConsentChoice) => void;
  onDecline: () => void;
};

export function PrivacyModal({ open, onAccept, onDecline }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onAccept, onDecline });
  callbacks.current = { onAccept, onDecline };
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPrivacy(false);
    setMarketing(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = dialogRef.current;
    node?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        callbacks.current.onDecline();
        return;
      }
      if (event.key !== "Tab") return;
      if (!node) return;
      const focusable = Array.from(
        node.querySelectorAll<HTMLElement>(
          "button, a[href], input:not([type='hidden']), [tabindex]:not([tabindex='-1'])",
        ),
      ).filter((element) => !element.hasAttribute("disabled"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="dialog-scrim"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) callbacks.current.onDecline();
      }}
    >
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-modal-title"
        aria-describedby="privacy-modal-desc"
        ref={dialogRef}
        tabIndex={-1}
      >
        <p className="t-label" style={{ color: "var(--text-tertiary)" }}>
          Before you join
        </p>
        <h2 id="privacy-modal-title" className="t-headline" style={{ marginTop: 8 }}>
          A clear note before we take your email.
        </h2>
        <p
          id="privacy-modal-desc"
          className="t-secondary"
          style={{ marginTop: 12, color: "var(--text-secondary)" }}
        >
          We store your email on Cloudflare and send one confirmation message. You only join the
          list when you press confirm in that email; until then nothing else reaches you. It is not
          sold, not shared, and never shown publicly, and you can ask us to delete it at any time
          at marhaanansari@gmail.com. Morro keeps voice recordings, alarm routines and mission data
          on your Android device.
        </p>

        <a
          href="/privacy.html"
          target="_blank"
          rel="noopener noreferrer"
          className="link-underline t-secondary"
          style={{ display: "inline-block", marginTop: 12 }}
        >
          Read the full privacy policy
        </a>

        <div
          style={{
            display: "grid",
            gap: 4,
            marginTop: 20,
            paddingTop: 16,
            borderTop: "1px solid var(--hairline)",
          }}
        >
          <label className="check" style={{ alignItems: "flex-start", paddingBlock: 8 }}>
            <input
              type="checkbox"
              checked={privacy}
              onChange={(event) => setPrivacy(event.target.checked)}
              style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
            />
            <span className="check__box" aria-hidden="true">
              <CheckIcon size={12} />
            </span>
            <span>
              I’ve read the privacy policy and agree to my email being used for the beta invite.
              Required.
            </span>
          </label>

          <label className="check" style={{ alignItems: "flex-start", paddingBlock: 8 }}>
            <input
              type="checkbox"
              checked={marketing}
              onChange={(event) => setMarketing(event.target.checked)}
              style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
            />
            <span className="check__box" aria-hidden="true">
              <CheckIcon size={12} />
            </span>
            <span>Send me occasional launch updates. Optional, and you can leave the list any time.</span>
          </label>
        </div>

        <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
          <PrimaryButton
            type="button"
            onClick={() => callbacks.current.onAccept({ privacy, marketing })}
            disabled={!privacy}
            block
          >
            <span aria-hidden="true" style={{ color: "var(--honey)", display: "inline-flex" }}>
              <CheckIcon size={15} />
            </span>
            Continue with my email
          </PrimaryButton>
          <button
            type="button"
            onClick={() => callbacks.current.onDecline()}
            className="t-secondary"
            style={{ minHeight: 44, color: "var(--text-secondary)" }}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
