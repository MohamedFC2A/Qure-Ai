"use client";

import { cn } from "@/lib/utils";
import { Copy, Check, Lightbulb } from "lucide-react";
import { useState } from "react";

/* ──────────────────────────────────────────────────────────
 *  ChatMessage – single chat bubble
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

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.content);
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
                    <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 my-2 text-sm">
                        {listItems.map((item, i) => (
                            <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
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
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 text-xs font-mono">$1</code>');
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
                    <h4 key={`h-${i}`} className="font-bold text-white text-sm mt-3 mb-1">
                        {line.replace(/^##\s+/, "")}
                    </h4>
                );
                continue;
            }
            if (line.startsWith("### ")) {
                flushList();
                elements.push(
                    <h5 key={`h-${i}`} className="font-semibold text-white/90 text-xs mt-2 mb-1">
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
                <p key={`p-${i}`} className="text-sm leading-relaxed my-1"
                    dangerouslySetInnerHTML={{ __html: formatInline(line) }}
                />
            );
        }
        flushList();

        return elements;
    };

    // Static class maps for Tailwind (avoids dynamic class purging)
    const avatarClasses: Record<string, string> = {
        cyan: "bg-cyan-400/15 text-cyan-300 border-cyan-400/20",
        emerald: "bg-emerald-400/15 text-emerald-300 border-emerald-400/20",
        violet: "bg-violet-400/15 text-violet-300 border-violet-400/20",
    };
    const userBubbleClasses: Record<string, string> = {
        cyan: "bg-cyan-500/15 border-cyan-400/20 text-white",
        emerald: "bg-emerald-500/15 border-emerald-400/20 text-white",
        violet: "bg-violet-500/15 border-violet-400/20 text-white",
    };

    return (
        <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
            {/* Avatar */}
            {!isUser && (
                <div className={cn(
                    "w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-black mt-0.5 border",
                    avatarClasses[accentColor] || avatarClasses.cyan
                )}
                    style={{
                        background: `var(--q-glass-2)`,
                    }}
                >
                    <Lightbulb className="w-4 h-4" />
                </div>
            )}

            {/* Message Bubble */}
            <div className={cn(
                "group relative max-w-[85%] sm:max-w-[75%]",
                isUser ? "ml-auto" : "mr-auto"
            )}>
                <div className={cn(
                    "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    isUser
                        ? userBubbleClasses[accentColor] || userBubbleClasses.cyan
                        : "border border-white/[0.07] text-white/85",
                    isUser ? (isArabic ? "rounded-tr-md" : "rounded-tl-md") : (isArabic ? "rounded-tl-md" : "rounded-tr-md")
                )}
                    style={!isUser ? { background: "var(--q-glass-2)" } : undefined}
                >
                    {isUser ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                        <div className="space-y-0.5">{renderMarkdown(message.content)}</div>
                    )}
                </div>

                {/* Copy button for AI messages */}
                {!isUser && (
                    <button
                        onClick={handleCopy}
                        className={cn(
                            "absolute -bottom-3 opacity-0 group-hover:opacity-100 transition-opacity",
                            isArabic ? "left-2" : "right-2",
                            "p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08]"
                        )}
                        title="Copy"
                    >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                    </button>
                )}

                {/* Key Points (only for assistant messages with keyPoints) */}
                {!isUser && message.keyPoints && message.keyPoints.length > 0 && (
                    <div className="mt-3 rounded-xl border border-white/[0.06] p-3 space-y-1.5"
                        style={{ background: "rgba(255,255,255,0.02)" }}
                    >
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            {isArabic ? "نقاط رئيسية" : "Key Points"}
                        </p>
                        {message.keyPoints.map((kp, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-white/70">
                                <span className="text-amber-400 shrink-0 mt-0.5">•</span>
                                <span>{kp}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Suggested Follow-ups */}
                {!isUser && message.suggestedFollowUps && message.suggestedFollowUps.length > 0 && onSuggestionClick && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {message.suggestedFollowUps.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => onSuggestionClick(s)}
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                                    "border border-white/[0.08] hover:border-white/20",
                                    "text-white/60 hover:text-white hover:bg-white/[0.06]"
                                )}
                                style={{ background: "var(--q-glass-1)" }}
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
