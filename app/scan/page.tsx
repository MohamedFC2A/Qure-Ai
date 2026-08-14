"use client";

import { ScannerInterface } from "@/components/scanner/ScannerInterface";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { useScan } from "@/context/ScanContext";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Zap, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Upsell Banner for credits/Pro features
const CreditsUpsellBanner = () => {
    const { credits, plan, loading } = useUser();
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    if (loading) return null;

    if (credits < 5 || plan === "free") {
        return (
            <div className="w-full max-w-5xl mb-4 sm:mb-5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] px-4 py-3 backdrop-blur-xl">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="icon-badge icon-badge-amber w-9 h-9 rounded-xl shrink-0">
                            {credits < 5 ? <Zap className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-white text-xs sm:text-sm">
                                {credits < 5
                                    ? t("Running low on credits", "رصيدك ينفد قريبًا")
                                    : t("Unlock Pro Features", "افتح ميزات ألترا Pro")}
                            </h3>
                            <p className="text-slate-400 text-[11px] sm:text-xs truncate">
                                {credits < 5
                                    ? t(`${credits} credits left — upgrade for more.`, `تبقّى ${credits} رصيد — قم بالترقية للمزيد.`)
                                    : t("Upgrade to Ultra for private history and interaction guard.", "قم بالترقية إلى Ultra للسجل الخاص وحارس التداخلات.")}
                            </p>
                        </div>
                    </div>
                    <Link href="/pricing" className="shrink-0 w-full sm:w-auto">
                        <Button variant="amber" size="xs" className="w-full sm:w-auto gap-1.5 font-bold whitespace-nowrap">
                            <Zap className="w-3.5 h-3.5" />
                            <span>{t("Upgrade", "ترقية")}</span>
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
    const { file, previewSrc, finalResult, resetScan } = useScan();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const handleBackClick = () => {
        if (file || previewSrc || finalResult) {
            resetScan();
        } else {
            if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
            } else {
                router.push("/");
            }
        }
    };

    return (
        <main className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-3 sm:px-6 flex flex-col items-center relative">
            <div className="z-10 w-full max-w-6xl flex flex-col items-center">
                {/* ── Back button ── */}
                <div className="w-full mb-3 sm:mb-4 flex items-center justify-start">
                    <button
                        onClick={handleBackClick}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-xs sm:text-sm text-slate-400 transition-all hover:bg-white/[0.08] hover:text-white"
                    >
                        <ArrowLeft className={cn("h-4 w-4 shrink-0", isArabic ? "rotate-180" : "")} />
                        <span>{t("Back to Scan", "رجوع للفحص")}</span>
                    </button>
                </div>

                {/* ── Upsell banner ── */}
                <CreditsUpsellBanner />

                {/* ── Scanner Interface Container ── */}
                <section className="w-full rounded-3xl border border-white/[0.09] bg-[#080D1A]/80 p-3 sm:p-5 md:p-6 shadow-2xl shadow-black/50 backdrop-blur-2xl">
                    <ScannerInterface />
                </section>
            </div>
        </main>
    );
}
