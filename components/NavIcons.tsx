/** Monoline nav glyphs — cleaner than emoji at 17px, and they inherit color. */

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function FeedIcon() {
  return (
    <svg {...base}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg {...base}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  );
}

export function ProjectsIcon() {
  return (
    <svg {...base}>
      <path d="M12 3c2.8 2.2 4.2 5.2 4.2 8.6L12 16l-4.2-4.4C7.8 8.2 9.2 5.2 12 3Z" />
      <path d="M9.4 15.2 7 21l4-1.6M14.6 15.2 17 21l-4-1.6" />
    </svg>
  );
}

export function ProfileIcon() {
  return (
    <svg {...base}>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
    </svg>
  );
}
