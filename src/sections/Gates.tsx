import { useState, type ReactElement, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { CheckIcon, CameraIcon, MicIcon, QrIcon } from "../components/Icons";
import { Waveform } from "../components/Waveform";
import { expoOut, springs, useReduced } from "../lib/motion";

type Gate = {
  id: string;
  name: string;
  hint: string;
  icon: (props: { size?: number }) => ReactElement;
  title: string;
  body: string;
  note: string;
  mock: "promise" | "scan" | "photo";
};

const GATES: Gate[] = [
  {
    id: "promise",
    name: "Record a promise",
    hint: "Fifteen seconds in your own voice",
    icon: MicIcon,
    title: "Say it tonight, hear it tomorrow.",
    body: "Record one line before bed. In the morning it plays in your voice, and you solve a short sum before it stops.",
    note: "Recording · 15 seconds",
    mock: "promise",
  },
  {
    id: "scan",
    name: "Scan a code",
    hint: "A QR or barcode you keep by the bed",
    icon: QrIcon,
    title: "Put the off switch somewhere else.",
    body: "Stick a QR code by the bathroom sink, or use the barcode on your coffee. Your feet have to hit the floor first.",
    note: "Target · Bathroom sink",
    mock: "scan",
  },
  {
    id: "photo",
    name: "Photograph an object",
    hint: "Morro picks one from your pool",
    icon: CameraIcon,
    title: "Go get the keys you left by the door.",
    body: "Choose an everyday object. In the morning, a photo of the real thing is your proof of arrival.",
    note: "Mission · Find your keys",
    mock: "photo",
  },
];

/** Icon badge that leans up to 3px toward the pointer, on springMomentum. */
function DirectionBadge({ children }: { children: ReactNode }) {
  const reduced = useReduced();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 386, damping: 32, mass: 1 });
  const y = useSpring(rawY, { stiffness: 386, damping: 32, mass: 1 });

  return (
    <motion.span
      className="gate-row__badge"
      style={{ x, y }}
      onPointerMove={(event) => {
        if (reduced) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        rawX.set(Math.max(-3, Math.min(3, dx / 10)));
        rawY.set(Math.max(-3, Math.min(3, dy / 10)));
      }}
      onPointerLeave={() => {
        rawX.set(0);
        rawY.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

export function Gates() {
  const reduced = useReduced();
  const [selected, setSelected] = useState(0);

  return (
    <section className="section" id="gates" aria-labelledby="gates-title">
      <div className="shell">
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={reduced ? { duration: 0.15 } : springs.default}
          style={{ maxWidth: "58ch" }}
        >
          <h2 className="t-section" id="gates-title">
            When a promise needs backup.
          </h2>
          <p className="t-body" style={{ marginTop: 16, color: "var(--text-secondary)" }}>
            The voice promise is the first nudge. Add a gate that asks your half-asleep self to
            actually do something.
          </p>
        </motion.div>

        <div className="gate-rows" role="radiogroup" aria-label="Wake-up gate">
          {GATES.map((item, index) => {
            const Icon = item.icon;
            const isSelected = index === selected;
            return (
              <motion.button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelected(index)}
                className="gate-row"
                data-selected={isSelected}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={
                  reduced ? { duration: 0.15 } : { ...springs.default, delay: index * 0.06 }
                }
              >
                <DirectionBadge>
                  <Icon size={20} />
                </DirectionBadge>
                <span style={{ display: "block", paddingRight: 32 }}>
                  <span className="t-headline" style={{ display: "block" }}>
                    {item.name}
                  </span>
                  <span
                    className="t-secondary"
                    style={{ display: "block", marginTop: 2, color: "var(--text-secondary)" }}
                  >
                    {item.hint}
                  </span>
                </span>
                <span
                  className="gate-row__check"
                  aria-hidden="true"
                  style={{ borderColor: isSelected ? "var(--hairline-active)" : undefined }}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="gate-check"
                      transition={reduced ? { duration: 0 } : springs.momentum}
                      style={{ display: "grid", placeItems: "center" }}
                    >
                      <CheckIcon size={13} />
                    </motion.span>
                  )}
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="gate-detail" aria-live="polite">
          <div className="gate-panels">
            {GATES.map((item, index) => {
              const isActive = index === selected;
              return (
                <motion.div
                  key={item.id}
                  initial={false}
                  animate={{ opacity: isActive ? 1 : 0 }}
                  transition={{ duration: reduced ? 0 : 0.22, ease: expoOut }}
                  aria-hidden={!isActive}
                  style={{ pointerEvents: isActive ? "auto" : "none" }}
                >
                  <h3 className="t-headline">{item.title}</h3>
                  <p className="t-body" style={{ marginTop: 12, color: "var(--text-secondary)" }}>
                    {item.body}
                  </p>

                  <div className="gate-mock" style={{ marginTop: 20 }}>
                    {item.mock === "promise" && (
                      <>
                        <span className="t-mono" style={{ fontSize: 28, lineHeight: "32px" }}>
                          00:15
                        </span>
                        <Waveform />
                        <span className="t-label" style={{ color: "var(--text-tertiary)" }}>
                          {item.note}
                        </span>
                      </>
                    )}
                    {item.mock === "scan" && (
                      <>
                        <div
                          style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, width: 96 }}
                          aria-hidden="true"
                        >
                          {Array.from({ length: 49 }, (_, i) => (
                            <span
                              key={i}
                              style={{
                                aspectRatio: "1",
                                background:
                                  (i * 7) % 3 === 0 || i % 5 === 0
                                    ? "rgba(239,231,214,0.55)"
                                    : "transparent",
                              }}
                            />
                          ))}
                        </div>
                        <span className="t-label" style={{ color: "var(--text-secondary)" }}>
                          {item.note}
                        </span>
                      </>
                    )}
                    {item.mock === "photo" && (
                      <>
                        <svg viewBox="0 0 120 80" width="120" height="80" aria-hidden="true">
                          <rect x="14" y="34" width="52" height="34" rx="4" fill="none" stroke="rgba(239,231,214,0.35)" strokeWidth="1.4" />
                          <circle cx="30" cy="20" r="10" fill="none" stroke="rgba(239,231,214,0.35)" strokeWidth="1.4" />
                          <circle cx="84" cy="52" r="9" fill="none" stroke="rgba(239,231,214,0.18)" strokeWidth="1.4" />
                          <path d="M14 34 6 52M66 34l8 18" stroke="rgba(239,231,214,0.18)" strokeWidth="1.4" />
                        </svg>
                        <span className="t-label" style={{ color: "var(--text-secondary)" }}>
                          {item.note}
                        </span>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <p className="t-secondary" style={{ marginTop: 16, color: "var(--text-tertiary)" }}>
          The voice mission also asks you to solve a short sum before it plays back.
        </p>

        <motion.p
          className="t-statement"
          style={{ marginTop: 56, textAlign: "center", maxWidth: "32ch", marginInline: "auto" }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={reduced ? { duration: 0.15 } : springs.default}
        >
          The point isn’t to make mornings harder. It’s to make going back to sleep harder.
        </motion.p>
      </div>
    </section>
  );
}
