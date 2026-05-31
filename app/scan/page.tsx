"use client";

import { ScannerInterface } from "@/components/scanner/ScannerInterface";
import { GlassCard } from "@/components/ui/GlassCard";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Zap, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

// Internal Component for Upsell
const CreditsUpsellBanner = () => {
    const { credits, plan, loading } = useUser();

    if (loading) return null;

    if (credits < 5 || plan === 'free') {
        return (
            <div className="w-full max-w-4xl mb-6">
                <GlassCard className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-amber-300/25 bg-amber-300/10" hoverEffect={false}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-300/15 rounded-lg text-amber-200">
                            {credits < 5 ? <Zap className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">
                                {credits < 5 ? "Running low on credits" : "Unlock Pro Features"}
                            </h3>
                            <p className="text-slate-400 text-xs">
                                {credits < 5
                                    ? `You have ${credits} credits left. Top up or upgrade for unlimited power.`
                                    : "Upgrade to Ultra for faster processing and private history."}
                            </p>
                        </div>
                    </div>
                    <Link href="/pricing">
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white border-none whitespace-nowrap">
                            Upgrade
                        </Button>
                    </Link>
                </GlassCard>
            </div>
        );
    }
    return null;
};

export default function ScanPage() {
    const router = useRouter();

    const goBack = () => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
            return;
        }

        router.push("/");
    };

    return (
        <main className="min-h-screen pt-24 sm:pt-28 pb-28 md:pb-14 px-4 sm:px-6 flex flex-col items-center relative">
            <div className="z-10 w-full max-w-6xl flex flex-col items-center">
                <div className="w-full mb-5">
                    <button
                        onClick={goBack}
                        className="mb-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
                        <div className="text-left">
                            <p className="clinical-eyebrow mb-3">
                                Analysis workspace
                            </p>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3">
                                Scan, verify, review.
                            </h1>
                            <p className="text-slate-400 text-base sm:text-lg max-w-2xl">
                                Upload a clear medication image. The workflow extracts label text, checks reliable signals, then builds a practical safety report.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-slate-950/55 p-2">
                            {["Upload", "Verify", "Review"].map((step, index) => (
                                <div key={step} className="rounded-md bg-white/[0.035] px-3 py-3 text-center">
                                    <p className="text-xs text-slate-600">0{index + 1}</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-200">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <CreditsUpsellBanner />

                <section className="w-full min-h-[470px] rounded-xl border border-white/10 bg-slate-950/45 p-3 sm:p-4 md:p-5 shadow-2xl shadow-black/20">
                    <ScannerInterface />
                </section>
            </div>
        </main>
    );
}
