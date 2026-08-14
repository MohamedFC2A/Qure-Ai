"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ShieldAlert, CheckCircle2, RefreshCw, Send, Brain, Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Scenario {
    id: string;
    userMessage: { en: string; ar: string };
    severity: "danger" | "warning";
    severityText: { en: string; ar: string };
    thinkingSteps: Array<{ en: string; ar: string }>;
    aiResponse: {
        headline: { en: string; ar: string };
        ingredients: string[];
        body: { en: string; ar: string };
        recommendation: { en: string; ar: string };
        executionTimeSec: number;
    };
}

const SCENARIOS: Scenario[] = [
    {
        id: "metformin_ibuprofen",
        userMessage: {
            ar: "ما التداخلات الدوائية للميتفورمين مع الإيبوبروفين؟",
            en: "What are the drug interactions between Metformin and Ibuprofen?",
        },
        severity: "danger",
        severityText: {
            ar: "تحذير تداخل دوائي عالي الخطورة",
            en: "High-Risk Drug Interaction Warning",
        },
        thinkingSteps: [
            { ar: "مطابقة المواد الفعالة: Metformin + Ibuprofen...", en: "Matching active ingredients: Metformin + Ibuprofen..." },
            { ar: "استعلام قاعدة بيانات FDA وتحليل وظائف الكلى...", en: "Querying FDA database & renal function metrics..." },
            { ar: "صياغة التوصية الطبية والسلامة...", en: "Synthesizing clinical advice & safety alert..." },
        ],
        aiResponse: {
            headline: {
                ar: "خطر حماض اللاكتيك وتأثر وظائف الكلى",
                en: "Lactic Acidosis & Renal Function Risk",
            },
            ingredients: ["Metformin HCl 500mg", "Ibuprofen 400mg"],
            body: {
                ar: "الاستخدام المتزامن قد يقلل التصفية الكلوية للميتفورمين ويرفع خطر حماض اللاكتيك لدى المرضى الذين يعانون من قصور كلوي. يُنصح بمراقبة وظائف الكلى واستشارة الطبيب.",
                en: "Concurrent use reduces renal clearance of Metformin and elevates lactic acidosis risk in patients with renal impairment. Monitor kidney function and consult doctor for alternatives.",
            },
            recommendation: {
                ar: "استشر الطبيب لاختيار مسكن آمن للكلى مثل الباراسيتامول بدلاً من الإيبوبروفين.",
                en: "Consult your clinician to switch to a kidney-safe analgesic like Paracetamol instead.",
            },
            executionTimeSec: 3.2,
        },
    },
    {
        id: "paracetamol_liver",
        userMessage: {
            ar: "ما هي الجرعة اليومية الآمنة من الباراسيتامول لمريض الكبد؟",
            en: "What is the safe daily limit of Paracetamol for a patient with liver disease?",
        },
        severity: "warning",
        severityText: {
            ar: "تعديل الجرعة وتنبيه السلامة",
            en: "Dosage Adjustment & Liver Safety Notice",
        },
        thinkingSteps: [
            { ar: "فحص أمان Acetaminophen / Paracetamol...", en: "Checking Acetaminophen / Paracetamol monograph..." },
            { ar: "مراجعة حدود السمية الكبدية مع FDA...", en: "Evaluating hepatotoxicity limits with FDA guidelines..." },
            { ar: "إعداد الجدول الزمني للجرعات...", en: "Structuring conservative dosage protocol..." },
        ],
        aiResponse: {
            headline: {
                ar: "تحديد الحد الأقصى بـ 2000 مجم/يوم",
                en: "Strict 2000mg/day Limit Enforced",
            },
            ingredients: ["Paracetamol / Acetaminophen 500mg"],
            body: {
                ar: "الجرعة القياسية للبالغين هي 4000 مجم يومياً، ولكن لمرضى الكبد يجب ألا تتجاوز 2000 مجم كحد أقصى لمنع الإجهاد الإنزيمي وتجمع نواتج الأيض السامة (NAPQI).",
                en: "While standard adult limit is 4000mg/day, hepatic impairment strictly caps dosage at 2000mg/day to prevent toxic metabolite (NAPQI) accumulation.",
            },
            recommendation: {
                ar: "تجنب تناول المشروبات الكحولية أو أدوية البرد المركبة التي تحتوي على باراسيتامول إضافي.",
                en: "Avoid alcohol and multi-symptom cold remedies containing hidden acetaminophen.",
            },
            executionTimeSec: 2.8,
        },
    },
];

export function InteractiveChatDemo({ isArabic }: { isArabic: boolean }) {
    const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
    const [phase, setPhase] = useState<"idle" | "typing_user" | "thinking" | "typing_ai" | "done">("done");
    const [typedUserText, setTypedUserText] = useState("");
    const [thinkingStepIndex, setThinkingStepIndex] = useState(0);
    const [typedAiCharsCount, setTypedAiCharsCount] = useState(0);

    const scenario = SCENARIOS[selectedScenarioIndex];
    const fullUserText = isArabic ? scenario.userMessage.ar : scenario.userMessage.en;
    const fullAiBody = isArabic ? scenario.aiResponse.body.ar : scenario.aiResponse.body.en;

    const runNextScenario = () => {
        const nextIdx = (selectedScenarioIndex + 1) % SCENARIOS.length;
        setSelectedScenarioIndex(nextIdx);
        setPhase("typing_user");
        setTypedUserText("");
        setThinkingStepIndex(0);
        setTypedAiCharsCount(0);
    };

    // Typewriter effect for user input
    useEffect(() => {
        if (phase !== "typing_user") return;

        if (typedUserText.length < fullUserText.length) {
            const timeout = setTimeout(() => {
                setTypedUserText(fullUserText.slice(0, typedUserText.length + 1));
            }, 25);
            return () => clearTimeout(timeout);
        } else {
            const timeout = setTimeout(() => {
                setPhase("thinking");
            }, 350);
            return () => clearTimeout(timeout);
        }
    }, [phase, typedUserText, fullUserText]);

    // Thinking sequence steps
    useEffect(() => {
        if (phase !== "thinking") return;

        if (thinkingStepIndex < scenario.thinkingSteps.length - 1) {
            const timeout = setTimeout(() => {
                setThinkingStepIndex((prev) => prev + 1);
            }, 550);
            return () => clearTimeout(timeout);
        } else {
            const timeout = setTimeout(() => {
                setPhase("typing_ai");
                setTypedAiCharsCount(0);
            }, 600);
            return () => clearTimeout(timeout);
        }
    }, [phase, thinkingStepIndex, scenario.thinkingSteps.length]);

    // Typewriter for AI response
    useEffect(() => {
        if (phase !== "typing_ai") return;

        if (typedAiCharsCount < fullAiBody.length) {
            const timeout = setTimeout(() => {
                setTypedAiCharsCount((prev) => Math.min(fullAiBody.length, prev + 3));
            }, 20);
            return () => clearTimeout(timeout);
        } else {
            setPhase("done");
        }
    }, [phase, typedAiCharsCount, fullAiBody]);

    // Auto cycle to next scenario after viewing complete answer
    useEffect(() => {
        if (phase !== "done") return;
        const timer = setTimeout(() => {
            runNextScenario();
        }, 7000);
        return () => clearTimeout(timer);
    }, [phase, selectedScenarioIndex]);

    return (
        <div className="w-full max-w-2xl mx-auto" dir={isArabic ? "rtl" : "ltr"}>
            {/* Main Window Card */}
            <div
                className="rounded-3xl border overflow-hidden backdrop-blur-2xl transition-all duration-300"
                style={{
                    background: "rgba(8, 13, 26, 0.96)",
                    borderColor: "rgba(255,255,255,0.09)",
                    boxShadow: "0 28px 70px rgba(0,0,0,0.65), 0 1px 0 rgba(255,255,255,0.08) inset",
                }}
            >
                {/* Header Bar */}
                <div
                    className="flex items-center justify-between px-4 sm:px-5 py-3 border-b"
                    style={{ background: "rgba(6, 10, 20, 0.95)", borderColor: "rgba(255,255,255,0.07)" }}
                >
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                        <div className="w-5 h-5 rounded-lg bg-cyan-500/20 border border-cyan-400/30 p-0.5 flex items-center justify-center shrink-0">
                            <Brain className="w-3.5 h-3.5 text-cyan-300" />
                        </div>
                        <span>Qure AI — Clinical Interaction Intelligence</span>
                    </div>

                    <button
                        onClick={runNextScenario}
                        title={isArabic ? "إعادة الفحص" : "Replay Simulation"}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", phase !== "done" && "animate-spin")} />
                    </button>
                </div>

                {/* Messages Body */}
                <div className="p-4 sm:p-5 space-y-4 min-h-[300px] flex flex-col justify-end">
                    
                    {/* User Question Bubble */}
                    {(phase !== "idle" || typedUserText) && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-end"
                        >
                            <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-3 bg-gradient-to-r from-cyan-500/20 to-cyan-600/15 border border-cyan-400/25 text-white text-xs sm:text-sm leading-relaxed shadow-lg shadow-cyan-950/20">
                                <span>{phase === "typing_user" ? typedUserText : fullUserText}</span>
                                {phase === "typing_user" && (
                                    <span className="inline-block w-1.5 h-4 ms-1 bg-cyan-400 animate-pulse align-middle" />
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* AI Thinking Multi-Step Pipeline Indicator */}
                    {phase === "thinking" && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-start gap-3"
                        >
                            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 flex items-center justify-center shrink-0 shadow-md">
                                <Brain className="w-4 h-4 text-slate-950 animate-pulse" />
                            </div>
                            <div className="flex-1 rounded-2xl bg-slate-900/90 border border-cyan-500/20 p-3.5 space-y-2">
                                <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold">
                                    <Zap className="w-3.5 h-3.5 animate-bounce text-cyan-400" />
                                    <span>{isArabic ? "جارٍ الفحص والتحليل الفوري بواسطة Qure AI..." : "Qure AI Real-Time Processing..."}</span>
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                    <span>{isArabic ? scenario.thinkingSteps[thinkingStepIndex]?.ar : scenario.thinkingSteps[thinkingStepIndex]?.en}</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Qure AI Clinical Response Card */}
                    {(phase === "typing_ai" || phase === "done") && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-start gap-3"
                        >
                            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 flex items-center justify-center shrink-0 shadow-md mt-0.5">
                                <Sparkles className="w-4 h-4 text-slate-950" />
                            </div>

                            <div className="flex-1 rounded-2xl bg-slate-900/95 border border-white/10 p-4 sm:p-5 space-y-3.5 shadow-2xl">
                                
                                {/* Severity Header Banner */}
                                <div className={cn(
                                    "p-3 rounded-xl border flex items-center justify-between gap-3 text-xs font-bold",
                                    scenario.severity === "danger"
                                        ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                                        : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                                )}>
                                    <div className="flex items-center gap-2">
                                        {scenario.severity === "danger" ? (
                                            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                                        ) : (
                                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                        )}
                                        <span>{isArabic ? scenario.severityText.ar : scenario.severityText.en}</span>
                                    </div>
                                    <span className="text-[10px] font-mono opacity-75 flex items-center gap-1">
                                        <Zap className="w-2.5 h-2.5 text-amber-400" />
                                        <span>{scenario.aiResponse.executionTimeSec}s</span>
                                    </span>
                                </div>

                                {/* Active Ingredients Pills */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[11px] text-slate-400 font-semibold me-1">
                                        {isArabic ? "المواد الفعالة:" : "Ingredients:"}
                                    </span>
                                    {scenario.aiResponse.ingredients.map((ing) => (
                                        <span key={ing} className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[10px]">
                                            {ing}
                                        </span>
                                    ))}
                                </div>

                                {/* Clinical Analysis Body */}
                                <div>
                                    <h4 className="text-xs sm:text-sm font-bold text-white mb-1">
                                        {isArabic ? scenario.aiResponse.headline.ar : scenario.aiResponse.headline.en}
                                    </h4>
                                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                                        {phase === "typing_ai"
                                            ? fullAiBody.slice(0, typedAiCharsCount)
                                            : fullAiBody}
                                        {phase === "typing_ai" && (
                                            <span className="inline-block w-1.5 h-3.5 ms-1 bg-emerald-400 animate-pulse align-middle" />
                                        )}
                                    </p>
                                </div>

                                {/* Clinical Recommendation Box */}
                                {(phase === "done" || typedAiCharsCount >= fullAiBody.length) && (
                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-200">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                        <div className="space-y-0.5">
                                            <span className="font-bold block text-white">
                                                {isArabic ? "التوصية الطبية المعتمدة:" : "Clinical Recommendation:"}
                                            </span>
                                            <p className="leading-relaxed text-[11px] sm:text-xs">
                                                {isArabic ? scenario.aiResponse.recommendation.ar : scenario.aiResponse.recommendation.en}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                </div>

                {/* Footer Simulated Input Bar */}
                <div className="p-3.5 border-t border-white/[0.07] bg-slate-950/80">
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/90 px-3.5 py-2.5">
                        <span className="text-xs text-slate-400 flex-1 truncate">
                            {phase === "typing_user"
                                ? typedUserText
                                : isArabic
                                ? "اسأل Qure AI عن أي دواء أو تعارض طبي..."
                                : "Ask Qure AI any medication or interaction query..."}
                        </span>
                        <button
                            onClick={runNextScenario}
                            className="w-7 h-7 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-bold flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
                        >
                            <Send className={cn("w-3.5 h-3.5", isArabic && "rotate-180")} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
