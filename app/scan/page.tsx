"use client";

import { ScannerInterface } from "@/components/scanner/ScannerInterface";
import { GlassCard } from "@/components/ui/GlassCard";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Zap, Lock, ChevronRight } from "lucide-react";

// Internal Component for Upsell
const CreditsUpsellBanner = () => {
    const { credits, plan, loading } = useUser();

    if (loading) return null;

    if (credits < 5 || plan === 'free') {
        return (
            <div className="w-full max-w-4xl mb-6">
                <GlassCard className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-amber-500/30 bg-amber-500/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-full text-amber-400">
                            {credits < 5 ? <Zap className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">
                                {credits < 5 ? "Running low on credits" : "Unlock Pro Features"}
                            </h3>
                            <p className="text-white/60 text-xs">
                                {credits < 5
                                    ? `You have ${credits} credits left. Top up or upgrade for unlimited power.`
                                    : "Upgrade to Ultra for faster processing and private history."}
                            </p>
                        </div>
                    </div>
                    <Link href="/pricing">
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white border-none whitespace-nowrap">
                            Upgrade Now
                        </Button>
                    </Link>
                </GlassCard>
            </div>
        );
    }
    return null;
};

export default function ScanPage() {
    return (
        <main className="min-h-screen pt-24 pb-12 px-4 flex flex-col items-center relative">
            <div className="z-10 w-full max-w-4xl flex flex-col items-center">
                <div className="w-full flex justify-start mb-6">
                    <Link href="/dashboard">
                        <Button variant="outline" size="sm" className="gap-2 border-white/10 text-white/60 hover:text-white hover:bg-white/5">
                            <ChevronRight className="w-4 h-4 rotate-180" /> Back to Dashboard
                        </Button>
                    </Link>
                </div>

                <div className="mb-8 text-center">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 mb-4">
                        Medical Analysis
                    </h1>
                    <p className="text-white/60 text-base sm:text-lg">
                        Upload an image of any medication to receive a comprehensive analysis.
                    </p>
                </div>

                <CreditsUpsellBanner />

                <GlassCard className="w-full min-h-[500px] p-6 md:p-10 flex flex-col items-center justify-center" hoverEffect={false}>
                    <ScannerInterface />
                </GlassCard>
            </div>
        </main>
    );
}
