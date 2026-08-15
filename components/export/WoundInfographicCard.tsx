import React from "react";
import {
    ShieldAlert,
    CheckCircle2,
    HeartPulse,
    AlertTriangle,
    Activity,
    PhoneCall,
    Calendar,
} from "lucide-react";

interface WoundInfographicCardProps {
    result: any;
    isArabic: boolean;
    reportId: string;
    generatedAt: string;
    userName?: string;
    scannedImage?: string | null;
}

export const WoundInfographicCard: React.FC<WoundInfographicCardProps> = ({
    result,
    isArabic,
    reportId,
    generatedAt,
    userName,
    scannedImage,
}) => {
    const t = (en: string, ar: string) => (isArabic ? ar : en);
    const dir = isArabic ? "rtl" : "ltr";

    const classification = result?.woundClassification || t("Wound Care Assessment", "تقييم الجروح السريري");
    const severityTier = result?.severityTier || "moderate";
    const confidence = result?.confidenceScore || 95;
    const immediateActions = Array.isArray(result?.immediateFirstAid) ? result.immediateFirstAid : [];
    const stepByStepCare = Array.isArray(result?.stepByStepCare) ? result.stepByStepCare : [];
    const redFlags = Array.isArray(result?.redFlags) ? result.redFlags : [];
    const doNots = Array.isArray(result?.doNots) ? result.doNots : [];

    return (
        <div
            id="qure-wound-png-infographic"
            dir={dir}
            className="bg-[#0A050D] text-white p-10 relative overflow-hidden font-sans"
            style={{ width: "1080px", minHeight: "1440px", boxSizing: "border-box" }}
        >
            <div className="absolute -top-40 -start-40 w-96 h-96 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -end-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 border border-white/10 rounded-3xl p-8 bg-[#120A1A]/85 backdrop-blur-2xl shadow-2xl flex flex-col justify-between" style={{ minHeight: "1360px" }}>
                <div>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-rose-500/20">
                                ⚕
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-black tracking-tight text-white">QURE AI</h1>
                                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold">
                                        WOUND TRIAGE
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">
                                    {t("Clinical Emergency & Wound Triage Summary", "بطاقة فرز الجروح والإسعاف السريري")}
                                </p>
                            </div>
                        </div>

                        <div className="text-end">
                            <div className="text-xs font-mono font-bold text-rose-400 tracking-wider">
                                {reportId}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-end mt-1 font-medium">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                <span>{generatedAt}</span>
                            </div>
                        </div>
                    </div>

                    {/* Banner */}
                    <div className="bg-gradient-to-r from-rose-950/80 via-slate-900/90 to-red-950/80 border border-rose-500/30 rounded-2xl p-6 mb-8 shadow-xl">
                        <div className="space-y-2">
                            <span className="px-3 py-1 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold inline-block">
                                {t("Assessment Result", "نتيجة التقييم")}
                            </span>
                            <h2 className="text-3xl font-black text-white tracking-tight">
                                {classification}
                            </h2>
                            <p className="text-xs text-slate-300 font-medium leading-relaxed">
                                {result?.summary || t("Clinical wound assessment summary and guidance.", "ملخص التقييم السريري لحالة الجرح وخطة العلاج.")}
                            </p>
                        </div>
                    </div>

                    {/* 4 Quadrants */}
                    <div className="grid grid-cols-2 gap-5 mb-8">
                        {/* 1. Immediate Actions */}
                        <div className="bg-[#0D0614] border border-rose-500/20 rounded-2xl p-5 shadow-lg space-y-3">
                            <div className="flex items-center gap-2.5 border-b border-rose-500/20 pb-2.5 text-rose-300">
                                <HeartPulse className="w-4 h-4" />
                                <h3 className="text-xs font-black uppercase tracking-wider">
                                    {t("Immediate First Aid", "الإسعاف الأولي الفوري")}
                                </h3>
                            </div>
                            <div className="space-y-2 text-xs text-slate-200">
                                {immediateActions.slice(0, 4).map((action: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{idx + 1}</span>
                                        <span className="leading-relaxed font-medium">{action}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. Step-by-Step Care */}
                        <div className="bg-[#0D0614] border border-sky-500/20 rounded-2xl p-5 shadow-lg space-y-3">
                            <div className="flex items-center gap-2.5 border-b border-sky-500/20 pb-2.5 text-sky-300">
                                <Activity className="w-4 h-4" />
                                <h3 className="text-xs font-black uppercase tracking-wider">
                                    {t("Dressing & Cleansing", "التطهير والضماد")}
                                </h3>
                            </div>
                            <div className="space-y-2 text-xs text-slate-200">
                                {stepByStepCare.slice(0, 4).map((step: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{idx + 1}</span>
                                        <span className="leading-relaxed font-medium">{step}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. Do Nots */}
                        <div className="bg-[#0D0614] border border-amber-500/20 rounded-2xl p-5 shadow-lg space-y-3">
                            <div className="flex items-center gap-2.5 border-b border-amber-500/20 pb-2.5 text-amber-300">
                                <AlertTriangle className="w-4 h-4" />
                                <h3 className="text-xs font-black uppercase tracking-wider">
                                    {t("Avoid Strictly", "ما يجب تجنبه تماماً")}
                                </h3>
                            </div>
                            <div className="space-y-2 text-xs text-slate-200">
                                {doNots.slice(0, 3).map((item: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <span className="text-amber-400 font-bold">✕</span>
                                        <span className="leading-relaxed font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 4. Red Flags */}
                        <div className="bg-[#0D0614] border border-red-500/20 rounded-2xl p-5 shadow-lg space-y-3">
                            <div className="flex items-center gap-2.5 border-b border-red-500/20 pb-2.5 text-red-300">
                                <ShieldAlert className="w-4 h-4" />
                                <h3 className="text-xs font-black uppercase tracking-wider">
                                    {t("Emergency Red Flags", "علامات الخطر")}
                                </h3>
                            </div>
                            <div className="space-y-2 text-xs text-slate-200">
                                {redFlags.slice(0, 3).map((flag: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <span className="text-red-400 font-bold">⚠</span>
                                        <span className="leading-relaxed font-medium">{flag}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Stamp */}
                <div className="border-t border-white/10 pt-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-white block">
                                {t("QURE AI CLINICAL TRIAGE CARD", "بطاقة التقييم الإسعافي المعتمدة")}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                                {t("Emergency Clinical Protocol Validated", "تم الفرز وفق المعايير السريرية المعتمدة")}
                            </span>
                        </div>
                    </div>
                    <div className="font-mono text-xs text-slate-400">
                        {reportId}
                    </div>
                </div>
            </div>
        </div>
    );
};
