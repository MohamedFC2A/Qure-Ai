"use client";

import { ScannerInterface } from "@/components/scanner/ScannerInterface";
import { GlassCard } from "@/components/ui/GlassCard";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Zap, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Internal Component for Upsell
const CreditsUpsellBanner = () => {
    const { credits, plan, loading } = useUser();
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    if (loading) return null;

    if (credits < 5 || plan === "free") {
        return (
            <div className="w-full max-w-5xl mb-5">
                <div className={cn(
                    "flex flex-col sm:flex-row items-center justify-between gap-4",
                    "rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3.5 backdrop-blur-xl"
                )}>
                    <div className={cn("flex items-center gap-3", isArabic ? "flex-row-reverse" : "")}>
                        <div className="icon-badge icon-badge-amber w-9 h-9 rounded-xl shrink-0">
                            {credits < 5 ? <Zap className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </div>
                        <div className={isArabic ? "text-right" : ""}>
                            <h3 className="font-bold text-white text-sm">
                                {credits < 5
                                    ? t("Running low on credits", "رصيدك ينفد قريبًا")
                                    : t("Unlock Pro Features", "افتح ميزات Pro")}
                            </h3>
                            <p className="text-slate-500 text-xs">
                                {credits < 5
                                    ? t(`${credits} credits left — upgrade for more.`, `تبقّى ${credits} رصيد — قم بالترقية للمزيد.`)
                                    : t("Upgrade to Ultra for private history and faster processing.", "قم بالترقية إلى Ultra للسجل الخاص والمعالجة الأسرع.")}
                            </p>
                        </div>
                    </div>
                    <Link href="/pricing" className="shrink-0">
                        <Button variant="amber" size="sm" className="gap-2 whitespace-nowrap">
                            <Zap className="w-3.5 h-3.5" />
                            {t("Upgrade", "ترقية")}
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }
    return null;
};

export default function ScanPage() {
    const router = useRouter();
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const goBack = () => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
            return;
        }
        router.push("/");
    };

    return (
        <main
            className={cn(
                "min-h-screen pt-24 sm:pt-28 pb-28 md:pb-14 px-2.5 sm:px-6",
                "flex flex-col items-center relative",
                isArabic ? "font-arabic" : ""
            )}
            dir={isArabic ? "rtl" : "ltr"}
        >
            <div className="z-10 w-full max-w-6xl flex flex-col items-center">

                {/* ── Back button ── */}
                <div className={cn("w-full mb-4", isArabic ? "text-right" : "text-left")}>
                    <button
                        onClick={goBack}
                        className={cn(
                            "inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03]",
                            "px-3.5 py-2 text-sm text-slate-500 transition-all hover:bg-white/[0.06] hover:text-white",
                            isArabic ? "flex-row-reverse" : ""
                        )}
                    >
                        <ArrowLeft className={cn("h-4 w-4", isArabic ? "rotate-180" : "")} />
                        {t("Back", "رجوع")}
                    </button>
                </div>

                {/* ── Upsell banner ── */}
                <CreditsUpsellBanner />

                {/* ── Scanner section ── */}
                <section className="w-full rounded-2xl border border-white/[0.07] bg-slate-950/40 p-2 sm:p-4 md:p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
                    <ScannerInterface />
                </section>
            </div>
        </main>
    );
}
