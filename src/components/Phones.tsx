import { useRef, useState } from "react";
import { motion, useInView, type MotionValue } from "motion/react";
import { CameraIcon, CheckIcon, MicIcon, QrIcon } from "./Icons";
import { CloudShape } from "./Clouds";
import { MorroDial } from "./MorroDial";
import { MorroMascot } from "./MorroMascot";
import { RollingDigits } from "./RollingDigits";
import { SignatureRule } from "./SignatureRule";
import { springs, useReduced } from "../lib/motion";

/* ── Splash ─────────────────────────────────────────────────── */
export function SplashPhone() {
  return (
    <div
      className="phone"
      role="img"
      aria-label="The Morro splash screen: drawn clouds, the Morro mascot, and the line The commitment alarm."
    >
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }} aria-hidden="true">
        <div style={{ position: "absolute", top: "5%", left: "-18%", width: "80%" }}>
          <CloudShape className="w-full h-auto" />
        </div>
        <div style={{ position: "absolute", top: "17%", right: "-20%", width: "62%" }}>
          <CloudShape className="w-full h-auto" />
        </div>
        <div style={{ position: "absolute", bottom: "5%", left: "-16%", width: "68%" }}>
          <CloudShape className="w-full h-auto" />
        </div>
      </div>

      <div
        style={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "38%",
        }}
      >
        <MorroMascot size={96} />
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 24, lineHeight: "28px" }}>Morro</span>
          <SignatureRule delay={0.9} width={22} />
        </div>
        <p className="t-label" style={{ marginTop: 6, color: "var(--text-tertiary)" }}>
          The commitment alarm
        </p>
        <p className="t-micro" style={{ marginTop: "auto", paddingBottom: 24, color: "var(--text-tertiary)" }}>
          Tap to continue
        </p>
      </div>
    </div>
  );
}

/* ── Dashboard ──────────────────────────────────────────────── */
export function DashboardPhone({ spin }: { spin?: MotionValue<number> }) {
  const reduced = useReduced();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });

  const enter = (delay: number) =>
    reduced
      ? { initial: { opacity: 0 }, whileInView: { opacity: 1 }, transition: { duration: 0.15 } }
      : {
          initial: { opacity: 0, y: 10 },
          whileInView: { opacity: 1, y: 0 },
          transition: { ...springs.default, delay },
        };

  return (
    <div
      className="phone"
      role="img"
      aria-label="The Morro home screen: a live dial, Monday 17 November, an armed 07:00 alarm and a Record a promise mission."
      ref={ref}
    >
      <div style={{ padding: 16, height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, lineHeight: "18px" }}>Morro</span>
          <span className="t-label" style={{ color: "var(--text-tertiary)" }}>
            Privacy
          </span>
        </div>

        <motion.div
          style={{ display: "grid", placeItems: "center", marginTop: 10 }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={reduced ? { duration: 0.15 } : springs.default}
        >
          <MorroDial size={140} running={inView} hour={7} minute={0} spin={spin} />
        </motion.div>

        <div style={{ textAlign: "center", marginTop: 8 }}>
          <span className="t-label" style={{ color: "var(--text-tertiary)" }}>
            Mon, 17 Nov
          </span>
        </div>

        <motion.div
          className="card"
          style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "var(--surface-card)" }}
          {...enter(0.09)}
          viewport={{ once: true, amount: 0.3 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="t-mono" style={{ fontSize: 34, lineHeight: "36px" }}>
              <RollingDigits value="07:00" />
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span
                aria-hidden="true"
                style={{ width: 6, height: 6, borderRadius: 99, background: "var(--honey)" }}
              />
              <span className="t-micro" style={{ color: "var(--text-secondary)" }}>
                Armed
              </span>
            </span>
          </div>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "var(--text-tertiary)",
            }}
          >
            <MicIcon size={14} />
            <span className="t-label">Record a promise</span>
          </div>
        </motion.div>

        <div style={{ marginTop: "auto" }}>
          <div
            className="btn btn--primary"
            style={{ height: 52, width: "100%", fontSize: 15 }}
            aria-hidden="true"
          >
            Change
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Setup sheet ────────────────────────────────────────────── */
const MISSIONS = [
  { name: "Record a promise", icon: MicIcon },
  { name: "Scan a code", icon: QrIcon },
  { name: "Photograph an object", icon: CameraIcon },
];

export function SetupPhone() {
  const reduced = useReduced();
  const [mission, setMission] = useState(1);

  return (
    <div
      className="phone"
      role="group"
      aria-label="The Morro setup sheet: choose a time and a mission."
    >
      <div style={{ position: "absolute", inset: 0, background: "var(--canvas)" }} aria-hidden="true" />

      <div
        style={{
          position: "absolute",
          inset: "18% 0 0 0",
          background: "var(--surface)",
          borderRadius: "26px 26px 0 0",
          padding: 20,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 40,
            height: 4,
            borderRadius: 99,
            background: "var(--surface-low)",
            margin: "0 auto",
          }}
        />

        <h3 style={{ fontSize: 20, lineHeight: "26px", marginTop: 10 }}>Wake-up</h3>
        <p className="t-label" style={{ marginTop: 4, color: "var(--text-secondary)" }}>
          Set the time and how you want to wake.
        </p>

        <p className="t-micro" style={{ marginTop: 12, color: "var(--text-tertiary)" }}>
          Time
        </p>
        <div
          style={{
            marginTop: 4,
            background: "var(--surface-card)",
            borderRadius: 12,
            padding: "8px 12px",
            boxShadow: "inset 0 0 0 1px var(--hairline)",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={{ fontSize: 44, lineHeight: "48px", fontFamily: "var(--font-mono)" }}>
              <RollingDigits value="07:00" />
            </span>
            <span className="t-micro" style={{ color: "var(--text-tertiary)" }}>
              Tap to change
            </span>
          </div>
        </div>

        <p className="t-micro" style={{ marginTop: 10, color: "var(--text-tertiary)" }}>
          Mission
        </p>
        <div role="radiogroup" aria-label="Mission" style={{ marginTop: 4, display: "grid", gap: 4 }}>
          {MISSIONS.map((item, index) => {
            const Icon = item.icon;
            const selected = mission === index;
            return (
              <button
                key={item.name}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setMission(index)}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minHeight: 44,
                  padding: "0 10px",
                  borderRadius: 10,
                  background: selected ? "var(--surface-elevated)" : "transparent",
                  boxShadow: `inset 0 0 0 1px ${selected ? "var(--hairline-strong)" : "var(--hairline)"}`,
                  textAlign: "left",
                }}
              >
                <Icon size={16} />
                <span className="t-label" style={{ color: selected ? "var(--text-primary)" : "var(--text-secondary)" }}>
                  {item.name}
                </span>
                {selected && (
                  <motion.span
                    layoutId="setup-check"
                    transition={reduced ? { duration: 0 } : springs.momentum}
                    style={{ marginLeft: "auto", color: "var(--honey)", display: "grid", placeItems: "center" }}
                  >
                    <CheckIcon size={13} />
                  </motion.span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: "auto" }}>
          <div className="btn btn--primary" style={{ height: 52, width: "100%" }} aria-hidden="true">
            Save and arm
          </div>
        </div>
      </div>
    </div>
  );
}
