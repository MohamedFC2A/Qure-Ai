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
            primary: "bg-gradient-to-r from-liquid-primary to-liquid-secondary hover:from-liquid-primary/90 hover:to-liquid-secondary/90 text-white shadow-lg",
            secondary: "bg-white text-black hover:bg-gray-100",
            glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:border-white/30",
            outline: "border border-white/20 bg-transparent hover:bg-white/5 text-white",
            ghost: "hover:bg-white/5 text-white/80 hover:text-white",
        };

        const sizes = {
            sm: "h-9 px-3 text-sm",
            md: "h-11 px-6",
            lg: "h-14 px-8 text-lg",
        };

        return (
            <button
                ref={ref}
                disabled={isLoading || props.disabled}
                className={cn(
                    "inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none active:scale-95",
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
