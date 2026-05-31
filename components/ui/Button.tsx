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
                "bg-cyan-400 text-slate-950 font-semibold hover:bg-cyan-300 border border-cyan-300/60 shadow-lg shadow-cyan-950/25 hover:shadow-glow-cyan",
            secondary:
                "bg-white text-slate-950 hover:bg-slate-100 border border-white font-semibold",
            glass:
                "backdrop-blur-md border border-white/12 text-white font-medium hover:border-white/20",
            outline:
                "border border-white/12 bg-transparent hover:bg-white/[0.05] hover:border-white/20 text-white font-medium",
            ghost:
                "hover:bg-white/[0.06] text-slate-300 hover:text-white font-medium",
            violet:
                "bg-violet-600 text-white font-semibold hover:bg-violet-500 border border-violet-400/40 shadow-lg shadow-violet-950/30 hover:shadow-glow-violet",
            rose:
                "bg-rose-600 text-white font-semibold hover:bg-rose-500 border border-rose-400/40 shadow-lg shadow-rose-950/30",
            emerald:
                "bg-emerald-600 text-white font-semibold hover:bg-emerald-500 border border-emerald-400/40 shadow-lg shadow-emerald-950/30 hover:shadow-glow-emerald",
            amber:
                "bg-amber-500 text-black font-semibold hover:bg-amber-400 border border-amber-400/60 shadow-lg shadow-amber-950/25 hover:shadow-glow-amber",
        };

        const sizes: Record<ButtonSize, string> = {
            xs: "h-8 px-3 text-xs rounded-lg",
            sm: "h-10 px-4 text-sm rounded-xl",
            md: "h-11 px-6 text-sm rounded-xl",
            lg: "h-13 px-8 text-base rounded-xl",
        };

        const glowMap: Record<ButtonVariant, string> = {
            primary: "shadow-glow-cyan",
            violet:  "shadow-glow-violet",
            emerald: "shadow-glow-emerald",
            amber:   "shadow-glow-amber",
            secondary: "",
            glass: "",
            outline: "",
            ghost: "",
            rose: "",
        };

        return (
            <button
                ref={ref}
                disabled={isLoading || props.disabled}
                className={cn(
                    "inline-flex items-center justify-center font-medium transition-all duration-200",
                    "disabled:opacity-40 disabled:pointer-events-none",
                    "active:scale-[0.97] focus-visible:outline-none",
                    "focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent",
                    variants[variant],
                    sizes[size],
                    glow && glowMap[variant],
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
