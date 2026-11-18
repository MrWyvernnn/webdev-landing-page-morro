import type { ReactElement } from "react";
import { motion } from "motion/react";
import { LockIcon, OfflineIcon, ProfileOffIcon } from "../components/Icons";
import { springs, useReduced } from "../lib/motion";

type Row = {
  title: string;
  body: string;
  note?: string;
  Icon: (props: { size?: number }) => ReactElement;
};

const ROWS: Row[] = [
  {
    title: "Kept on your phone",
    body: "Voice memos, alarms and mission data stay in local storage.",
    Icon: LockIcon,
  },
  {
    title: "Works offline",
    body: "The app core never contacts a server. Your routines aren’t uploaded.",
    note: "Purchases are handled by Google Play.",
    Icon: OfflineIcon,
  },
  {
    title: "No ad profile",
    body: "No trackers, no advertising identity built around you.",
    Icon: ProfileOffIcon,
  },
];

export function Privacy() {
  const reduced = useReduced();

  return (
    <section className="section" id="privacy" aria-labelledby="privacy-title">
      <div className="shell">
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={reduced ? { duration: 0.15 } : springs.default}
          style={{ maxWidth: "60ch" }}
        >
          <h2 className="t-section" id="privacy-title">
            Private by where it lives.
          </h2>
          <p className="t-body" style={{ marginTop: 16, color: "var(--text-secondary)" }}>
            Your mornings are personal. Voice memos, alarm routines and mission data stay in
            Morro’s local storage on your phone. No cloud sync. No trackers. No ad profiling.
          </p>
        </motion.div>

        <div className="privacy-grid">
          {ROWS.map((row, index) => {
            const Icon = row.Icon;
            return (
              <motion.article
                key={row.title}
                className="privacy-row"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={
                  reduced ? { duration: 0.15 } : { ...springs.default, delay: index * 0.06 }
                }
              >
                <span className="privacy-row__icon" aria-hidden="true">
                  <Icon size={20} />
                </span>
                <h3 className="t-headline">{row.title}</h3>
                <p className="t-secondary" style={{ marginTop: 6, color: "var(--text-secondary)" }}>
                  {row.body}
                </p>
                {row.note && (
                  <p className="t-label" style={{ marginTop: 8, color: "var(--text-tertiary)" }}>
                    {row.note}
                  </p>
                )}
              </motion.article>
            );
          })}
        </div>

        <p className="t-secondary" style={{ marginTop: 20, maxWidth: "62ch", color: "var(--text-tertiary)" }}>
          The beta waitlist is the one exception — your email is sent to our form provider so we
          can invite you. Nothing else leaves your device.
        </p>

        <a
          href="/privacy.html"
          className="link-underline t-secondary"
          style={{ display: "inline-block", marginTop: 16 }}
        >
          Read the privacy policy
        </a>
      </div>
    </section>
  );
}
