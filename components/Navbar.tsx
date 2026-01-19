"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { GlassCard } from "./ui/GlassCard";
import { Button } from "./ui/Button";
import { Atom, ScanLine, LayoutDashboard, User, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export const Navbar = () => {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const navItems = [
        { name: "Home", href: "/", icon: Atom },
        { name: "Scan", href: "/scan", icon: ScanLine },
        { name: "History", href: "/dashboard/history", icon: Clock },
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ];

    return (
        <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl px-0 sm:px-4">
            <GlassCard className="rounded-full py-3 px-4 sm:px-6 flex items-center justify-between shadow-2xl shadow-black/20 backdrop-blur-xl bg-black/40 border-white/5" hoverEffect={false}>
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 font-bold text-lg tracking-tight mr-4">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Atom className="w-5 h-5 text-white" />
                    </div>
                    <span className="hidden sm:inline-block bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 font-display">
                        MedVision
                    </span>
                </Link>

                {/* Navigation */}
                <nav className="flex items-center gap-1 sm:gap-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href}>
                                <div
                                    className={cn(
                                        "relative px-4 py-2 rounded-full text-sm transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden",
                                        isActive
                                            ? "text-white font-medium"
                                            : "text-white/60 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute inset-0 bg-white/10 rounded-full animate-in fade-in zoom-in duration-300" />
                                    )}
                                    <item.icon className={cn("w-4 h-4 relative z-10", isActive ? "text-cyan-400" : "")} />
                                    <span className={cn("hidden md:inline-block relative z-10", isActive ? "text-white" : "")}>
                                        {item.name}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Auth Buttons */}
                <div className="flex items-center gap-2 pl-4 border-l border-white/10 ml-2">
                    {user ? (
                        <div className="flex items-center gap-2">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="sm" className="hidden sm:flex rounded-full h-9 w-9 p-0 items-center justify-center border border-white/10 bg-white/5 overflow-hidden">
                                    {user?.user_metadata?.avatar_url ? (
                                        <img
                                            src={user.user_metadata.avatar_url}
                                            alt={user.email || "User"}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-4 h-4" />
                                    )}
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSignOut}
                                className="text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-full px-4"
                            >
                                Sign Out
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/login">
                                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">Login</Button>
                            </Link>
                            <Link href="/signup">
                                <Button variant="primary" size="sm" className="rounded-full px-5 shadow-lg shadow-cyan-500/20">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </GlassCard>
        </header>
    );
};
