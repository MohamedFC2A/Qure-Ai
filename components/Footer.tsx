"use client";

import Link from "next/link";
import { useSettings } from "@/context/SettingsContext";
import { Github, Shield } from "lucide-react";
import { AiPartnersBadge } from "@/components/ui/AiPartnersBadge";

export const Footer = () => {
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const footerLinks = {
        product: {
            title: t("Product", "المنتج"),
            items: [
                { name: t("Scan Medication", "فحص الدواء"),  href: "/scan"    },
                { name: t("Pricing",          "الأسعار"),     href: "/pricing" },
                // { name: t("Dashboard",        "لوحة التحكم"), href: "/dashboard" }, // TODO: unhide
            ],
        },
        company: {
            title: t("Company", "الشركة"),
            items: [
                { name: t("Terms of Service", "شروط الخدمة"), href: "/terms" },
                { name: t("Privacy Policy",   "سياسة الخصوصية"), href: "/terms" },
                { name: t("Changelog & Updates", "التحديثات والسجل"), href: "/changelog" },
                { name: t("Documentation",    "الوثائق"),     href: "/docs"  },
            ],
        },
    };

    return (
        <footer className="relative z-10 mt-16 border-t mb-16 md:mb-0 border-white/[0.06] bg-slate-950/40 backdrop-blur-xl">
            {/* Top gradient line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-8 py-10 sm:py-12 grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr]">
                    {/* Brand Column */}
                    <div>
                        <Link href="/" dir="ltr" className="inline-flex items-center text-xl font-bold font-display select-none transition-opacity hover:opacity-90">
                            <span className="font-extrabold text-white">Qure</span><span className="text-cyan-400 font-bold">Scan</span>
                        </Link>

                        <p className="mt-4 text-xs sm:text-sm leading-relaxed text-slate-400 max-w-xs">
                            {t(
                                "AI-powered medication analysis and pharmaceutical intelligence for safer healthcare decisions.",
                                "تحليل الأدوية بالذكاء الاصطناعي للقرارات الصحية الأكثر أمانًا."
                            )}
                        </p>

                        {/* Disclaimer badge */}
                        <div className="mt-4 inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[11px] border-amber-400/20 bg-amber-400/[0.06] text-amber-300">
                            <Shield className="h-3.5 w-3.5 shrink-0" />
                            <span>{t("Review tool, not a diagnosis service", "أداة مراجعة، وليست خدمة تشخيص طبي")}</span>
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 mb-3 sm:mb-4">
                            {footerLinks.product.title}
                        </p>
                        <ul className="space-y-2.5 sm:space-y-3">
                            {footerLinks.product.items.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className="text-xs sm:text-sm text-slate-400 hover:text-white transition-colors duration-150"
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 mb-3 sm:mb-4">
                            {footerLinks.company.title}
                        </p>
                        <ul className="space-y-2.5 sm:space-y-3">
                            {footerLinks.company.items.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className="text-xs sm:text-sm text-slate-400 hover:text-white transition-colors duration-150"
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-white/[0.06] py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
                    <div className="flex flex-wrap items-center gap-2">
                        <p>
                            {t("Built by ", "تم التطوير بواسطة ")}
                            <span className="text-slate-300 font-medium">Matany Labs</span>
                            {" · "}
                            <span>© 2026</span>
                        </p>
                        <span className="text-slate-600 hidden sm:inline">•</span>
                        <Link href="/changelog" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                            <span>v1.3.7</span>
                            <span className="font-black uppercase tracking-wider bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent text-[10px]">
                                Beta
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <AiPartnersBadge showLabel={false} />

                        <a
                            href="https://github.com/MohamedFC2A"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-white transition-colors p-1"
                            aria-label="GitHub"
                        >
                            <Github className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
