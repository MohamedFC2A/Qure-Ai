import { cn } from "@/lib/utils";
import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export const GlassCard = ({
    children,
    className,
    hoverEffect = true,
    ...props
}: GlassCardProps) => {
    return (
        <div
            className={cn(
                "glass-card relative overflow-hidden rounded-lg border backdrop-blur-xl transition-all duration-300",
                hoverEffect && "hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-slate-900/80",
                className
            )}
            {...props}
        >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/20 to-transparent opacity-70" />

            {children}
        </div>
    );
};
