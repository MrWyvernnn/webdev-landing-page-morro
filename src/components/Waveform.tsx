import type { CSSProperties } from "react";

const BARS = [10, 18, 26, 14, 30, 22, 12, 28, 20, 32, 16, 24];

/** 12 bars, 4px wide, honey at 0.4. Only animates while preview is on. */
export function Waveform({ playing = false }: { playing?: boolean }) {
  return (
    <div className="wave" data-playing={playing} aria-hidden="true">
      {BARS.map((height, index) => (
        <i
          key={index}
          style={
            {
              "--h": height,
              "--d": `${index * 70}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
