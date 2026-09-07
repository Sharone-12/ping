/**
 * Monoline desk still-life for the landing hero: envelopes lifting off and
 * becoming event cards. Geometric line-art in the app palette — no raster
 * assets, scales cleanly, inherits nothing so it reads the same everywhere.
 */
export function HeroScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="18 70 384 224"
      className={className}
      fill="none"
      stroke="#121212"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* floating cards */}
      <g transform="rotate(-8 223 118)">
        <rect x="180" y="90" width="86" height="56" rx="9" fill="#D4F0DF" />
        <path d="M193 110h44M193 122h32M193 134h20" strokeWidth="1.7" />
      </g>
      <g transform="rotate(9 310 152)">
        <rect x="272" y="124" width="76" height="52" rx="9" fill="#E8DCFA" />
        <path d="M284 143h38M284 155h26" strokeWidth="1.7" />
      </g>
      <g transform="rotate(-4 150 168)">
        <rect x="112" y="142" width="70" height="48" rx="9" fill="#DAE7FB" />
        <path d="M124 160h34M124 172h22" strokeWidth="1.7" />
      </g>

      {/* card rising out of the envelope */}
      <g transform="rotate(5 218 208)">
        <rect x="186" y="186" width="64" height="44" rx="8" fill="#FBEFB8" />
        <path d="M197 202h34M197 213h22" strokeWidth="1.7" />
      </g>

      {/* motion arcs */}
      <path
        d="M212 186c-4-16-16-26-24-32"
        strokeWidth="1.6"
        strokeDasharray="5 7"
      />
      <path
        d="M244 190c12-10 22-14 34-16"
        strokeWidth="1.6"
        strokeDasharray="5 7"
      />

      {/* envelope stack */}
      <rect x="160" y="242" width="112" height="16" rx="5" fill="#F8F8F6" />
      <rect x="150" y="236" width="128" height="46" rx="7" fill="#FFFFFF" />
      <path d="M150 242l64 30 64-30" />

      {/* potted plant */}
      <path d="M62 248c2 18 4 26 6 32h34c2-6 4-14 6-32" fill="#FFFFFF" />
      <rect x="57" y="236" width="56" height="13" rx="4" fill="#F1F1EE" />
      <path d="M85 236v-56" strokeWidth="1.8" />
      <path
        d="M85 226c-18-2-28-14-28-28 16 0 26 12 28 28Z"
        fill="#D4F0DF"
        strokeWidth="1.8"
      />
      <path
        d="M85 210c18-2 28-14 28-28-16 0-26 12-28 28Z"
        fill="#D4F0DF"
        strokeWidth="1.8"
      />
      <path
        d="M85 194c-16-4-24-16-22-29 15 2 23 15 22 29Z"
        fill="#D4F0DF"
        strokeWidth="1.8"
      />
      <path
        d="M85 180c-4-14 0-26 8-34 7 11 3 25-8 34Z"
        fill="#FBEFB8"
        strokeWidth="1.8"
      />

      {/* desk lamp */}
      <path d="M352 278v-92" strokeWidth="1.9" />
      <path d="M326 186h52l-13-34h-26Z" fill="#FBE0D2" />
      <path d="M326 186h52" strokeWidth="1.9" />
      <path d="M336 281c0-7 7-11 16-11s16 4 16 11" fill="#F1F1EE" />

      {/* sparkles */}
      <path d="M300 84v12M294 90h12" strokeWidth="1.7" />
      <path d="M96 118v9M91.5 122.5h9" strokeWidth="1.7" />

      {/* ground */}
      <path d="M28 281h364" strokeWidth="1.8" />
    </svg>
  );
}
