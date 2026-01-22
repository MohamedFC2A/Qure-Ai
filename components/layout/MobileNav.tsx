"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Atom, ScanLine, User, Clock, Gem, LogIn, UserPlus } from "lucide-react";
import { useUser } from "@/context/UserContext";

export const MobileNav = () => {
    const pathname = usePathname();
    const { user } = useUser();

    const navItems = user
        ? [
            { name: "Home", href: "/", icon: Atom },
            { name: "Scan", href: "/scan", icon: ScanLine },
            { name: "History", href: "/dashboard/history", icon: Clock },
            { name: "Plans", href: "/pricing", icon: Gem },
            { name: "Profile", href: "/profile", icon: User },
        ]
        : [
            { name: "Home", href: "/", icon: Atom },
            { name: "Plans", href: "/pricing", icon: Gem },
            { name: "Login", href: "/login", icon: LogIn },
            { name: "Sign Up", href: "/signup", icon: UserPlus },
        ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-[env(safe-area-inset-bottom)]">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.45)]" />

            <div className="relative flex items-center justify-around px-2.5 py-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-label={item.name}
                            aria-current={isActive ? "page" : undefined}
                            className="flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-2xl"
                        >
                            <div className="flex flex-col items-center gap-1.5 group">
                                <div className={cn(
                                    "p-2.5 rounded-full transition-all duration-300",
                                    isActive
                                        ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_-3px_rgba(34,211,238,0.4)]"
                                        : "text-white/40 group-hover:text-white/80"
                                )}>
                                    <item.icon className={cn("w-5 h-5", isActive && "fill-current/20")} />
                                </div>
                                <span className={cn(
                                    "text-[11px] font-medium tracking-wide transition-colors leading-none",
                                    isActive ? "text-cyan-100" : "text-white/40"
                                )}>
                                    {item.name}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};
