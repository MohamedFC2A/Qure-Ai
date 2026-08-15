"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, CreditCard, Banknote, ShieldCheck, Zap } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSettings } from "@/context/SettingsContext";
import { useUser } from "@/context/UserContext";
import { useUltraCelebration } from "@/context/UltraCelebrationContext";
import { cn } from "@/lib/utils";
import Link from "next/link";

function BillingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const plan = searchParams.get("plan") || "ultra";
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { resultsLanguage } = useSettings();
    const { refreshUser } = useUser();
    const { triggerCelebration } = useUltraCelebration();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const [voucherCode, setVoucherCode] = useState("");
    const [redeemLoading, setRedeemLoading] = useState(false);
    const [redeemMsg, setRedeemMsg] = useState("");

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
                alert(t("Failed to start checkout. Please try again.", "فشل بدء الدفع. يرجى المحاولة لاحقًا."));
            }
        } catch (e) {
            console.error(e);
            alert(t("An error occurred.", "حدث خطأ."));
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: voucherCode })
            });
            const data = await res.json();
            if (res.ok) {
                setRedeemMsg(data.message || t("Success! Credits added.", "تم بنجاح! أضيف الرصيد."));
                setVoucherCode("");
                await refreshUser();
                setTimeout(() => {
                    triggerCelebration({ force: true });
                }, 300);
            } else {
                setRedeemMsg(data.error || t("Failed", "فشل الاستبدال"));
            }
        } catch (e) {
            setRedeemMsg(t("Error redeeming code", "خطأ في استبدال الكود"));
        } finally {
            setRedeemLoading(false);
        }
    };

    if (success) {
        return (
            <main className="min-h-screen flex items-center justify-center p-3 sm:p-6 pt-16 sm:pt-24 pb-16 sm:pb-20">
                <GlassCard className="max-w-md w-full p-6 sm:p-8 text-center flex flex-col items-center" hoverEffect={false}>
                    <div className="icon-badge icon-badge-amber w-14 h-14 rounded-2xl mb-5">
                        <AlertTriangle className="w-7 h-7" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white mb-3">
                        {t("Payment Gateway Update", "تحديث بوابة الدفع")}
                    </h1>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                        {t(
                            "Our payment gateway is currently undergoing scheduled maintenance. Your request has been recorded and you will be notified.",
                            "تخضع بوابة الدفع حاليًا للصيانة المجدولة. تم تسجيل طلبك وسيتم إشعارك فور اكتمال التحديث."
                        )}
                    </p>
                    <Button href="/dashboard" variant="outline" className="w-full font-semibold">
                        {t("Return to Dashboard", "العودة للوحة التحكم")}
                    </Button>
                </GlassCard>
            </main>
        );
    }

    return (
        <main className="min-h-screen pt-16 sm:pt-24 pb-16 sm:pb-20 md:pb-14 px-3 sm:px-6 flex items-center justify-center">
            <GlassCard className="max-w-2xl w-full p-6 sm:p-10" hoverEffect={false}>
                <div className="mb-6 sm:mb-8 border-b border-white/10 pb-6 sm:pb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        {t("Upgrade Workspace", "ترقية مساحة العمل")}
                    </h1>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">
                        {t("Complete your upgrade to", "أكمل ترقيتك إلى")}{" "}
                        <span className="text-cyan-300 font-bold uppercase">
                            {plan === "golden_ceo" ? t("Executive CEO Upgrade (Beta)", "ترقية خاصة من قبل CEO (نسخة البيتا)") : plan}
                        </span>
                    </p>
                </div>

                <div className="space-y-4 sm:space-y-5">
                    <h3 className="text-white font-bold text-sm">
                        {t("Select Payment Method", "اختر وسيلة الدفع")}
                    </h3>

                    {/* Method: Card */}
                    <div className="relative opacity-60 cursor-not-allowed">
                        <GlassCard className="p-4 flex items-center gap-3.5 border-white/10" hoverEffect={false}>
                            <div className="icon-badge icon-badge-cyan w-11 h-11 rounded-xl shrink-0">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-bold text-sm">{t("Credit/Debit Card", "بطاقة ائتمان / خصم مباشر")}</h4>
                                <p className="text-slate-500 text-xs">Visa, Mastercard, Meeza</p>
                            </div>
                            <div className="px-2.5 py-1 bg-white/5 rounded-lg text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                                {t("Soon", "قريبًا")}
                            </div>
                        </GlassCard>
                    </div>

                    {/* Method: InstaPay */}
                    <div className="relative opacity-60 cursor-not-allowed">
                        <GlassCard className="p-4 flex items-center gap-3.5 border-white/10" hoverEffect={false}>
                            <div className="icon-badge icon-badge-violet w-11 h-11 rounded-xl shrink-0">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-bold text-sm">InstaPay</h4>
                                <p className="text-slate-500 text-xs">{t("Instant Bank Transfer", "تحويل بنكي فوري")}</p>
                            </div>
                            <div className="px-2.5 py-1 bg-white/5 rounded-lg text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                                {t("Soon", "قريبًا")}
                            </div>
                        </GlassCard>
                    </div>

                    {/* Method: Cash */}
                    <button
                        onClick={() => handleCheckout('cash')}
                        disabled={loading}
                        className="w-full text-start focus:outline-none"
                    >
                        <GlassCard className="p-4 flex items-center gap-3.5 border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/15 transition-all cursor-pointer" hoverEffect={false}>
                            <div className="icon-badge icon-badge-emerald w-11 h-11 rounded-xl shrink-0">
                                <Banknote className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-bold text-sm">{t("Digital Wallets / Cash", "المحافظ الإلكترونية / كاش")}</h4>
                                <p className="text-slate-400 text-xs">Vodafone Cash, Orange Cash, Etisalat Cash</p>
                            </div>
                            <div className="px-3 py-1 bg-cyan-400/20 text-cyan-300 rounded-lg text-xs font-bold shrink-0">
                                {t("Select", "اختيار")}
                            </div>
                        </GlassCard>
                    </button>

                    {/* Method: Voucher Code */}
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <h3 className="text-white font-bold text-sm mb-3">
                            {t("Have a Promo Code?", "هل لديك كود خصم أو قسيمة؟")}
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                value={voucherCode}
                                onChange={(e) => setVoucherCode(e.target.value)}
                                placeholder={t("Enter code (e.g. 01272...)", "أدخل الرمز (مثال: 01272...)")}
                                className="clinical-input flex-1 text-xs sm:text-sm"
                            />
                            <Button
                                onClick={handleRedeemVoucher}
                                disabled={redeemLoading || !voucherCode}
                                className="font-bold whitespace-nowrap text-xs sm:text-sm"
                                glow
                            >
                                {redeemLoading ? t("Processing...", "جارٍ المعالجة...") : t("Redeem", "استبدال")}
                            </Button>
                        </div>
                        {redeemMsg && (
                            <p className={cn("text-xs mt-2 font-semibold", redeemMsg.includes("Success") || redeemMsg.includes("تم") ? "text-emerald-400" : "text-amber-400")}>
                                {redeemMsg}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-500 text-xs justify-center pt-4">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>{t("256-Bit SSL Encrypted Checkout", "دفع مشفّر بحماية 256-Bit SSL")}</span>
                    </div>
                </div>
            </GlassCard>
        </main>
    );
}

export default function BillingPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen pt-28 px-4 flex items-center justify-center">
                <div className="text-slate-400 text-sm">Loading billing options...</div>
            </div>
        }>
            <BillingContent />
        </React.Suspense>
    );
}
