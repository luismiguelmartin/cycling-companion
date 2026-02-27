interface StravaLogoProps {
  className?: string;
  size?: number;
}

export function StravaLogo({ className, size = 20 }: StravaLogoProps) {
  return (
    <svg
      viewBox="0 0 384 512"
      width={size}
      height={size * (512 / 384)}
      className={className}
      aria-label="Strava"
      fill="currentColor"
    >
      <path d="M158.4 0L7 292h89.2l62.2-131.4L220.6 292h89.2L158.4 0zm150.2 292l-43.9 88.2-44.6-88.2h-67.6l112.2 220 111.5-220h-67.6z" />
    </svg>
  );
}
