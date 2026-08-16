"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Send, Mic, MicOff, Menu, ArrowUp, Lock, ShieldCheck, Zap, Pill, Brain, CheckCircle2, Globe, Search, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { type AiChatMode, getModeConfig } from "@/lib/ai/chat";
import { ChatMessage, type ChatMessageData } from "./ChatMessage";
import { ConversationSidebar, type ConversationSummary } from "./ConversationSidebar";
import { MedicationSelect } from "./MedicationSelect";

/* ──────────────────────────────────────────────────────────
 *  AiChatPage – Unified Qure AI (Smart context, no mode juggling)
 * ────────────────────────────────────────────────────────── */

// Smart intent detection to auto-route mode without user interaction
function detectModeFromText(text: string): AiChatMode {
    const lower = text.toLowerCase();
    // Wound & trauma keywords
    const woundKeywords = [
        "جرح", "حرق", "نزيف", "خياطة", "تيتانوس", "ضمادة", "سحجة", "غرز", "صدمة", "إسعاف",
        "wound", "burn", "bleeding", "suture", "stitches", "tetanus", "dressing", "bandage",
        "laceration", "cut", "scrape", "ulcer", "injury", "trauma", "pus", "infection"
    ];
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
    // Check wound first
    for (const kw of woundKeywords) {
        if (lower.includes(kw)) return "wound";
    }
    // Check self-reference
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
    { en: "Is this medication safe for my health profile?", ar: "هل هذا الدواء مناسب لملفي الصحي؟" },
    { en: "First aid for a bleeding laceration", ar: "إسعافات أولية لجرح قطعي ينزف" },
    { en: "How to properly care for thermal burns?", ar: "كيف أتعامل مع حرق جلدي منزلي بشكل سليم؟" },
    { en: "Check drug interactions for my medications", ar: "افحص تداخلات الأدوية بناءً على ملفي الصحي" },
];

export function AiChatPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, plan, loading } = useUser();
    const { resultsLanguage, speakVoiceOs } = useSettings();
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
    const [liveSearchEnabled, setLiveSearchEnabled] = useState(false);
    const [activeTopic, setActiveTopic] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const [activeMode, setActiveMode] = useState<AiChatMode>("health");

    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const autoSentRef = useRef(false);

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
                if (data.conversation?.mode) setActiveMode(data.conversation.mode as AiChatMode);
                setAutoScroll(true);
                setTimeout(() => chatEndRef.current?.scrollIntoView(), 100);
            }
        } catch (e) { console.error("Failed to load conversation:", e); }
    }, []);

    /* ── STREAMING send message ── */
    const sendMessage = useCallback(async (text: string, overrideMedication?: any) => {
        if (!text.trim() || isSending) return;

        const currentMed = overrideMedication || selectedMedication;

        // Smart auto-detect mode from user's message text
        const detectedMode = detectModeFromText(text);
        // If a medication is selected, always use medication mode
        const resolvedMode: AiChatMode = currentMed
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
            isLiveSearch: liveSearchEnabled,
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

            const medPayload = currentMed
                ? {
                    ...(currentMed.analysis_json || currentMed),
                    focusedTopic: activeTopic || currentMed.focusedTopic || currentMed.topic,
                    topic: activeTopic || currentMed.topic,
                  }
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
                    forceLiveSearch: liveSearchEnabled,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                setMessages((prev) => prev.filter((m) => m.id !== assistantId));
                if (res.status === 402) setError(t("ULTRA plan subscription required to access Qure AI.", "يلزم الاشتراك في باقة ULTRA لاستخدام مساعد Qure AI."));
                else if (res.status === 401) setError(t("Please log in", "يرجى تسجيل الدخول"));
                else setError(errData.error || t("Failed to get response", "فشل في الحصول على استجابة"));
                return;
            }

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let streamedContent = "";

            const processLine = (line: string) => {
                if (!line.startsWith("data: ")) return;
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) return;

                try {
                    const event = JSON.parse(jsonStr);

                    if (event.type === "search_start") {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === assistantId
                                    ? { ...m, isLiveSearch: true }
                                    : m
                            )
                        );
                    }

                    if (event.type === "search_status") {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === assistantId
                                    ? {
                                        ...m,
                                        isLiveSearch: true,
                                        searchMetadata: {
                                            performed: true,
                                            query: event.query,
                                            pagesCount: event.pagesCount,
                                            totalSources: event.totalSources,
                                            sources: event.sources,
                                            directAnswer: event.directAnswer,
                                            knowledgeEntity: event.knowledgeEntity,
                                        },
                                    }
                                    : m
                            )
                        );
                    }

                    if (event.type === "token" && event.token) {
                        streamedContent += event.token;
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === assistantId ? { ...m, content: streamedContent } : m
                            )
                        );
                    }

                    if (event.type === "done") {
                        const finalAns = event.answer || streamedContent || "";
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === assistantId
                                    ? {
                                        ...m,
                                        content: finalAns || m.content,
                                        keyPoints: event.keyPoints || [],
                                        suggestedFollowUps: event.suggestedFollowUps || [],
                                        searchMetadata: event.searchMetadata || m.searchMetadata,
                                    }
                                    : m
                            )
                        );

                        // VOICE OS Automatic Background Warning Announcement
                        if (finalAns && /(تحذير|خطر|احذر|تداخل|خطيرة|warning|caution|danger)/i.test(finalAns)) {
                            const match = finalAns.match(/[^.!?\n]*(تحذير|خطر|احذر|تداخل|خطيرة|warning|caution|danger)[^.!?\n]*/i);
                            const warningTxt = match ? match[0].trim() : finalAns.slice(0, 140);
                            speakVoiceOs((isArabic ? "تنبيه طبي مهم: " : "Important Medical Warning: ") + warningTxt);
                        }

                        if (event.conversationId && event.conversationId !== activeConversationId) {
                            setActiveConversationId(event.conversationId);
                            loadConversations();
                        }
                    }

                    if (event.type === "error") {
                        setError(event.error || t("Stream error", "خطأ في البث"));
                    }
                } catch { /* skip invalid JSON */ }
            };

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        processLine(line);
                    }
                }

                if (buffer.trim()) {
                    processLine(buffer);
                }
            }
        } catch (e: any) {
            setMessages((prev) => prev.filter((m) => m.id !== assistantId));
            setError(e?.message || t("Failed to send message", "فشل إرسال الرسالة"));
        } finally {
            setIsSending(false);
            setIsStreaming(false);
        }
    }, [activeConversationId, activeTopic, isArabic, isSending, liveSearchEnabled, loadConversations, messages, selectedMedication, speakVoiceOs, t]);

    /* ── Handle URL params, sessionStorage Context, & Background Context Binding ── */
    useEffect(() => {
        if (autoSentRef.current) return;

        let initialMedication: any = null;
        let initialQuestion: string | null = null;
        let initialTopic: string | null = null;
        let shouldAutoSend = false;
        let isNewChat = false;

        // 1. Read rich context from sessionStorage
        try {
            const raw = sessionStorage.getItem("qure_ai_active_context");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.medication) initialMedication = parsed.medication;
                if (parsed.question) initialQuestion = parsed.question;
                if (parsed.topic) initialTopic = parsed.topic;
                if (parsed.isNewChat) isNewChat = true;
                if (parsed.shouldAutoSend) shouldAutoSend = true;
                sessionStorage.removeItem("qure_ai_active_context");
            }
        } catch (err) {
            console.warn("[AiChatPage] SessionStorage context error:", err);
        }

        // 2. Read URL search params as fallback / explicit query
        if (searchParams.get("newChat") === "1" || searchParams.get("newChat") === "true") {
            isNewChat = true;
        }

        const medParam = searchParams.get("medication");
        if (medParam && !initialMedication) {
            try {
                initialMedication = JSON.parse(decodeURIComponent(medParam));
            } catch {}
        }

        const qParam = searchParams.get("q") || searchParams.get("question");
        if (qParam && !initialQuestion) {
            initialQuestion = decodeURIComponent(qParam);
        }

        const topicParam = searchParams.get("topic");
        if (topicParam && !initialTopic) {
            initialTopic = decodeURIComponent(topicParam);
        }

        if (searchParams.get("autoSend") === "1" || searchParams.get("autoSend") === "true") {
            shouldAutoSend = true;
        }

        if (isNewChat) {
            setActiveConversationId(null);
            setMessages([]);
            setError(null);
            setAutoScroll(true);
        }

        if (initialMedication) {
            setSelectedMedication(initialMedication);
            const isWound = initialMedication.type === "wound";
            setActiveMode(isWound ? "wound" : "medication");
        }

        if (initialTopic) {
            setActiveTopic(initialTopic);
        }

        if (initialQuestion && shouldAutoSend) {
            autoSentRef.current = true;
            void sendMessage(initialQuestion, initialMedication);
        } else if (initialQuestion && !shouldAutoSend) {
            setInput(initialQuestion);
        }
    }, [searchParams, sendMessage]);

    /* ── Handle clinical context switch (Medication or Wound) ── */
    const handleSelectMedication = useCallback((item: any) => {
        setSelectedMedication(item);
        if (item) {
            const isWound = item.type === "wound";
            setActiveMode(isWound ? "wound" : "medication");
        }
    }, []);

    /* ── Auto-scroll strictly on container, zero window jitter ── */
    useEffect(() => {
        if (!autoScroll || !chatContainerRef.current) return;
        const el = chatContainerRef.current;
        el.scrollTop = el.scrollHeight;
    }, [messages, isStreaming, autoScroll]);

    /* ── Track scroll position to toggle auto-scroll ── */
    const handleScroll = useCallback(() => {
        const container = chatContainerRef.current;
        if (!container) return;
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        setAutoScroll(distanceFromBottom < 200);
    }, []);

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
        medication: "text-cyan-300",
        wound: "text-emerald-400",
        context: "text-violet-400",
    };
    const modeLabels: Record<AiChatMode, { en: string; ar: string }> = {
        health: { en: "Health AI", ar: "صحي عام" },
        medication: { en: "Medications & Rx", ar: "أدوية وروشتات" },
        wound: { en: "Wound & Trauma Care", ar: "طوارئ وجروح" },
        context: { en: "Private Health Memory", ar: "الملف الصحي الخاص" },
    };

    /* ── Loading ── */
    if (loading) {
        return (
            <main className="min-h-screen pt-20 px-4 bg-[#040711] flex items-center justify-center">
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
            className="fixed inset-0 pt-16 sm:pt-20 md:pt-20 z-40 flex overflow-hidden"
            dir={isArabic ? "rtl" : "ltr"}
            style={{ background: "#040711" }}
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
            <div className="flex-1 flex flex-col min-w-0 h-full relative z-10 overflow-hidden">
                {/* Top Chat Sub-Header with Smooth Sidebar Toggle */}
                <div className="shrink-0 flex items-center justify-between px-3 sm:px-6 py-2 border-b border-white/[0.06] bg-[#060A17]/80 backdrop-blur-xl">
                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen((prev) => !prev)}
                            className={cn(
                                "p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold select-none",
                                sidebarOpen
                                    ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                                    : "bg-white/[0.03] hover:bg-cyan-500/10 border-white/[0.08] hover:border-cyan-500/30 text-slate-300 hover:text-cyan-200"
                            )}
                            title={isArabic ? "سجل المحادثات" : "Chat History"}
                        >
                            <Menu className="w-4 h-4" />
                            <span className="hidden sm:inline">{isArabic ? "المحادثات" : "Chats"}</span>
                        </button>

                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[11px] font-bold text-slate-200">
                                Qure AI
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleNewChat}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-cyan-500/15 border border-white/[0.08] hover:border-cyan-500/30 text-slate-300 hover:text-cyan-200 text-xs font-semibold transition-all cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{isArabic ? "محادثة جديدة" : "New Chat"}</span>
                        </button>
                    </div>
                </div>

                {/* ── CHAT MESSAGES & INPUT ── */}
                <div
                    ref={chatContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4"
                >
                            <div className="max-w-3xl mx-auto space-y-4">

                                {/* Smart Unified Linked Context Banner */}
                                {selectedMedication && (
                                    <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900/95 via-slate-900/85 to-cyan-950/40 border border-cyan-500/30 text-xs backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all animate-in fade-in duration-300">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                                                <Brain className="w-4 h-4 text-cyan-300 animate-pulse" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-white/60 font-medium text-xs">
                                                        {t("Attached Context:", "تم ربط سياق الدواء:")}
                                                    </span>
                                                    <span className="font-bold text-white text-xs sm:text-sm truncate">
                                                        {selectedMedication.drug_name || selectedMedication.drugName || selectedMedication.title || (isArabic ? "مستحضر دوائي" : "Medication")}
                                                    </span>
                                                    {activeTopic && (
                                                        <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-200 border border-cyan-400/30 text-[11px] font-bold truncate shrink-0 flex items-center gap-1 shadow-sm">
                                                            <Sparkles className="w-3 h-3 text-cyan-300" />
                                                            {activeTopic}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-cyan-300/80 mt-0.5 leading-normal">
                                                    {t(
                                                        "Clinical context connected in background. Ask any question below for intelligent reasoning.",
                                                        "تم ربط سياق هذه الجزئية في الخلفية. اكتب أي سؤال تريده بالأسفل وسيجيبك الذكاء الاصطناعي بدقة كاملة."
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedMedication(null);
                                                setActiveTopic(null);
                                            }}
                                            className="text-slate-400 hover:text-rose-300 text-xs px-3 py-1.5 rounded-xl border border-white/[0.08] hover:border-rose-500/30 bg-white/[0.02] hover:bg-rose-950/30 shrink-0 transition-all font-medium ms-2 cursor-pointer"
                                        >
                                            {t("Unlink", "إلغاء الربط")}
                                        </button>
                                    </div>
                                )}

                                {/* Welcome section when empty */}
                                {messages.length === 0 && (
                                    <div className="py-8 sm:py-14 text-center flex flex-col items-center justify-center space-y-5">
                                        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-3xl bg-[#080D1A] border border-cyan-500/30 flex items-center justify-center shadow-xl select-none">
                                            <span className="text-xl sm:text-2xl font-black tracking-tight text-cyan-400 font-display">
                                                Qure
                                            </span>
                                        </div>

                                        <div className="space-y-1.5 max-w-md px-2">
                                            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                                                {selectedMedication
                                                    ? (isArabic ? `استشارة سريرية حول ${selectedMedication.drug_name || selectedMedication.drugName || "الدواء"}` : `Clinical Consultation for ${selectedMedication.drug_name || selectedMedication.drugName || "Medication"}`)
                                                    : t("Qure AI Medical Assistant", "المساعد الطبي الذكي Qure AI")}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                                                {selectedMedication
                                                    ? (isArabic
                                                        ? (activeTopic ? `الجزئية المحددة: ${activeTopic} • اسأل أي سؤال وسيقوم الذكاء الاصطناعي بتحليله فوراً.` : "اطرح أي استفسار حول الجرعات أو الآثار الجانبية أو التوافق مع ملفك الصحي.")
                                                        : (activeTopic ? `Focused topic: ${activeTopic} • Ask anything for instant clinical reasoning.` : "Ask about dosages, side effects, or personalized suitability with your health profile."))
                                                    : t(
                                                        "Ask about your scanned medications, verify interactions, or analyze treatment regimens with AI precision.",
                                                        "اسأل عن أدويتك المسجلة، وتحقق من التداخلات الدوائية والجرعات بدقة الذكاء الاصطناعي."
                                                    )}
                                            </p>
                                        </div>

                                        {/* Quick Prompts */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md pt-2">
                                            {(selectedMedication
                                                ? [
                                                    {
                                                        en: "Is this suitable for my health profile and chronic conditions?",
                                                        ar: "هل هذا مناسب لملفي الصحي وحالتي الشخصية؟"
                                                    },
                                                    {
                                                        en: "What are the important precautions and side effects to know?",
                                                        ar: "ما هي أهم الاحتياطات والآثار الجانبية الواجب معرفتها؟"
                                                    },
                                                    {
                                                        en: "Does this interact with any other medications or foods?",
                                                        ar: "هل يتعارض مع أي أدوية أو مكملات أو أطعمة أخرى؟"
                                                    },
                                                    {
                                                        en: "What is the optimal timing and dosage protocol?",
                                                        ar: "ما هي الجرعة والتوقيت الأمثل للاستخدام الآمن؟"
                                                    }
                                                ]
                                                : QUICK_PROMPTS_UNIFIED
                                            ).map((s, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => sendMessage(isArabic ? s.ar : s.en)}
                                                    className="px-4 py-3 rounded-2xl text-xs text-start border border-white/[0.08] bg-[#080D1A]/80 text-slate-300 hover:text-white hover:border-cyan-500/40 hover:bg-[#0C1324]/90 backdrop-blur-xl transition-all leading-relaxed cursor-pointer"
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
                        <div className="shrink-0 px-3 sm:px-6 pt-3 pb-3 sm:pb-5 border-t border-white/[0.08] bg-[#080D1A]/90 backdrop-blur-2xl">
                            <div className="max-w-3xl mx-auto space-y-2.5">

                                {/* Medication picker bar — only show picker when no medication is active */}
                                {!selectedMedication && (
                                    <MedicationSelect
                                        isArabic={isArabic}
                                        onSelect={handleSelectMedication}
                                        selected={selectedMedication}
                                        onNavigateToScan={() => router.push("/scan")}
                                    />
                                )}

                                {/* Premium Main Input Container */}
                                <div className="rounded-2xl border border-white/[0.09] bg-[#0C1324]/90 focus-within:border-cyan-500/50 backdrop-blur-xl transition-all duration-200 shadow-xl overflow-hidden">
                                    
                                    {/* Subtitle / Mode Indicator Header */}
                                    <div className="flex items-center justify-between px-4 pt-2.5 pb-1 border-b border-white/[0.04]">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("flex items-center gap-1.5 text-[11px] font-bold tracking-wide", modeColors[activeMode])}>
                                                <span className="w-2 h-2 rounded-full bg-current" />
                                                <span>{isArabic ? modeLabels[activeMode].ar : modeLabels[activeMode].en}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                                                {t("• Smart Intent Engine", "• كشف تلقائي بالذكاء الاصطناعي")}
                                            </span>
                                        </div>

                                        {selectedMedication && (
                                            <button
                                                onClick={() => setSelectedMedication(null)}
                                                className="text-[10px] text-slate-400 hover:text-rose-400 font-medium transition-colors"
                                            >
                                                {t("Clear selected drug", "إلغاء تحديد الدواء")}
                                            </button>
                                        )}
                                    </div>

                                    {/* Textarea & Controls */}
                                    <div className="flex items-end gap-2 px-4 py-2.5">
                                        <textarea
                                            ref={inputRef}
                                            value={input}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            placeholder={
                                                activeTopic
                                                    ? (isArabic
                                                        ? `اسأل أي استفسار حول ${activeTopic}...`
                                                        : `Ask anything about ${activeTopic}...`)
                                                    : selectedMedication
                                                        ? t(
                                                            `Ask about ${selectedMedication.drug_name || selectedMedication.drugName || "this medication"} or suitability…`,
                                                            `اسأل عن ${selectedMedication.drug_name || selectedMedication.drugName || "هذا الدواء"} أو هل يناسبك…`
                                                        )
                                                        : liveSearchEnabled
                                                            ? t(
                                                                "Search live medical web & clinical databases for any topic…",
                                                                "ابحث مباشرة عبر الويب وقواعد البيانات السريرية في أي موضوع طبي…"
                                                            )
                                                            : t(
                                                                "Ask Qure AI anything — health, medications, or allergies…",
                                                                "اسأل Qure AI أي شيء — صحة، دواء، أو عن ملفك الطبي…"
                                                            )
                                            }
                                            className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-white placeholder:text-slate-400/90 text-sm sm:text-base leading-normal py-1.5 resize-none min-h-[44px] max-h-[160px]"
                                            disabled={isSending}
                                            dir={isArabic ? "rtl" : "ltr"}
                                            rows={1}
                                        />

                                        <div className="flex items-center gap-2 shrink-0 pb-1">
                                            {/* Live Search quick button */}
                                            <button
                                                type="button"
                                                onClick={() => setLiveSearchEnabled((prev) => !prev)}
                                                disabled={isSending}
                                                className={cn(
                                                    "w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-150 active:scale-95",
                                                    liveSearchEnabled
                                                        ? "bg-sky-950/80 border-sky-500/60 text-sky-300"
                                                        : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
                                                )}
                                                title={t("Toggle Live Medical Web Search", "تفعيل/إلغاء البحث السريري المباشر عبر الإنترنت")}
                                            >
                                                <Globe className={cn("w-4 h-4", liveSearchEnabled ? "text-sky-400" : "text-slate-400")} />
                                            </button>

                                            {/* Voice input button */}
                                            <button
                                                type="button"
                                                onClick={toggleVoice}
                                                disabled={isSending}
                                                className={cn(
                                                    "w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-150 active:scale-95",
                                                    isListening
                                                        ? "bg-red-950/80 border-red-800 text-red-300 animate-pulse"
                                                        : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
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
                    </div>
                </main>
            );
        }
