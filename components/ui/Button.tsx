import { cn } from "@/lib/utils";
import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "glass" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
        const variants = {
            primary: "bg-cyan-300 text-slate-950 hover:bg-cyan-200 border border-cyan-200/70 shadow-lg shadow-cyan-950/20",
            secondary: "bg-white text-slate-950 hover:bg-slate-100 border border-white",
            glass: "bg-slate-900/70 backdrop-blur-md border border-white/10 text-white hover:bg-slate-800/80 hover:border-cyan-300/30",
            outline: "border border-white/10 bg-slate-950/20 hover:bg-white/[0.06] text-white",
            ghost: "hover:bg-white/[0.06] text-slate-300 hover:text-white",
        };

        const sizes = {
            sm: "h-10 px-3 text-sm",
            md: "h-11 px-6",
            lg: "h-14 px-8 text-lg",
        };

        return (
            <button
                ref={ref}
                disabled={isLoading || props.disabled}
                className={cn(
                    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";
