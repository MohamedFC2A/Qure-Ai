"use client";

import { cn } from "@/lib/utils";
import { Clock, Trash2, Pill, HeartPulse, Brain, X, MessageSquare } from "lucide-react";
import type { AiChatMode } from "@/lib/ai/chat";

/* ──────────────────────────────────────────────────────────
 *  ConversationSidebar – list of past AI conversations
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
    isArabic: boolean;
    isOpen: boolean;
    onClose: () => void;
}

const modeIcons: Record<AiChatMode, React.ElementType> = {
    health: HeartPulse,
    medication: Pill,
    context: Brain,
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
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 bottom-0 z-50 w-72 flex flex-col transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0",
                    "border-r border-white/[0.06]",
                    isArabic ? "right-0 lg:border-r-0 lg:border-l" : "left-0",
                    isOpen
                        ? "translate-x-0"
                        : isArabic
                            ? "translate-x-full lg:translate-x-0"
                            : "-translate-x-full lg:translate-x-0"
                )}
                style={{ background: "rgba(6,9,14,0.95)" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-500" />
                        {isArabic ? "المحادثات" : "Conversations"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-500"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto py-2 no-scrollbar">
                    {conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                            <MessageSquare className="w-8 h-8 text-slate-700 mb-3" />
                            <p className="text-xs text-slate-600">
                                {isArabic ? "لا توجد محادثات بعد" : "No conversations yet"}
                            </p>
                        </div>
                    ) : (
                        grouped.map((group) => (
                            <div key={group.label}>
                                <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-700">
                                    {group.label}
                                </p>
                                {group.items.map((conv) => {
                                    const isActive = conv.id === activeConversationId;
                                    const Icon = modeIcons[conv.mode];

                                    // Static class maps per mode for Tailwind
                                    const activeClasses: Record<AiChatMode, string> = {
                                        health: "bg-cyan-400/8 border-cyan-400/15",
                                        medication: "bg-emerald-400/8 border-emerald-400/15",
                                        context: "bg-violet-400/8 border-violet-400/15",
                                    };
                                    const activeIconClasses: Record<AiChatMode, string> = {
                                        health: "bg-cyan-400/15 text-cyan-300",
                                        medication: "bg-emerald-400/15 text-emerald-300",
                                        context: "bg-violet-400/15 text-violet-300",
                                    };

                                    return (
                                        <div
                                            key={conv.id}
                                            className={cn(
                                                "group flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition-all mx-1.5 rounded-xl",
                                                isActive
                                                    ? activeClasses[conv.mode]
                                                    : "hover:bg-white/[0.03] border border-transparent"
                                            )}
                                            onClick={() => onSelect(conv)}
                                        >
                                            <div className={cn(
                                                "w-7 h-7 rounded-lg shrink-0 flex items-center justify-center",
                                                isActive
                                                    ? activeIconClasses[conv.mode]
                                                    : "bg-white/[0.04] text-slate-600"
                                            )}>
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    "text-xs font-medium truncate",
                                                    isActive ? "text-white" : "text-slate-400"
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
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-400/10 text-slate-700 hover:text-red-400 transition-all"
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
            </aside>
        </>
    );
}
