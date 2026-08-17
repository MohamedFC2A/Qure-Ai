"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Trash2, Pill, HeartPulse, Brain, X, MessageSquare, Plus, Bandage, Search } from "lucide-react";
import type { AiChatMode } from "@/lib/ai/chat";

/* ──────────────────────────────────────────────────────────
 *  ConversationSidebar – Native Slide-Over Drawer & Desktop Sidebar
 *  Matte Clinical Style • Zero Glow • Real-time Instant Search
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
    wound: Bandage,
    context: Brain,
};

const modeColors: Record<AiChatMode, { icon: string; bg: string; activeBg: string; activeBorder: string }> = {
    health:     { icon: "text-cyan-400",    bg: "bg-cyan-500/10",    activeBg: "bg-cyan-500/15",    activeBorder: "border-cyan-500/30" },
    medication: { icon: "text-cyan-300",    bg: "bg-cyan-500/10",    activeBg: "bg-cyan-500/15",    activeBorder: "border-cyan-500/30" },
    wound:      { icon: "text-emerald-400", bg: "bg-emerald-500/10", activeBg: "bg-emerald-500/15", activeBorder: "border-emerald-500/30" },
    context:    { icon: "text-violet-400",  bg: "bg-violet-500/10",  activeBg: "bg-violet-500/15",  activeBorder: "border-violet-500/30" },
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
        else key = isArabic ? "سابقاً" : "Older";

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
    const [searchQuery, setSearchQuery] = useState("");

    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        const q = searchQuery.toLowerCase().trim();
        return conversations.filter((c) => (c.title || "").toLowerCase().includes(q));
    }, [conversations, searchQuery]);

    const grouped = useMemo(() => {
        return groupByDate(filteredConversations, isArabic);
    }, [filteredConversations, isArabic]);

    return (
        <>
            {/* Mobile / Tablet Slide-over Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 lg:hidden transition-opacity duration-300 animate-fade-in"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Drawer */}
            <aside
                className={cn(
                    "fixed inset-y-0 z-50 flex flex-col backdrop-blur-2xl transition-transform duration-300 ease-out border-r border-white/[0.08] shadow-2xl",
                    isArabic ? "right-0 border-r-0 border-l border-white/[0.08]" : "left-0",
                    isOpen
                        ? "translate-x-0 w-80 max-w-[85vw] opacity-100 pointer-events-auto lg:static lg:z-auto lg:shrink-0 lg:w-72 lg:max-w-none"
                        : isArabic
                            ? "translate-x-full w-80 opacity-0 pointer-events-none lg:w-0 lg:overflow-hidden lg:border-none lg:p-0 lg:pointer-events-none"
                            : "-translate-x-full w-80 opacity-0 pointer-events-none lg:w-0 lg:overflow-hidden lg:border-none lg:p-0 lg:pointer-events-none"
                )}
                style={{ background: "#080D1A" }}
                dir={isArabic ? "rtl" : "ltr"}
            >
                {/* Header with Brand & Close Button */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06] shrink-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-display font-black text-xs select-none">
                        Qure
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white leading-none tracking-tight">Qure AI</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">{isArabic ? "سجل الاستشارات والمحادثات" : "Consultation History"}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/[0.06] active:bg-white/[0.10] text-slate-400 hover:text-white transition-colors cursor-pointer touch-manipulation"
                        title={isArabic ? "إغلاق السجل" : "Close drawer"}
                        aria-label={isArabic ? "إغلاق السجل" : "Close drawer"}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sticky Controls: New Chat & Instant Search */}
                <div className="p-3 space-y-2 border-b border-white/[0.06] shrink-0 bg-[#080D1A]">
                    {/* Primary New Chat Button (Solid Matte High-Contrast) */}
                    <button
                        type="button"
                        onClick={() => {
                            onNewChat();
                            if (typeof window !== "undefined" && window.innerWidth < 1024) {
                                onClose();
                            }
                        }}
                        className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.98] text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-sm touch-manipulation"
                    >
                        <Plus className="w-4 h-4 text-slate-950 font-bold" />
                        <span>{isArabic ? "محادثة سريرية جديدة" : "New Clinical Chat"}</span>
                    </button>

                    {/* Instant Search Bar */}
                    <div className="relative flex items-center">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute start-3 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={isArabic ? "بحث في المحادثات..." : "Search conversations..."}
                            className="w-full h-9 rounded-xl bg-[#0C1324] border border-white/[0.08] focus:border-cyan-500/40 text-xs text-white placeholder:text-slate-500 outline-none ps-9 pe-8 transition-colors"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute end-2.5 p-1 rounded-md text-slate-400 hover:text-white cursor-pointer"
                                aria-label={isArabic ? "مسح البحث" : "Clear search"}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto py-2 px-1 scrollbar-thin">
                    {conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 text-center px-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-3">
                                <MessageSquare className="w-5 h-5 text-slate-600" />
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                {isArabic ? "لا توجد محادثات سابقة.\nابدأ استشارتك الأولى الآن!" : "No conversations yet.\nStart your first consultation!"}
                            </p>
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                            <p className="text-xs text-slate-500">
                                {isArabic ? "لم يتم العثور على نتائج للبحث" : "No matching conversations found"}
                            </p>
                        </div>
                    ) : (
                        grouped.map((group) => (
                            <div key={group.label} className="mb-3">
                                <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    {group.label}
                                </p>
                                {group.items.map((conv) => {
                                    const isActive = conv.id === activeConversationId;
                                    const Icon = modeIcons[conv.mode] || HeartPulse;
                                    const colors = modeColors[conv.mode] || modeColors.health;

                                    return (
                                        <div
                                            key={conv.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => onSelect(conv)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    onSelect(conv);
                                                }
                                            }}
                                            className={cn(
                                                "group flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-all rounded-xl border mb-1 min-h-[44px] touch-manipulation",
                                                isActive
                                                    ? cn(colors.activeBg, colors.activeBorder)
                                                    : "hover:bg-white/[0.04] active:bg-white/[0.07] border-transparent hover:border-white/[0.06]"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-7 h-7 rounded-lg shrink-0 flex items-center justify-center transition-all",
                                                isActive ? colors.bg : "bg-white/[0.04]"
                                            )}>
                                                <Icon className={cn(
                                                    "w-3.5 h-3.5 transition-colors",
                                                    isActive ? colors.icon : "text-slate-400"
                                                )} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    "text-xs font-semibold truncate leading-snug",
                                                    isActive ? "text-white" : "text-slate-300 group-hover:text-white"
                                                )}>
                                                    {conv.title || (isArabic ? "محادثة بدون عنوان" : "Untitled Chat")}
                                                </p>
                                                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                                                    {new Date(conv.updated_at).toLocaleDateString(
                                                        isArabic ? "ar-SA" : "en-US",
                                                        { month: "short", day: "numeric" }
                                                    )}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(conv.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all shrink-0 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                                                title={isArabic ? "حذف" : "Delete"}
                                                aria-label={isArabic ? "حذف المحادثة" : "Delete conversation"}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-white/[0.04] bg-[#080D1A] shrink-0">
                    <p className="text-[10px] text-slate-500 text-center font-medium tracking-wide">
                        Qure AI • {isArabic ? "نظام سريري متكامل" : "Clinical Intelligence"}
                    </p>
                </div>
            </aside>
        </>
    );
}
