import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { CloudLayer } from "../components/Clouds";
import { MorroMascot } from "../components/MorroMascot";
import { PrimaryButton } from "../components/PrimaryButton";
import { useScrollTo } from "../lib/lenis";
import { expoOut, springs, useReduced } from "../lib/motion";

export function Hero() {
  const reduced = useReduced();
  const scrollTo = useScrollTo();
  const ref = useRef<HTMLElement>(null);

  const pointerX = useMotionValue(-400);
  const pointerY = useMotionValue(-400);
  const lightX = useSpring(pointerX, { stiffness: 60, damping: 20, mass: 0.6 });
  const lightY = useSpring(pointerY, { stiffness: 60, damping: 20, mass: 0.6 });

  const line = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : { initial: { y: "110%" }, animate: { y: 0 } };

  const fade = (delay: number) =>
    reduced
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.15 } }
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { ...springs.default, delay },
        };

  return (
    <section
      className="hero"
      id="top"
      ref={ref}
      aria-labelledby="hero-title"
      onPointerMove={(event) => {
        if (reduced || event.pointerType !== "mouse") return;
        const rect = event.currentTarget.getBoundingClientRect();
        pointerX.set(event.clientX - rect.left);
        pointerY.set(event.clientY - rect.top);
      }}
    >
      <CloudLayer />
      {!reduced && (
        <div className="spotlight" aria-hidden="true">
          <motion.div className="spotlight__light" style={{ x: lightX, y: lightY }} />
        </div>
      )}

      <div className="shell hero__grid">
        <div className="hero__copy">
          <motion.p className="hero__meta t-label" {...fade(0.05)}>
            Android · closed beta
          </motion.p>

          <h1 className="hero__title t-hero" id="hero-title">
            <span className="hero__line">
              <motion.span
                style={{ display: "block" }}
                {...line}
                transition={
                  reduced ? { duration: 0.15 } : { ...springs.default, delay: 0.12 }
                }
              >
                You made a promise.
              </motion.span>
            </span>
            <span className="hero__line">
              <motion.span
                style={{ display: "block" }}
                {...line}
                transition={
                  reduced ? { duration: 0.15 } : { ...springs.default, delay: 0.19 }
                }
              >
                Wake up and keep it.
              </motion.span>
            </span>
          </h1>

          <motion.p className="hero__body" {...fade(0.26)}>
            Record fifteen seconds in your own voice tonight. In the morning Morro plays it back and
            waits until you’re actually up.
          </motion.p>

          <motion.div className="hero__actions" {...fade(0.34)}>
            <PrimaryButton href="#waitlist" onClick={scrollTo}>
              Join the Android beta
            </PrimaryButton>
            <a className="link-underline" href="#how-it-works" onClick={scrollTo}>
              See how it works
            </a>
          </motion.div>

          <motion.p className="hero__fine" {...fade(0.42)}>
            No snooze. Everything stays on your phone.
          </motion.p>
        </div>

        <motion.div
          className="hero__art"
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            reduced
              ? { duration: 0.15 }
              : { ...springs.default, delay: 0.3, ease: expoOut }
          }
        >
          <MorroMascot size={124} />
        </motion.div>
      </div>
    </section>
  );
}
