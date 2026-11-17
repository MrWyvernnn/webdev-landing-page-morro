import { useId, type CSSProperties } from "react";

type Props = {
  size?: number;
  animated?: boolean;
  /** 0 – 1 multiplier for the float/sway amplitude. */
  amplitude?: number;
  className?: string;
};

const BODY =
  "M 32 130.74 C 29.38 55.89, 45.6 20.8, 100 20.8 C 154.4 20.8, 170.62 55.89, 168 130.74 C 175.48 165.45, 173.24 222.88, 168 230.06 C 163.47 254.43, 152.59 254.87, 145.33 250.95 C 138.08 254.87, 127.2 254.43, 122.67 230.06 C 118.13 254.43, 107.25 254.87, 100 250.95 C 92.75 254.87, 81.87 254.43, 77.33 230.06 C 72.8 254.43, 61.92 254.87, 54.67 250.95 C 47.41 254.87, 36.53 254.43, 32 230.06 C 26.76 222.88, 24.52 165.45, 32 130.74 Z";

export function MorroMascot({ size = 124, animated = true, amplitude = 1, className }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const style = {
    width: size,
    height: size * 1.3,
    "--amp": amplitude,
  } as CSSProperties;

  return (
    <div aria-hidden="true" className={className} style={style}>
      <svg
        className="morro"
        viewBox="0 0 200 260"
        width={size}
        height={size * 1.3}
        data-animated={animated}
        role="presentation"
      >
        <defs>
          <linearGradient
            id={`body-${uid}`}
            x1="0"
            y1="20.8"
            x2="0"
            y2="261"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#1A1714" />
            <stop offset="55%" stopColor="#0E0C0A" />
            <stop offset="100%" stopColor="#060605" />
          </linearGradient>
          <linearGradient id={`rim-${uid}`} x1="0" y1="20.8" x2="0" y2="261" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#EFE7D6" stopOpacity="0.3" />
            <stop offset="55%" stopColor="#EFE7D6" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#EFE7D6" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        <g className="morro__float">
          <g className="morro__breath" style={{ transformBox: "fill-box" }}>
            <path d={BODY} fill={`url(#body-${uid})`} />
            <path d={BODY} fill="none" stroke={`url(#rim-${uid})`} strokeWidth={1.4} />
            <g className="morro__eyes" style={{ transformBox: "fill-box" }}>
              <path
                d="M 60.56 87.93 C 66.68 60.91, 81.64 60.91, 87.76 87.93"
                fill="none"
                stroke="#E8B4AE"
                strokeWidth={11.83}
                strokeLinecap="round"
              />
              <path
                d="M 112.24 87.93 C 118.36 60.91, 133.32 60.91, 139.44 87.93"
                fill="none"
                stroke="#E8B4AE"
                strokeWidth={11.83}
                strokeLinecap="round"
              />
            </g>
            <path
              d="M 85.04 102.02 C 93.42 111.27, 106.58 111.27, 114.96 102.02"
              fill="none"
              stroke="#E8C58F"
              strokeOpacity={0.55}
              strokeWidth={2.72}
              strokeLinecap="round"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
