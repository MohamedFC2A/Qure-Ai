"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Copy, Check, User, CheckCircle2, AlertTriangle, Zap, Info, HelpCircle, ArrowRight, XCircle, Brain } from "lucide-react";
import { useState } from "react";
import { parseAiResponse } from "@/lib/ai/chat";
import { VoiceReaderButton } from "@/components/ui/VoiceReaderButton";

export interface ChatMessageData {
    id?: string;
    role: "user" | "assistant";
    content: string;
    keyPoints?: string[];
    suggestedFollowUps?: string[];
    created_at?: string;
}

interface ChatMessageProps {
    message: ChatMessageData;
    isArabic: boolean;
    accentColor: string;
    onSuggestionClick?: (text: string) => void;
}

export function ChatMessage({ message, isArabic, accentColor, onSuggestionClick }: ChatMessageProps) {
    const [copied, setCopied] = useState(false);
    const isUser = message.role === "user";

    // Fail-safe parsing for AI assistant messages to eliminate raw JSON artifacts
    const parsed = !isUser && message.content ? parseAiResponse(message.content) : { answer: "", keyPoints: [], suggestedFollowUps: [] };
    const displayContent = isUser ? message.content : (parsed.answer || message.content);
    const displayKeyPoints = (message.keyPoints && message.keyPoints.length > 0) ? message.keyPoints : parsed.keyPoints;
    const displayFollowUps = (message.suggestedFollowUps && message.suggestedFollowUps.length > 0) ? message.suggestedFollowUps : parsed.suggestedFollowUps;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(displayContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* ignore */ }
    };

    // Advanced Markdown & Table renderer for AI answers
    const renderMarkdown = (text: string) => {
        const lines = text.split("\n");
        const elements: React.ReactNode[] = [];
        let inList = false;
        let listItems: string[] = [];

        const flushList = () => {
            if (listItems.length > 0) {
                elements.push(
                    <ul key={`ul-${elements.length}`} className="list-none space-y-2 my-3">
                        {listItems.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                                <span className="text-sm leading-relaxed text-slate-200" dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
                            </li>
                        ))}
                    </ul>
                );
                listItems = [];
                inList = false;
            }
        };

        const formatInline = (s: string): string => {
            let formatted = s;

            // 1. Red Critical Threat Warning Badge: ⚠️ [...] or [⚠️ ...]
            formatted = formatted.replace(
                /(?:⚠️\s*\[|\[⚠️\s*)([^\]]+)\]/gi,
                '<span class="inline-flex items-center gap-1.5 px-3 py-1 my-1 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 font-bold text-xs shrink-0 align-middle"><svg class="w-4 h-4 text-red-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span>$1</span></span>'
            );

            // 2. Amber Caution Badge: ⚡ [...] or [⚡ ...]
            formatted = formatted.replace(
                /(?:⚡\s*\[|\[⚡\s*)([^\]]+)\]/gi,
                '<span class="inline-flex items-center gap-1.5 px-3 py-1 my-1 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 font-bold text-xs shrink-0 align-middle"><svg class="w-4 h-4 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg><span>$1</span></span>'
            );

            // 3. Green Verified Document Badge: ✓ [...] or [✓ ...]
            formatted = formatted.replace(
                /(?:✓\s*\[|\[✓\s*)([^\]]+)\]/gi,
                '<span class="inline-flex items-center gap-1.5 px-3 py-1 my-1 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-semibold text-xs shrink-0 align-middle"><svg class="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg><span>$1</span></span>'
            );

            // Replace raw emojis with clean SVG representations
            formatted = formatted
                .replace(/✅/g, '<svg class="w-3.5 h-3.5 text-emerald-400 inline-block align-middle mx-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>')
                .replace(/⚠️/g, '<svg class="w-3.5 h-3.5 text-amber-400 inline-block align-middle mx-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>')
                .replace(/❌/g, '<svg class="w-3.5 h-3.5 text-red-400 inline-block align-middle mx-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>');

            // Bold, italic, code formatting
            return formatted
                .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
                .replace(/\*(.+?)\*/g, '<em class="italic text-slate-300">$1</em>')
                .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded-md bg-slate-800 text-cyan-300 text-xs font-mono border border-slate-700">$1</code>');
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

                // Explicit positive indicators
                const startsWithYes = /^(?:\*\*|\#\#|\*)*\s*(?:نعم|آمن|مناسب|مسموح|يمكن|عادي|صحيح|ممتاز|جيد|yes|suitable|safe|allowed|correct|good)/i.test(line);
                const hasPositiveWords = lower.includes("نعم") || lower.includes("مناسب") || lower.includes("آمن") || lower.includes("yes") || lower.includes("suitable") || lower.includes("safe");
                
                // Explicit negative indicators (standalone "لا" or phrases like "غير مناسب", "غير آمن", "ممنوع", "خطير")
                const startsWithNo = /^(?:\*\*|\#\#|\*)*\s*(?:لا|غير\s*مناسب|غير\s*آمن|ممنوع|خطير|تجنب|تحذير|no|unsuitable|unsafe|forbidden)/i.test(line);
                const hasNegativePhrase = lower.includes("غير مناسب") || lower.includes("غير آمن") || lower.includes("ممنوع") || lower.includes("خطير") || lower.includes("تجنب") || lower.includes("تحذير") || lower.includes("unsuitable") || lower.includes("unsafe") || lower.includes("forbidden") || /(?:^|[\s،.!:;?])لا(?:[\s،.!:;?]|$)/.test(lower);

                // Priority to negative if starts with "لا" / "غير مناسب"
                if (startsWithNo || (hasNegativePhrase && !startsWithYes && !lower.includes("نعم"))) {
                    elements.push(
                        <div key={`verdict-${i}`} className="my-2.5 p-4 rounded-xl border border-red-500/30 bg-red-950/30 text-red-100 text-sm font-bold flex items-start sm:items-center gap-3">
                            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5 sm:mt-0" />
                            <div className="flex-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
                        </div>
                    );
                    continue;
                } else if (startsWithYes || (hasPositiveWords && !lower.includes("غير مناسب") && !lower.includes("غير آمن") && !lower.includes("غير مفضل"))) {
                    elements.push(
                        <div key={`verdict-${i}`} className="my-2.5 p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/30 text-emerald-100 text-sm font-bold flex items-start sm:items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
                            <div className="flex-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
                        </div>
                    );
                    continue;
                }
            }

            // Divider lines (--- or ***)
            if (line.match(/^[-*_]{3,}$/)) {
                flushList();
                elements.push(<hr key={`hr-${i}`} className="my-4 border-slate-800/80" />);
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
                        <div key={`table-${i}`} className="my-4 overflow-x-auto rounded-xl border border-white/[0.08] bg-[#080D1A]/90 backdrop-blur-xl shadow-md">
                            <table className="w-full text-xs sm:text-sm text-slate-200 border-collapse">
                                <thead className="bg-cyan-950/30 text-cyan-300 font-bold border-b border-white/[0.08]">
                                    <tr>
                                        {headers.map((h, hIdx) => (
                                            <th key={hIdx} className="px-4 py-3 text-start font-bold border-x border-white/[0.04] whitespace-nowrap">
                                                <span dangerouslySetInnerHTML={{ __html: formatInline(h) }} />
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {bodyRows.map((r, rIdx) => (
                                        <tr key={rIdx} className="hover:bg-white/[0.03] transition-colors">
                                            {r.map((cell, cIdx) => (
                                                <td key={cIdx} className="px-4 py-3 leading-relaxed border-x border-white/[0.04]">
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
                    <div key={`quote-${i}`} className="my-3.5 p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 backdrop-blur-xl text-cyan-200 text-xs sm:text-sm leading-relaxed flex items-start gap-3 shadow-sm">
                        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div className="flex-1" dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^>\s+/, "")) }} />
                    </div>
                );
                continue;
            }

            // Headers
            if (line.startsWith("## ")) {
                flushList();
                elements.push(
                    <h4 key={`h-${i}`} className="font-extrabold text-white text-base mt-6 mb-3 flex items-center gap-2.5 pb-1.5 border-b border-slate-800/80">
                        <span className="w-1.5 h-4.5 rounded-full bg-cyan-400 shrink-0" />
                        <span dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^##\s+/, "")) }} />
                    </h4>
                );
                continue;
            }
            if (line.startsWith("### ")) {
                flushList();
                elements.push(
                    <h5 key={`h-${i}`} className="font-bold text-white text-sm mt-4 mb-2 flex items-center gap-2">
                        <span className="w-1 h-3.5 rounded-full bg-cyan-500/70 shrink-0" />
                        <span dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^###\s+/, "")) }} />
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
                <p key={i} className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
            );
        }
        flushList();

        return elements;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
        >
            {/* AI Avatar Icon */}
            {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-[#080D1A] border border-white/[0.08] flex items-center justify-center text-cyan-400 shrink-0 shadow-sm mt-0.5">
                    <Brain className="w-4 h-4" />
                </div>
            )}

            <div className={cn("max-w-[85%] sm:max-w-[80%] relative group space-y-2")}>
                
                {/* User bubble */}
                {isUser ? (
                    <div className={cn(
                        "rounded-2xl px-4 py-3 border text-sm leading-relaxed",
                        isArabic ? "rounded-tr-sm" : "rounded-tl-sm",
                        "bg-cyan-950/35 border-cyan-500/30 text-cyan-50 backdrop-blur-xl shadow-lg"
                    )}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                ) : (
                    /* AI bubble — authentic liquid glass */
                    <div className={cn(
                        "px-5 py-4 border border-white/[0.09] bg-[#080D1A]/90 backdrop-blur-2xl rounded-2xl text-slate-100 leading-relaxed shadow-xl",
                        isArabic ? "rounded-tl-sm" : "rounded-tr-sm"
                    )}>
                        {displayContent ? (
                            <div className="space-y-1">{renderMarkdown(displayContent)}</div>
                        ) : (
                            /* Streaming: typing indicator */
                            <div className="flex items-center gap-1.5 py-1">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-100" />
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-200" />
                            </div>
                        )}
                    </div>
                )}

                {/* Copy & TTS buttons for AI messages */}
                {!isUser && displayContent && (
                    <div className={cn(
                        "absolute -bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1.5 z-10",
                        isArabic ? "left-2" : "right-2"
                    )}>
                        <VoiceReaderButton text={displayContent} lang={isArabic ? "ar" : "en"} size="xs" />
                        <button
                            onClick={handleCopy}
                            className={cn(
                                "p-1.5 rounded-lg bg-[#0C1324] hover:bg-[#10192F] border border-white/[0.08]",
                                "text-slate-400 hover:text-white shadow-md backdrop-blur-md"
                            )}
                            title="Copy"
                        >
                            {copied
                                ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                                : <Copy className="w-3.5 h-3.5 text-slate-400" />
                            }
                        </button>
                    </div>
                )}

                {/* Key Points */}
                {!isUser && displayKeyPoints && displayKeyPoints.length > 0 && (
                    <div className="mt-3.5 rounded-xl border border-white/[0.08] bg-[#0C1324]/80 backdrop-blur-xl p-4 space-y-2.5 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{isArabic ? "أهم النقاط السريرية" : "Key Clinical Takeaways"}</span>
                        </p>
                        <div className="space-y-2">
                            {displayKeyPoints.map((kp, i) => (
                                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-200">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                                    <span className="leading-relaxed">{kp}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Suggested Follow-ups */}
                {!isUser && displayFollowUps && displayFollowUps.length > 0 && onSuggestionClick && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {displayFollowUps.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => onSuggestionClick(s)}
                                className={cn(
                                    "px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5",
                                    "border border-white/[0.08] bg-[#080D1A]/80 backdrop-blur-xl shadow-sm",
                                    "text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-[#0C1324]/90"
                                )}
                            >
                                <span>{s}</span>
                                <ArrowRight className={cn("w-3 h-3 text-cyan-400 shrink-0 transition-transform group-hover:translate-x-0.5", isArabic && "rotate-180")} />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
