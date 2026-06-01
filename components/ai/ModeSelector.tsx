"use client";

import { cn } from "@/lib/utils";
import { HeartPulse, Pill, Brain, Sparkles } from "lucide-react";
import type { AiChatMode } from "@/lib/ai/chat";

/* ──────────────────────────────────────────────────────────
 *  ModeSelector – 3-tab segmented control for AI chat modes
 * ────────────────────────────────────────────────────────── */

interface ModeSelectorProps {
    activeMode: AiChatMode;
    onModeChange: (mode: AiChatMode) => void;
    isArabic: boolean;
    hasActiveConversation?: boolean;
    onNewChat?: () => void;
}

const modes: Array<{
    id: AiChatMode;
    icon: React.ElementType;
    labelEn: string;
    labelAr: string;
    descriptionEn: string;
    descriptionAr: string;
    color: string;
    gradient: string;
}> = [
    {
        id: "health",
        icon: HeartPulse,
        labelEn: "Health AI",
        labelAr: "صحي AI",
        descriptionEn: "Health, nutrition, exercise, wellness",
        descriptionAr: "صحة، تغذية، رياضة، عافية",
        color: "cyan",
        gradient: "from-cyan-400 to-cyan-600",
    },
    {
        id: "medication",
        icon: Pill,
        labelEn: "Medication",
        labelAr: "الدواء",
        descriptionEn: "Side effects, alternatives, interactions",
        descriptionAr: "آثار جانبية، بدائل، تداخلات",
        color: "emerald",
        gradient: "from-emerald-400 to-emerald-600",
    },
    {
        id: "context",
        icon: Brain,
        labelEn: "QURE Integrated",
        labelAr: "QURE المدمج",
        descriptionEn: "Personalized with your health profile",
        descriptionAr: "مخصص بملفك الصحي",
        color: "violet",
        gradient: "from-violet-400 to-violet-600",
    },
];

export function ModeSelector({ activeMode, onModeChange, isArabic, hasActiveConversation, onNewChat }: ModeSelectorProps) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {modes.map((mode) => {
                const isActive = activeMode === mode.id;
                const Icon = mode.icon;

                // Static class map per mode to avoid Tailwind dynamic class purging
                const activeMap: Record<string, string> = {
                    health: "bg-cyan-400/10 border-cyan-400/25 text-cyan-300 shadow-lg shadow-cyan-500/10",
                    medication: "bg-emerald-400/10 border-emerald-400/25 text-emerald-300 shadow-lg shadow-emerald-500/10",
                    context: "bg-violet-400/10 border-violet-400/25 text-violet-300 shadow-lg shadow-violet-500/10",
                };
                const glowMap: Record<string, Record<string, string>> = {
                    health: { boxShadow: "0 4px 20px rgba(34,211,238,0.1), inset 0 1px 0 rgba(34,211,238,0.1)" },
                    medication: { boxShadow: "0 4px 20px rgba(52,211,153,0.1), inset 0 1px 0 rgba(52,211,153,0.1)" },
                    context: { boxShadow: "0 4px 20px rgba(167,139,250,0.1), inset 0 1px 0 rgba(167,139,250,0.1)" },
                };

                return (
                    <button
                        key={mode.id}
                        onClick={() => onModeChange(mode.id)}
                        className={cn(
                            "relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0",
                            "border whitespace-nowrap",
                            isActive
                                ? activeMap[mode.id]
                                : "border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/[0.12] hover:bg-white/[0.03]"
                        )}
                        style={isActive ? glowMap[mode.id] : undefined}
                    >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="hidden sm:inline">{isArabic ? mode.labelAr : mode.labelEn}</span>
                        <span className="sm:hidden">{isArabic ? mode.labelAr.split(" ")[0] : mode.labelEn.split(" ")[0]}</span>

                        {/* Active indicator glow */}
                        {isActive && (
                            <div className={cn(
                                "absolute inset-0 rounded-xl opacity-[0.07] pointer-events-none",
                                mode.id === "health" && "bg-gradient-to-r from-cyan-400 to-cyan-600",
                                mode.id === "medication" && "bg-gradient-to-r from-emerald-400 to-emerald-600",
                                mode.id === "context" && "bg-gradient-to-r from-violet-400 to-violet-600",
                            )} />
                        )}
                    </button>
                );
            })}

            {/* New Chat button */}
            {hasActiveConversation && onNewChat && (
                <button
                    onClick={onNewChat}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all shrink-0",
                        "border border-white/[0.06] text-slate-600 hover:text-white hover:border-white/[0.15] hover:bg-white/[0.04]"
                    )}
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isArabic ? "محادثة جديدة" : "New Chat"}</span>
                </button>
            )}
        </div>
    );
}
