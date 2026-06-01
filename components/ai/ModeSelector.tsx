"use client";

import { cn } from "@/lib/utils";
import { HeartPulse, Pill, Brain, ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { AiChatMode } from "@/lib/ai/chat";

/* ──────────────────────────────────────────────────────────
 *  ModeSelector – Professional dropdown for AI mode selection
 *  Positioned next to the input bar
 * ────────────────────────────────────────────────────────── */

interface ModeSelectorProps {
    activeMode: AiChatMode;
    onModeChange: (mode: AiChatMode) => void;
    isArabic: boolean;
}

const modes: Array<{
    id: AiChatMode;
    icon: React.ElementType;
    labelEn: string;
    labelAr: string;
    descriptionEn: string;
    descriptionAr: string;
}> = [
    {
        id: "health",
        icon: HeartPulse,
        labelEn: "Health AI",
        labelAr: "صحي AI",
        descriptionEn: "Health, nutrition, exercise, wellness",
        descriptionAr: "صحة، تغذية، رياضة، عافية",
    },
    {
        id: "medication",
        icon: Pill,
        labelEn: "Medication",
        labelAr: "الدواء",
        descriptionEn: "Side effects, alternatives, interactions",
        descriptionAr: "آثار جانبية، بدائل، تداخلات",
    },
    {
        id: "context",
        icon: Brain,
        labelEn: "QURE Integrated",
        labelAr: "QURE المدمج",
        descriptionEn: "Personalized with your health profile",
        descriptionAr: "مخصص بملفك الصحي",
    },
];

// Static class maps for Tailwind
const iconBg: Record<string, string> = {
    health: "bg-cyan-400/15",
    medication: "bg-emerald-400/15",
    context: "bg-violet-400/15",
};
const iconText: Record<string, string> = {
    health: "text-cyan-300",
    medication: "text-emerald-300",
    context: "text-violet-300",
};
const borderActive: Record<string, string> = {
    health: "border-cyan-400/20",
    medication: "border-emerald-400/20",
    context: "border-violet-400/20",
};
const menuHover: Record<string, string> = {
    health: "hover:bg-cyan-400/8",
    medication: "hover:bg-emerald-400/8",
    context: "hover:bg-violet-400/8",
};

export function ModeSelector({ activeMode, onModeChange, isArabic }: ModeSelectorProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const active = modes.find((m) => m.id === activeMode) || modes[0];
    const ActiveIcon = active.icon;

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            {/* ── Trigger ── */}
            <button
                onClick={() => setOpen(!open)}
                className={cn(
                    "flex items-center gap-2 pl-3 pr-2 py-2 rounded-2xl text-sm font-semibold transition-all",
                    "border backdrop-blur-xl",
                    borderActive[activeMode],
                    "text-white hover:brightness-110",
                )}
                style={{ background: "rgba(15,20,30,0.9)" }}
            >
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", iconBg[activeMode])}>
                    <ActiveIcon className={cn("w-4 h-4", iconText[activeMode])} />
                </div>
                <span className="hidden sm:inline">{isArabic ? active.labelAr : active.labelEn}</span>
                <ChevronDown className={cn("w-3.5 h-3.5 text-white/40 transition-transform duration-200", open && "rotate-180")} />
            </button>

            {/* ── Dropdown (opens upward from bottom bar) ── */}
            {open && (
                <div
                    className={cn(
                        "absolute bottom-full mb-2 z-50 w-72 rounded-2xl border border-white/[0.08] p-1.5",
                        "shadow-2xl shadow-black/60 backdrop-blur-2xl animate-fade-in",
                        isArabic ? "right-0" : "left-0",
                    )}
                    style={{ background: "rgba(12,16,24,0.97)" }}
                >
                    <p className="px-3 pt-2 pb-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">
                        {isArabic ? "وضع الذكاء الاصطناعي" : "AI Model"}
                    </p>

                    {modes.map((mode) => {
                        const Icon = mode.icon;
                        const isActive = mode.id === activeMode;
                        return (
                            <button
                                key={mode.id}
                                onClick={() => { onModeChange(mode.id); setOpen(false); }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-start transition-all",
                                    isActive
                                        ? cn("bg-white/[0.06]", borderActive[mode.id])
                                        : cn("border border-transparent", menuHover[mode.id]),
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                    isActive ? iconBg[mode.id] : "bg-white/[0.04]",
                                )}>
                                    <Icon className={cn("w-5 h-5", isActive ? iconText[mode.id] : "text-white/40")} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={cn("text-sm font-semibold", isActive ? "text-white" : "text-white/70")}>
                                        {isArabic ? mode.labelAr : mode.labelEn}
                                    </p>
                                    <p className="text-[11px] text-white/30 mt-0.5 truncate leading-relaxed">
                                        {isArabic ? mode.descriptionAr : mode.descriptionEn}
                                    </p>
                                </div>
                                {isActive && <Check className="w-4 h-4 text-white/50 shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
