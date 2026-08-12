"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Send, Mic, MicOff, Menu, ArrowUp, Lock, ShieldCheck, Zap, Pill, Brain } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { type AiChatMode, getModeConfig } from "@/lib/ai/chat";
import { ChatMessage, type ChatMessageData } from "./ChatMessage";
import { ConversationSidebar, type ConversationSummary } from "./ConversationSidebar";
import { MedicationSelect } from "./MedicationSelect";

/* ──────────────────────────────────────────────────────────
 *  AiChatPage – Unified Mat AI (Smart context, no mode juggling)
 * ────────────────────────────────────────────────────────── */

// Smart intent detection to auto-route mode without user interaction
function detectModeFromText(text: string): AiChatMode {
    const lower = text.toLowerCase();
    // Profile / personal context keywords
    const selfKeywords = [
        "يناسبني", "يناسب لي", "مناسب لي", "مناسب لحالتي", "حساسيتي", "وضعي", "حالتي",
        "ملفي", "بيانتي", "suit me", "suits me", "my profile", "my condition",
        "my allergy", "my health", "for me", "is it safe for me", "can i take",
        "أخذه أنا", "هل يناسبني", "هل مناسب لي", "bmi", "وزني", "طولي",
        "مرضي", "أمراضي", "أدويتي الحالية"
    ];
    // Medication-specific keywords
    const medKeywords = [
        "دواء", "علاج", "جرعة", "تركيز", "مضاد حيوي", "باراسيتامول", "ايبوبروفين",
        "آثار جانبية", "تداخل", "بديل", "مادة فعالة", "نشرة", "تركيبة",
        "medication", "drug", "pill", "tablet", "side effect", "dosage", "dose",
        "antibiotic", "paracetamol", "ibuprofen", "interaction", "active ingredient",
        "generic", "brand", "prescription", "overdose", "mg", "ml"
    ];
    // Check self-reference first (highest priority → context mode)
    for (const kw of selfKeywords) {
        if (lower.includes(kw)) return "context";
    }
    // Then medication
    for (const kw of medKeywords) {
        if (lower.includes(kw)) return "medication";
    }
    return "health";
}

const QUICK_PROMPTS_UNIFIED: { en: string; ar: string }[] = [
    { en: "Is this medication safe for me?", ar: "هل هذا الدواء مناسب لحالتي الصحية؟" },
    { en: "What's my BMI and what does it mean?", ar: "ما هو مؤشر كتلة الجسم BMI وما معناه؟" },
    { en: "Foods that boost immunity", ar: "أطعمة تعزز المناعة وتقوي الجهاز الدفاعي" },
    { en: "Check drug interactions for me", ar: "افحص تداخلات الأدوية بناءً على ملفي الصحي" },
    { en: "Side effects of Ibuprofen?", ar: "ما آثار الإيبوبروفين الجانبية؟" },
    { en: "How to sleep better naturally?", ar: "كيف أحسّن نومي بطريقة طبيعية؟" },
];

export function AiChatPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, plan, loading } = useUser();
    const { resultsLanguage } = useSettings();
    const supabase = useMemo(() => createClient(), []);

    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);
    const isUltra = plan === "ultra";

    /* ── State ── */
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
    const [activeMode, setActiveMode] = useState<AiChatMode>("health");

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

    useEffect(() => { if (user && isUltra) loadConversations(); }, [user, isUltra, loadConversations]);

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
                if (data.conversation?.mode) setActiveMode(data.conversation.mode as AiChatMode);
                setAutoScroll(true);
                setTimeout(() => chatEndRef.current?.scrollIntoView(), 100);
            }
        } catch (e) { console.error("Failed to load conversation:", e); }
    }, []);

    /* ── Handle URL params & Medication Selection ── */
    useEffect(() => {
        const medParam = searchParams.get("medication");
        if (medParam) {
            try {
                const parsed = JSON.parse(decodeURIComponent(medParam));
                setSelectedMedication(parsed);
                setActiveMode("medication");
            } catch { /* ignore */ }
        }
    }, [searchParams]);

    /* ── Handle medication context switch ── */
    const handleSelectMedication = useCallback((med: any) => {
        setSelectedMedication(med);
        if (med) {
            setActiveMode("medication");
            if (!activeConversationId && messages.length === 0) {
                const medName = med.drug_name || med.drugName || "Medication";
                const noticeText = isArabic
                    ? `تم ربط الدواء: **${medName}** بالمحادثة. الآن يمكنك سؤالي عن جرعاته، آثاره الجانبية، تداخلاته، أو هل يناسبك شخصياً.`
                    : `Medication attached: **${medName}**. Ask me about dosage, side effects, interactions, or if it's suitable for you personally.`;
                setMessages([{
                    id: `notice-${Date.now()}`,
                    role: "assistant",
                    content: noticeText,
                    created_at: new Date().toISOString()
                }]);
            }
        }
    }, [activeConversationId, messages.length, isArabic]);

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

        if (!isUltra) {
            setError(t("Mat AI is exclusive to ULTRA plan members.", "ميزة Mat AI متاحة حصرياً لمشتركي باقة ULTRA."));
            return;
        }

        // Smart auto-detect mode from user's message text
        const detectedMode = detectModeFromText(text);
        // If a medication is selected, always use medication mode
        const resolvedMode: AiChatMode = selectedMedication
            ? (detectedMode === "context" ? "context" : "medication")
            : detectedMode;
        setActiveMode(resolvedMode);

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

            const medPayload = selectedMedication
                ? (selectedMedication.analysis_json || selectedMedication)
                : undefined;

            const res = await fetch("/api/ai/chat/stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: resolvedMode,
                    question: text.trim(),
                    conversationId: activeConversationId,
                    messageHistory: history.slice(0, -1),
                    language: isArabic ? "ar" : "en",
                    medicationData: medPayload,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                setMessages((prev) => prev.filter((m) => m.id !== assistantId));
                if (res.status === 402) setError(t("ULTRA plan subscription required.", "يلزم الاشتراك في باقة ULTRA لاستخدام Mat AI."));
                else if (res.status === 401) setError(t("Please log in", "يرجى تسجيل الدخول"));
                else setError(errData.error || t("Failed to get response", "فشل في الحصول على استجابة"));
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
                                                content: event.answer || streamedContent || m.content,
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
                        } catch { /* skip invalid JSON */ }
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
    }, [isSending, isUltra, messages, activeConversationId, activeMode, isArabic, selectedMedication, t, loadConversations]);

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
        setActiveMode("health");
    }, []);

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

    // Active mode indicator color
    const modeColors: Record<AiChatMode, string> = {
        health: "text-cyan-400",
        medication: "text-emerald-400",
        context: "text-violet-400",
    };
    const modeLabels: Record<AiChatMode, { en: string; ar: string }> = {
        health: { en: "Health AI", ar: "صحي" },
        medication: { en: "Medication", ar: "دواء" },
        context: { en: "Your Profile", ar: "ملفك" },
    };

    /* ── Loading ── */
    if (loading) {
        return (
            <main className="min-h-screen pt-20 px-4 bg-slate-950 flex items-center justify-center">
                <div className="w-full max-w-3xl space-y-4">
                    <div className="h-12 skeleton rounded-2xl bg-white/[0.04]" />
                    <div className="h-[60vh] skeleton rounded-2xl bg-white/[0.04]" />
                    <div className="h-14 skeleton rounded-2xl bg-white/[0.04]" />
                </div>
            </main>
        );
    }
    if (!user) return null;

    return (
        <main
            className="fixed inset-0 pt-16 sm:pt-20 md:pt-20 z-40 flex"
            dir={isArabic ? "rtl" : "ltr"}
            style={{ background: "#050811" }}
        >
            {/* ── Sidebar ── */}
            {isUltra && (
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
            )}

            {/* ── Main Chat Area ── */}
            <div className="flex-1 flex flex-col min-w-0 relative z-10">

                {/* Floating mobile sidebar toggle */}
                {isUltra && (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden fixed top-20 right-3 z-30 p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white shadow-md"
                        title="Open Conversations"
                    >
                        <Menu className="w-4 h-4" />
                    </button>
                )}

                {/* ── ULTRA PAYWALL BLOCK (For Free Tier Users) ── */}
                {!isUltra ? (
                    <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
                        <div className="max-w-xl w-full rounded-3xl border border-cyan-500/30 p-6 sm:p-8 text-center space-y-6 bg-slate-900/80 backdrop-blur-xl shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden">
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl" />
                            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />

                            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center mx-auto text-cyan-400 shadow-inner">
                                <Lock className="w-8 h-8" />
                            </div>

                            <div className="space-y-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-400/10 text-cyan-300 border border-cyan-400/30">
                                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                                    {t("ULTRA EXCLUSIVE FEATURE", "ميزة حصرية لمشتركي ULTRA")}
                                </span>
                                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                                    {t("Unlock Mat AI Assistant", "افتح المساعد الطبي الذكي Mat AI")}
                                </h2>
                                <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                                    {t(
                                        "Mat AI is available exclusively for ULTRA members. Get personalized clinical insights, comprehensive medication analysis, and health advice.",
                                        "مساعد Mat AI متاح حصرياً لأعضاء باقة ULTRA. احصل على تحليلات سريرية فائقة الدقة، قراءة شفرات الأدوية، واستشارات صحية مخصصة."
                                    )}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-start pt-2">
                                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-start gap-2.5">
                                    <Pill className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                        <p className="font-bold text-white">{t("Full Medication Context", "قراءة بيانات الأدوية بالكامل")}</p>
                                        <p className="text-slate-400 text-[11px]">{t("Reads ingredients, warnings & FDA labels", "يفهم المواد الفعالة والتحذيرات والجرعات")}</p>
                                    </div>
                                </div>
                                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-start gap-2.5">
                                    <Brain className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                        <p className="font-bold text-white">{t("Personalized Health Profile", "ربط بالملف الصحي الخاص")}</p>
                                        <p className="text-slate-400 text-[11px]">{t("Cross-checks allergies & conditions", "يفحص الحساسية والتداخلات لملفك")}</p>
                                    </div>
                                </div>
                                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-start gap-2.5">
                                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                        <p className="font-bold text-white">{t("Clinical Safety Guard", "فحص السلامة الصيدلانية")}</p>
                                        <p className="text-slate-400 text-[11px]">{t("FDA verified interaction checks", "مراجعة معايير السلامة والتداخلات")}</p>
                                    </div>
                                </div>
                                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-start gap-2.5">
                                    <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                        <p className="font-bold text-white">{t("Zero-Lag Streaming", "استجابة فائقة السرعة")}</p>
                                        <p className="text-slate-400 text-[11px]">{t("Instant token streaming & continuous chat", "بث فوري للإجابات وحفظ المحادثات")}</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push("/pricing")}
                                className="w-full py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-base transition-all flex items-center justify-center gap-2"
                            >
                                <Zap className="w-5 h-5" />
                                {t("Upgrade to ULTRA Now", "ترقية إلى باقة ULTRA الآن")}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ── CHAT MESSAGES & INPUT FOR ULTRA USERS ── */
                    <>
                        {/* Scrollable Messages */}
                        <div
                            ref={chatContainerRef}
                            onScroll={handleScroll}
                            className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar"
                        >
                            <div className="max-w-2xl mx-auto space-y-6">

                                {/* Welcome section when empty */}
                                {messages.length === 0 && (
                                    <div className="flex flex-col items-center text-center pt-10 pb-6 animate-fade-in space-y-4">
                                        <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                                            <Brain className="w-7 h-7" />
                                        </div>

                                        <div className="space-y-1">
                                            <h2 className="text-2xl font-black tracking-tight text-white">Mat AI</h2>
                                            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                                                {t(
                                                    "Your personal health AI — knows your profile, your medications, and gives you personalized answers. Just ask anything.",
                                                    "مساعدك الصحي الشخصي — يعرف ملفك الصحي وتاريخ أدويتك ويجيبك بشكل مخصص. فقط اسأل عن أي شيء."
                                                )}
                                            </p>
                                        </div>

                                        {/* Quick Prompts */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md pt-2">
                                            {QUICK_PROMPTS_UNIFIED.map((s, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => sendMessage(isArabic ? s.ar : s.en)}
                                                    className="px-4 py-3 rounded-2xl text-xs text-start border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:border-cyan-500/40 hover:bg-slate-800 transition-all leading-relaxed"
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
                                        accentColor={activeMode === "context" ? "violet" : activeMode === "medication" ? "emerald" : "cyan"}
                                        onSuggestionClick={handleSuggestionClick}
                                    />
                                ))}

                                {/* Error */}
                                {error && (
                                    <div className="flex items-center justify-center animate-fade-in">
                                        <div className="rounded-2xl border border-red-500/20 bg-red-950/30 px-5 py-3.5 text-xs text-red-300 text-center">
                                            {error}
                                        </div>
                                    </div>
                                )}

                                <div ref={chatEndRef} />
                            </div>
                        </div>

                        {/* ── INPUT BAR ── */}
                        <div className="shrink-0 px-3 sm:px-6 pt-2 pb-3 sm:pb-4 border-t border-slate-900 bg-slate-950/95 backdrop-blur-md">
                            <div className="max-w-2xl mx-auto space-y-2">

                                {/* Medication picker — always visible */}
                                <MedicationSelect
                                    isArabic={isArabic}
                                    onSelect={handleSelectMedication}
                                    selected={selectedMedication}
                                    onNavigateToScan={() => router.push("/scan")}
                                />

                                {/* Main input container */}
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/90 focus-within:border-cyan-500/50 transition-all shadow-sm">
                                    {/* Active mode indicator (subtle, auto) */}
                                    <div className="flex items-center gap-2 px-4 pt-2.5 pb-0">
                                        <div className={cn("flex items-center gap-1.5 text-[10px] font-semibold", modeColors[activeMode])}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                            <span>{isArabic ? modeLabels[activeMode].ar : modeLabels[activeMode].en}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-600">
                                            {t("• auto-detected", "• تم اكتشافه تلقائياً")}
                                        </span>
                                    </div>

                                    {/* Textarea & Send button */}
                                    <div className="flex items-end gap-2 px-4 pt-2 pb-3">
                                        <textarea
                                            ref={inputRef}
                                            value={input}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            placeholder={
                                                selectedMedication
                                                    ? t(
                                                        `Ask about ${selectedMedication.drug_name || "this medication"} or if it suits you…`,
                                                        `اسأل عن ${selectedMedication.drug_name || "هذا الدواء"} أو هل يناسبك…`
                                                    )
                                                    : t(
                                                        "Ask Mat AI anything — health, medications, or your personal profile…",
                                                        "اسأل Mat AI أي شيء — صحة، دواء، أو عن ملفك الشخصي…"
                                                    )
                                            }
                                            className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-white placeholder-slate-500 resize-none min-h-[36px] max-h-[140px] text-sm leading-relaxed py-1"
                                            disabled={isSending}
                                            dir={isArabic ? "rtl" : "ltr"}
                                            rows={1}
                                            style={{ overflowY: "auto" }}
                                        />

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {/* Voice button */}
                                            <button
                                                type="button"
                                                onClick={toggleVoice}
                                                disabled={isSending}
                                                className={cn(
                                                    "p-2 rounded-xl transition-all",
                                                    isListening
                                                        ? "bg-red-500/20 text-red-400 animate-pulse"
                                                        : "text-slate-400 hover:text-white hover:bg-slate-800"
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
                                                    "p-2.5 rounded-xl transition-all",
                                                    input.trim() && !isSending
                                                        ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                                                        : "bg-slate-800 text-slate-600 cursor-not-allowed"
                                                )}
                                            >
                                                {isSending
                                                    ? <div className="w-4 h-4 border-2 border-slate-900 border-t-cyan-400 rounded-full animate-spin" />
                                                    : <ArrowUp className="w-4 h-4" />
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
                                    <p className="text-[10px] text-slate-500 hidden lg:block">
                                        {t("Enter to send  •  Shift+Enter for new line", "Enter للإرسال  •  Shift+Enter لسطر جديد")}
                                    </p>
                                    {input.length > 0 && (
                                        <p className={cn(
                                            "text-[10px]",
                                            input.length > 1800 ? "text-amber-400" : "text-slate-500"
                                        )}>
                                            {input.length}/2000
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
