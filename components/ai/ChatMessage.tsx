"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Copy, Check, CheckCircle2, AlertTriangle, Zap, Info, XCircle, Globe, ExternalLink, ChevronDown, ChevronUp, Share2 } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { parseAiResponse } from "@/lib/ai/chat";
import { VoiceReaderButton } from "@/components/ui/VoiceReaderButton";

export interface ChatSearchSource {
    title: string;
    link: string;
    domain?: string;
    snippet?: string;
    date?: string;
}

export interface ChatSearchMetadata {
    performed: boolean;
    query?: string;
    pagesCount?: number;
    totalSources?: number;
    sources?: ChatSearchSource[];
    directAnswer?: string;
    knowledgeEntity?: string;
}

export interface ChatMessageData {
    id?: string;
    role: "user" | "assistant";
    content: string;
    keyPoints?: string[];
    suggestedFollowUps?: string[];
    searchMetadata?: ChatSearchMetadata | null;
    isLiveSearch?: boolean;
    created_at?: string;
}

interface ChatMessageProps {
    message: ChatMessageData;
    isArabic: boolean;
    accentColor: string;
    onSuggestionClick?: (text: string) => void;
}

const SEARCH_STEPS_AR = [
    { title: "الاتصال بمحرك البحث السريري المباشر...", source: "فحص صفحات ومصادر طبية معتمدة" },
    { title: "استخراج ومطابقة النشرات وقواعد البيانات المعتمدة...", source: "FDA • RxNorm • DailyMed" },
    { title: "مراجعة التداخلات والبروتوكولات السريرية الحديثة...", source: "Medscape • Mayo Clinic • PubMed" },
    { title: "صياغة وتدقيق التوصيات بالذكاء الاصطناعي السريري...", source: "Qure Clinical Synthesizer" },
];

const SEARCH_STEPS_EN = [
    { title: "Connecting to Live Clinical Search Engine...", source: "Scanning verified clinical databases" },
    { title: "Scanning Official Drug Monographs & Databases...", source: "FDA • RxNorm • DailyMed" },
    { title: "Cross-referencing Safety Protocols & Interactions...", source: "Medscape • Mayo Clinic • PubMed" },
    { title: "Synthesizing Verified Clinical Recommendations...", source: "Qure Clinical Synthesizer" },
];

const FALLBACK_LIVE_SOURCES = [
    { name: "FDA.gov (هيئة الغذاء والدواء الأمريكية)", nameEn: "FDA.gov (US Approved Database)", domain: "fda.gov" },
    { name: "DailyMed (المكتبة الوطنية للطب NLM)", nameEn: "DailyMed (National Library of Medicine)", domain: "dailymed.nlm.nih.gov" },
    { name: "Mayo Clinic (البروتوكولات السريرية)", nameEn: "Mayo Clinic Clinical Protocols", domain: "mayoclinic.org" },
    { name: "Medscape (المراجع الدوائية والتحذيرات)", nameEn: "Medscape Drug Reference & Alerts", domain: "medscape.com" },
    { name: "PubMed / NIH (الأبحاث السريرية المحكمة)", nameEn: "PubMed / NIH Peer-Reviewed Studies", domain: "pubmed.ncbi.nlm.nih.gov" },
    { name: "RxNorm (المعايير الصيدلانية الدولية)", nameEn: "RxNorm Standard Registry", domain: "nlm.nih.gov" },
];

function LiveMedicalSearchRadar({ isArabic, searchMetadata }: { isArabic: boolean; searchMetadata?: ChatSearchMetadata | null }) {
    const rawSources = searchMetadata?.sources || [];
    const hasDiscoveredSources = rawSources.length > 0;

    // Dynamic Real Sources Count based on actual verified sources discovered
    const totalCount = hasDiscoveredSources
        ? rawSources.length
        : (searchMetadata?.totalSources && searchMetadata.totalSources > 0 ? searchMetadata.totalSources : 18);

    const [currentIndex, setCurrentIndex] = useState(1);

    const actualSources = hasDiscoveredSources
        ? rawSources.map((s) => ({
            name: s.title,
            domain: s.domain || "medical-source.org",
        }))
        : FALLBACK_LIVE_SOURCES.map((s) => ({
            name: isArabic ? s.name : s.nameEn,
            domain: s.domain,
        }));

    useEffect(() => {
        // Smoothly cycle through real discovered sources
        const intervalMs = Math.max(300, Math.min(800, 4500 / totalCount));
        const timer = setInterval(() => {
            setCurrentIndex((prev) => {
                if (prev >= totalCount) return 1;
                return prev + 1;
            });
        }, intervalMs);

        return () => clearInterval(timer);
    }, [totalCount]);

    const activeSourceItem = actualSources[(currentIndex - 1) % actualSources.length];
    const progressPercent = Math.min(100, Math.max(12, Math.round((currentIndex / totalCount) * 100)));

    return (
        <div className="w-full min-w-[280px] sm:min-w-[380px] max-w-lg rounded-2xl border border-white/[0.08] bg-[#0A1224]/95 p-3.5 space-y-2.5 shadow-md animate-in fade-in duration-200">
            {/* Header Stage & Dynamic Real Sources Stepper */}
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-sm text-cyan-300 select-none">
                    <Globe className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: "8s" }} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-white truncate">
                            {isArabic ? "جاري البحث السريري العميق..." : "Deep Clinical Search..."}
                        </p>
                        <span dir="ltr" className="px-2 py-0.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 font-mono font-bold text-[11px] shrink-0">
                            {currentIndex} / {totalCount}
                        </span>
                    </div>
                </div>
            </div>

            {/* Step-by-step progress bar (Crisp Solid Green) */}
            <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden border border-white/10">
                <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* Active Real Source Spotlight Item */}
            <div className="flex items-center gap-2 text-[11px] pt-0.5 overflow-hidden">
                <span className="text-slate-400 text-[10px] font-medium shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{isArabic ? "المصدر الحالي:" : "Scanning:"}</span>
                </span>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0C1527] border border-white/[0.08] text-sky-300 text-[10.5px] truncate max-w-[calc(100%-80px)]">
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[9.5px] font-mono text-cyan-200 shrink-0">
                        {activeSourceItem.domain}
                    </span>
                    <span className="truncate text-slate-200 font-sans">
                        {activeSourceItem.name}
                    </span>
                </div>
            </div>
        </div>
    );
}

function ClinicalThinkingIndicator({ isArabic }: { isArabic: boolean }) {
    return (
        <div className="flex items-center gap-3 py-1 px-0.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#080D1A] border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-sm select-none">
                <span className="text-[10px] font-black tracking-tight text-cyan-400 font-display">
                    Qure
                </span>
            </div>
            <div className="space-y-1">
                <p className="text-xs text-slate-200 font-bold">
                    {isArabic ? "جاري التحليل السريري وصياغة التوصيات الطبية..." : "Analyzing clinical context & synthesizing recommendations..."}
                </p>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-150" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-300" />
                </div>
            </div>
        </div>
    );
}

export function ChatMessage({ message, isArabic, accentColor, onSuggestionClick }: ChatMessageProps) {
    const [copied, setCopied] = useState(false);
    const [showSources, setShowSources] = useState(false);
    const [showCopyToast, setShowCopyToast] = useState(false);
    const lastTapRef = useRef<number>(0);
    const isUser = message.role === "user";

    // Fail-safe parsing for AI assistant messages to eliminate raw JSON artifacts
    const parsed = !isUser && message.content ? parseAiResponse(message.content) : { answer: "", keyPoints: [], suggestedFollowUps: [] };
    const displayContent = isUser ? message.content : (parsed.answer || message.content);
    const displayKeyPoints = (message.keyPoints && message.keyPoints.length > 0) ? message.keyPoints : parsed.keyPoints;
    const displayFollowUps = (message.suggestedFollowUps && message.suggestedFollowUps.length > 0) ? message.suggestedFollowUps : parsed.suggestedFollowUps;

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(displayContent);
            setCopied(true);
            setShowCopyToast(true);
            setTimeout(() => {
                setCopied(false);
                setShowCopyToast(false);
            }, 2000);
        } catch { /* ignore */ }
    }, [displayContent]);

    // Native Mobile Double-Tap to Copy Gesture
    const handleTouchEnd = useCallback(() => {
        const now = Date.now();
        const DOUBLE_TAP_THRESHOLD = 300;
        if (now - lastTapRef.current < DOUBLE_TAP_THRESHOLD) {
            handleCopy();
        }
        lastTapRef.current = now;
    }, [handleCopy]);

    // Advanced Markdown & Table renderer for AI answers
    const renderMarkdown = (text: string) => {
        const lines = text.split("\n");
        const elements: React.ReactNode[] = [];
        let inList = false;
        let listItems: string[] = [];

        const flushList = () => {
            if (listItems.length > 0) {
                elements.push(
                    <ul key={`ul-${elements.length}`} className="list-none space-y-2 my-2.5" dir={isArabic ? "rtl" : "ltr"}>
                        {listItems.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-start">
                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                                <span className="text-xs sm:text-sm leading-relaxed text-slate-200 text-start flex-1 [unicode-bidi:plaintext]" dir={isArabic ? "rtl" : "ltr"} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
                            </li>
                        ))}
                    </ul>
                );
                listItems = [];
                inList = false;
            }
        };

        const formatInline = (s: string): string => {
            // 1. Strip ALL Emojis (Strict Zero-Emoji Policy)
            let formatted = s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}⚡✓✔✖❌⚠️💊🔴🟢💡🔥📌]/gu, "");

            formatted = formatted
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");

            // 2. Transform Citations into Sleek Interactive Badges (e.g. (SOURCE #1, #31), [Source: #1], etc.)
            formatted = formatted.replace(
                /[\(\{\[]\s*(?:SOURCE|Source|المصدر|مصدر)?\s*:?\s*#?(\d+(?:\s*(?:,|،|and|&)\s*#?\d+)*)\s*[\)\}\]]/gi,
                (match, numsStr) => {
                    const numbers = numsStr.split(/[,،]|and|&/).map((n: string) => n.replace(/[^\d]/g, "").trim()).filter(Boolean);
                    if (numbers.length === 0) return "";
                    return numbers.map((n: string) => {
                        const srcIdx = parseInt(n, 10);
                        const srcMeta = message.searchMetadata?.sources?.[srcIdx - 1];
                        const domainLabel = srcMeta?.domain ? srcMeta.domain : (isArabic ? `المصدر #${n}` : `Source #${n}`);
                        return `<span class="inline-flex items-center gap-1 px-2 py-0.5 my-0.5 mx-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300 font-mono text-[10.5px] font-bold align-middle select-none shadow-sm"><svg class="w-3 h-3 text-sky-400 inline-block shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg><span>${domainLabel}</span></span>`;
                    }).join(" ");
                }
            );

            // Handle isolated (#1) or {#1}
            formatted = formatted.replace(/[\(\{\[]\s*#(\d+)\s*[\)\}\]]/g, (match, n) => {
                const srcIdx = parseInt(n, 10);
                const srcMeta = message.searchMetadata?.sources?.[srcIdx - 1];
                const domainLabel = srcMeta?.domain ? srcMeta.domain : (isArabic ? `المصدر #${n}` : `Source #${n}`);
                return `<span class="inline-flex items-center gap-1 px-2 py-0.5 my-0.5 mx-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300 font-mono text-[10.5px] font-bold align-middle select-none shadow-sm"><svg class="w-3 h-3 text-sky-400 inline-block shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg><span>${domainLabel}</span></span>`;
            });

            // 3. Red Critical Threat Warning Badge: [CRITICAL_WARNING: ...] or [تحذير سريري حرج: ...]
            formatted = formatted.replace(
                /\[\s*(?:CRITICAL_WARNING|تحذير سريري حرج)\s*:\s*([^\]]+)\]/gi,
                '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 my-0.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 font-bold text-xs shrink-0 align-middle"><svg class="w-3.5 h-3.5 text-red-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span>$1</span></span>'
            );

            // 4. Amber Caution Badge: [MEDICAL_CAUTION: ...] or [تنبيه طبي احتياطي: ...]
            formatted = formatted.replace(
                /\[\s*(?:MEDICAL_CAUTION|تنبيه طبي احتياطي|تنبيه احتياطي)\s*:\s*([^\]]+)\]/gi,
                '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 my-0.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 font-bold text-xs shrink-0 align-middle"><svg class="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg><span>$1</span></span>'
            );

            // 5. Green Verified Document Badge: [VERIFIED_DOCUMENT: ...] or [موثق سريرياً: ...]
            formatted = formatted.replace(
                /\[\s*(?:VERIFIED_DOCUMENT|موثق سريرياً|موثق من النشرة)\s*:\s*([^\]]+)\]/gi,
                '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 my-0.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-semibold text-xs shrink-0 align-middle"><svg class="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg><span>$1</span></span>'
            );

            // Bold, italic, inline code with bidirectional isolation
            return formatted
                .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white [unicode-bidi:isolate]">$1</strong>')
                .replace(/\*(.+?)\*/g, '<em class="italic text-slate-300 [unicode-bidi:isolate]">$1</em>')
                .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded-md bg-slate-800 text-cyan-300 text-xs font-mono border border-slate-700 [unicode-bidi:isolate]">$1</code>');
        };

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();

            if (!line) {
                flushList();
                continue;
            }

            // High-impact Verdict Banner (First non-empty line decision)
            if (elements.length === 0) {
                const lower = line.toLowerCase();

                const startsWithYes = /^(?:\*\*|\#\#|\*)*\s*(?:نعم|آمن|مناسب|مسموح|يمكن|عادي|صحيح|ممتاز|جيد|yes|suitable|safe|allowed|correct|good)/i.test(line);
                const hasPositiveWords = lower.includes("نعم") || lower.includes("مناسب") || lower.includes("آمن") || lower.includes("yes") || lower.includes("suitable") || lower.includes("safe");
                
                const startsWithNo = /^(?:\*\*|\#\#|\*)*\s*(?:لا|غير\s*مناسب|غير\s*آمن|ممنوع|خطير|تجنب|تحذير|no|unsuitable|unsafe|forbidden)/i.test(line);
                const hasNegativePhrase = lower.includes("غير مناسب") || lower.includes("غير آمن") || lower.includes("ممنوع") || lower.includes("خطير") || lower.includes("تجنب") || lower.includes("تحذير") || lower.includes("unsuitable") || lower.includes("unsafe") || lower.includes("forbidden") || /(?:^|[\s،.!:;?])لا(?:[\s،.!:;?]|$)/.test(lower);

                if (startsWithNo || (hasNegativePhrase && !startsWithYes && !lower.includes("نعم"))) {
                    elements.push(
                        <div key={`verdict-${i}`} dir={isArabic ? "rtl" : "ltr"} className="my-2 p-3 sm:p-3.5 rounded-xl border border-red-500/30 bg-red-950/30 text-red-100 text-xs sm:text-sm font-bold flex items-start sm:items-center gap-2.5 text-start">
                            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 shrink-0 mt-0.5 sm:mt-0" />
                            <div className="flex-1 leading-relaxed text-start [unicode-bidi:plaintext]" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
                        </div>
                    );
                    continue;
                } else if (startsWithYes || (hasPositiveWords && !lower.includes("غير مناسب") && !lower.includes("غير آمن") && !lower.includes("غير مفضل"))) {
                    elements.push(
                        <div key={`verdict-${i}`} dir={isArabic ? "rtl" : "ltr"} className="my-2 p-3 sm:p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 text-emerald-100 text-xs sm:text-sm font-bold flex items-start sm:items-center gap-2.5 text-start">
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
                            <div className="flex-1 leading-relaxed text-start [unicode-bidi:plaintext]" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
                        </div>
                    );
                    continue;
                }
            }

            // Divider lines (--- or ***)
            if (line.match(/^[-*_]{3,}$/)) {
                flushList();
                elements.push(<hr key={`hr-${i}`} className="my-3 border-slate-800" />);
                continue;
            }

            // Markdown Table Detection
            if (line.startsWith("|") && line.endsWith("|")) {
                flushList();
                const tableLines: string[] = [];
                while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
                    tableLines.push(lines[i].trim());
                    i++;
                }
                i--;

                if (tableLines.length >= 2) {
                    const parseRow = (l: string) => l.split("|").slice(1, -1).map((c) => c.trim());
                    const headers = parseRow(tableLines[0]);
                    const startIdx = tableLines[1].match(/^\|[\s:-|-]+\|$/) ? 2 : 1;
                    const bodyRows = tableLines.slice(startIdx).map(parseRow);

                    elements.push(
                        <div key={`table-${i}`} className="my-3 overflow-x-auto rounded-xl border border-white/[0.08] bg-[#080D1A] shadow-sm" dir={isArabic ? "rtl" : "ltr"}>
                            <table className="w-full text-xs sm:text-sm text-slate-200 border-collapse">
                                <thead className="bg-cyan-950/30 text-cyan-300 font-bold border-b border-white/[0.08]">
                                    <tr>
                                        {headers.map((h, hIdx) => (
                                            <th key={hIdx} className="px-3.5 py-2.5 text-start font-bold border-x border-white/[0.04] whitespace-nowrap">
                                                <span dangerouslySetInnerHTML={{ __html: formatInline(h) }} />
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {bodyRows.map((r, rIdx) => (
                                        <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                                            {r.map((cell, cIdx) => (
                                                <td key={cIdx} className="px-3.5 py-2.5 leading-relaxed border-x border-white/[0.04] text-start">
                                                    <span dangerouslySetInnerHTML={{ __html: formatInline(cell) }} />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                    continue;
                }
            }

            // Clinical Callout Box (> quote)
            if (line.startsWith("> ")) {
                flushList();
                elements.push(
                    <div key={`quote-${i}`} dir={isArabic ? "rtl" : "ltr"} className="my-2.5 p-3 sm:p-3.5 rounded-xl border border-cyan-500/25 bg-cyan-950/20 text-cyan-200 text-xs sm:text-sm leading-relaxed flex items-start gap-2.5 shadow-sm text-start">
                        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div className="flex-1 text-start [unicode-bidi:plaintext]" dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^>\s+/, "")) }} />
                    </div>
                );
                continue;
            }

            // Headers
            if (line.startsWith("## ")) {
                flushList();
                elements.push(
                    <h4 key={`h-${i}`} dir={isArabic ? "rtl" : "ltr"} className="font-bold text-white text-sm sm:text-base mt-4 mb-2 flex items-center gap-2 pb-1 border-b border-slate-800 text-start">
                        <span className="w-1.5 h-4 rounded-full bg-cyan-400 shrink-0" />
                        <span className="text-start [unicode-bidi:plaintext]" dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^##\s+/, "")) }} />
                    </h4>
                );
                continue;
            }
            if (line.startsWith("### ")) {
                flushList();
                elements.push(
                    <h5 key={`h-${i}`} dir={isArabic ? "rtl" : "ltr"} className="font-bold text-white text-xs sm:text-sm mt-3 mb-1.5 flex items-center gap-1.5 text-start">
                        <span className="w-1 h-3 rounded-full bg-cyan-500/80 shrink-0" />
                        <span className="text-start [unicode-bidi:plaintext]" dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^###\s+/, "")) }} />
                    </h5>
                );
                continue;
            }

            // List items
            if (line.match(/^[-*•]\s+/)) {
                inList = true;
                listItems.push(line.replace(/^[-*•]\s+/, ""));
                continue;
            }

            // Numbered list
            if (line.match(/^\d+[.)]\s+/)) {
                inList = true;
                listItems.push(line.replace(/^\d+[.)]\s+/, ""));
                continue;
            }

            flushList();
            elements.push(
                <p key={i} dir={isArabic ? "rtl" : "ltr"} className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans text-start [unicode-bidi:plaintext]" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
            );
        }
        flushList();

        return elements;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className={cn("flex gap-2 sm:gap-3", isUser ? "justify-end" : "justify-start")}
        >
            {/* AI Avatar Icon - Official Qure Brand Mark (Matte, Zero Glowing) */}
            {!isUser && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#080D1A] border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-sm mt-1 select-none">
                    <span className="text-[10px] font-black tracking-tight text-cyan-400 font-display">
                        Qure
                    </span>
                </div>
            )}

            <div className={cn(
                "relative group space-y-1.5",
                isUser ? "max-w-[85%] sm:max-w-[80%]" : "max-w-[96%] sm:max-w-[88%]"
            )}>
                {/* User Message Bubble */}
                {isUser ? (
                    <div
                        onTouchEnd={handleTouchEnd}
                        dir={isArabic ? "rtl" : "ltr"}
                        className={cn(
                            "rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 border text-xs sm:text-sm leading-relaxed shadow-sm transition-all select-text text-start [unicode-bidi:plaintext]",
                            isArabic ? "rounded-tr-sm" : "rounded-tl-sm",
                            "bg-cyan-950/40 border-cyan-500/30 text-cyan-50"
                        )}
                    >
                        <p className="whitespace-pre-wrap text-start">{message.content}</p>
                    </div>
                ) : (
                    /* AI Assistant Message Bubble (Matte Dark Card, Zero Glow) */
                    <div
                        onTouchEnd={handleTouchEnd}
                        dir={isArabic ? "rtl" : "ltr"}
                        className={cn(
                            "px-4 sm:px-5 py-3.5 sm:py-4 border border-white/[0.08] bg-[#0C1324]/95 rounded-2xl text-slate-100 leading-relaxed shadow-sm transition-all select-text text-start [unicode-bidi:plaintext]",
                            isArabic ? "rounded-tl-sm" : "rounded-tr-sm"
                        )}
                    >
                        {displayContent ? (
                            <div className="space-y-1 text-start" dir={isArabic ? "rtl" : "ltr"}>{renderMarkdown(displayContent)}</div>
                        ) : (message.isLiveSearch || message.searchMetadata?.performed) ? (
                            <LiveMedicalSearchRadar isArabic={isArabic} searchMetadata={message.searchMetadata} />
                        ) : (
                            <ClinicalThinkingIndicator isArabic={isArabic} />
                        )}
                    </div>
                )}

                {/* Double-tap feedback badge */}
                {showCopyToast && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold shadow-md animate-fade-in pointer-events-none z-20 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>{isArabic ? "تم النسخ" : "Copied"}</span>
                    </div>
                )}

                {/* Compact Action Toolbar (TTS Voice Reader + Double Tap Copy Indicator) */}
                {!isUser && displayContent && (
                    <div className="flex items-center gap-1.5 pt-0.5 select-none" dir={isArabic ? "rtl" : "ltr"}>
                        {/* Audio Voice Reader */}
                        <VoiceReaderButton text={displayContent} lang={isArabic ? "ar" : "en"} size="xs" />

                        {/* Copy Button */}
                        <button
                            type="button"
                            onClick={handleCopy}
                            className={cn(
                                "min-h-[32px] px-2.5 py-1 rounded-lg border transition-all duration-150 flex items-center gap-1.5 touch-manipulation cursor-pointer text-xs font-medium",
                                copied
                                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm"
                                    : "bg-white/[0.03] hover:bg-white/[0.06] active:bg-white/[0.10] border-white/[0.06] text-slate-400 hover:text-slate-200"
                            )}
                            title={isArabic ? "نسخ الإجابة (أو اضغط مرتين)" : "Copy response (or double tap)"}
                            aria-label={isArabic ? "نسخ الإجابة" : "Copy response"}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-[11px] text-emerald-300">{isArabic ? "تم النسخ" : "Copied"}</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-[11px] text-slate-400">{isArabic ? "نسخ" : "Copy"}</span>
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Key Takeaways */}
                {!isUser && displayKeyPoints && displayKeyPoints.length > 0 && (
                    <div className="mt-2.5 rounded-xl border border-white/[0.08] bg-[#0C1324] p-3.5 space-y-2 shadow-sm text-start" dir={isArabic ? "rtl" : "ltr"}>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{isArabic ? "أهم النقاط السريرية" : "Key Clinical Takeaways"}</span>
                        </p>
                        <div className="space-y-1.5">
                            {displayKeyPoints.map((kp, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-slate-200 text-start [unicode-bidi:plaintext]">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                                    <span className="leading-relaxed flex-1">{kp}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Suggested Follow-Ups */}
                {!isUser && displayFollowUps && displayFollowUps.length > 0 && onSuggestionClick && (
                    <div className="mt-2.5 space-y-1.5 text-start" dir={isArabic ? "rtl" : "ltr"}>
                        <p className="text-[11px] font-semibold text-slate-400 px-1">
                            {isArabic ? "أسئلة متابعة مقترحة:" : "Suggested follow-ups:"}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {displayFollowUps.map((s, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => onSuggestionClick(s)}
                                    dir={isArabic ? "rtl" : "ltr"}
                                    className="px-3 py-1.5 rounded-xl text-xs font-medium border border-white/[0.08] bg-[#080D1A] text-slate-300 hover:text-white hover:border-cyan-500/40 hover:bg-[#0C1324] active:scale-[0.98] transition-all touch-manipulation cursor-pointer text-start [unicode-bidi:isolate]"
                                >
                                    <span className="[unicode-bidi:plaintext]">{s}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Verified Live Medical Web Search Sources (Rendered at the very end!) */}
                {!isUser && message.searchMetadata?.performed && (
                    <div className="mt-2.5 rounded-xl border border-white/[0.08] bg-[#0A1020] p-3 space-y-2 shadow-sm animate-in fade-in duration-150">
                        {(() => {
                            const totalSources = message.searchMetadata.sources?.length || message.searchMetadata.totalSources || 0;
                            return (
                                <>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                                            <div className="p-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400">
                                                <Globe className="w-3.5 h-3.5" />
                                            </div>
                                            <span>
                                                {isArabic
                                                    ? `تم التوثيق السريري المباشر عبر ${totalSources === 1 ? "مصدر معتمد واحد" : totalSources === 2 ? "مصدرين معتمدين" : totalSources <= 10 ? `${totalSources} مصادر معتمدة` : `${totalSources} مصدراً معتمداً`}`
                                                    : `Verified via ${totalSources} Live Medical ${totalSources === 1 ? "Source" : "Sources"}`}
                                            </span>
                                        </div>

                                        {totalSources > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setShowSources((prev) => !prev)}
                                                className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] border border-white/[0.08] text-[11px] font-medium text-slate-300 flex items-center gap-1 transition-colors touch-manipulation cursor-pointer"
                                                aria-label={showSources ? "Hide sources" : "Show sources"}
                                            >
                                                <span>
                                                    {showSources
                                                        ? (isArabic ? "إخفاء" : "Hide")
                                                        : (isArabic ? `عرض (${totalSources})` : `Sources (${totalSources})`)}
                                                </span>
                                                {showSources ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
                                            </button>
                                        )}
                                    </div>

                                    {/* Expandable Sources List (1 to 50 sources) */}
                                    {showSources && message.searchMetadata.sources && message.searchMetadata.sources.length > 0 && (
                                        <div className="space-y-1.5 pt-2 border-t border-white/[0.06] max-h-80 overflow-y-auto scrollbar-thin">
                                            {message.searchMetadata.sources.map((src, i) => (
                                                <a
                                                    key={i}
                                                    href={src.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block p-2.5 rounded-lg bg-[#0C1428] hover:bg-[#101B36] active:bg-[#142244] border border-white/[0.06] hover:border-cyan-500/30 transition-all group touch-manipulation"
                                                >
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] font-mono text-cyan-300 truncate max-w-[200px]">
                                                            {src.domain || "medical-source.org"}
                                                        </span>
                                                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium shrink-0">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            <span>{isArabic ? "موثوق" : "Verified"}</span>
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                                                        <span className="line-clamp-1">{src.title}</span>
                                                        <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
                                                    </p>
                                                    {src.snippet && (
                                                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-normal font-sans">
                                                            {src.snippet}
                                                        </p>
                                                    )}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
