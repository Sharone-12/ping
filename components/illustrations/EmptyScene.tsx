/** Small monoline scene for empty states — a calendar with nothing on it. */
export function EmptyScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 180 140"
      className={className}
      fill="none"
      stroke="#121212"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="34" y="30" width="112" height="88" rx="10" fill="#FFFFFF" />
      <path d="M34 54h112" />
      <path d="M60 30V18M120 30V18" />
      <circle cx="62" cy="76" r="5" fill="#FBEFB8" strokeWidth="1.7" />
      <circle cx="90" cy="76" r="5" fill="#D4F0DF" strokeWidth="1.7" />
      <path
        d="M112 71h12M112 81h12M56 98h68"
        strokeWidth="1.6"
        strokeDasharray="4 6"
      />
      <path d="M150 26v10M145 31h10" strokeWidth="1.6" />
    </svg>
  );
}
