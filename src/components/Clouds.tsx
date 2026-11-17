import { useEffect, useRef, useState, type CSSProperties } from "react";

const CLOUD_PATH =
  "M 8 110 C 0 86.8, 8 58.96, 32 61.28 C 36 19.52, 80 3.28, 100 38.08 C 124 5.6, 164 21.84, 168 58.96 C 190 63.6, 200 93.76, 192 110 Z";

export function CloudShape({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 120" fill="#F6EFE1" role="presentation" aria-hidden="true">
      <path d={CLOUD_PATH} />
    </svg>
  );
}

type Cloud = {
  y: number;
  w: number;
  flip?: boolean;
  outer?: boolean;
  /** Anchored clouds hold station on the mascot's side of the hero. */
  x?: number;
  /** Phase along the shared 180s clock, 0 – 1. */
  phase?: number;
};

const CLOUDS: Cloud[] = [
  { y: 0.015, w: 0.15, outer: true, phase: 0.1 },
  { y: 0.12, w: 0.12, flip: true, outer: true, phase: 0.45 },
  { y: 0.05, w: 0.09, flip: true, outer: true, phase: 0.8 },
  { y: 0.3, w: 0.13, x: 0.74 },
  { y: 0.58, w: 0.1, flip: true, x: 0.84 },
  { y: 0.72, w: 0.14, x: 0.6 },
  { y: 0.84, w: 0.14, outer: true, phase: 0.22 },
  { y: 0.93, w: 0.1, flip: true, outer: true, phase: 0.66 },
];

/**
 * Eight drawn clouds on ONE shared 180s linear clock.
 * Sky and horizon clouds traverse and wrap; the mascot-side clouds hold
 * station so no cloud ever crosses the copy column.
 */
export function CloudLayer() {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPaused(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="cloud-layer" ref={ref} data-paused={paused} aria-hidden="true">
      {CLOUDS.map((cloud, index) => {
        const anchored = cloud.x !== undefined;
        return (
          <div
            key={index}
            className="cloud"
            data-outer={cloud.outer ? "true" : "false"}
            data-low={cloud.y > 0.5 ? "true" : "false"}
            data-flip={cloud.flip ? "true" : "false"}
            data-anchored={anchored ? "true" : "false"}
            style={
              {
                top: `${cloud.y * 100}%`,
                left: anchored ? `${cloud.x! * 100}%` : "100%",
                width: "var(--w)",
                "--w": `${cloud.w * 100}vw`,
                animationDelay: anchored ? undefined : `${-(cloud.phase ?? 0) * 180}s`,
              } as CSSProperties
            }
          >
            <div className="cloud__sway">
              <CloudShape />
            </div>
          </div>
        );
      })}
    </div>
  );
}
