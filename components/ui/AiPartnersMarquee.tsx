"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";

export interface PartnerItem {
    id: string;
    name: string;
    descriptionEn: string;
    descriptionAr: string;
    logo: React.ReactNode;
}

/* ── Crisp Pure White SVG Logos ── */

export const GeminiWhiteLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"
            fill="#FFFFFF"
        />
    </svg>
);

export const DeepSeekWhiteLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M16 3C8.82 3 3 8.82 3 16C3 23.18 8.82 29 16 29C18.42 29 20.68 28.34 22.62 27.19C22.07 26.35 21.75 25.35 21.75 24.28C21.75 21.38 24.1 19.03 27 19.03C27.39 19.03 27.76 19.08 28.12 19.16C28.69 18.17 29 17.12 29 16C29 8.82 23.18 3 16 3ZM14.04 10.88C15.28 10.88 16.29 11.89 16.29 13.13C16.29 14.37 15.28 15.38 14.04 15.38C12.8 15.38 11.79 14.37 11.79 13.13C11.79 11.89 12.8 10.88 14.04 10.88ZM11.16 22.42C8.14 21.24 6.83 17.96 8.01 14.94C8.53 13.63 9.58 12.58 10.89 12.06C10.5 13.11 10.5 14.29 10.89 15.34C11.55 17.05 12.99 18.23 14.83 18.62C13.39 20.59 11.16 21.64 8.54 21.64C9.42 22.03 10.3 22.29 11.16 22.42Z"
            fill="#FFFFFF"
        />
    </svg>
);

export const MatanyAiWhiteLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M2 17L12 22L22 17"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M2 12L12 17L22 12"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const FdaWhiteLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M12 2L3 7V13C3 18.52 6.84 23.74 12 25C17.16 23.74 21 18.52 21 13V7L12 2Z"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M9 12L11 14L15 10"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const SupabaseWhiteLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M13.397 20.997L13.804 13.23H20.612C21.411 13.23 21.849 12.298 21.341 11.678L10.603 3.003C9.799 2.022 8.196 2.593 8.196 3.864V10.77H1.388C0.589 10.77 0.151 11.702 0.659 12.322L11.397 20.997C12.201 21.978 13.804 21.407 13.804 20.136"
            fill="#FFFFFF"
        />
    </svg>
);

export const RxNormWhiteLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M19 14C20.49 12.54 21.35 10.51 21.05 8.35C20.59 5.07 17.93 2.41 14.65 1.95C10.71 1.39 7.37 4.14 7.04 8.04C6.88 9.94 7.55 11.75 8.76 13.08L2.29 19.55C1.9 19.94 1.9 20.57 2.29 20.96L3.04 21.71C3.43 22.1 4.06 22.1 4.45 21.71L10.92 15.24C12.25 16.45 14.06 17.12 15.96 16.96C19.86 16.63 22.61 13.29 22.05 9.35"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <line x1="8" y1="8" x2="14" y2="14" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const SerperWhiteLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="11" cy="11" r="8" stroke="#FFFFFF" strokeWidth="2" />
        <path d="M21 21L16.65 16.65" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const PARTNERS: PartnerItem[] = [
    {
        id: "gemini",
        name: "Google Gemini",
        descriptionEn: "Gemini 2.5 Flash",
        descriptionAr: "محرك جيميناي 2.5 فلاش",
        logo: <GeminiWhiteLogo className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />,
    },
    {
        id: "deepseek",
        name: "DeepSeek AI",
        descriptionEn: "DeepSeek-V3 Engine",
        descriptionAr: "ذكاء ديب سيك V3",
        logo: <DeepSeekWhiteLogo className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />,
    },
    {
        id: "matany",
        name: "Matany AI",
        descriptionEn: "Clinical Intelligence Core",
        descriptionAr: "نواة مطاني للذكاء الطبي",
        logo: <MatanyAiWhiteLogo className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />,
    },
    {
        id: "fda",
        name: "openFDA",
        descriptionEn: "50,000+ FDA Drug Database",
        descriptionAr: "قاعدة بيانات الدواء الأمريكية",
        logo: <FdaWhiteLogo className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />,
    },
    {
        id: "supabase",
        name: "Supabase",
        descriptionEn: "Cloud Enterprise Infrastructure",
        descriptionAr: "بنية تحتية سحابية آمنة",
        logo: <SupabaseWhiteLogo className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />,
    },
    {
        id: "rxnorm",
        name: "NIH RxNorm",
        descriptionEn: "RxNav Standard Drug Nomenclature",
        descriptionAr: "المصطلحات الدوائية العالمية",
        logo: <RxNormWhiteLogo className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />,
    },
    {
        id: "serper",
        name: "Google Serper",
        descriptionEn: "Live Web Verification Engine",
        descriptionAr: "محرك التحقق الفوري عبر الويب",
        logo: <SerperWhiteLogo className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />,
    },
];

export const AiPartnersMarquee: React.FC<{ className?: string }> = ({ className }) => {
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";

    // Duplicate list 3 times to guarantee smooth infinite continuous scroll
    const items = [...PARTNERS, ...PARTNERS, ...PARTNERS];

    return (
        <div className={cn("w-full overflow-hidden select-none py-4 sm:py-6", className)}>
            {/* Header label */}
            <div className="flex items-center justify-center gap-2 mb-4">
                <span className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-white/20" />
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">
                    {isArabic ? "منظومة التقنيات والشركاء المعتمدين" : "POWERED BY INDUSTRY LEADERS"}
                </span>
                <span className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-white/20" />
            </div>

            {/* Continuous Marquee Rail */}
            <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
                <div className="flex gap-4 sm:gap-6 animate-marquee-slow hover:[animation-play-state:paused] py-2">
                    {items.map((item, idx) => (
                        <div
                            key={`${item.id}-${idx}`}
                            className={cn(
                                "group relative flex items-center gap-3 rounded-2xl border px-4 py-2.5 sm:px-5 sm:py-3 transition-all duration-300 shrink-0 cursor-default",
                                "bg-white/[0.03] border-white/[0.09] hover:bg-white/[0.08] hover:border-white/[0.22] hover:shadow-xl hover:shadow-white/[0.05]"
                            )}
                        >
                            {/* Logo Icon Container in Pure White */}
                            <div className="relative flex items-center justify-center p-2 rounded-xl bg-white/[0.08] border border-white/10 group-hover:scale-110 transition-transform duration-200 text-white">
                                {item.logo}
                            </div>

                            {/* Partner Info */}
                            <div className="flex flex-col text-left rtl:text-right">
                                <span className="text-xs sm:text-sm font-bold tracking-tight text-white group-hover:text-white transition-colors">
                                    {item.name}
                                </span>
                                <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                                    {isArabic ? item.descriptionAr : item.descriptionEn}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
