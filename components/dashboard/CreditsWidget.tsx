"use client";

import React, { useEffect, useState } from 'react';
import { GlassCard } from "@/components/ui/GlassCard";
import { Zap, Clock, TrendingUp, Gift } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CreditStatus {
    plan: 'free' | 'ultra';
    planRemaining: number;
    dailyUsed: number;
    monthlyUsed: number;
    totalAvailable: number;
}

export const CreditsWidget = () => {
    const [status, setStatus] = useState<CreditStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [showRedeem, setShowRedeem] = useState(false);
    const [promoCode, setPromoCode] = useState("");
    const [redeemLoading, setRedeemLoading] = useState(false);
    const [redeemMsg, setRedeemMsg] = useState("");

    const fetchCredits = async () => {
        try {
            const res = await fetch('/api/credits/status');
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (error) {
            console.error("Failed to load credits", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRedeem = async () => {
        if (!promoCode) return;
        setRedeemLoading(true);
        setRedeemMsg("");
        try {
            const res = await fetch('/api/credits/redeem', {
                method: 'POST',
                body: JSON.stringify({ code: promoCode })
            });
            const data = await res.json();
            if (res.ok) {
                setRedeemMsg("Success! Credits added.");
                setPromoCode("");
                await fetchCredits();
                setTimeout(() => {
                    setShowRedeem(false);
                    setRedeemMsg("");
                }, 2000);
            } else {
                setRedeemMsg(data.error || "Failed to redeem");
            }
        } catch (e) {
            setRedeemMsg("Error redeeming code");
        } finally {
            setRedeemLoading(false);
        }
    };

    useEffect(() => {
        fetchCredits();
    }, []);

    if (loading) {
        return (
            <GlassCard className="p-6 h-full flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 bg-white/10 rounded-full" />
                    <div className="h-4 w-32 bg-white/10 rounded" />
                </div>
            </GlassCard>
        );
    }

    if (!status) return null;

    const isUltra = status.plan === 'ultra';

    return (
        <GlassCard className={cn("p-6 flex flex-col justify-between relative overflow-hidden h-full",
            isUltra ? "border-cyan-500/30" : "border-white/5"
        )}>
            {isUltra && (
                <div className="absolute top-0 right-0 p-3 bg-cyan-500/10 rounded-bl-2xl border-b border-l border-cyan-500/20">
                    <Zap className="w-5 h-5 text-cyan-400" />
                </div>
            )}

            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className={cn("p-2.5 rounded-lg", isUltra ? "bg-cyan-500/20 text-cyan-400" : "bg-white/10 text-white")}>
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-white/40 text-xs font-bold uppercase tracking-wider">Current Plan</p>
                        <h3 className="text-xl font-bold text-white capitalize">{status.plan} Plan</h3>
                    </div>
                </div>

                <div className="mb-8">
                    <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-5xl font-bold text-white tracking-tight">{status.totalAvailable}</span>
                        <span className="text-white/40 font-medium">credits left</span>
                    </div>

                    {isUltra ? (
                        <div className="flex items-center gap-2 text-cyan-400 text-sm bg-cyan-500/10 px-3 py-1.5 rounded-full w-fit">
                            <Clock className="w-4 h-4" />
                            <span>Resets daily (50/day)</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-white/40 text-sm bg-white/5 px-3 py-1.5 rounded-full w-fit">
                            <Clock className="w-4 h-4" />
                            <span>Resets monthly</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                <Link href={isUltra ? "/billing" : "/pricing"}>
                    <Button
                        className={cn("w-full transition-all",
                            isUltra ? "bg-white/10 hover:bg-white/20 text-white" : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                        )}
                    >
                        {isUltra ? "Manage Subscription" : "Upgrade to Ultra"}
                    </Button>
                </Link>

                <div className="text-center">
                    {!showRedeem ? (
                        <button
                            onClick={() => setShowRedeem(true)}
                            className="text-xs text-white/30 hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto"
                        >
                            <Gift className="w-3 h-3" /> Redeem Promo Code
                        </button>
                    ) : (
                        <div className="mt-2 text-left">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value)}
                                    placeholder="Enter code"
                                    className="bg-black/20 border border-white/10 rounded px-3 py-1 text-sm text-white w-full focus:outline-none focus:border-cyan-500/50"
                                />
                                <Button
                                    size="sm"
                                    className={cn("h-8 py-0", status.plan === 'ultra' ? "bg-white/10" : "bg-cyan-600")}
                                    onClick={handleRedeem}
                                    disabled={redeemLoading}
                                >
                                    {redeemLoading ? "..." : "Apply"}
                                </Button>
                            </div>
                            {redeemMsg && (
                                <p className={cn("text-xs mt-1", redeemMsg.includes("Success") ? "text-green-400" : "text-red-400")}>
                                    {redeemMsg}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </GlassCard>
    );
};
