"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { GlassCard } from "./ui/GlassCard";
import { Button } from "./ui/Button";
import { Atom, ScanLine, LayoutDashboard, User, Clock, Gem, Loader2, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import { useUser } from "@/context/UserContext";
import { useScan } from "@/context/ScanContext";

export const Navbar = () => {
    const pathname = usePathname();
    const { user, credits, plan, loading } = useUser();
    const { isScanning, totalDuration } = useScan();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        // window.location.reload(); // Context will handle null, or forcing reload is safer
        window.location.href = '/login';
    };

    const navItems = user ? [
        { name: "Home", href: "/", icon: Atom },
        { name: "Scan", href: "/scan", icon: ScanLine },
        { name: "Pricing", href: "/pricing", icon: Gem },
        { name: "History", href: "/dashboard/history", icon: Clock },
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ] : [
        { name: "Home", href: "/", icon: Atom },
        { name: "Pricing", href: "/pricing", icon: Gem },
    ];

    return (
        <header className="fixed top-3 sm:top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl px-0 sm:px-4">
            <GlassCard className="rounded-full py-2.5 sm:py-3 px-3 sm:px-6 flex items-center justify-between shadow-2xl shadow-black/20 backdrop-blur-xl bg-black/40 border-white/5" hoverEffect={false}>
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 font-bold text-lg tracking-tight mr-2 sm:mr-4">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Atom className="w-5 h-5 text-white" />
                    </div>
                    <span className="hidden sm:inline-block bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 font-display">
                        Qure Ai
                    </span>
                </Link>

                {/* Navigation */}
                <nav className="flex-1 min-w-0 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar px-1 sm:px-0">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href}>
                                <div
                                    className={cn(
                                        "relative px-2.5 sm:px-4 py-2 rounded-full text-sm transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap",
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
                <div className="flex items-center gap-2 pl-3 sm:pl-4 border-l border-white/10 ml-2">
                    {/* Only show content after we've checked auth state to prevent flickering */}
                    {!loading && user ? (
                        <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                            {isScanning && (
                                <Link href="/scan" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-white/5 border-white/10 text-white/70 hover:bg-white/10 transition-all">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                                    <span>Scanning · {totalDuration}s</span>
                                </Link>
                            )}
                            {/* Credits Chip */}
                            <Link href="/profile">
                                <div className={cn(
                                    "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                                    plan === 'ultra'
                                        ? "bg-amber-500/10 border-amber-500/30 text-amber-200 hover:bg-amber-500/20"
                                        : "bg-cyan-500/10 border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/20"
                                )}>
                                    <span className={cn("w-1.5 h-1.5 rounded-full", plan === 'ultra' ? "bg-amber-400" : "bg-cyan-400")} />
                                    {credits} C
                                </div>
                            </Link>

                            <Link href="/profile">
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
                                className="text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-full px-3 sm:px-4"
                            >
                                <LogOut className="w-4 h-4 sm:hidden" />
                                <span className="hidden sm:inline">Sign Out</span>
                            </Button>
                        </div>
                    ) : !loading && (
                        <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
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
