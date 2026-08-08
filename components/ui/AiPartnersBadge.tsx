"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";

interface AiPartnersBadgeProps {
    className?: string;
    showLabel?: boolean;
    compact?: boolean;
}

export const GeminiLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="geminiStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4285F4" />
                <stop offset="35%" stopColor="#9C27B0" />
                <stop offset="70%" stopColor="#EA4335" />
                <stop offset="100%" stopColor="#FBBC05" />
            </linearGradient>
        </defs>
        <path
            d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"
            fill="url(#geminiStarGrad)"
        />
    </svg>
);

export const DeepSeekLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M16 3C8.82 3 3 8.82 3 16C3 23.18 8.82 29 16 29C18.42 29 20.68 28.34 22.62 27.19C22.07 26.35 21.75 25.35 21.75 24.28C21.75 21.38 24.1 19.03 27 19.03C27.39 19.03 27.76 19.08 28.12 19.16C28.69 18.17 29 17.12 29 16C29 8.82 23.18 3 16 3ZM14.04 10.88C15.28 10.88 16.29 11.89 16.29 13.13C16.29 14.37 15.28 15.38 14.04 15.38C12.8 15.38 11.79 14.37 11.79 13.13C11.79 11.89 12.8 10.88 14.04 10.88ZM11.16 22.42C8.14 21.24 6.83 17.96 8.01 14.94C8.53 13.63 9.58 12.58 10.89 12.06C10.5 13.11 10.5 14.29 10.89 15.34C11.55 17.05 12.99 18.23 14.83 18.62C13.39 20.59 11.16 21.64 8.54 21.64C9.42 22.03 10.3 22.29 11.16 22.42Z"
            fill="#4D6BFE"
        />
    </svg>
);

export const AiPartnersBadge: React.FC<AiPartnersBadgeProps> = ({
    className,
    showLabel = true,
    compact = false,
}) => {
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    return (
        <div
            className={cn(
                "inline-flex items-center gap-2.5 sm:gap-3 rounded-full border border-white/12 bg-slate-950/80 px-3.5 sm:px-4 py-1.5 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:border-white/25 select-none",
                className
            )}
        >
            {showLabel && (
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    {t("Powered by", "مشغل بواسطة")}
                </span>
            )}

            {/* Gemini Brand */}
            <div className="flex items-center gap-1.5">
                <GeminiLogo className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                <span className="font-bold text-xs sm:text-sm text-white tracking-tight">
                    Gemini
                </span>
            </div>

            {/* Separator Cross */}
            <span className="text-xs font-semibold text-slate-500">×</span>

            {/* DeepSeek Brand */}
            <div className="flex items-center gap-1.5">
                <DeepSeekLogo className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                <span className="font-bold text-xs sm:text-sm text-[#5B7BFE] tracking-tight">
                    DeepSeek
                </span>
            </div>
        </div>
    );
};
