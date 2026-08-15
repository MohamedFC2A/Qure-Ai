"use client";

import { motion, useReducedMotion } from "framer-motion";
import React from "react";

export const LiquidBackground = () => {
    const prefersReducedMotion = useReducedMotion();
    return (
        <div
            className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#040711]"
            style={{ contain: "paint layout", transform: "translateZ(0)" }}
            suppressHydrationWarning
        >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.025)_1px,transparent_1px)] bg-[size:64px_64px]" style={{ contain: "paint layout" }} />
            <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-cyan-950/20 via-[#040711]/60 to-transparent" style={{ contain: "paint layout" }} />
            <motion.div
                animate={
                    prefersReducedMotion
                        ? { opacity: 0.12 }
                        : {
                            opacity: [0.10, 0.18, 0.10],
                            x: [0, 18, 0],
                        }
                }
                transition={
                    prefersReducedMotion
                        ? { duration: 0 }
                        : {
                            duration: 18,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }
                }
                className="absolute right-[-10%] top-[-20%] h-[45vw] w-[45vw] rounded-full bg-cyan-600/8 blur-[120px] will-change-transform"
            />
            <motion.div
                animate={
                    prefersReducedMotion
                        ? { opacity: 0.12 }
                        : {
                            opacity: [0.08, 0.15, 0.08],
                            y: [0, -16, 0],
                        }
                }
                transition={
                    prefersReducedMotion
                        ? { duration: 0 }
                        : {
                            duration: 24,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }
                }
                className="absolute bottom-[-24%] left-[-10%] h-[50vw] w-[50vw] rounded-full bg-slate-800/10 blur-[130px] will-change-transform"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#040711]/45 to-[#040711]" style={{ contain: "paint layout" }} />
        </div>
    );
};
