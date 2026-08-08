"use client";

import { cn } from "@/lib/utils";
import { HeartPulse, Pill, Brain } from "lucide-react";
import type { AiChatMode } from "@/lib/ai/chat";

/* ──────────────────────────────────────────────────────────
 *  ModeSelector – Horizontal chip tabs (premium redesign)
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
    activeClass: string;
}> = [
    {
        id: "health",
        icon: HeartPulse,
        labelEn: "Health",
        labelAr: "صحي",
        activeClass: "mode-chip-active-health",
    },
    {
        id: "medication",
        icon: Pill,
        labelEn: "Meds",
        labelAr: "الدواء",
        activeClass: "mode-chip-active-medication",
    },
    {
        id: "context",
        icon: Brain,
        labelEn: "My Profile",
        labelAr: "ملفي",
        activeClass: "mode-chip-active-context",
    },
];

export function ModeSelector({ activeMode, onModeChange, isArabic }: ModeSelectorProps) {
    return (
        <div className="flex items-center gap-1.5">
            {modes.map((mode) => {
                const Icon = mode.icon;
                const isActive = mode.id === activeMode;
                return (
                    <button
                        key={mode.id}
                        onClick={() => onModeChange(mode.id)}
                        className={cn(
                            "mode-chip",
                            isActive && mode.activeClass
                        )}
                    >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{isArabic ? mode.labelAr : mode.labelEn}</span>
                    </button>
                );
            })}
        </div>
    );
}
