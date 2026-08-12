"use client";

import { cn } from "@/lib/utils";
import { Trash2, Pill, HeartPulse, Brain, X, MessageSquare, Plus } from "lucide-react";
import type { AiChatMode } from "@/lib/ai/chat";

/* ──────────────────────────────────────────────────────────
 *  ConversationSidebar – Premium redesign
 * ────────────────────────────────────────────────────────── */

export interface ConversationSummary {
    id: string;
    mode: AiChatMode;
    title: string;
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

interface ConversationSidebarProps {
    conversations: ConversationSummary[];
    activeConversationId: string | null;
    onSelect: (conv: ConversationSummary) => void;
    onDelete: (id: string) => void;
    onNewChat: () => void;
    isArabic: boolean;
    isOpen: boolean;
    onClose: () => void;
}

const modeIcons: Record<AiChatMode, React.ElementType> = {
    health: HeartPulse,
    medication: Pill,
    context: Brain,
};

const modeColors: Record<AiChatMode, { icon: string; bg: string; activeBg: string; activeBorder: string }> = {
    health:     { icon: "text-cyan-400",    bg: "bg-cyan-400/10",    activeBg: "bg-cyan-400/12",    activeBorder: "border-cyan-400/25" },
    medication: { icon: "text-emerald-400", bg: "bg-emerald-400/10", activeBg: "bg-emerald-400/12", activeBorder: "border-emerald-400/25" },
    context:    { icon: "text-violet-400",  bg: "bg-violet-400/10",  activeBg: "bg-violet-400/12",  activeBorder: "border-violet-400/25" },
};

function groupByDate(items: ConversationSummary[], isArabic: boolean): Array<{ label: string; items: ConversationSummary[] }> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const weekAgo = today - 7 * 86400000;

    const groups: Record<string, ConversationSummary[]> = {};

    for (const item of items) {
        const ts = new Date(item.updated_at).getTime();
        let key: string;
        if (ts >= today) key = isArabic ? "اليوم" : "Today";
        else if (ts >= yesterday) key = isArabic ? "أمس" : "Yesterday";
        else if (ts >= weekAgo) key = isArabic ? "هذا الأسبوع" : "This Week";
        else key = isArabic ? "قديم" : "Older";

        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    }

    return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

export function ConversationSidebar({
    conversations,
    activeConversationId,
    onSelect,
    onDelete,
    onNewChat,
    isArabic,
    isOpen,
    onClose,
}: ConversationSidebarProps) {
    const grouped = groupByDate(conversations, isArabic);

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 bottom-0 z-50 w-[min(17rem,85vw)] flex flex-col transition-all duration-300",
                    "lg:static lg:z-auto lg:translate-x-0 lg:w-64",
                    "border-r border-white/[0.06]",
                    isArabic ? "right-0 lg:border-r-0 lg:border-l" : "left-0",
                    isOpen
                        ? "translate-x-0"
                        : isArabic
                            ? "translate-x-full lg:translate-x-0"
                            : "-translate-x-full lg:translate-x-0"
                )}
                style={{ background: "rgba(5, 8, 15, 0.97)" }}
            >
                {/* Top accent line */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

                {/* Header */}
                <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.05]">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-cyan-500/10 border border-cyan-400/30 text-cyan-400">
                        <Brain className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white leading-none">Aura-OS Ai</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{isArabic ? "محادثات AOS AI" : "AOS AI Chats"}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* New Chat Button */}
                <div className="px-3 pt-3 pb-2">
                    <button
                        onClick={() => { onNewChat(); onClose(); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.14] text-slate-400 hover:text-white text-xs font-semibold transition-all group"
                    >
                        <Plus className="w-3.5 h-3.5 transition-transform group-hover:rotate-90 duration-200" />
                        <span>{isArabic ? "محادثة جديدة" : "New Chat"}</span>
                    </button>
                </div>

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto py-1 no-scrollbar">
                    {conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 text-center px-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-3">
                                <MessageSquare className="w-5 h-5 text-slate-700" />
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                {isArabic ? "لا توجد محادثات بعد.\nابدأ بسؤال جديد!" : "No conversations yet.\nAsk your first question!"}
                            </p>
                        </div>
                    ) : (
                        grouped.map((group) => (
                            <div key={group.label}>
                                <p className="px-4 pt-3 pb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-700">
                                    {group.label}
                                </p>
                                {group.items.map((conv) => {
                                    const isActive = conv.id === activeConversationId;
                                    const Icon = modeIcons[conv.mode];
                                    const colors = modeColors[conv.mode];

                                    return (
                                        <div
                                            key={conv.id}
                                            className={cn(
                                                "group flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-all mx-2 rounded-xl border mb-0.5",
                                                isActive
                                                    ? cn(colors.activeBg, colors.activeBorder)
                                                    : "hover:bg-white/[0.04] border-transparent hover:border-white/[0.06]"
                                            )}
                                            onClick={() => onSelect(conv)}
                                        >
                                            <div className={cn(
                                                "w-7 h-7 rounded-lg shrink-0 flex items-center justify-center transition-all",
                                                isActive ? colors.bg : "bg-white/[0.04]"
                                            )}>
                                                <Icon className={cn(
                                                    "w-3.5 h-3.5 transition-colors",
                                                    isActive ? colors.icon : "text-slate-700"
                                                )} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    "text-xs font-medium truncate leading-snug",
                                                    isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                                                )}>
                                                    {conv.title}
                                                </p>
                                                <p className="text-[10px] text-slate-700 mt-0.5">
                                                    {new Date(conv.updated_at).toLocaleDateString(
                                                        isArabic ? "ar-SA" : "en-US",
                                                        { month: "short", day: "numeric" }
                                                    )}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(conv.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/15 text-slate-700 hover:text-red-400 transition-all shrink-0"
                                                title={isArabic ? "حذف" : "Delete"}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Bottom footer */}
                <div className="px-4 py-3 border-t border-white/[0.04]">
                    <p className="text-[9px] text-slate-800 text-center font-medium tracking-wide uppercase">
                        Powered by QureScan
                    </p>
                </div>
            </aside>
        </>
    );
}
