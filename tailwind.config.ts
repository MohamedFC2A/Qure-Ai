import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                clinical: {
                    ink: "#EEF6F7",
                    muted: "#94A3B8",
                    panel: "rgba(9, 18, 28, 0.78)",
                    panelSolid: "#09121C",
                    border: "rgba(148, 163, 184, 0.16)",
                    cyan: "#22D3EE",
                    emerald: "#34D399",
                    amber: "#FBBF24",
                    red: "#F87171",
                },
                glass: {
                    100: "rgba(148, 163, 184, 0.08)",
                    200: "rgba(148, 163, 184, 0.14)",
                    300: "rgba(148, 163, 184, 0.2)",
                    border: "rgba(148, 163, 184, 0.16)",
                },
                liquid: {
                    primary: "#0891B2",
                    secondary: "#0D9488",
                    accent: "#22D3EE",
                }
            },
            fontFamily: {
                display: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
            },
            screens: {
                xs: "420px",
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "liquid-mesh": "linear-gradient(135deg, rgba(8,145,178,0.12), rgba(13,148,136,0.08))",
            },
            animation: {
                "blob": "blob 7s infinite",
                "tilt": "tilt 10s infinite linear",
            },
            keyframes: {
                blob: {
                    "0%": {
                        transform: "translate(0px, 0px) scale(1)",
                    },
                    "33%": {
                        transform: "translate(30px, -50px) scale(1.1)",
                    },
                    "66%": {
                        transform: "translate(-20px, 20px) scale(0.9)",
                    },
                    "100%": {
                        transform: "translate(0px, 0px) scale(1)",
                    },
                },
                tilt: {
                    "0%, 50%, 100%": {
                        transform: "rotate(0deg)",
                    },
                    "25%": {
                        transform: "rotate(1deg)",
                    },
                    "75%": {
                        transform: "rotate(-1deg)",
                    },
                },
            },
        },
    },
    plugins: [],
};
export default config;
