"use client";

import { motion, useReducedMotion } from "framer-motion";
import React from "react";

export const LiquidBackground = () => {
    const prefersReducedMotion = useReducedMotion();
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-black">
            <motion.div
                animate={
                    prefersReducedMotion
                        ? { opacity: 0.2 }
                        : {
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3],
                            rotate: [0, 90, 0],
                        }
                }
                transition={
                    prefersReducedMotion
                        ? { duration: 0 }
                        : {
                            duration: 20,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }
                }
                className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-indigo-600/20 rounded-full blur-[100px] will-change-transform translate-z-0"
            />
            <motion.div
                animate={
                    prefersReducedMotion
                        ? { opacity: 0.18 }
                        : {
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.4, 0.3],
                            x: [0, 50, 0],
                        }
                }
                transition={
                    prefersReducedMotion
                        ? { duration: 0 }
                        : {
                            duration: 25,
                            repeat: Infinity,
                            ease: "linear",
                        }
                }
                className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] bg-purple-600/20 rounded-full blur-[100px] will-change-transform translate-z-0"
            />
            <motion.div
                animate={
                    prefersReducedMotion
                        ? { opacity: 0.18 }
                        : {
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.4, 0.3],
                            y: [0, -50, 0],
                        }
                }
                transition={
                    prefersReducedMotion
                        ? { duration: 0 }
                        : {
                            duration: 30,
                            repeat: Infinity,
                            ease: "linear",
                        }
                }
                className="absolute bottom-[-20%] left-[20%] w-[80vw] h-[80vw] bg-pink-600/20 rounded-full blur-[100px] will-change-transform translate-z-0"
            />
            <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay"></div>
        </div>
    );
};
