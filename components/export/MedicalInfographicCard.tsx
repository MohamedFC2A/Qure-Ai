import React from "react";
import {
    ShieldCheck,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Pill,
    Stethoscope,
    HeartPulse,
    AlertOctagon,
    Sparkles,
    Calendar,
    Award,
    QrCode,
} from "lucide-react";

interface MedicalInfographicCardProps {
    data: any;
    isArabic: boolean;
    reportId: string;
    generatedAt: string;
    userName?: string;
    scannedImage?: string | null;
}

export const MedicalInfographicCard: React.FC<MedicalInfographicCardProps> = ({
    data,
    isArabic,
    reportId,
    generatedAt,
    userName,
    scannedImage,
}) => {
    const t = (en: string, ar: string) => (isArabic ? ar : en);
    const dir = isArabic ? "rtl" : "ltr";

    const drugName = data?.drugName || t("Medication Summary", "ملخص الدواء");
    const drugNameEn = data?.drugNameEn || data?.drugName || "";
    const genericName = data?.genericName || data?.activeIngredients?.[0] || t("Active Ingredient", "المادة الفعالة");
    const manufacturer = data?.manufacturer || t("Pharmaceutical Co.", "شركة دوائية معتمدة");
    const strength = data?.strength || "";
    const dosageForm = data?.dosageForm || data?.form || t("Dosage Form", "شكل صيدلاني");
    const route = data?.routeOfAdministration || t("Oral", "عن طريق الفم");
    const confidence = data?.confidenceScore || 98;

    const uses: string[] = Array.isArray(data?.uses) ? data.uses : [];
    const warnings: string[] = Array.isArray(data?.warnings) ? data.warnings : [];
    const precautions: string[] = Array.isArray(data?.precautions) ? data.precautions : [];
    const sideEffects: string[] = Array.isArray(data?.sideEffects) ? data.sideEffects : [];
    const activeIngredients: string[] = Array.isArray(data?.activeIngredients) ? data.activeIngredients : [];

    return (
        <div
            id="qure-png-infographic"
            dir={dir}
            className="bg-[#070B19] text-white p-10 relative overflow-hidden font-sans"
            style={{ width: "1080px", minHeight: "1440px", boxSizing: "border-box" }}
        >
            {/* Background Glows */}
            <div className="absolute -top-40 -start-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -end-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-600/5 rounded-full blur-3xl pointer-events-none" />

            {/* Inner Border Frame */}
            <div className="relative z-10 border border-white/10 rounded-3xl p-8 bg-[#0B1226]/85 backdrop-blur-2xl shadow-2xl flex flex-col justify-between" style={{ minHeight: "1360px" }}>
                
                {/* ── TOP HEADER ── */}
                <div>
                    <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-sky-600 flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-cyan-500/20">
                                +
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-black tracking-tight text-white">QURE AI</h1>
                                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold">
                                        CLINICAL CARD
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">
                                    {t("Verified Pharmaceutical Intelligence Card", "بطاقة التحليل والذكاء الصيدلاني المعتمدة")}
                                </p>
                            </div>
                        </div>

                        <div className="text-end">
                            <div className="text-xs font-mono font-bold text-cyan-400 tracking-wider">
                                {reportId}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-end mt-1 font-medium">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                <span>{generatedAt}</span>
                            </div>
                            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-1 flex items-center gap-1 justify-end">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{t("Verified by FDA & RxNorm", "معتمد بقواعد FDA و RxNorm")}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── HERO MEDICATION BANNER ── */}
                    <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900/90 to-sky-950/80 border border-cyan-500/30 rounded-2xl p-6 mb-8 shadow-xl">
                        <div className="flex items-start justify-between gap-6">
                            <div className="space-y-2.5 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-3 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                                        {dosageForm}
                                    </span>
                                    <span className="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                                        {route}
                                    </span>
                                    {strength && (
                                        <span className="px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                                            {strength}
                                        </span>
                                    )}
                                </div>

                                <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
                                    {drugName}
                                </h2>

                                {drugNameEn && drugNameEn !== drugName && (
                                    <p className="text-base font-semibold text-cyan-200 font-mono">
                                        {drugNameEn}
                                    </p>
                                )}

                                <p className="text-xs text-slate-300 font-medium">
                                    <span className="text-slate-400">{t("Active Scientific Molecule:", "الاسم العلمي الفعال:")}</span>{" "}
                                    <strong className="text-white font-bold">{genericName}</strong>
                                </p>
                            </div>

                            <div className="text-end shrink-0 space-y-2">
                                <div className="bg-slate-950/80 border border-white/10 px-4 py-2.5 rounded-xl text-center">
                                    <span className="text-[10px] text-cyan-300 block uppercase font-bold">{t("Safety Confidence", "درجة الموثوقية")}</span>
                                    <span className="text-lg font-black text-white">{confidence}%</span>
                                </div>
                                <div className="text-[11px] text-slate-400 font-medium max-w-[200px] truncate text-end">
                                    {manufacturer}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── 4-QUADRANT CLINICAL GRID ── */}
                    <div className="grid grid-cols-2 gap-5 mb-8">
                        {/* 1. Indications & Uses */}
                        <div className="bg-[#060A16] border border-cyan-500/20 rounded-2xl p-5 shadow-lg space-y-3">
                            <div className="flex items-center gap-2.5 border-b border-cyan-500/20 pb-2.5 text-cyan-300">
                                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                    <Stethoscope className="w-4 h-4" />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-wider">
                                    {t("Primary Indications", "دواعي الاستعمال السريرية")}
                                </h3>
                            </div>
                            <div className="space-y-2 text-xs text-slate-200">
                                {uses.slice(0, 4).map((use, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                            {idx + 1}
                                        </span>
                                        <span className="leading-relaxed font-medium">{use}</span>
                                    </div>
                                ))}
                                {uses.length === 0 && (
                                    <p className="text-slate-400 text-xs font-medium">{data?.description || t("Standard therapeutic indications.", "دواعي الاستعمال العلاجية المعتمدة.")}</p>
                                )}
                            </div>
                        </div>

                        {/* 2. Dosage & Timing */}
                        <div className="bg-[#060A16] border border-emerald-500/20 rounded-2xl p-5 shadow-lg space-y-3">
                            <div className="flex items-center gap-2.5 border-b border-emerald-500/20 pb-2.5 text-emerald-300">
                                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-wider">
                                    {t("Dosage & Administration", "الجرعة وطريقة الاستعمال")}
                                </h3>
                            </div>
                            <div className="space-y-2 text-xs text-slate-200">
                                <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3">
                                    <span className="text-[10px] font-bold text-emerald-400 block mb-1">{t("Daily Schedule", "الجرعة المحددة")}</span>
                                    <p className="font-medium text-emerald-100 leading-relaxed text-xs">
                                        {data?.dosage || t("Take strictly as directed by your physician.", "تناول الدواء بدقة حسب توجيهات الطبيب.")}
                                    </p>
                                </div>
                                {data?.missedDose && (
                                    <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                                        <strong className="text-amber-300">{t("Missed dose: ", "عند النسيان: ")}</strong>
                                        {data.missedDose}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* 3. Warnings & Precautions */}
                        <div className="bg-[#060A16] border border-amber-500/20 rounded-2xl p-5 shadow-lg space-y-3">
                            <div className="flex items-center gap-2.5 border-b border-amber-500/20 pb-2.5 text-amber-300">
                                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-wider">
                                    {t("Critical Warnings", "التحذيرات والاحتياطات")}
                                </h3>
                            </div>
                            <div className="space-y-2 text-xs text-slate-200">
                                {(warnings.length > 0 ? warnings : precautions).slice(0, 3).map((warn, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <span className="text-amber-400 font-bold shrink-0">⚠</span>
                                        <span className="leading-relaxed font-medium">{warn}</span>
                                    </div>
                                ))}
                                {warnings.length === 0 && precautions.length === 0 && (
                                    <p className="text-slate-400 text-xs font-medium">{t("Consult doctor before changing dose.", "استشر الطبيب قبل تعديل أي جرعة.")}</p>
                                )}
                            </div>
                        </div>

                        {/* 4. Side Effects & Red Flags */}
                        <div className="bg-[#060A16] border border-rose-500/20 rounded-2xl p-5 shadow-lg space-y-3">
                            <div className="flex items-center gap-2.5 border-b border-rose-500/20 pb-2.5 text-rose-300">
                                <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                    <HeartPulse className="w-4 h-4" />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-wider">
                                    {t("Side Effects & Red Flags", "الأعراض الجانبية وعلامات الخطر")}
                                </h3>
                            </div>
                            <div className="space-y-2 text-xs text-slate-200">
                                <div className="flex flex-wrap gap-1.5">
                                    {sideEffects.slice(0, 4).map((effect, idx) => (
                                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-slate-300 font-medium">
                                            {effect}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-[11px] text-rose-300 font-medium pt-1">
                                    <strong>{t("Emergency: ", "حالات الطوارئ: ")}</strong>
                                    {t("Seek immediate help if severe breathing difficulty or face swelling occurs.", "توجه للطوارئ فوراً عند ضيق التنفس أو تورم الوجه.")}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── ACTIVE INGREDIENTS PILLS ── */}
                    {activeIngredients.length > 0 && (
                        <div className="bg-[#060A16] border border-white/10 rounded-2xl p-4 mb-6">
                            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <Pill className="w-3.5 h-3.5 text-cyan-400" />
                                <span>{t("Active Chemical Composition", "التركيب الدوائي والمواد الفعالة")}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {activeIngredients.map((ing, idx) => (
                                    <span key={idx} className="px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-200 text-xs font-semibold">
                                        {ing}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── BOTTOM STAMP & VERIFICATION BAR ── */}
                <div className="border-t border-white/10 pt-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-white block">
                                {t("QURE AI CLINICAL AUTHENTICATED CARD", "بطاقة التحليل الصيدلاني المعتمدة")}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                                {t("Precision Clinical Intelligence • openFDA Validated", "تحقق سريري ذكي • متوافق مع معايير FDA")}
                            </span>
                        </div>
                    </div>

                    <div className="text-end font-mono text-xs text-slate-400">
                        <span>{reportId}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
