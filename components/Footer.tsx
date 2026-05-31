"use client";

import { useSettings } from "@/context/SettingsContext";

export const Footer = () => {
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === 'ar';
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    return (
        <footer className="relative z-10 mt-12 mb-24 flex w-full flex-col items-center justify-center gap-3 border-t border-white/10 px-4 py-8 text-center md:mb-8">
            <p className="text-sm font-medium text-slate-500">
                {t("Built by ", "تم التطوير بواسطة ")}<span className="text-slate-300">Matany Labs</span>
            </p>
            <p className="text-[10px] md:text-xs font-bold tracking-[0.28em] uppercase text-cyan-200/70">
                {t("Powered by NEXUS AI", "مشغل بواسطة NEXUS AI")}
            </p>
        </footer>
    );
};
