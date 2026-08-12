"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface QLogoIconProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
}

export const QLogoIcon: React.FC<QLogoIconProps> = ({
    className = "w-6 h-6",
    ...props
}) => {
    return (
        <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("shrink-0", className)}
            {...props}
        >
            <defs>
                {/* ── Liquid Glass Main Gradient ── */}
                <linearGradient id="qLiquidGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="25%" stopColor="#00F2FE" />
                    <stop offset="60%" stopColor="#0284C7" />
                    <stop offset="85%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>

                {/* ── Glass Specular Top Highlight ── */}
                <linearGradient id="qGlassHighlight" x1="18" y1="12" x2="38" y2="34" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                    <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>

                {/* ── Liquid Tail Gradient ── */}
                <linearGradient id="qTailGrad" x1="28" y1="28" x2="54" y2="54" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#00F2FE" />
                    <stop offset="45%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#818CF8" />
                </linearGradient>

                {/* ── Liquid Glass Refraction Drop Core ── */}
                <radialGradient id="qDropRefract" cx="24" cy="24" r="14" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.6" />
                    <stop offset="70%" stopColor="#0891B2" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#0891B2" stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* ── Glass Inner Glow Shadow ── */}
            <circle cx="30" cy="30" r="17" fill="url(#qDropRefract)" />

            {/* ── Main Liquid Glass Q Loop (Fluid 3D Body) ── */}
            <circle
                cx="30"
                cy="30"
                r="16"
                stroke="url(#qLiquidGrad)"
                strokeWidth="6.5"
                strokeLinecap="round"
            />

            {/* ── Glass Specular Reflection Highlight (Upper Curve) ── */}
            <path
                d="M17.5 24 C19 18 24 14.5 31 14.5 C36 14.5 40 16.5 42.5 20"
                stroke="url(#qGlassHighlight)"
                strokeWidth="2.8"
                strokeLinecap="round"
            />

            {/* ── Liquid Glass Fluid Tail ── */}
            <path
                d="M27 27 L48 48"
                stroke="url(#qTailGrad)"
                strokeWidth="6.5"
                strokeLinecap="round"
            />

            {/* ── Prismatic Glass Specular Dot on Tail ── */}
            <circle cx="48" cy="48" r="1.8" fill="#FFFFFF" opacity="0.9" />

            {/* ── Refractive Glass Sparkle in Core ── */}
            <circle cx="23" cy="23" r="1.6" fill="#FFFFFF" opacity="0.75" />
        </svg>
    );
};
