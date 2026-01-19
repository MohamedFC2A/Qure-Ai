import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                glass: {
                    100: "rgba(255, 255, 255, 0.1)",
                    200: "rgba(255, 255, 255, 0.2)",
                    300: "rgba(255, 255, 255, 0.3)",
                    border: "rgba(255, 255, 255, 0.1)",
                },
                liquid: {
                    primary: "#4F46E5", // Indigo
                    secondary: "#EC4899", // Pink
                    accent: "#8B5CF6", // Violet
                }
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "liquid-mesh": "conic-gradient(at 0% 0%, #1e1e2e 0, #0000 50%), conic-gradient(at 50% 100%, #1e1e2e 0, #0000 50%), conic-gradient(at 100% 0%, #1e1e2e 0, #0000 50%)",
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
