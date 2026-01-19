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
                "glass-card relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300",
                hoverEffect && "hover:bg-white/10 hover:scale-[1.01] hover:shadow-2xl hover:border-white/20",
                className
            )}
            {...props}
        >
            {/* Glossy overlay effect */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent opacity-50" />

            {children}
        </div>
    );
};
