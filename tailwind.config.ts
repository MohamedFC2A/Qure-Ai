import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // ── QURE Design System ──
                q: {
                    base:    "#050709",
                    surface: "#080C12",
                    "surface-2": "#0D1420",
                    "surface-3": "#111828",
                    cyan:    "#22D3EE",
                    emerald: "#10B981",
                    amber:   "#F59E0B",
                    violet:  "#8B5CF6",
                    rose:    "#F43F5E",
                },
                // ── Legacy clinical tokens ──
                clinical: {
                    ink:        "#EEF6F7",
                    muted:      "#94A3B8",
                    panel:      "rgba(8, 14, 22, 0.82)",
                    panelSolid: "#080C12",
                    border:     "rgba(255, 255, 255, 0.07)",
                    cyan:       "#22D3EE",
                    emerald:    "#10B981",
                    amber:      "#F59E0B",
                    red:        "#F43F5E",
                    violet:     "#8B5CF6",
                },
                glass: {
                    100: "rgba(255, 255, 255, 0.04)",
                    200: "rgba(255, 255, 255, 0.08)",
                    300: "rgba(255, 255, 255, 0.14)",
                    border: "rgba(255, 255, 255, 0.07)",
                },
                liquid: {
                    primary:   "#0891B2",
                    secondary: "#0D9488",
                    accent:    "#22D3EE",
                },
            },
            fontFamily: {
                display: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
                arabic:  ["Cairo", "system-ui", "sans-serif"],
                sans:    ["var(--font-inter)", "Cairo", "Inter", "system-ui", "sans-serif"],
            },
            screens: {
                xs: "420px",
            },
            backgroundImage: {
                "gradient-radial":    "radial-gradient(var(--tw-gradient-stops))",
                "liquid-mesh":        "linear-gradient(135deg, rgba(34,211,238,0.08), rgba(16,185,129,0.06))",
                "gradient-conic":     "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "glass-highlight":    "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.01) 100%)",
            },
            animation: {
                "blob":         "blob 8s infinite",
                "tilt":         "tilt 12s infinite linear",
                "float":        "float-y 4s ease-in-out infinite",
                "glow-pulse":   "glow-pulse 3s ease-in-out infinite",
                "spin-slow":    "spin-slow 12s linear infinite",
                "shimmer":      "skeleton-shimmer 1.8s ease-in-out infinite",
                "fade-up":      "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                "scale-in":     "scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            },
            keyframes: {
                blob: {
                    "0%":   { transform: "translate(0px, 0px) scale(1)" },
                    "33%":  { transform: "translate(30px, -50px) scale(1.1)" },
                    "66%":  { transform: "translate(-20px, 20px) scale(0.9)" },
                    "100%": { transform: "translate(0px, 0px) scale(1)" },
                },
                tilt: {
                    "0%, 50%, 100%": { transform: "rotate(0deg)" },
                    "25%":           { transform: "rotate(1deg)" },
                    "75%":           { transform: "rotate(-1deg)" },
                },
                "float-y": {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%":      { transform: "translateY(-12px)" },
                },
                "glow-pulse": {
                    "0%, 100%": { opacity: "0.5" },
                    "50%":      { opacity: "1" },
                },
                "spin-slow": {
                    from: { transform: "rotate(0deg)" },
                    to:   { transform: "rotate(360deg)" },
                },
                "skeleton-shimmer": {
                    "0%":   { backgroundPosition: "200% 0" },
                    "100%": { backgroundPosition: "-200% 0" },
                },
                "fade-up": {
                    from: { opacity: "0", transform: "translateY(16px)" },
                    to:   { opacity: "1", transform: "translateY(0)" },
                },
                "scale-in": {
                    from: { opacity: "0", transform: "scale(0.92)" },
                    to:   { opacity: "1", transform: "scale(1)" },
                },
            },
            boxShadow: {
                "glass":        "0 20px 60px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.06) inset",
                "glass-lg":     "0 32px 80px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.08) inset",
                "glow-cyan":    "0 0 20px rgba(34,211,238,0.2), 0 0 60px rgba(34,211,238,0.06)",
                "glow-emerald": "0 0 20px rgba(16,185,129,0.2), 0 0 60px rgba(16,185,129,0.06)",
                "glow-amber":   "0 0 20px rgba(245,158,11,0.2), 0 0 60px rgba(245,158,11,0.06)",
                "glow-violet":  "0 0 20px rgba(139,92,246,0.2), 0 0 60px rgba(139,92,246,0.06)",
            },
            borderRadius: {
                "2xl": "1rem",
                "3xl": "1.5rem",
                "4xl": "2rem",
            },
        },
    },
    plugins: [],
};

export default config;
