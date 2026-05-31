"use client";

import Link from "next/link";
import { useSettings } from "@/context/SettingsContext";
import { Atom, Github, Shield, FileText, Gem } from "lucide-react";
import { cn } from "@/lib/utils";

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
                { name: t("Dashboard",        "لوحة التحكم"), href: "/dashboard" },
            ],
        },
        company: {
            title: t("Company", "الشركة"),
            items: [
                { name: t("Terms of Service", "شروط الخدمة"), href: "/terms" },
                { name: t("Privacy Policy",   "سياسة الخصوصية"), href: "/terms" },
                { name: t("Documentation",    "الوثائق"),     href: "/docs"  },
            ],
        },
    };

    return (
        <footer className={cn(
            "relative z-10 mt-16 border-t mb-24 md:mb-0",
            "border-white/[0.06]"
        )}>
            {/* Top gradient line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className={cn(
                    "grid gap-8 py-12",
                    "grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr]",
                    isArabic ? "text-right" : "text-left"
                )}>
                    {/* Brand Column */}
                    <div>
                        <Link href="/" className={cn(
                            "inline-flex items-center gap-2.5 font-bold text-base",
                            isArabic ? "flex-row-reverse" : ""
                        )}>
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-950/40">
                                <Atom className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-white">
                                Qure <span className="text-cyan-400">Ai</span>
                            </span>
                        </Link>

                        <p className="mt-4 text-sm leading-relaxed text-slate-500 max-w-xs">
                            {t(
                                "AI-powered medication analysis and pharmaceutical intelligence for safer healthcare decisions.",
                                "تحليل الأدوية بالذكاء الاصطناعي للقرارات الصحية الأكثر أمانًا."
                            )}
                        </p>

                        {/* Disclaimer badge */}
                        <div className={cn(
                            "mt-5 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs",
                            "border-amber-400/15 bg-amber-400/[0.05] text-amber-400/70"
                        )}>
                            <Shield className="h-3.5 w-3.5 shrink-0" />
                            {t(
                                "Review tool, not a diagnosis service",
                                "أداة مراجعة، وليست خدمة تشخيص طبي"
                            )}
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 mb-4">
                            {footerLinks.product.title}
                        </p>
                        <ul className="space-y-3">
                            {footerLinks.product.items.map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="text-sm text-slate-500 hover:text-slate-200 transition-colors duration-150"
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 mb-4">
                            {footerLinks.company.title}
                        </p>
                        <ul className="space-y-3">
                            {footerLinks.company.items.map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="text-sm text-slate-500 hover:text-slate-200 transition-colors duration-150"
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className={cn(
                    "border-t border-white/[0.05] py-6",
                    "flex flex-col sm:flex-row items-center justify-between gap-3",
                    isArabic ? "sm:flex-row-reverse" : ""
                )}>
                    <p className="text-xs text-slate-600">
                        {t("Built by ", "تم التطوير بواسطة ")}
                        <span className="text-slate-400 font-medium">Matany Labs</span>
                        {" · "}
                        <span className="text-slate-600">© 2026</span>
                    </p>

                    <div className={cn(
                        "flex items-center gap-3",
                        isArabic ? "flex-row-reverse" : ""
                    )}>
                        <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-cyan-400/50">
                            {t("Powered by NEXUS AI", "مشغّل بواسطة NEXUS AI")}
                        </span>

                        <a
                            href="https://github.com/MohamedFC2A"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-600 hover:text-slate-300 transition-colors"
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
