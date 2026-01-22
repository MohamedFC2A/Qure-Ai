"use client";

import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Check, Sparkles, Zap, Shield, Globe, Clock, Gift, Lock } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";

export default function PricingPage() {
    const { plan, loading } = useUser();
    const router = useRouter();

    const handlePurchase = () => {
        router.push("/billing");
    };

    return (
        <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
            <div className="relative max-w-6xl mx-auto">
                <div className="absolute -top-10 right-10 h-40 w-40 bg-cyan-500/20 blur-3xl rounded-full" />
                <div className="absolute -top-4 left-10 h-32 w-32 bg-fuchsia-500/20 blur-3xl rounded-full" />

                <div className="text-center mb-14">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs sm:text-sm">
                        اختر الخطة الأنسب لأسلوب استخدامك
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mt-4">خطط مرنة وتجربة قوية</h1>
                    <p className="text-white/60 text-base sm:text-lg max-w-2xl mx-auto mt-3">
                        لغة موحدة، تفاصيل واضحة، وواجهة تضع أهم المزايا أمامك مباشرة.
                    </p>
                </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* Free Plan */}
                <GlassCard className="p-8 border-white/5 relative overflow-hidden">
                    <div className="mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs">
                            الخطة المجانية
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-white">0$</span>
                            <span className="text-white/50">مجاني</span>
                        </div>
                        <p className="text-white/40 text-sm mt-2">بداية قوية لتحليل سريع وموثوق</p>
                        <div className="mt-6 flex flex-col gap-2">
                            <Button disabled variant="outline" className="w-full border-white/10 text-white/50">الخطة الحالية</Button>
                        </div>
                    </div>
                    <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-white/70"><Check className="w-5 h-5 text-cyan-400" /> 100 كريديت بلا انتهاء</li>
                        <li className="flex items-center gap-3 text-white/70"><Check className="w-5 h-5 text-cyan-400" /> سرعة قياسية وثبات في النتائج</li>
                        <li className="flex items-center gap-3 text-white/70"><Check className="w-5 h-5 text-cyan-400" /> تحقق أساسي من المطابقة</li>
                        <li className="flex items-center gap-3 text-white/70"><Check className="w-5 h-5 text-cyan-400" /> حفظ النتائج في السجل</li>
                    </ul>
                </GlassCard>

                {/* Ultra Plan */}
                <GlassCard className="p-8 border-amber-500/30 bg-amber-500/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                        الأفضل
                    </div>

                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            Ultra <Sparkles className="w-5 h-5 text-amber-400" />
                        </h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white">$9</span>
                            <span className="text-white/50">/ شهريًا</span>
                        </div>
                        <p className="text-amber-200/60 text-sm mt-2">أقصى قوة + تخصيص + سلامة متقدمة</p>

                        <div className="mt-6 flex flex-col gap-3">
                            {loading ? (
                                <div className="h-10 bg-white/10 animate-pulse rounded" />
                            ) : (
                                <Button
                                    onClick={handlePurchase}
                                    disabled={plan === 'ultra'}
                                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-none"
                                >
                                    {plan === 'ultra' ? "الخطة مفعّلة" : "اشترك الآن"}
                                </Button>
                            )}
                        </div>
                    </div>

                    <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-white"><Zap className="w-5 h-5 text-amber-400" /> حتى 2000 كريديت شهريًا</li>
                        <li className="flex items-center gap-3 text-white"><Clock className="w-5 h-5 text-amber-400" /> تحليل أسرع ×2</li>
                        <li className="flex items-center gap-3 text-white"><Shield className="w-5 h-5 text-amber-400" /> ملف صحي خاص ومحمي</li>
                        <li className="flex items-center gap-3 text-white"><Globe className="w-5 h-5 text-amber-400" /> تعدد لغات وترجمة تلقائية</li>
                        <li className="flex items-center gap-3 text-white"><Gift className="w-5 h-5 text-amber-400" /> ذاكرة الأدوية والتنبيهات الذكية</li>
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
                        <table className="w-full text-sm min-w-[560px]">
                            <thead>
                                <tr className="text-left">
                                    <th className="p-3 sm:p-4 text-white/50 font-semibold">الميزة</th>
                                    <th className="p-3 sm:p-4 text-white/50 font-semibold">مجاني</th>
                                    <th className="p-3 sm:p-4 text-amber-200 font-semibold bg-amber-500/5">Ultra</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { f: "التحليل الأساسي + حفظ النتائج في السجل", free: true, ultra: true },
                                    { f: "توثيق الاسم مع openFDA (NDC/UNII/SPL)", free: true, ultra: true },
                                    { f: "حزمة الأمان المتقدمة", free: false, ultra: true },
                                    { f: "ملف صحي خاص + ذاكرة الأدوية", free: false, ultra: true },
                                    { f: "شجرة الأسئلة الذكية بعد النتائج", free: false, ultra: true },
                                    { f: "أقسام النشرة الرسمية المتقدمة", free: false, ultra: true },
                                    { f: "تصدير النتائج", free: "PNG", ultra: "PNG + PDF عالي الجودة" },
                                    { f: "حد الاستخدام", free: "100 كريديت بلا انتهاء", ultra: "حتى 2000 كريديت شهريًا" },
                                ].map((row, idx) => (
                                    <tr key={idx} className="border-t border-white/10">
                                        <td className="p-3 sm:p-4 text-white/80">{row.f}</td>
                                        <td className="p-3 sm:p-4 text-white/70">
                                            {typeof row.free === "boolean" ? (
                                                row.free ? <Check className="w-5 h-5 text-cyan-400" /> : <Lock className="w-5 h-5 text-white/30" />
                                            ) : (
                                                <span className="text-white/70">{row.free}</span>
                                            )}
                                        </td>
                                        <td className="p-3 sm:p-4 bg-amber-500/5 text-white">
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
                <h2 className="text-xl font-bold text-white mb-6">هل تحتاج رصيدًا إضافيًا؟</h2>
                <Link href="/profile">
                    <Button variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                        استبدال كود القسيمة
                    </Button>
                </Link>
            </div>
            </div>
        </main>
    );
}
