import { cn } from "@/lib/utils";
import React from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "glass" | "outline" | "ghost" | "violet" | "rose" | "emerald" | "amber";
type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    glow?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, glow = false, children, ...props }, ref) => {
        const variants: Record<ButtonVariant, string> = {
            primary:
                "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold border border-cyan-400/40 shadow-sm",
            secondary:
                "bg-slate-900/90 hover:bg-slate-800/90 text-white border border-white/10 font-semibold shadow-sm",
            glass:
                "backdrop-blur-xl border border-white/10 bg-white/[0.04] text-white font-medium hover:border-white/20 hover:bg-white/[0.08]",
            outline:
                "border border-white/10 bg-transparent hover:bg-white/[0.05] hover:border-white/20 text-white font-medium",
            ghost:
                "hover:bg-white/[0.06] text-slate-300 hover:text-white font-medium",
            violet:
                "bg-violet-600 text-white font-semibold hover:bg-violet-500 border border-violet-500/30 shadow-sm",
            rose:
                "bg-rose-600 text-white font-semibold hover:bg-rose-500 border border-rose-500/30 shadow-sm",
            emerald:
                "bg-emerald-600 text-white font-semibold hover:bg-emerald-500 border border-emerald-500/30 shadow-sm",
            amber:
                "bg-amber-500 text-black font-semibold hover:bg-amber-400 border border-amber-500/30 shadow-sm",
        };

        const sizes: Record<ButtonSize, string> = {
            xs: "h-8 px-3 text-xs rounded-lg",
            sm: "h-10 px-4 text-sm rounded-xl",
            md: "h-11 px-6 text-sm rounded-xl",
            lg: "h-13 px-8 text-base rounded-xl",
        };

        return (
            <button
                ref={ref}
                disabled={isLoading || props.disabled}
                className={cn(
                    "inline-flex items-center justify-center font-medium transition-all duration-150",
                    "disabled:opacity-40 disabled:pointer-events-none",
                    "active:scale-[0.98] focus-visible:outline-none",
                    "focus-visible:ring-1 focus-visible:ring-white/20",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";
