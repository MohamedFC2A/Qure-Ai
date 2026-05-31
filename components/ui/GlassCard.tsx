import { cn } from "@/lib/utils";
import React from "react";

type AccentColor = "cyan" | "emerald" | "amber" | "violet" | "rose" | "none";
type GlassVariant = "default" | "elevated" | "inset" | "bordered";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
    accent?: AccentColor;
    variant?: GlassVariant;
    noPadding?: boolean;
}

const accentClasses: Record<AccentColor, string> = {
    cyan:    "accent-top-cyan",
    emerald: "accent-top-emerald",
    amber:   "accent-top-amber",
    violet:  "accent-top-violet",
    rose:    "accent-top-rose",
    none:    "",
};

const variantClasses: Record<GlassVariant, string> = {
    default:  "glass-card",
    elevated: "glass-elevated",
    inset:    "glass-inset",
    bordered: "glass-card border-white/12",
};

export const GlassCard = ({
    children,
    className,
    hoverEffect = true,
    accent = "none",
    variant = "default",
    noPadding = false,
    ...props
}: GlassCardProps) => {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-2xl transition-all duration-300",
                variantClasses[variant],
                hoverEffect && "hover:-translate-y-0.5 hover:shadow-glass-lg",
                accentClasses[accent],
                className
            )}
            {...props}
        >
            {/* Top shimmer line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

            {children}
        </div>
    );
};
