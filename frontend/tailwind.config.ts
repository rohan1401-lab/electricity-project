import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
import { themeExtend } from "./src/styles/tokens.generated";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class", "[data-theme='dark']"],
  theme: {
    extend: {
      ...themeExtend,
      fontFamily: {
        ...themeExtend.fontFamily,
        sans: themeExtend.fontFamily.body as unknown as string[],
      },
      boxShadow: {
        "accent-glow": "0 0 24px var(--color-accent-glow30)",
        "accent-halo": "0 0 48px var(--color-accent-halo)",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
