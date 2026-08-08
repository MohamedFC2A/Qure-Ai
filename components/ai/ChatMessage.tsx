"use client";

import { cn } from "@/lib/utils";
import { Copy, Check, Sparkles, User } from "lucide-react";
import { useState } from "react";
import { parseAiResponse } from "@/lib/ai/chat";

/* ──────────────────────────────────────────────────────────
 *  ChatMessage – Premium redesign with gradient bubbles
 * ────────────────────────────────────────────────────────── */

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

    // Simple markdown renderer for AI answers
    const renderMarkdown = (text: string) => {
        const lines = text.split("\n");
        const elements: React.ReactNode[] = [];
        let inList = false;
        let listItems: string[] = [];

        const flushList = () => {
            if (listItems.length > 0) {
                elements.push(
                    <ul key={`ul-${elements.length}`} className="list-none space-y-1.5 my-2.5">
                        {listItems.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400/70 shrink-0" />
                                <span className="text-sm leading-relaxed text-white/85" dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
                            </li>
                        ))}
                    </ul>
                );
                listItems = [];
                inList = false;
            }
        };

        const formatInline = (s: string): string => {
            return s
                .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
                .replace(/\*(.+?)\*/g, '<em class="italic text-white/90">$1</em>')
                .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded-md bg-white/8 text-amber-300/90 text-xs font-mono border border-white/10">$1</code>');
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (!line) {
                flushList();
                continue;
            }

            // Headers
            if (line.startsWith("## ")) {
                flushList();
                elements.push(
                    <h4 key={`h-${i}`} className="font-bold text-white text-sm mt-4 mb-1.5 flex items-center gap-2">
                        <span className="w-1 h-4 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 shrink-0" />
                        {line.replace(/^##\s+/, "")}
                    </h4>
                );
                continue;
            }
            if (line.startsWith("### ")) {
                flushList();
                elements.push(
                    <h5 key={`h-${i}`} className="font-semibold text-white/90 text-xs mt-3 mb-1">
                        {line.replace(/^###\s+/, "")}
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
                <p key={`p-${i}`} className="text-sm leading-relaxed my-1 text-white/85"
                    dangerouslySetInnerHTML={{ __html: formatInline(line) }}
                />
            );
        }
        flushList();

        return elements;
    };

    // User bubble gradient by accent
    const userBg: Record<string, string> = {
        cyan:    "bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border-cyan-400/25",
        emerald: "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-400/25",
        violet:  "bg-gradient-to-br from-violet-500/20 to-violet-600/10 border-violet-400/25",
    };

    const suggestionBorder: Record<string, string> = {
        cyan:    "hover:border-cyan-400/30 hover:text-cyan-300",
        emerald: "hover:border-emerald-400/30 hover:text-emerald-300",
        violet:  "hover:border-violet-400/30 hover:text-violet-300",
    };

    return (
        <div className={cn(
            "flex gap-3 items-start w-full",
            isUser ? "flex-row-reverse" : "flex-row",
            isUser ? "animate-chat-in-right" : "animate-chat-in-left"
        )}>
            {/* Avatar */}
            {isUser ? (
                <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center mt-0.5 bg-white/[0.07] border border-white/10">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                </div>
            ) : (
                <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center mt-0.5 nexus-gold-logo">
                    <Sparkles className="w-3.5 h-3.5" style={{ color: "#1a0e00" }} />
                </div>
            )}

            {/* Message Bubble */}
            <div className={cn(
                    "group relative",
                    isUser
                        ? "max-w-[85%] sm:max-w-[72%]"
                        : "max-w-[90%] sm:max-w-[82%]"
                )}>
                {isUser ? (
                    /* User bubble — flat, bordered */
                    <div className={cn(
                        "rounded-2xl px-4 py-3 border",
                        isArabic ? "rounded-tr-sm" : "rounded-tl-sm",
                        "bg-white/[0.07] border-white/[0.10] text-white"
                    )}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                ) : (
                    /* AI bubble — clean, no pseudo-element */
                    <div className={cn(
                        "ai-bubble px-4 py-3.5",
                        isArabic ? "rounded-tl-sm" : "rounded-tr-sm"
                    )}>
                        {displayContent ? (
                            <div className="space-y-0.5">{renderMarkdown(displayContent)}</div>
                        ) : (
                            /* Streaming: typing dots */
                            <div className="flex items-center gap-1.5 py-1">
                                <span className="typing-dot" />
                                <span className="typing-dot" />
                                <span className="typing-dot" />
                            </div>
                        )}
                    </div>
                )}

                {/* Copy button for AI messages */}
                {!isUser && displayContent && (
                    <button
                        onClick={handleCopy}
                        className={cn(
                            "absolute -bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-200",
                            isArabic ? "left-2" : "right-2",
                            "p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08]",
                            "backdrop-blur-sm"
                        )}
                        title="Copy"
                    >
                        {copied
                            ? <Check className="w-3 h-3 text-emerald-400" />
                            : <Copy className="w-3 h-3 text-slate-500" />
                        }
                    </button>
                )}

                {/* Key Points */}
                {!isUser && displayKeyPoints && displayKeyPoints.length > 0 && (
                    <div className="mt-3 rounded-xl border border-amber-400/15 p-3.5 space-y-2"
                        style={{ background: "rgba(212, 168, 67, 0.04)" }}
                    >
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-500/70 mb-2 flex items-center gap-1.5">
                            <span className="w-3 h-px bg-amber-400/40" />
                            {isArabic ? "نقاط رئيسية" : "Key Points"}
                            <span className="w-3 h-px bg-amber-400/40" />
                        </p>
                        {displayKeyPoints.map((kp, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-xs text-white/75">
                                <span className="text-amber-400/80 shrink-0 mt-0.5 text-[10px]">◆</span>
                                <span className="leading-relaxed">{kp}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Suggested Follow-ups */}
                {!isUser && displayFollowUps && displayFollowUps.length > 0 && onSuggestionClick && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {displayFollowUps.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => onSuggestionClick(s)}
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                                    "border border-white/[0.07] bg-white/[0.03]",
                                    "text-white/50 hover:text-white hover:bg-white/[0.06]",
                                    suggestionBorder[accentColor] || suggestionBorder.cyan
                                )}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
