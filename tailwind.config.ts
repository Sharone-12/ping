import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Near-white neutral ground, not cream.
        paper: {
          DEFAULT: "#F8F8F6",
          deep: "#F1F1EE",
          tint: "#EAEAE6",
        },
        ink: {
          DEFAULT: "#121212",
          soft: "#6E6E6B",
          muted: "#A1A19D",
        },
        line: {
          DEFAULT: "#E4E4E0",
          strong: "#CFCFC9",
          ink: "#121212",
        },
        // Soft pastels for category chips and card tints.
        butter: { DEFAULT: "#FBEFB8", ink: "#7A5C00" },
        mint: { DEFAULT: "#D4F0DF", ink: "#1D6B45" },
        sky: { DEFAULT: "#DAE7FB", ink: "#27508F" },
        lilac: { DEFAULT: "#E8DCFA", ink: "#5B3B9C" },
        peach: { DEFAULT: "#FBE0D2", ink: "#9E4526" },
        blush: { DEFAULT: "#FBDDE8", ink: "#96335C" },
        alert: { DEFAULT: "#FBDDD8", ink: "#A63A22" },
      },
      fontFamily: {
        sans: [
          "var(--font-jakarta)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "22px",
        soft: "14px",
      },
      borderWidth: { 1.5: "1.5px" },
      boxShadow: {
        card: "0 1px 2px rgba(18, 18, 18, 0.04)",
        lift: "0 12px 32px -10px rgba(18, 18, 18, 0.16)",
        soft: "0 2px 12px -4px rgba(18, 18, 18, 0.08)",
      },
      maxWidth: { shell: "1180px" },
    },
  },
  plugins: [],
};
export default config;
