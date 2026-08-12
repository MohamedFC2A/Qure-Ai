"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldAlert,
    AlertTriangle,
    CheckCircle2,
    Plus,
    Trash2,
    X,
    Sparkles,
    Loader2,
    Pill,
    Brain,
} from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";
import { VoiceReaderButton } from "@/components/ui/VoiceReaderButton";

interface InteractionMatrixModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMedications?: string[];
}

export function InteractionMatrixModal({
    isOpen,
    onClose,
    initialMedications = [],
}: InteractionMatrixModalProps) {
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const [medList, setMedList] = useState<string[]>([]);
    const [newInput, setNewInput] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setMedList(initialMedications.length > 0 ? initialMedications : ["Panadol Extra", "Brufen 400mg"]);
            setResult(null);
            setError(null);
        }
    }, [isOpen, initialMedications]);

    const handleAddMed = () => {
        const trimmed = newInput.trim();
        if (trimmed && !medList.includes(trimmed)) {
            setMedList((prev) => [...prev, trimmed]);
            setNewInput("");
        }
    };

    const handleRemoveMed = (index: number) => {
        setMedList((prev) => prev.filter((_, i) => i !== index));
    };

    const handleRunAnalysis = async () => {
        if (medList.length < 2) {
            setError(t("Please add at least 2 medications to test interactions.", "يرجى إضافة دواءين على الأقل لفحص التداخلات المتبادلة."));
            return;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const promptText = isArabic
                ? `قم بإجراء فحص تداخلات دوائية دقيق لمجموعة الأدوية التالية: [${medList.join(", ")}]. حدد مستوى الخطر (منخفض / متوسط / مرتفع)، واذكر التداخلات المحددة بين كل دواءين، وتوصيات السلامة والجرعات والفاصل الزمني المطلوب.`
                : `Perform a precise drug-drug interaction matrix check for the following medications: [${medList.join(", ")}]. Determine overall risk level (low / moderate / high), detail specific interactions between drug pairs, and provide safety timing recommendations.`;

            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [{ role: "user", content: promptText }],
                    mode: "medication",
                    language: resultsLanguage,
                }),
            });

            if (!res.ok) throw new Error("Failed to process interaction matrix analysis.");

            const data = await res.json();
            setResult(data.content || data.reply || data);
        } catch (e: any) {
            setError(e.message || "Error analyzing interactions");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-3xl overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-900 shadow-2xl shadow-cyan-950/50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-slate-950/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                                    <ShieldAlert className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-bold text-white">
                                        {t("Multi-Medication Interaction Matrix", "مركز فحص التداخلات الدوائية المتبادلة")}
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        {t("Add multiple medications to test cross-conflicts and safety timings", "أضف عدة أدوية لمعاينة كشف التضارب وتوقيتات السلامة")}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
                            {/* Medication Pills Input Area */}
                            <div className="space-y-3">
                                <label className="block text-xs font-semibold text-slate-300">
                                    {t("Medications to analyze:", "الأدوية المراد فحص تداخلاتها:")}
                                </label>
                                <div className="flex flex-wrap items-center gap-2">
                                    {medList.map((med, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-200 border border-cyan-500/30 text-xs font-semibold"
                                        >
                                            <Pill className="h-3.5 w-3.5" />
                                            {med}
                                            <button
                                                onClick={() => handleRemoveMed(index)}
                                                className="ml-1 hover:text-rose-400 transition-colors"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                {/* Add Medicine Input */}
                                <div className="flex items-center gap-2 pt-1">
                                    <input
                                        type="text"
                                        value={newInput}
                                        onChange={(e) => setNewInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddMed()}
                                        placeholder={t("Type drug name (e.g. Aspirin, Omeprazole)...", "اكتب اسم الدواء (مثال: أسبيرين، أوميبرازول)...")}
                                        className="flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddMed}
                                        className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold hover:bg-cyan-500/30 transition-all"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>{t("Add", "إضافة")}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Run Analysis Action */}
                            <div className="flex items-center justify-between pt-2">
                                <button
                                    onClick={handleRunAnalysis}
                                    disabled={isAnalyzing || medList.length < 2}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-all disabled:opacity-50"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>{t("Analyzing Drug Interactions...", "جارٍ معالجة مصفوفة التداخلات...")}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Brain className="h-4 w-4" />
                                            <span>{t("Run Interaction Matrix Check", "تشغيل فحص المصفوفة التفاعلية")}</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {error && (
                                <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">
                                    {error}
                                </div>
                            )}

                            {/* Result Display */}
                            {result && (
                                <div className="space-y-4 rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                                            <Sparkles className="h-4 w-4" />
                                            <span>{t("Matrix Analysis Report", "تقرير مصفوفة التداخلات الطبية")}</span>
                                        </div>
                                        <VoiceReaderButton text={typeof result === "string" ? result : JSON.stringify(result)} lang={resultsLanguage} size="xs" />
                                    </div>
                                    <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
                                        {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
