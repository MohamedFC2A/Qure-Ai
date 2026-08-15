"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
    Sparkles,
    Timer,
    CheckCircle2,
    ShieldCheck,
    Cpu,
    Zap,
    Users,
    ChevronRight,
    Pill,
    Stethoscope,
    FileText,
    Camera,
    Image as ImageIcon,
    RotateCw,
    SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";
import { AI_DISPLAY_NAME } from "@/lib/ai/branding";

interface PreFlightEstimatorProps {
    imageQuality: {
        width: number;
        height: number;
        sizeMB: number;
        isHighClarity: boolean;
        isAcceptable: boolean;
        isTooSmall: boolean;
    } | null;
    scanType: "auto" | "medication" | "prescription" | "wound";
    activeProfileName?: string;
    onOpenProfilePicker?: () => void;
    onStartScan: () => void;
    onRetakeCamera: () => void;
    onChooseGallery: () => void;
    onRotate: () => void;
    isScanning: boolean;
}

export const PreFlightEstimator: React.FC<PreFlightEstimatorProps> = ({
    imageQuality,
    scanType,
    activeProfileName,
    onOpenProfilePicker,
    onStartScan,
    onRetakeCamera,
    onChooseGallery,
    onRotate,
    isScanning,
}) => {
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    // Calculate realistic, dynamic estimated duration (seconds)
    const estimation = useMemo(() => {
        let baseSec = 6.0;
        let rangeMin = 5;
        let rangeMax = 8;
        let complexityLabelEn = "Optimal High-Speed Scan";
        let complexityLabelAr = "فحص عالي السرعة فائق الدقة";

        if (scanType === "wound") {
            baseSec = 8.5;
            rangeMin = 7;
            rangeMax = 11;
            complexityLabelEn = "Deep Tissue & Clinical Vision Analysis";
            complexityLabelAr = "تحليل الأنسجة والتشخيص السريري المتقدم";
        } else if (scanType === "prescription") {
            baseSec = 9.0;
            rangeMin = 8;
            rangeMax = 12;
            complexityLabelEn = "Handwriting OCR & Interaction Cross-Check";
            complexityLabelAr = "قراءة خط اليد ومطابقة التداخلات الدوائية";
        } else {
            // standard medication
            if (imageQuality && imageQuality.width > 2000) {
                baseSec = 6.8;
                rangeMin = 6;
                rangeMax = 9;
            } else {
                baseSec = 5.5;
                rangeMin = 4;
                rangeMax = 7;
            }
        }

        return {
            baseSec,
            rangeMin,
            rangeMax,
            complexityLabel: isArabic ? complexityLabelAr : complexityLabelEn,
        };
    }, [scanType, imageQuality, isArabic]);

    return (
        <div className="w-full flex flex-col gap-4 text-start">
            {/* Top Pre-Flight Diagnostic Bar */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                            <Cpu className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                                <span>{t("Pre-Scan Clinical Calibration", "المعايرة السريرية المسبقة")}</span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-[10px] font-mono">
                                    {t("READY", "جاهز")}
                                </span>
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                {AI_DISPLAY_NAME} {t("Vision Neural Core v4.2", "المحرك البصري السريري")}
                            </p>
                        </div>
                    </div>

                    {/* Accurate Estimated Processing Time Badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-400/30 shadow-inner self-start sm:self-center">
                        <Timer className="w-4 h-4 text-cyan-300 shrink-0" />
                        <div className="text-start">
                            <span className="text-[10px] text-cyan-200/70 block leading-tight font-medium">
                                {t("Estimated Scan Time", "الوقت التقديري المتوقع")}
                            </span>
                            <span className="text-xs font-black text-cyan-300 font-mono">
                                ~ {estimation.rangeMin} - {estimation.rangeMax} {t("seconds", "ثوانٍ")}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Grid of Pre-Flight Diagnostics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3">
                    {/* Diagnostic 1: Image Clarity */}
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">{t("Resolution & Clarity", "دقة ووضوح الصورة")}</span>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="text-xs font-bold text-white truncate font-mono">
                                {imageQuality ? `${imageQuality.width}×${imageQuality.height}` : "4K Enhanced"}
                            </span>
                        </div>
                    </div>

                    {/* Diagnostic 2: Verification Standard */}
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">{t("Clinical Safety Guard", "معايير الأمان السريري")}</span>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="text-xs font-bold text-cyan-200 truncate">
                                {t("FDA & RxNorm Active", "مطابقة FDA وRxNorm")}
                            </span>
                        </div>
                    </div>

                    {/* Diagnostic 3: Target Profile */}
                    <div
                        onClick={onOpenProfilePicker}
                        className={cn(
                            "col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between transition-all",
                            onOpenProfilePicker ? "cursor-pointer hover:bg-white/[0.06] hover:border-cyan-400/30" : ""
                        )}
                    >
                        <span className="text-[10px] text-slate-400 font-medium">{t("Target Profile", "الملف الصحي")}</span>
                        <div className="flex items-center justify-between gap-1 mt-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                <span className="text-xs font-bold text-white truncate">
                                    {activeProfileName || t("Personal", "شخصي")}
                                </span>
                            </div>
                            {onOpenProfilePicker && (
                                <span className="text-[10px] text-cyan-300 underline font-medium">
                                    {t("Change", "تغيير")}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Adjustment Toolbar (Rotate & Re-Select) */}
            <div className="flex items-center justify-between gap-2 px-1">
                <button
                    type="button"
                    onClick={onRotate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-medium transition-all"
                >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{t("Rotate Image", "تدوير الصورة")}</span>
                </button>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onRetakeCamera}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-medium transition-all"
                    >
                        <Camera className="w-3.5 h-3.5 text-cyan-300" />
                        <span className="hidden sm:inline">{t("Camera", "الكاميرا")}</span>
                    </button>
                    <button
                        type="button"
                        onClick={onChooseGallery}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-medium transition-all"
                    >
                        <ImageIcon className="w-3.5 h-3.5 text-cyan-300" />
                        <span className="hidden sm:inline">{t("Gallery", "الاستوديو")}</span>
                    </button>
                </div>
            </div>

            {/* Big Shiny Start Scan CTA Button */}
            <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={onStartScan}
                disabled={isScanning}
                className={cn(
                    "shiny-cta-btn w-full flex items-center justify-center gap-3.5 py-4 sm:py-4.5 px-6 rounded-2xl font-black text-base sm:text-lg shadow-2xl transition-all duration-200",
                    scanType === "wound"
                        ? "from-emerald-400 via-teal-300 to-emerald-400 text-slate-950 shadow-emerald-500/20"
                        : "from-cyan-400 via-blue-400 to-cyan-400 text-slate-950 shadow-cyan-500/20"
                )}
            >
                {scanType === "wound" ? (
                    <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 stroke-[2.5]" />
                ) : scanType === "prescription" ? (
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 stroke-[2.5]" />
                ) : (
                    <Pill className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 stroke-[2.5]" />
                )}
                <span>
                    {scanType === "wound"
                        ? t("Start Clinical Wound Assessment", "ابدأ الفحص السريري للجرح")
                        : scanType === "prescription"
                        ? t("Analyze Prescription & Interactions", "فحص الروشتة والتداخلات")
                        : t("Start AI Clinical Medication Scan", "ابدأ الفحص السريري الشامل")}
                </span>
                <ChevronRight className={cn("w-5 h-5 shrink-0 stroke-[2.5]", isArabic ? "rotate-180" : "")} />
            </motion.button>
        </div>
    );
};
