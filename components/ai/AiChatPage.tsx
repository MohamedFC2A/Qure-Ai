"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Send, Mic, MicOff, Menu, Sparkles, RotateCcw, ArrowUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { type AiChatMode, getModeConfig } from "@/lib/ai/chat";
import { ModeSelector } from "./ModeSelector";
import { ChatMessage, type ChatMessageData } from "./ChatMessage";
import { ConversationSidebar, type ConversationSummary } from "./ConversationSidebar";
import { MedicationSelect } from "./MedicationSelect";

/* ──────────────────────────────────────────────────────────
 *  AiChatPage – Full-page MATANY AI chat (Premium Redesign)
 * ────────────────────────────────────────────────────────── */

const QUICK_PROMPTS: Record<AiChatMode, { en: string; ar: string }[]> = {
    health: [
        { en: "Best exercises for back pain?", ar: "أفضل تمارين لآلام الظهر؟" },
        { en: "How to sleep better naturally?", ar: "كيف أحسّن نومي بشكل طبيعي؟" },
        { en: "Foods that boost immunity", ar: "أطعمة تعزز المناعة" },
        { en: "How to reduce stress fast?", ar: "كيف أخفف التوتر بسرعة؟" },
    ],
    medication: [
        { en: "Side effects of Ibuprofen?", ar: "ما هي آثار جانبية الإيبوبروفين؟" },
        { en: "Alternatives to Paracetamol", ar: "بدائل للباراسيتامول" },
        { en: "Can I take vitamin D with antibiotics?", ar: "هل يمكن أخذ فيتامين د مع مضادات الحيوية؟" },
        { en: "Foods that interact with Warfarin", ar: "أطعمة تتفاعل مع الوارفارين" },
    ],
    context: [
        { en: "Review my medication safety", ar: "راجع سلامة أدويتي" },
        { en: "Nutrition advice for my conditions", ar: "نصائح غذائية لحالتي الصحية" },
        { en: "Exercise plan for my health profile", ar: "خطة رياضية بناءً على ملفي" },
        { en: "What should I avoid with my allergies?", ar: "ماذا أتجنّب بسبب حساسيتي؟" },
    ],
};

export function AiChatPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading } = useUser();
    const { resultsLanguage } = useSettings();
    const supabase = useMemo(() => createClient(), []);

    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    /* ── State ── */
    const [mode, setMode] = useState<AiChatMode>(
        (searchParams.get("mode") as AiChatMode) || "health"
    );
    const [messages, setMessages] = useState<ChatMessageData[]>([]);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedMedication, setSelectedMedication] = useState<any>(null);
    const [isListening, setIsListening] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    /* ── Load conversations ── */
    const loadConversations = useCallback(async () => {
        try {
            const res = await fetch("/api/ai/conversations");
            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations || []);
            }
        } catch (e) { console.error("Failed to load conversations:", e); }
    }, []);

    useEffect(() => { if (user) loadConversations(); }, [user, loadConversations]);

    /* ── Load a conversation's messages ── */
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
                if (data.conversation?.mode) setMode(data.conversation.mode);
                setAutoScroll(true);
                setTimeout(() => chatEndRef.current?.scrollIntoView(), 100);
            }
        } catch (e) { console.error("Failed to load conversation:", e); }
    }, []);

    /* ── Handle URL params ── */
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

    /* ── Auto-scroll only when user is near bottom ── */
    useEffect(() => {
        if (!autoScroll) return;
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isStreaming, autoScroll]);

    /* ── Track scroll position to toggle auto-scroll ── */
    const handleScroll = useCallback(() => {
        const container = chatContainerRef.current;
        if (!container) return;
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        setAutoScroll(distanceFromBottom < 200);
    }, []);

    /* ── STREAMING send message ── */
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
        setIsStreaming(true);
        setError(null);
        setAutoScroll(true);

        // Auto-resize textarea back
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
        }

        const assistantId = `stream-${Date.now()}`;
        const placeholder: ChatMessageData = {
            id: assistantId,
            role: "assistant",
            content: "",
            keyPoints: [],
            suggestedFollowUps: [],
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, placeholder]);

        try {
            const history = [...messages, userMessage].slice(-20).map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const res = await fetch("/api/ai/chat/stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode,
                    question: text.trim(),
                    conversationId: activeConversationId,
                    messageHistory: history.slice(0, -1),
                    language: isArabic ? "ar" : "en",
                    medicationData: mode === "medication" && selectedMedication?.analysis_json
                        ? selectedMedication.analysis_json
                        : undefined,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                setMessages((prev) => prev.filter((m) => m.id !== assistantId));
                if (res.status === 402) setError(t("Ultra plan required", "يلزم الاشتراك Ultra"));
                else if (res.status === 401) setError(t("Please log in", "يرجى تسجيل الدخول"));
                else setError(errData.error || t("Failed to get answer", "فشل في الحصول على إجابة"));
                return;
            }

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let streamedContent = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        if (!line.startsWith("data: ")) continue;
                        const jsonStr = line.slice(6).trim();
                        if (!jsonStr) continue;

                        try {
                            const event = JSON.parse(jsonStr);

                            if (event.type === "token" && event.token) {
                                streamedContent += event.token;
                                setMessages((prev) =>
                                    prev.map((m) =>
                                        m.id === assistantId ? { ...m, content: streamedContent } : m
                                    )
                                );
                            }

                            if (event.type === "done") {
                                setMessages((prev) =>
                                    prev.map((m) =>
                                        m.id === assistantId
                                            ? {
                                                ...m,
                                                content: streamedContent || m.content,
                                                keyPoints: event.keyPoints || [],
                                                suggestedFollowUps: event.suggestedFollowUps || [],
                                            }
                                            : m
                                    )
                                );
                                if (event.conversationId && event.conversationId !== activeConversationId) {
                                    setActiveConversationId(event.conversationId);
                                    loadConversations();
                                }
                            }

                            if (event.type === "error") {
                                setError(event.error || t("Stream error", "خطأ في البث"));
                            }
                        } catch { /* bad JSON, skip */ }
                    }
                }
            }
        } catch (e: any) {
            console.error("Chat error:", e);
            setMessages((prev) => prev.filter((m) => m.id !== assistantId));
            setError(t("Network error — please try again", "خطأ في الشبكة — يرجى المحاولة مرة أخرى"));
        } finally {
            setIsSending(false);
            setIsStreaming(false);
        }
    }, [isSending, messages, activeConversationId, mode, isArabic, selectedMedication, t, loadConversations]);

    /* ── Voice input ── */
    const toggleVoice = useCallback(() => {
        if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
        if (isListening) return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = isArabic ? "ar-SA" : "en-US";
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
            setInput((prev) => prev + event.results[0][0].transcript);
            setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
        setIsListening(true);
    }, [isListening, isArabic]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    }, [sendMessage, input]);

    /* ── Auto-grow textarea ── */
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value.slice(0, 2000));
        const el = e.target;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    }, []);

    const handleNewChat = useCallback(() => {
        setActiveConversationId(null);
        setMessages([]);
        setError(null);
        setSelectedMedication(null);
        setAutoScroll(true);
    }, []);

    const handleModeChange = useCallback((newMode: AiChatMode) => {
        if (newMode !== mode) {
            setMode(newMode);
            if (!activeConversationId) {
                setMessages([]);
                setError(null);
            }
        }
    }, [mode, activeConversationId]);

    const handleSelectConversation = useCallback((conv: ConversationSummary) => {
        loadConversation(conv.id);
        setSidebarOpen(false);
    }, [loadConversation]);

    const handleDeleteConversation = useCallback(async (id: string) => {
        try {
            await fetch("/api/ai/conversations", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId: id }),
            });
            setConversations((prev) => prev.filter((c) => c.id !== id));
            if (id === activeConversationId) handleNewChat();
        } catch (e) { console.error("Failed to delete:", e); }
    }, [activeConversationId, handleNewChat]);

    const handleSuggestionClick = useCallback((text: string) => {
        sendMessage(text);
    }, [sendMessage]);

    const modeConfig = getModeConfig(mode);
    const accentColor = modeConfig.accentColor;

    /* ── Loading ── */
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

    const quickPrompts = QUICK_PROMPTS[mode];

    return (
        <main
            className="fixed inset-0 pt-16 z-40 flex"
            dir={isArabic ? "rtl" : "ltr"}
            style={{ background: "var(--q-base, #040810)" }}
        >
            {/* ── Sidebar ── */}
            <ConversationSidebar
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelect={handleSelectConversation}
                onDelete={handleDeleteConversation}
                onNewChat={handleNewChat}
                isArabic={isArabic}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* ── Main Chat Area ── */}
            <div className="flex-1 flex flex-col min-w-0 relative z-10">

                {/* ── Top Header ── */}
                <div
                    className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.05] shrink-0"
                    style={{ background: "rgba(4,8,16,0.95)", backdropFilter: "blur(16px)" }}
                >
                    {/* Mobile sidebar toggle */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-lg hover:bg-white/[0.05] text-slate-600 hover:text-slate-400 transition-all"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Center: mode indicator */}
                    <div className="flex-1 flex items-center justify-center">
                        <span className="text-xs font-medium text-slate-600">
                            {mode === "health"
                                ? t("Health AI", "الصحة")
                                : mode === "medication"
                                    ? t("Medication", "الدواء")
                                    : t("QureScan Integrated", "المدمج")
                            }
                        </span>
                    </div>

                    {messages.length > 0 && (
                        <button
                            onClick={handleNewChat}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-white/[0.06] text-slate-600 hover:text-white hover:border-white/[0.15] hover:bg-white/[0.04] transition-all"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{isArabic ? "جديد" : "New"}</span>
                        </button>
                    )}
                </div>

                {/* ── Scrollable Messages ── */}
                <div
                    ref={chatContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar"
                >
                    <div className="max-w-2xl mx-auto space-y-6">

                        {/* Welcome (only when empty) */}
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center text-center pt-16 pb-8 animate-fade-in">
                                {/* Clean icon — no glow */}
                                <div className="mb-5">
                                    <div className="ai-orb">
                                        <Sparkles className="w-6 h-6 relative z-10" style={{ color: "#1c1000" }} />
                                    </div>
                                </div>

                                <h2 className="text-xl font-black mb-2 tracking-tight">
                                    <span className="nexus-gold-text">MATANY AI</span>
                                </h2>
                                <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-8">
                                    {mode === "health" && t(
                                        "Ask about health, nutrition, exercise, sleep, and wellness.",
                                        "اسأل عن الصحة، التغذية، الرياضة، النوم، والعافية."
                                    )}
                                    {mode === "medication" && t(
                                        "Ask about medications — side effects, alternatives, drug interactions, dosage.",
                                        "اسأل عن أي دواء — آثار جانبية، بدائل، تداخلات دوائية، جرعات."
                                    )}
                                    {mode === "context" && t(
                                        "Get personalized health advice based on your profile and medication history.",
                                        "احصل على نصائح صحية مخصصة بناءً على ملفك وتاريخ أدويتك."
                                    )}
                                </p>

                                {/* Quick Prompts */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                                    {quickPrompts.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => sendMessage(isArabic ? s.ar : s.en)}
                                            className="px-4 py-3 rounded-2xl text-xs text-start border border-white/[0.07] bg-white/[0.03] text-slate-400 hover:text-white hover:border-white/[0.15] hover:bg-white/[0.06] transition-all leading-relaxed"
                                        >
                                            {isArabic ? s.ar : s.en}
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

                        {/* Error */}
                        {error && (
                            <div className="flex items-center justify-center animate-fade-in">
                                <div className="rounded-2xl border border-red-400/20 bg-red-400/5 px-5 py-3.5 text-xs text-red-300/90 text-center">
                                    {error}
                                </div>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>
                </div>

                {/* ══════════════════════════════════════════════
                 *  PREMIUM INPUT BAR
                 * ══════════════════════════════════════════════ */}
                <div
                    className="shrink-0 px-3 sm:px-6 pt-2 pb-20 sm:pb-4"
                    style={{ background: "rgba(3,7,18,0.94)", backdropFilter: "blur(24px)" }}
                >
                    <div className="max-w-2xl mx-auto space-y-2">
                        {/* Medication selector (medication mode only) */}
                        {mode === "medication" && (
                            <div className="mb-1">
                                <MedicationSelect
                                    isArabic={isArabic}
                                    onSelect={setSelectedMedication}
                                    selected={selectedMedication}
                                    onNavigateToScan={() => router.push("/scan")}
                                />
                            </div>
                        )}

                        {/* Main input container */}
                        <div className="ai-input-container">
                            {/* Mode chips inside the container (top row) */}
                            <div className="flex items-center gap-2 px-4 pt-3 pb-0">
                                <ModeSelector
                                    activeMode={mode}
                                    onModeChange={handleModeChange}
                                    isArabic={isArabic}
                                />
                            </div>

                            {/* Textarea */}
                            <div className="flex items-end gap-2 px-4 pt-2 pb-3">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder={
                                        mode === "health"
                                            ? t("Ask anything about your health…", "اسأل أي شيء عن صحتك…")
                                            : mode === "medication"
                                                ? t("Ask about a medication…", "اسأل عن دواء…")
                                                : t("Ask — I know your health profile", "اسأل — أعرف ملفك الصحي")
                                    }
                                    className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-white placeholder-white/20 resize-none min-h-[36px] max-h-[140px] text-sm leading-relaxed py-1"
                                    disabled={isSending}
                                    dir={isArabic ? "rtl" : "ltr"}
                                    rows={1}
                                    style={{ overflowY: "auto" }}
                                />

                                <div className="flex items-center gap-1.5 shrink-0">
                                    {/* Voice */}
                                    <button
                                        type="button"
                                        onClick={toggleVoice}
                                        disabled={isSending}
                                        className={cn(
                                            "p-2 rounded-xl transition-all",
                                            isListening
                                                ? "bg-red-500/20 text-red-400 animate-pulse"
                                                : "text-white/25 hover:text-white/50 hover:bg-white/[0.06]"
                                        )}
                                        title={t("Voice input", "إدخال صوتي")}
                                    >
                                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                    </button>

                                    {/* Send */}
                                    <button
                                        type="button"
                                        onClick={() => sendMessage(input)}
                                        disabled={isSending || !input.trim()}
                                        className={cn(
                                            "p-2.5 rounded-xl transition-all",
                                            input.trim() && !isSending
                                                ? "gold-send-btn"
                                                : "bg-white/[0.05] text-white/15 cursor-not-allowed"
                                        )}
                                    >
                                        {isSending
                                            ? <div className="w-4 h-4 border-2 border-amber-800/50 border-t-amber-400 rounded-full animate-spin" />
                                            : <ArrowUp className={cn("w-4 h-4", isArabic && "rotate-180")} />
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Hint row */}
                        <div className={cn(
                            "flex items-center px-1",
                            input.length > 0 ? "justify-between" : "justify-center"
                        )}>
                            <p className="text-[10px] text-white/12">
                                {t("Enter to send  •  Shift+Enter for new line", "Enter للإرسال  •  Shift+Enter لسطر جديد")}
                            </p>
                            {input.length > 0 && (
                                <p className={cn(
                                    "text-[10px]",
                                    input.length > 1800 ? "text-amber-400" : "text-white/15"
                                )}>
                                    {input.length}/2000
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
