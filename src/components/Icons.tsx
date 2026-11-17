type IconProps = { size?: number; className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function MicIcon({ size = 20, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" />
    </svg>
  );
}

export function QrIcon({ size = 20, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base}>
      <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h2v2h-2zM19 15v2M21 19v2h-2M15 21h2" />
    </svg>
  );
}

export function CameraIcon({ size = 20, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base}>
      <path d="M3 8h4l1.6-2h6.8L17 8h4v11H3z" />
      <circle cx="12" cy="13.5" r="3.4" />
    </svg>
  );
}

export function LockIcon({ size = 20, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base}>
      <rect x="5" y="10" width="14" height="11" rx="2.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14.5v2.5" />
    </svg>
  );
}

export function OfflineIcon({ size = 20, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base}>
      <path d="M3.5 8.5a13 13 0 0 1 4-2.2M17 6.6a13 13 0 0 1 3.5 1.9M7 12a9 9 0 0 1 3.2-1.6M17.4 10.9A9 9 0 0 1 19 12M10.4 15.2a5 5 0 0 1 3.3 0" />
      <circle cx="12" cy="18.5" r="0.9" fill="currentColor" stroke="none" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

export function ProfileOffIcon({ size = 20, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base}>
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 12.2-5.7M3 3l18 18" />
    </svg>
  );
}

export function CheckIcon({ size = 14, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base} strokeWidth={1.9}>
      <path d="m5 12.5 4.5 4.5L19 6.5" />
    </svg>
  );
}
