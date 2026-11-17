import { motion } from "motion/react";
import { springs, useReduced } from "../lib/motion";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function Digit({ value, reduced }: { value: number; reduced: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{ display: "inline-block", height: "1em", overflow: "hidden", verticalAlign: "top" }}
    >
      <motion.span
        style={{ display: "block" }}
        initial={false}
        animate={{ y: `${-value * 10}%` }}
        transition={reduced ? { duration: 0 } : springs.momentum}
      >
        {DIGITS.map((digit) => (
          <span key={digit} style={{ display: "block", height: "1em", lineHeight: 1 }}>
            {digit}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/** Rolling digit columns. Monospace, tabular, no layout shift. */
export function RollingDigits({ value, className = "" }: { value: string; className?: string }) {
  const reduced = useReduced();

  return (
    <span
      className={`t-mono ${className}`}
      style={{ display: "inline-flex", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}
    >
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" style={{ display: "inline-flex", lineHeight: 1 }}>
        {value.split("").map((character, index) =>
          /\d/.test(character) ? (
            <Digit key={index} value={Number(character)} reduced={reduced} />
          ) : (
            <span
              key={index}
              style={{ display: "inline-block", width: "0.62em", textAlign: "center" }}
            >
              {character}
            </span>
          ),
        )}
      </span>
    </span>
  );
}
