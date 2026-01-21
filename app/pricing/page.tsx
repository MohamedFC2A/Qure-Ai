"use client";

import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Check, Sparkles, Zap, Shield, Globe, Clock, Gift, Lock } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PricingPage() {
    const { user, credits, plan, refreshUser, loading } = useUser();
    const router = useRouter();
    const [buying, setBuying] = useState(false);

    const handlePurchase = async () => {
        if (!confirm("Spend 2000 Credits to upgrade to Ultra for 30 days?")) return;

        setBuying(true);
        try {
            const res = await fetch('/api/plans/purchase', { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                alert(data.message);
                await refreshUser();
                router.push('/dashboard');
            } else {
                alert(data.error);
                if (data.error && data.error.includes("Insufficient")) {
                    router.push('/profile'); // To top up
                }
            }
        } catch (e) {
            alert("Purchase failed");
        } finally {
            setBuying(false);
        }
    };

    return (
        <main className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold text-white mb-4">اختر خطتك</h1>
                <p className="text-white/60 max-w-2xl mx-auto">
                    فعّل أقوى ميزات التحليل والسلامة والتخصيص مع خطة Ultra.
                    يمكنك الترقية فورًا باستخدام الرصيد.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* Free Plan */}
                <GlassCard className="p-8 border-white/5 relative overflow-hidden">
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-white mb-2">Free</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white">Free</span>
                        </div>
                        <p className="text-white/40 text-sm mt-2">المستوى الأساسي للتحليل</p>
                        <div className="mt-6 flex flex-col gap-2">
                            <Button disabled variant="outline" className="w-full border-white/10 text-white/50">Current Plan</Button>
                        </div>
                    </div>
                    <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-white/70"><Check className="w-5 h-5 text-cyan-400" /> 50 C / يوم</li>
                        <li className="flex items-center gap-3 text-white/70"><Check className="w-5 h-5 text-cyan-400" /> سرعة قياسية</li>
                        <li className="flex items-center gap-3 text-white/70"><Check className="w-5 h-5 text-cyan-400" /> تحقق أساسي من المطابقة</li>
                        <li className="flex items-center gap-3 text-white/70"><Check className="w-5 h-5 text-cyan-400" /> حفظ النتائج في السجل</li>
                    </ul>
                </GlassCard>

                {/* Ultra Plan */}
                <GlassCard className="p-8 border-amber-500/30 bg-amber-500/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                        RECOMMENDED
                    </div>

                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            Ultra <Sparkles className="w-5 h-5 text-amber-400" />
                        </h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white">2000 C</span>
                            <span className="text-white/50">/ month</span>
                        </div>
                        <p className="text-amber-200/60 text-sm mt-2">أقصى قوة + تخصيص + سلامة</p>

                        <div className="mt-6 flex flex-col gap-3">
                            {loading ? (
                                <div className="h-10 bg-white/10 animate-pulse rounded" />
                            ) : (
                                <Button
                                    onClick={handlePurchase}
                                    disabled={plan === 'ultra' || buying}
                                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-none"
                                >
                                    {buying ? "Processing..." : plan === 'ultra' ? "Plan Active" : "Purchase with Credits"}
                                </Button>
                            )}

                            {plan !== 'ultra' && !loading && (
                                <p className="text-xs text-center text-white/40">
                                    Balance: {credits} C • <Link href="/profile" className="text-amber-400 hover:underline">Top Up</Link>
                                </p>
                            )}
                        </div>
                    </div>

                    <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-white"><Zap className="w-5 h-5 text-amber-400" /> 1500 Credits / Month</li>
                        <li className="flex items-center gap-3 text-white"><Clock className="w-5 h-5 text-amber-400" /> 2x Faster Analysis Speed</li>
                        <li className="flex items-center gap-3 text-white"><Shield className="w-5 h-5 text-amber-400" /> Private Health Profile</li>
                        <li className="flex items-center gap-3 text-white"><Globe className="w-5 h-5 text-amber-400" /> Multilingual & Auto-Translate</li>
                        <li className="flex items-center gap-3 text-white"><Gift className="w-5 h-5 text-amber-400" /> Medication Memory System</li>
                    </ul>
                </GlassCard>
            </div>

            {/* Full Comparison */}
            <div className="mt-14 max-w-5xl mx-auto">
                <GlassCard className="p-0 overflow-hidden border-white/10" hoverEffect={false}>
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-2xl font-bold text-white">مقارنة كاملة</h2>
                        <p className="text-white/50 text-sm mt-1">جدول واضح يوضح ما تحصل عليه في كل خطة.</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left">
                                    <th className="p-4 text-white/50 font-semibold">الميزة</th>
                                    <th className="p-4 text-white/50 font-semibold">Free</th>
                                    <th className="p-4 text-amber-200 font-semibold bg-amber-500/5">Ultra</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { f: "التحليل الأساسي + حفظ في السجل", free: true, ultra: true },
                                    { f: "openFDA: توثيق الاسم + NDC/UNII/SPL", free: true, ultra: true },
                                    { f: "حزمة الأمان المتقدمة (احتياطات/تداخلات/آثار/جرعة زائدة/متى تطلب المساعدة)", free: false, ultra: true },
                                    { f: "Private AI Profile + Medication Memories", free: false, ultra: true },
                                    { f: "شجرة الأسئلة (AI Tree) بعد النتائج", free: false, ultra: true },
                                    { f: "openFDA: أقسام النشرة الرسمية (Warnings/Interactions/Overdose…)", free: false, ultra: true },
                                    { f: "تصدير النتائج", free: "PNG", ultra: "PNG + PDF (HQ)" },
                                    { f: "حد الاستخدام", free: "50 C / يوم", ultra: "1500 C / شهر" },
                                ].map((row, idx) => (
                                    <tr key={idx} className="border-t border-white/10">
                                        <td className="p-4 text-white/80">{row.f}</td>
                                        <td className="p-4 text-white/70">
                                            {typeof row.free === "boolean" ? (
                                                row.free ? <Check className="w-5 h-5 text-cyan-400" /> : <Lock className="w-5 h-5 text-white/30" />
                                            ) : (
                                                <span className="text-white/70">{row.free}</span>
                                            )}
                                        </td>
                                        <td className="p-4 bg-amber-500/5 text-white">
                                            {typeof row.ultra === "boolean" ? (
                                                row.ultra ? <Check className="w-5 h-5 text-amber-400" /> : <Lock className="w-5 h-5 text-white/30" />
                                            ) : (
                                                <span className="text-white">{row.ultra}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </div>

            <div className="mt-16 text-center">
                <h2 className="text-xl font-bold text-white mb-6">Need Credits?</h2>
                <Link href="/profile">
                    <Button variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                        Redeem Voucher Code
                    </Button>
                </Link>
            </div>
        </main>
    );
}
