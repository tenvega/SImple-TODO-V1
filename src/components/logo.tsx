export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center justify-center rounded-full bg-inv text-inv-fg"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 12.5l4 4 8-9" />
      </svg>
    </span>
  );
}
