"use client";

import { clearAllAuthCookies } from "@/lib/authCookies";

import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useSettings } from "@/context/SettingsContext";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Globe, Settings as SettingsIcon, MapPin, Smartphone, RotateCcw, Check, Database, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
    const { resultsLanguage, setResultsLanguage, isAutoDetected, resetToAutoDetect, detectedCountry, fdaDrugsEnabled, setFdaDrugsEnabled } = useSettings();
    const { user } = useUser();
    const supabase = createClient();
    const router = useRouter();

    const isArabic = resultsLanguage === 'ar';
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const handleSignOut = async () => {
        clearAllAuthCookies();
        if (typeof window !== "undefined") {
            localStorage.removeItem("qurescan_active_care_profile");
        }
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <main className="min-h-screen pt-24 sm:pt-28 pb-24 md:pb-14 px-3 sm:px-6">
            <div className="clinical-page space-y-6 sm:space-y-8 max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-3.5 mb-6">
                    <div className="icon-badge icon-badge-cyan w-12 h-12 rounded-2xl shrink-0">
                        <SettingsIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{t("Settings", "الإعدادات")}</h1>
                        <p className="text-slate-400 text-xs sm:text-sm mt-0.5">{t("Customize your QureScan experience.", "قم بتخصيص تجربتك مع QureScan.")}</p>
                    </div>
                </div>

                {/* Language Settings */}
                <GlassCard className="p-6 sm:p-8" hoverEffect={false}>
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                        <Globe className="w-5 h-5 text-cyan-400" />
                                        <span>{t("App & AI Language", "لغة التطبيق والذكاء الاصطناعي")}</span>
                                    </h2>

                                    {isAutoDetected && (
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-400/10 border border-cyan-400/25 text-cyan-300 flex items-center gap-1">
                                            <Smartphone className="w-3 h-3" />
                                            {t("Auto-Detected", "تحديد تلقائي (جوال/موقع)")}
                                        </span>
                                    )}
                                </div>
                                <p className="text-slate-400 text-xs sm:text-sm max-w-lg leading-relaxed">
                                    {t("The application automatically detects your mobile device language and location. You can override it manually anytime.", "يتعرف التطبيق تلقائياً على لغة جوالك وموقعك الجغرافي. يمكنك تغيير اللغة يدوياً في أي وقت.")}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-white/10 shrink-0">
                                <button
                                    onClick={() => setResultsLanguage("en")}
                                    className={cn(
                                        "px-5 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5",
                                        resultsLanguage === "en"
                                            ? "bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 font-bold"
                                            : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                                    )}
                                >
                                    {resultsLanguage === "en" && <Check className="w-3.5 h-3.5" />}
                                    {t("English", "English")}
                                </button>
                                <button
                                    onClick={() => setResultsLanguage("ar")}
                                    className={cn(
                                        "px-5 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5",
                                        resultsLanguage === "ar"
                                            ? "bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 font-bold"
                                            : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                                    )}
                                >
                                    {resultsLanguage === "ar" && <Check className="w-3.5 h-3.5" />}
                                    {t("العربية", "العربية")}
                                </button>
                            </div>
                        </div>

                        {/* Reset to Auto Detect Option */}
                        <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-4 text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                                <span>
                                    {detectedCountry
                                        ? t(`Detected Region: ${detectedCountry}`, `المنطقة المكتشفة: ${detectedCountry}`)
                                        : t("Device location detection active", "التعرف التلقائي على الجوال والموقع نشط")}
                                </span>
                            </div>

                            {!isAutoDetected && (
                                <button
                                    onClick={resetToAutoDetect}
                                    className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 transition-colors underline underline-offset-4"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>{t("Reset to Auto-Detection", "الرجوع للتحديد التلقائي بحسب الجوال")}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </GlassCard>

                {/* FDA Verification Settings */}
                <GlassCard className="p-6 sm:p-8" hoverEffect={false}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1.5 min-w-0">
                            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                <Database className="w-5 h-5 text-emerald-400 shrink-0" />
                                <span>{t("FDA Drugs Verification", "التحقق من الأدوية عبر هيئة الغذاء والدواء (FDA)")}</span>
                            </h2>
                            <p className="text-slate-400 text-xs sm:text-sm max-w-lg leading-relaxed">
                                {t(
                                    "Cross-check medication scans with official FDA datasets (openFDA) to verify manufacturer details, active ingredients, and exact dosages.",
                                    "مطابقة فحوصات الأدوية مع قواعد بيانات الغذاء والدواء العالمية (openFDA) للتحقق من جهة التصنيع والمواد الفعالة والجرعات الدقيقة."
                                )}
                            </p>
                        </div>

                        <button
                            type="button"
                            role="switch"
                            aria-checked={fdaDrugsEnabled}
                            onClick={() => setFdaDrugsEnabled(!fdaDrugsEnabled)}
                            className={cn(
                                "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors focus:outline-none",
                                fdaDrugsEnabled
                                    ? "bg-emerald-500/20 border-emerald-500/40"
                                    : "bg-white/5 border-white/15"
                            )}
                        >
                            <span
                                className={cn(
                                    "inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform",
                                    isArabic
                                        ? fdaDrugsEnabled ? "-translate-x-7" : "-translate-x-1"
                                        : fdaDrugsEnabled ? "translate-x-7" : "translate-x-1"
                                )}
                            />
                        </button>
                    </div>
                </GlassCard>

                {/* Account & Logout Options */}
                {user && (
                    <GlassCard className="p-6 sm:p-8 border-rose-500/20 bg-gradient-to-br from-rose-950/20 to-slate-950/80" hoverEffect={false}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="space-y-1">
                                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                    <User className="w-5 h-5 text-rose-400" />
                                    <span>{t("Account & Session", "الحساب ورلسة الدخول")}</span>
                                </h2>
                                <p className="text-slate-400 text-xs sm:text-sm">
                                    {t("Currently signed in as:", "مسجل الدخول حالياً بحساب:")}{" "}
                                    <span className="text-white font-medium">{user.email}</span>
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <Link href="/profile">
                                    <Button variant="outline" size="sm" className="border-white/15 text-white">
                                        {t("View Profile", "عرض الحساب")}
                                    </Button>
                                </Link>
                                <Button
                                    onClick={handleSignOut}
                                    variant="outline"
                                    size="sm"
                                    className="border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-white font-semibold"
                                >
                                    <LogOut className="w-4 h-4 me-2 shrink-0" />
                                    <span>{t("Sign Out / Switch Account", "تسجيل الخروج / تبديل الحساب")}</span>
                                </Button>
                            </div>
                        </div>
                    </GlassCard>
                )}

            </div>
        </main>
    );
}

