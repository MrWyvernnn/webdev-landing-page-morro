import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useReduced } from "../lib/motion";

/** Full-bleed MORRO logotype drifting ~8% of its width against scroll. */
export function Wordmark() {
  const reduced = useReduced();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);

  return (
    <section className="wordmark-section" ref={ref} aria-label="Morro">
      <div className="wordmark-dots" aria-hidden="true" />
      <div className="shell" style={{ overflow: "hidden" }}>
        <motion.div className="wordmark" aria-hidden="true" style={{ x: reduced ? 0 : x }}>
          MORRO
        </motion.div>
      </div>
    </section>
  );
}
