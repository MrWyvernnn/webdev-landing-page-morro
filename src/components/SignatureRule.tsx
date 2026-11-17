import { motion } from "motion/react";
import { expoOut, useReduced } from "../lib/motion";

/** The 28px curved honey stroke that draws itself after the wordmark. */
export function SignatureRule({
  delay = 0.4,
  width = 28,
  className,
}: {
  delay?: number;
  width?: number;
  className?: string;
}) {
  const reduced = useReduced();
  return (
    <svg
      viewBox="0 0 28 10"
      width={width}
      height={(width * 10) / 28}
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ overflow: "visible" }}
    >
      <motion.path
        d="M1 7.4C4.6 1.6 8.2 1.6 11.8 6.4c3.2 4.3 7 4.6 10-1"
        stroke="#E8C58F"
        strokeOpacity={0.7}
        strokeWidth={1.6}
        strokeLinecap="round"
        initial={{ pathLength: reduced ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={reduced ? { duration: 0 } : { duration: 0.52, ease: expoOut, delay }}
      />
    </svg>
  );
}
