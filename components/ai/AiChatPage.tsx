"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Send, Mic, MicOff, Menu, Sparkles, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { type AiChatMode, getModeConfig } from "@/lib/ai/chat";
import { ModeSelector } from "./ModeSelector";
import { ChatMessage, type ChatMessageData } from "./ChatMessage";
import { ConversationSidebar, type ConversationSummary } from "./ConversationSidebar";
import { MedicationSelect } from "./MedicationSelect";

/* ──────────────────────────────────────────────────────────
 *  AiChatPage – Full-page Nexus AI chat
 *  • Sticky input bar at bottom (fixed, doesn't scroll)
 *  • Mode dropdown next to input
 *  • Streaming token-by-token responses
 *  • Auto-scroll only when user is near bottom
 *  • 1M context indicator
 * ────────────────────────────────────────────────────────── */

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
                // Scroll to bottom after loading
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

        // Create empty assistant placeholder for streaming
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

            // Process SSE stream
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

    const accentMap: Record<string, { text: string; gradient: string }> = {
        cyan: { text: "text-cyan-300", gradient: "from-cyan-400 to-cyan-600" },
        emerald: { text: "text-emerald-300", gradient: "from-emerald-400 to-emerald-600" },
        violet: { text: "text-violet-300", gradient: "from-violet-400 to-violet-600" },
    };
    const accent = accentMap[accentColor] || accentMap.cyan;

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

    return (
        <main
            className="fixed inset-0 pt-16 z-40 flex"
            dir={isArabic ? "rtl" : "ltr"}
            style={{ background: "var(--q-base, #030712)" }}
        >
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

                {/* ── Top Header (fixed) ── */}
                <div
                    className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.06] shrink-0"
                    style={{ background: "rgba(3,7,18,0.95)" }}
                >
                    {/* Mobile sidebar toggle */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-lg hover:bg-white/[0.06] text-slate-500"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm font-bold text-white flex items-center gap-2 truncate">
                            <span className="nexus-gold-icon w-6 h-6 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-3.5 h-3.5" />
                            </span>
                            <span className="nexus-gold-text">NEXUS AI</span>
                            <span className="nexus-gold-badge px-1.5 py-0.5 rounded-[6px] text-[9px] font-black tracking-wider">
                                AI
                            </span>
                        </h1>
                    </div>

                    {messages.length > 0 && (
                        <button
                            onClick={handleNewChat}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-white/[0.06] text-slate-500 hover:text-white hover:border-white/[0.15] hover:bg-white/[0.04] transition-all"
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
                    className="flex-1 overflow-y-auto px-4 py-6"
                >
                    <div className="max-w-3xl mx-auto space-y-5">

                        {/* Welcome (only when empty) */}
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center text-center pt-20 pb-12">
                                <div className="nexus-gold-logo w-20 h-20 rounded-2xl flex items-center justify-center mb-5">
                                    <Sparkles className="w-9 h-9" />
                                </div>
                                <h2 className="text-xl font-black mb-2">
                                    <span className="nexus-gold-text">{t("Ask NEXUS AI", "اسأل NEXUS AI")}</span>
                                </h2>
                                <p className="text-sm text-slate-500 max-w-md leading-relaxed">
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

                                <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-lg">
                                    {(mode === "health"
                                        ? [
                                            t("Best exercises for back pain?", "أفضل تمارين لآلام الظهر؟"),
                                            t("How to reduce stress naturally?", "كيف أخفف التوتر بشكل طبيعي؟"),
                                            t("Healthy meal plan for weight loss", "خطة وجبات صحية لإنقاص الوزن"),
                                            t("What should I eat for better sleep?", "ماذا آكل لتحسين النوم؟"),
                                        ]
                                        : mode === "medication"
                                            ? [
                                                t("What are the side effects of Ibuprofen?", "ما هي آثار جانبية الإيبوبروفين؟"),
                                                t("Alternatives to Paracetamol", "بدائل للباراسيتامول"),
                                                t("Can I take vitamin D with antibiotics?", "هل أخذ فيتامين د مع المضادات الحيوية؟"),
                                                t("What foods interact with Warfarin?", "أطعمة تتفاعل مع الوارفارين؟"),
                                            ]
                                            : [
                                                t("Review my medication safety", "راجع سلامة أدويتي"),
                                                t("Nutrition advice based on my conditions", "نصائح غذائية بناءً على حالاتي"),
                                                t("What should I avoid with my allergies?", "ماذا يجب أن أتجنّب مع حساسيتي؟"),
                                                t("Exercise plan for my health profile", "خطة رياضية لملفي الصحي"),
                                            ]
                                    ).map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => sendMessage(s)}
                                            className="px-3.5 py-2.5 rounded-2xl text-xs border border-white/[0.07] text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all"
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

                        {/* Streaming cursor */}
                        {isStreaming && (
                            <div className="flex items-center gap-2 px-1">
                                <span className="inline-block w-0.5 h-4 bg-white/60 animate-pulse rounded-full" />
                                <span className="text-[10px] text-white/30">
                                    {t("NEXUS AI is thinking...", "NEXUS AI يفكر...")}
                                </span>
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

                {/* ══════════════════════════════════════════════
                 *  STICKY INPUT BAR (fixed at bottom)
                 * ══════════════════════════════════════════════ */}
                <div
                    className="shrink-0 border-t border-white/[0.06] px-3 sm:px-4 py-3"
                    style={{ background: "rgba(3,7,18,0.97)", backdropFilter: "blur(20px)" }}
                >
                    {/* Medication selector (medication mode only) */}
                    {mode === "medication" && (
                        <div className="mb-2.5 max-w-3xl mx-auto">
                            <MedicationSelect
                                isArabic={isArabic}
                                onSelect={setSelectedMedication}
                                selected={selectedMedication}
                                onNavigateToScan={() => router.push("/scan")}
                            />
                        </div>
                    )}

                    <div className="max-w-3xl mx-auto flex items-end gap-2">
                        {/* Mode dropdown */}
                        <div className="shrink-0">
                            <ModeSelector
                                activeMode={mode}
                                onModeChange={handleModeChange}
                                isArabic={isArabic}
                            />
                        </div>

                        {/* Input field */}
                        <div
                            className="flex-1 flex items-end gap-2 rounded-2xl border px-3 py-2 transition-all border-white/[0.08] focus-within:border-white/[0.18]"
                            style={{ background: "rgba(15,20,30,0.7)" }}
                        >
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value.slice(0, 2000))}
                                onKeyDown={handleKeyDown}
                                placeholder={
                                    mode === "health"
                                        ? t("Ask about health...", "اسأل عن الصحة...")
                                        : mode === "medication"
                                            ? t("Ask about a medication...", "اسأل عن دواء...")
                                            : t("Ask anything — I know your profile", "اسأل أي شيء — أعرف ملفك")
                                }
                                className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-white placeholder-white/25 resize-none min-h-[38px] max-h-[120px] py-1.5 text-sm leading-relaxed"
                                disabled={isSending}
                                dir={isArabic ? "rtl" : "ltr"}
                                rows={1}
                            />
                            <div className="flex items-center gap-1 shrink-0 pb-0.5">
                                {/* Voice */}
                                <button
                                    type="button"
                                    onClick={toggleVoice}
                                    disabled={isSending}
                                    className={cn(
                                        "p-2 rounded-full transition-all",
                                        isListening
                                            ? "bg-red-500/20 text-red-400 animate-pulse"
                                            : "text-white/30 hover:text-white/60 hover:bg-white/[0.06]"
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
                                        "p-2 rounded-full transition-all",
                                        input.trim()
                                            ? cn("bg-gradient-to-r", accent.gradient, "text-white shadow-md hover:scale-[1.04]")
                                            : "text-white/15"
                                    )}
                                >
                                    <Send className={cn("w-4 h-4", isArabic && "rotate-180")} />
                                </button>
                            </div>
                        </div>

                        {/* Context window indicator */}
                        <div className="shrink-0">
                            <div
                                className={cn(
                                    "w-9 h-9 rounded-full flex items-center justify-center border text-[8px] font-black tracking-tighter",
                                    mode === "context"
                                        ? "bg-violet-500/15 border-violet-400/25 text-violet-300"
                                        : "bg-white/[0.04] border-white/[0.06] text-white/25"
                                )}
                                title={isArabic ? "نافذة السياق: 1M توكن" : "Context Window: 1M Tokens"}
                            >
                                1M
                            </div>
                        </div>
                    </div>

                    {/* Keyboard hint */}
                    <div className="flex items-center justify-between px-2 mt-1.5 max-w-3xl mx-auto">
                        <p className="text-[10px] text-white/15">
                            {t("Enter to send • Shift+Enter for new line", "Enter للإرسال • Shift+Enter لسطر جديد")}
                        </p>
                        <p className={cn("text-[10px]", input.length > 1800 ? "text-amber-400" : "text-white/15")}>
                            {input.length}/2000
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
