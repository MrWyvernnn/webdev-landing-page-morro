import { useEffect, useState, type CSSProperties } from "react";
import { useMotionValue, useTransform, motion, type MotionValue } from "motion/react";
import { useReduced } from "../lib/motion";

type Props = {
  size?: number;
  hour?: number;
  minute?: number;
  second?: number;
  /** Optional 0 – 1 scroll driver added to the second hand's rotation. */
  spin?: MotionValue<number>;
  running?: boolean;
};

const CX = 120;
const CY = 120;

function polar(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)] as const;
}

export function MorroDial({
  size = 140,
  hour = 7,
  minute = 0,
  second = 0,
  spin,
  running = true,
}: Props) {
  const reduced = useReduced();
  const [seconds, setSeconds] = useState(second);
  const fallbackSpin = useMotionValue(0);
  const spinValue = spin ?? fallbackSpin;
  const spinDegrees = useTransform(spinValue, (value) => `${value * 120}deg`);

  useEffect(() => {
    setSeconds(second);
  }, [second]);

  useEffect(() => {
    if (!running || reduced) return;
    const id = window.setInterval(() => {
      setSeconds((current) => (current + 1) % 60);
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, reduced]);

  const sweep = (minute + seconds / 60) * 6;
  const arcStart = polar(118, 0);
  const arcEnd = polar(118, sweep);
  const arcPath =
    sweep > 0.4
      ? `M ${arcStart[0]} ${arcStart[1]} A 118 118 0 ${sweep > 180 ? 1 : 0} 1 ${arcEnd[0]} ${arcEnd[1]}`
      : null;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      aria-hidden="true"
      role="presentation"
      style={{ display: "block", "--dial-spin": spinDegrees } as unknown as CSSProperties}
    >
      <circle cx={CX} cy={CY} r={120} fill="#080706" />
      <circle cx={CX} cy={CY} r={119} fill="none" stroke="#EFE7D6" strokeOpacity={0.12} strokeWidth={1} />
      {arcPath && (
        <path d={arcPath} fill="none" stroke="#E8C58F" strokeOpacity={0.55} strokeWidth={2} strokeLinecap="round" />
      )}

      {Array.from({ length: 60 }, (_, i) => {
        const angle = i * 6;
        if (i % 5 === 0) {
          const inner = polar(107, angle);
          const outer = polar(113, angle);
          const major = i % 15 === 0;
          return (
            <line
              key={i}
              x1={inner[0]}
              y1={inner[1]}
              x2={outer[0]}
              y2={outer[1]}
              stroke="#EFE7D6"
              strokeOpacity={major ? 0.55 : 0.32}
              strokeWidth={major ? 1.8 : 1}
              strokeLinecap="round"
            />
          );
        }
        const dot = polar(111, angle);
        return (
          <circle key={i} cx={dot[0]} cy={dot[1]} r={0.7} fill="#EFE7D6" fillOpacity={0.16} />
        );
      })}

      <g transform={`rotate(${(hour + minute / 60) * 30} ${CX} ${CY})`}>
        <line x1={120} y1={126} x2={120} y2={64.8} stroke="#EFE7D6" strokeWidth={4} strokeLinecap="round" />
      </g>
      <g transform={`rotate(${(minute + seconds / 60) * 6} ${CX} ${CY})`}>
        <line x1={120} y1={128.4} x2={120} y2={38.4} stroke="#EFE7D6" strokeWidth={2.6} strokeLinecap="round" />
      </g>
      {/* Pivot is fixed at the dial centre by .dial__second (view-box origin), never by the hand's own bbox. */}
      <g
        className="dial__second"
        style={{ transform: `rotate(calc(${seconds * 6}deg + var(--dial-spin, 0deg)))` }}
      >
        <line x1={120} y1={139.2} x2={120} y2={26.4} stroke="#E8C58F" strokeOpacity={0.85} strokeWidth={1.2} strokeLinecap="round" />
      </g>

      <circle cx={CX} cy={CY} r={3.2} fill="#EFE7D6" />
      <circle cx={CX} cy={CY} r={1.3} fill="#000000" />
    </motion.svg>
  );
}
