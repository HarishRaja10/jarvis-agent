import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        panel: "hsl(var(--panel))",
        "panel-foreground": "hsl(var(--panel-foreground))",
        cyan: {
          core: "hsl(var(--cyan-core))"
        },
        amber: {
          core: "hsl(var(--amber-core))"
        },
        emerald: {
          core: "hsl(var(--emerald-core))"
        },
        rose: {
          core: "hsl(var(--rose-core))"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      boxShadow: {
        neon: "0 0 24px rgba(55, 225, 255, 0.18)",
        "neon-strong": "0 0 42px rgba(55, 225, 255, 0.28)"
      },
      animation: {
        "signal-scan": "signal-scan 3.2s linear infinite",
        "soft-pulse": "soft-pulse 2.6s ease-in-out infinite"
      },
      keyframes: {
        "signal-scan": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" }
        },
        "soft-pulse": {
          "0%, 100%": { opacity: "0.62" },
          "50%": { opacity: "1" }
        }
      }
    }
  },
  plugins: []
} satisfies Config;

