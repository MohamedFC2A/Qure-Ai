"use client";

import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, CreditCard, Banknote, ShieldCheck, Zap } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Separate component that uses search params
function BillingContent() {
    const searchParams = useSearchParams();
    const plan = searchParams.get("plan") || "ultra";
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const supabase = createClient();

    const [voucherCode, setVoucherCode] = useState("");
    const [redeemLoading, setRedeemLoading] = useState(false);
    const [redeemMsg, setRedeemMsg] = useState("");

    // Use the checkout API instead of direct DB call
    const handleCheckout = async (method: string) => {
        setLoading(true);
        try {
            const res = await fetch("/api/checkout/intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan, method })
            });

            if (res.ok) {
                setSuccess(true);
            } else {
                alert("Failed to start checkout. Please try again.");
            }
        } catch (e) {
            console.error(e);
            alert("An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleRedeemVoucher = async () => {
        if (!voucherCode) return;
        setRedeemLoading(true);
        setRedeemMsg("");
        try {
            const res = await fetch('/api/credits/redeem', {
                method: 'POST',
                body: JSON.stringify({ code: voucherCode })
            });
            const data = await res.json();
            if (res.ok) {
                setRedeemMsg(data.message || "Success! Credits added.");
                setVoucherCode("");
                // Reload after delay to show credits update in navbar (if we had access to context here, even better)
                setTimeout(() => window.location.href = "/dashboard", 1500);
            } else {
                setRedeemMsg(data.error || "Failed");
            }
        } catch (e) {
            setRedeemMsg("Error redeeming code");
        } finally {
            setRedeemLoading(false);
        }
    };

    if (success) {
        return (
            <main className="min-h-screen flex items-center justify-center p-6">
                <GlassCard className="max-w-md w-full p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mb-6">
                        <AlertTriangle className="w-8 h-8 text-yellow-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-4">Payment System Updating</h1>
                    <p className="text-white/60 leading-relaxed mb-8">
                        Our payment gateway is currently undergoing maintenance for the new Qure Ai integration.
                        Your interest has been recorded, and you will be notified when payments are live.
                    </p>
                    <Link href="/dashboard">
                        <Button variant="outline" className="w-full">Return to Dashboard</Button>
                    </Link>
                </GlassCard>
            </main>
        )
    }

    return (
        <main className="min-h-screen pt-24 pb-12 px-4 sm:px-6 flex items-center justify-center">
            <GlassCard className="max-w-2xl w-full p-8 sm:p-12">
                <div className="mb-8 border-b border-white/10 pb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Data Secure Checkout</h1>
                    <p className="text-white/50">Complete your upgrade to <span className="text-cyan-400 font-bold uppercase">{plan}</span></p>
                </div>

                <div className="space-y-6">
                    <h3 className="text-white font-medium mb-4">Select Payment Method</h3>

                    {/* Method: Card */}
                    <div className="relative group opacity-60 cursor-not-allowed grayscale">
                        <div className="absolute inset-0 bg-black/40 z-10 rounded-xl" />
                        <GlassCard className="p-4 flex items-center gap-4 border-white/10" hoverEffect={false}>
                            <div className="p-3 bg-white/5 rounded-lg">
                                <CreditCard className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-bold">Credit/Debit Card</h4>
                                <p className="text-white/40 text-xs">Visa, Mastercard, Amex</p>
                            </div>
                            <div className="px-3 py-1 bg-white/5 rounded text-xs text-white/30 font-mono">COMING SOON</div>
                        </GlassCard>
                    </div>

                    {/* Method: InstaPay */}
                    <div className="relative group opacity-60 cursor-not-allowed grayscale">
                        <div className="absolute inset-0 bg-black/40 z-10 rounded-xl" />
                        <GlassCard className="p-4 flex items-center gap-4 border-white/10" hoverEffect={false}>
                            <div className="p-3 bg-white/5 rounded-lg">
                                <Zap className="w-6 h-6 text-violet-400" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-bold">InstaPay</h4>
                                <p className="text-white/40 text-xs">Instant Bank Transfer</p>
                            </div>
                            <div className="px-3 py-1 bg-white/5 rounded text-xs text-white/30 font-mono">COMING SOON</div>
                        </GlassCard>
                    </div>

                    {/* Method: Cash */}
                    <button
                        onClick={() => handleCheckout('cash')}
                        disabled={loading}
                        className="w-full text-left"
                    >
                        <GlassCard className="p-4 flex items-center gap-4 border-cyan-500/30 bg-cyan-500/5 group hover:bg-cyan-500/10 transition-colors">
                            <div className="p-3 bg-cyan-500/20 rounded-lg text-cyan-400">
                                <Banknote className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-bold group-hover:text-cyan-300 transition-colors">Digital Wallets / Cash</h4>
                                <p className="text-white/40 text-xs">Vodafone Cash, Orange Cash</p>
                            </div>
                            <div className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs font-bold">SELECT</div>
                        </GlassCard>
                    </button>

                    {/* Method: Voucher Code */}
                    <div className="mt-8 pt-8 border-t border-white/10">
                        <h3 className="text-white font-medium mb-4">Have a Promo Code?</h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={voucherCode}
                                onChange={(e) => setVoucherCode(e.target.value)}
                                placeholder="Enter code (e.g. 01272...)"
                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                            />
                            <Button
                                onClick={handleRedeemVoucher}
                                disabled={redeemLoading || !voucherCode}
                                className="min-w-[120px]"
                            >
                                {redeemLoading ? "Processing" : "Redeem"}
                            </Button>
                        </div>
                        {redeemMsg && (
                            <p className={cn("text-xs mt-2 font-medium", redeemMsg.includes("Success") ? "text-green-400" : "text-amber-400")}>
                                {redeemMsg}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-white/30 text-xs justify-center mt-8">
                        <ShieldCheck className="w-4 h-4" />
                        SSL Encrypted Payment
                    </div>
                </div>
            </GlassCard>
        </main>
    );
}

// Main page component wrapped in Suspense
export default function BillingPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
                <div className="text-white/50">Loading billing options...</div>
            </div>
        }>
            <BillingContent />
        </React.Suspense>
    );
}


