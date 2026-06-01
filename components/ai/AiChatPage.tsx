"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Send, Mic, MicOff, Menu, Lock, Sparkles, Zap,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/Button";
import { type AiChatMode, AI_CHAT_MODES, getModeConfig } from "@/lib/ai/chat";
import { ModeSelector } from "./ModeSelector";
import { ChatMessage, type ChatMessageData } from "./ChatMessage";
import { ConversationSidebar, type ConversationSummary } from "./ConversationSidebar";
import { MedicationSelect } from "./MedicationSelect";

/* ──────────────────────────────────────────────────────────
 *  AiChatPage – Full-page Nexus AI chat experience
 * ────────────────────────────────────────────────────────── */

export function AiChatPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, plan, credits, loading } = useUser();
    const { resultsLanguage } = useSettings();
    const supabase = useMemo(() => createClient(), []);

    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    // ── State ──
    const [mode, setMode] = useState<AiChatMode>(
        (searchParams.get("mode") as AiChatMode) || "health"
    );
    const [messages, setMessages] = useState<ChatMessageData[]>([]);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedMedication, setSelectedMedication] = useState<any>(null);
    const [isListening, setIsListening] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // ── Load conversations list ──
    const loadConversations = useCallback(async () => {
        try {
            const res = await fetch("/api/ai/conversations");
            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations || []);
            }
        } catch (e) {
            console.error("Failed to load conversations:", e);
        }
    }, []);

    useEffect(() => {
        if (user) loadConversations();
    }, [user, loadConversations]);

    // ── Load messages for a conversation ──
    const loadConversation = useCallback(async (convId: string) => {
        try {
            const res = await fetch(`/api/ai/conversations/${convId}/messages?limit=100`);
            if (res.ok) {
                const data = await res.json();
                setActiveConversationId(convId);
                setMessages(
                    (data.messages || []).map((m: any) => ({
                        id: m.id,
                        role: m.role,
                        content: m.content,
                        keyPoints: m.metadata?.keyPoints || [],
                        suggestedFollowUps: m.metadata?.suggestedFollowUps || [],
                        created_at: m.created_at,
                    }))
                );
                // Set mode from conversation
                if (data.conversation?.mode) {
                    setMode(data.conversation.mode);
                }
            }
        } catch (e) {
            console.error("Failed to load conversation:", e);
        }
    }, []);

    // ── Handle URL params for medication context ──
    useEffect(() => {
        const medParam = searchParams.get("medication");
        if (medParam) {
            try {
                const parsed = JSON.parse(decodeURIComponent(medParam));
                setSelectedMedication(parsed);
                setMode("medication");
            } catch { /* ignore */ }
        }
    }, [searchParams]);

    // ── Auto-scroll ──
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ── Send message ──
    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isSending) return;

        const userMessage: ChatMessageData = {
            id: `temp-${Date.now()}`,
            role: "user",
            content: text.trim(),
            created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsSending(true);
        setError(null);

        try {
            // Build message history for context (last 20 messages)
            const history = [...messages, userMessage].slice(-20).map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode,
                    question: text.trim(),
                    conversationId: activeConversationId,
                    messageHistory: history.slice(0, -1), // exclude last (current question)
                    language: isArabic ? "ar" : "en",
                    medicationData: mode === "medication" && selectedMedication?.analysis_json
                        ? selectedMedication.analysis_json
                        : undefined,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                if (res.status === 402) {
                    setError(t("Ultra plan required", "يلزم الاشتراك Ultra"));
                } else if (res.status === 401) {
                    setError(t("Please log in", "يرجى تسجيل الدخول"));
                } else {
                    setError(errData.error || t("Failed to get answer", "فشل في الحصول على إجابة"));
                }
                return;
            }

            const data = await res.json();

            const assistantMessage: ChatMessageData = {
                id: `temp-${Date.now()}-ai`,
                role: "assistant",
                content: data.answer || "",
                keyPoints: data.keyPoints || [],
                suggestedFollowUps: data.suggestedFollowUps || [],
                created_at: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, assistantMessage]);

            // Update active conversation ID if new
            if (data.conversationId && data.conversationId !== activeConversationId) {
                setActiveConversationId(data.conversationId);
                loadConversations(); // refresh sidebar
            }
        } catch (e: any) {
            console.error("Chat error:", e);
            setError(t("Network error — please try again", "خطأ في الشبكة — يرجى المحاولة مرة أخرى"));
        } finally {
            setIsSending(false);
        }
    }, [isSending, messages, activeConversationId, mode, isArabic, selectedMedication, t, loadConversations]);

    // ── Voice input ──
    const toggleVoice = useCallback(() => {
        if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
            return;
        }

        if (isListening) {
            // Stop listening - handled by the recognition instance
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = isArabic ? "ar-SA" : "en-US";
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput((prev) => prev + transcript);
            setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognition.start();
        setIsListening(true);
    }, [isListening, isArabic]);

    // ── Keyboard shortcuts ──
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    }, [sendMessage, input]);

    // ── New chat ──
    const handleNewChat = useCallback(() => {
        setActiveConversationId(null);
        setMessages([]);
        setError(null);
        setSelectedMedication(null);
    }, []);

    // ── Mode change ──
    const handleModeChange = useCallback((newMode: AiChatMode) => {
        if (newMode !== mode) {
            setMode(newMode);
            // Only clear if no active conversation
            if (!activeConversationId) {
                setMessages([]);
                setError(null);
            }
        }
    }, [mode, activeConversationId]);

    // ── Select conversation ──
    const handleSelectConversation = useCallback((conv: ConversationSummary) => {
        loadConversation(conv.id);
        setSidebarOpen(false);
    }, [loadConversation]);

    // ── Delete conversation ──
    const handleDeleteConversation = useCallback(async (id: string) => {
        try {
            await fetch("/api/ai/conversations", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId: id }),
            });
            setConversations((prev) => prev.filter((c) => c.id !== id));
            if (id === activeConversationId) {
                handleNewChat();
            }
        } catch (e) {
            console.error("Failed to delete conversation:", e);
        }
    }, [activeConversationId, handleNewChat]);

    // ── Suggestion click ──
    const handleSuggestionClick = useCallback((text: string) => {
        sendMessage(text);
    }, [sendMessage]);

    const modeConfig = getModeConfig(mode);

    // ── Accent colors for current mode ──
    const accentColor = modeConfig.accentColor;
    const accentMap: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
        cyan: { bg: "bg-cyan-400/10", text: "text-cyan-300", border: "border-cyan-400/20", gradient: "from-cyan-400 to-cyan-600" },
        emerald: { bg: "bg-emerald-400/10", text: "text-emerald-300", border: "border-emerald-400/20", gradient: "from-emerald-400 to-emerald-600" },
        violet: { bg: "bg-violet-400/10", text: "text-violet-300", border: "border-violet-400/20", gradient: "from-violet-400 to-violet-600" },
    };
    const accent = accentMap[accentColor] || accentMap.cyan;

    // ── Loading skeleton ──
    if (loading) {
        return (
            <main className="min-h-screen pt-20 px-4">
                <div className="mx-auto max-w-4xl space-y-4 mt-8">
                    <div className="h-12 skeleton rounded-2xl" />
                    <div className="h-[60vh] skeleton rounded-2xl" />
                    <div className="h-14 skeleton rounded-2xl" />
                </div>
            </main>
        );
    }

    if (!user) return null;

    return (
        <main
            className={cn("min-h-screen pt-20", isArabic ? "font-arabic" : "")}
            dir={isArabic ? "rtl" : "ltr"}
        >
            <div className="flex h-[calc(100vh-5rem)]">
                {/* ── Sidebar ── */}
                <ConversationSidebar
                    conversations={conversations}
                    activeConversationId={activeConversationId}
                    onSelect={handleSelectConversation}
                    onDelete={handleDeleteConversation}
                    isArabic={isArabic}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                {/* ── Main Chat Area ── */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Top bar */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]"
                        style={{ background: "rgba(6,9,14,0.6)" }}
                    >
                        {/* Mobile sidebar toggle */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-lg hover:bg-white/[0.06] text-slate-500"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Mode selector */}
                        <div className="flex-1 overflow-x-auto no-scrollbar">
                            <ModeSelector
                                activeMode={mode}
                                onModeChange={handleModeChange}
                                isArabic={isArabic}
                                hasActiveConversation={!!activeConversationId}
                                onNewChat={handleNewChat}
                            />
                        </div>
                    </div>

                    {/* Medication selector (medication mode only) */}
                    {mode === "medication" && (
                        <div className="px-4 py-3 border-b border-white/[0.04]">
                            <MedicationSelect
                                isArabic={isArabic}
                                onSelect={setSelectedMedication}
                                selected={selectedMedication}
                                onNavigateToScan={() => router.push("/scan")}
                            />
                        </div>
                    )}

                    {/* Messages area */}
                    <div className="flex-1 overflow-y-auto px-4 py-6">
                        <div className="max-w-3xl mx-auto space-y-5">
                            {/* Welcome message when empty */}
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center text-center py-16">
                                    <div className={cn(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center mb-4",
                                        accent.bg, accent.border, "border"
                                    )}
                                        style={{
                                            background: accentColor === "cyan"
                                                ? "rgba(34,211,238,0.08)"
                                                : accentColor === "emerald"
                                                    ? "rgba(52,211,153,0.08)"
                                                    : "rgba(167,139,250,0.08)",
                                        }}
                                    >
                                        <Sparkles className={cn("w-7 h-7", accent.text)} />
                                    </div>
                                    <h2 className="text-lg font-bold text-white mb-2">
                                        {isArabic ? `اسأل ${"`"}NEXUS AI${"`"} anything` : `Ask NEXUS AI anything`}
                                    </h2>
                                    <p className="text-sm text-slate-500 max-w-md">
                                        {mode === "health" && t(
                                            "Ask about health, nutrition, exercise, sleep, wellness — anything about your wellbeing.",
                                            "اسأل عن الصحة، التغذية، الرياضة، النوم، العافية — أي شيء عن صحتك."
                                        )}
                                        {mode === "medication" && t(
                                            "Ask about any medication — side effects, alternatives, drug interactions, dosage guidelines.",
                                            "اسأل عن أي دواء — آثار جانبية، بدائل، تداخلات دوائية، إرشادات الجرعة."
                                        )}
                                        {mode === "context" && t(
                                            "Get personalized health advice based on your profile, medication history, and health data.",
                                            "احصل على نصائح صحية مخصصة بناءً على ملفك وتاريخ أدويتك وبياناتك الصحية."
                                        )}
                                    </p>

                                    {/* Quick starter suggestions */}
                                    <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-lg">
                                        {mode === "health" && [
                                            t("What should I eat for better sleep?", "ماذا آكل لتحسين النوم؟"),
                                            t("Best exercises for back pain?", "أفضل تمارين لآلام الظهر؟"),
                                            t("How to reduce stress naturally?", "كيف أخفف التوتر بشكل طبيعي؟"),
                                            t("Healthy meal plan for weight loss", "خطة وجبات صحية لإنقاص الوزن"),
                                        ].map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => sendMessage(s)}
                                                className="px-3.5 py-2 rounded-xl text-xs border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                        {mode === "medication" && [
                                            t("What are the side effects of Ibuprofen?", "ما هي آثار جانبية الإيبوبروفين؟"),
                                            t("Alternatives to Paracetamol", "بدائل للباراسيتامول"),
                                            t("Can I take vitamin D with antibiotics?", "هل أخذ فيتامين د مع المضادات الحيوية؟"),
                                            t("What foods interact with Warfarin?", "أطعمة تتفاعل مع الوارفارين؟"),
                                        ].map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => sendMessage(s)}
                                                className="px-3.5 py-2 rounded-xl text-xs border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                        {mode === "context" && [
                                            t("Review my medication safety", "راجع سلامة أدويتي"),
                                            t("Nutrition advice based on my conditions", "نصائح غذائية بناءً على حالاتي"),
                                            t("What should I avoid with my allergies?", "ماذا يجب أن أتجنّب مع حساسيتي؟"),
                                            t("Exercise plan for my health profile", "خطة رياضية لملفي الصحي"),
                                        ].map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => sendMessage(s)}
                                                className="px-3.5 py-2 rounded-xl text-xs border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Messages */}
                            {messages.map((msg, idx) => (
                                <ChatMessage
                                    key={msg.id || idx}
                                    message={msg}
                                    isArabic={isArabic}
                                    accentColor={accentColor}
                                    onSuggestionClick={handleSuggestionClick}
                                />
                            ))}

                            {/* Typing indicator */}
                            {isSending && (
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "w-8 h-8 rounded-xl shrink-0 flex items-center justify-center",
                                        accent.bg, accent.border, "border"
                                    )}>
                                        <Sparkles className="w-4 h-4 text-slate-400 animate-pulse" />
                                    </div>
                                    <div className="rounded-2xl px-4 py-3 border border-white/[0.06]"
                                        style={{ background: "var(--q-glass-2)" }}
                                    >
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="flex items-center justify-center">
                                    <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-xs text-red-300">
                                        {error}
                                    </div>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>
                    </div>

                    {/* ── Input Area ── */}
                    <div className="px-4 py-4 border-t border-white/[0.06]"
                        style={{ background: "rgba(6,9,14,0.8)" }}
                    >
                        <div className="max-w-3xl mx-auto">
                            <div className={cn(
                                "flex items-end gap-2 rounded-2xl border px-3 py-2.5 transition-all",
                                "border-white/[0.08] focus-within:border-white/[0.15]",
                                "backdrop-blur-xl"
                            )}
                                style={{ background: "var(--q-glass-2)" }}
                            >
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value.slice(0, 2000))}
                                    onKeyDown={handleKeyDown}
                                    placeholder={
                                        mode === "health"
                                            ? t("Ask about health, nutrition, exercise...", "اسأل عن الصحة، التغذية، الرياضة...")
                                            : mode === "medication"
                                                ? t("Ask about a medication...", "اسأل عن دواء...")
                                                : t("Ask anything — I know your health profile", "اسأل أي شيء — أعرف ملفك الصحي")
                                    }
                                    className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-white placeholder-white/30 resize-none min-h-[40px] max-h-[120px] py-1.5 text-sm leading-relaxed"
                                    disabled={isSending}
                                    dir={isArabic ? "rtl" : "ltr"}
                                    rows={1}
                                />
                                <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
                                    {/* Voice button */}
                                    <button
                                        type="button"
                                        onClick={toggleVoice}
                                        disabled={isSending}
                                        className={cn(
                                            "p-2 rounded-full transition-all",
                                            isListening
                                                ? "bg-red-500/20 text-red-400 animate-pulse"
                                                : "text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
                                        )}
                                        title={t("Voice input", "إدخال صوتي")}
                                    >
                                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                    </button>

                                    {/* Send button */}
                                    <button
                                        type="button"
                                        onClick={() => sendMessage(input)}
                                        disabled={isSending || !input.trim()}
                                        className={cn(
                                            "p-2 rounded-full transition-all",
                                            input.trim()
                                                ? `bg-gradient-to-r ${accent.gradient} text-white shadow-md hover:scale-[1.04]`
                                                : "text-white/20"
                                        )}
                                    >
                                        <Send className={cn("w-4 h-4", isArabic && "rotate-180")} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between px-2 mt-1.5 text-[10px]">
                                <p className="text-white/20">
                                    {t("Enter to send • Shift+Enter for new line", "Enter للإرسال • Shift+Enter لسطر جديد")}
                                </p>
                                <p className={cn(input.length > 1800 ? "text-amber-400" : "text-white/20")}>
                                    {input.length}/2000
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
