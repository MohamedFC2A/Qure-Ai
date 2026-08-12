"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Ruler, Weight } from "lucide-react";

/* ──────────────────────────────────────────────────────────
 *  SmartHeightInput
 *  - Accepts: "175", "175 cm", "1.75", "1.75m"
 *  - Auto-converts meters to cm ONLY on blur (not while typing)
 *  - Shows a gentle success tip after conversion
 * ────────────────────────────────────────────────────────── */

interface SmartHeightInputProps {
    value: string;
    onChange: (value: string) => void;
    isArabic?: boolean;
    label?: string;
    className?: string;
}

export const SmartHeightInput: React.FC<SmartHeightInputProps> = ({
    value,
    onChange,
    isArabic = false,
    label,
    className,
}) => {
    // Extract numeric portion for display
    const extractNum = (v: string) => String(v || "").replace(/[^\d.]/g, "");

    const [inputValue, setInputValue] = useState(extractNum(value));
    const [status, setStatus] = useState<{ type: "corrected" | "ok"; msg: string } | null>(null);
    const isMounted = useRef(false);

    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }
        setInputValue(extractNum(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow digits and single dot only
        const raw = e.target.value.replace(/[^\d.]/g, "");
        setInputValue(raw);
        setStatus(null);
        // Pass raw value immediately so form state stays in sync
        onChange(raw);
    };

    const handleBlur = () => {
        const raw = inputValue.trim();
        if (!raw) return;
        const num = parseFloat(raw);
        if (isNaN(num)) return;

        // Smart conversion: if value looks like meters (e.g. 1.5 – 2.5), treat as m → cm
        // Values like "1" are ambiguous (could be 1 cm or 1 m) — we check decimal presence
        const looksLikeMeters = num >= 1.0 && num < 2.6 && raw.includes(".");

        if (looksLikeMeters) {
            const cm = Math.round(num * 100);
            setInputValue(String(cm));
            onChange(String(cm));
            setStatus({
                type: "corrected",
                msg: isArabic
                    ? `تم التحويل: ${raw} م ← ${cm} سم`
                    : `Converted: ${raw}m → ${cm} cm`,
            });
        } else if (num >= 50 && num <= 280) {
            // Valid cm range — round to whole number
            const rounded = Math.round(num);
            setInputValue(String(rounded));
            onChange(String(rounded));
            setStatus(null);
        } else if (num > 0 && num < 50) {
            // Too small to be cm, not decimal either — likely a typo, leave it
            setStatus(null);
        }
    };

    return (
        <div className={cn("space-y-1.5", className)}>
            {label && (
                <label className="text-xs font-semibold text-slate-300 block">{label}</label>
            )}
            <div className="relative flex items-center">
                <input
                    type="text"
                    inputMode="decimal"
                    value={inputValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={isArabic ? "مثال: 175 أو 1.75" : "e.g. 175 or 1.75"}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 pe-16 text-base text-white font-medium placeholder:text-slate-500/60 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 transition-all shadow-inner"
                />
                <div className="absolute end-2.5 flex items-center gap-1 bg-cyan-500/10 border border-cyan-400/25 text-cyan-300 text-xs font-bold px-2.5 py-1.5 rounded-lg select-none pointer-events-none">
                    <span>{isArabic ? "سم" : "cm"}</span>
                </div>
            </div>

            {/* Smart correction tip — only when actually corrected */}
            {status?.type === "corrected" && (
                <p className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{status.msg}</span>
                </p>
            )}
        </div>
    );
};

/* ──────────────────────────────────────────────────────────
 *  SmartWeightInput
 *  - Accepts kg values, strips non-numeric chars
 *  - No special conversion needed (kg is universal)
 * ────────────────────────────────────────────────────────── */

interface SmartWeightInputProps {
    value: string;
    onChange: (value: string) => void;
    isArabic?: boolean;
    label?: string;
    className?: string;
}

export const SmartWeightInput: React.FC<SmartWeightInputProps> = ({
    value,
    onChange,
    isArabic = false,
    label,
    className,
}) => {
    const extractNum = (v: string) => String(v || "").replace(/[^\d.]/g, "");
    const [inputValue, setInputValue] = useState(extractNum(value));
    const isMounted = useRef(false);

    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }
        setInputValue(extractNum(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^\d.]/g, "");
        setInputValue(raw);
        onChange(raw);
    };

    const handleBlur = () => {
        const num = parseFloat(inputValue);
        if (!isNaN(num) && num > 0) {
            const rounded = String(parseFloat(num.toFixed(1)));
            setInputValue(rounded);
            onChange(rounded);
        }
    };

    return (
        <div className={cn("space-y-1.5", className)}>
            {label && (
                <label className="text-xs font-semibold text-slate-300 block">{label}</label>
            )}
            <div className="relative flex items-center">
                <input
                    type="text"
                    inputMode="decimal"
                    value={inputValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={isArabic ? "مثال: 75" : "e.g. 75"}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 pe-16 text-base text-white font-medium placeholder:text-slate-500/60 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 transition-all shadow-inner"
                />
                <div className="absolute end-2.5 flex items-center gap-1 bg-emerald-500/10 border border-emerald-400/25 text-emerald-300 text-xs font-bold px-2.5 py-1.5 rounded-lg select-none pointer-events-none">
                    <span>{isArabic ? "كجم" : "kg"}</span>
                </div>
            </div>
        </div>
    );
};
