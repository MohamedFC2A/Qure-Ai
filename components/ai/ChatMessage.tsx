"use client";

import { cn } from "@/lib/utils";
import { Copy, Check, Sparkles, User } from "lucide-react";
import { useState } from "react";
import { parseAiResponse } from "@/lib/ai/chat";

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

    // Markdown renderer for AI answers
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
            return s
                .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
                .replace(/\*(.+?)\*/g, '<em class="italic text-slate-300">$1</em>')
                .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded-md bg-slate-800 text-cyan-300 text-xs font-mono border border-slate-700">$1</code>');
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
                    <h4 key={`h-${i}`} className="font-bold text-white text-base mt-4 mb-2 flex items-center gap-2">
                        <span className="w-1 h-4 rounded-full bg-cyan-400 shrink-0" />
                        {line.replace(/^##\s+/, "")}
                    </h4>
                );
                continue;
            }
            if (line.startsWith("### ")) {
                flushList();
                elements.push(
                    <h5 key={`h-${i}`} className="font-semibold text-white text-sm mt-3 mb-1">
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
                <p key={`p-${i}`} className="text-sm leading-relaxed my-1 text-slate-200"
                    dangerouslySetInnerHTML={{ __html: formatInline(line) }}
                />
            );
        }
        flushList();

        return elements;
    };

    return (
        <div className={cn(
            "flex gap-3 items-start w-full",
            isUser ? "flex-row-reverse" : "flex-row",
            isUser ? "animate-chat-in-right" : "animate-chat-in-left"
        )}>
            {/* Avatar */}
            {isUser ? (
                <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center mt-0.5 bg-slate-800 border border-slate-700">
                    <User className="w-4 h-4 text-slate-400" />
                </div>
            ) : (
                <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center mt-0.5 bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                    <Sparkles className="w-4 h-4" />
                </div>
            )}

            {/* Message Bubble */}
            <div className={cn(
                "group relative",
                isUser
                    ? "max-w-[85%] sm:max-w-[75%]"
                    : "max-w-[92%] sm:max-w-[85%]"
            )}>
                {isUser ? (
                    /* User bubble — crisp, dark cyan-tinted border */
                    <div className={cn(
                        "rounded-2xl px-4 py-3 border text-sm leading-relaxed",
                        isArabic ? "rounded-tr-sm" : "rounded-tl-sm",
                        "bg-cyan-950/40 border-cyan-800/40 text-cyan-50"
                    )}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                ) : (
                    /* AI bubble — crisp, dark slate card with clean border */
                    <div className={cn(
                        "px-5 py-4 border border-slate-800 bg-slate-900/90 rounded-2xl text-slate-100 leading-relaxed shadow-sm",
                        isArabic ? "rounded-tl-sm" : "rounded-tr-sm"
                    )}>
                        {displayContent ? (
                            <div className="space-y-1">{renderMarkdown(displayContent)}</div>
                        ) : (
                            /* Streaming: typing indicator */
                            <div className="flex items-center gap-1.5 py-1">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-150" />
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-300" />
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
                            "p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700",
                            "text-slate-400 hover:text-white"
                        )}
                        title="Copy"
                    >
                        {copied
                            ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                            : <Copy className="w-3.5 h-3.5 text-slate-400" />
                        }
                    </button>
                )}

                {/* Key Points */}
                {!isUser && displayKeyPoints && displayKeyPoints.length > 0 && (
                    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                            {isArabic ? "النقاط الرئيسية" : "Key Points"}
                        </p>
                        {displayKeyPoints.map((kp, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                                <span className="text-cyan-400 shrink-0 mt-0.5">•</span>
                                <span className="leading-relaxed">{kp}</span>
                            </div>
                        ))}
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
                                    "px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all",
                                    "border border-slate-800 bg-slate-900/80",
                                    "text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-950/20"
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
