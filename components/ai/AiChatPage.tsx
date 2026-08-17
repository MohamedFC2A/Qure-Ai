"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Send, Mic, MicOff, Menu, ArrowUp, ArrowDown, Lock, ShieldCheck, Zap, Pill, Brain, CheckCircle2, Globe, Search, Sparkles, Plus, X, Bandage, HeartPulse, History, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { type AiChatMode } from "@/lib/ai/chat";
import { ChatMessage, type ChatMessageData } from "./ChatMessage";
import { ConversationSidebar, type ConversationSummary } from "./ConversationSidebar";
import { MedicationSelectModal } from "./MedicationSelect";

/* ──────────────────────────────────────────────────────────
 *  AiChatPage – Native Mobile-First Ergonomics & Zero-Glow Clean UI
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

const QUICK_PROMPTS_GENERAL: { en: string; ar: string; icon: string }[] = [
    { en: "Is this medication safe for my health profile?", ar: "هل هذا الدواء مناسب لملفي الصحي؟", icon: "💊" },
    { en: "Check drug interactions for my medications", ar: "افحص تداخلات الأدوية بناءً على ملفي الصحي", icon: "⚠️" },
    { en: "First aid for a bleeding laceration", ar: "إسعافات أولية لجرح قطعي ينزف", icon: "🩹" },
    { en: "How to properly care for thermal burns?", ar: "كيف أتعامل مع حرق جلدي منزلي بشكل سليم؟", icon: "🩺" },
];

const QUICK_PROMPTS_MED: { en: string; ar: string; icon: string }[] = [
    { en: "Is this suitable for my health profile & conditions?", ar: "هل هذا الدواء مناسب لملفي الصحي وحالتي؟", icon: "💊" },
    { en: "What are the important precautions and side effects?", ar: "ما هي أهم الاحتياطات والآثار الجانبية الواجب معرفتها؟", icon: "⚠️" },
    { en: "What is the optimal timing and dosage protocol?", ar: "ما هي الجرعة والتوقيت الأمثل للاستخدام الآمن؟", icon: "📋" },
    { en: "Does this interact with any other drugs or food?", ar: "هل يتعارض مع أي أدوية أو مكملات أو أطعمة أخرى؟", icon: "🔍" },
];

const QUICK_PROMPTS_WOUND: { en: string; ar: string; icon: string }[] = [
    { en: "Immediate first-aid steps for this injury", ar: "خطوات الإسعاف الأولي السريع لهذه الإصابة", icon: "🩹" },
    { en: "Red flag symptoms requiring emergency ER", ar: "علامات الخطر التي تستدعي التوجه للطوارئ فوراً", icon: "⚠️" },
    { en: "Proper cleaning & dressing guidelines", ar: "طريقة تنظيف وتطهير وتضميد الجرح الصحيحة", icon: "🧼" },
    { en: "Is a tetanus vaccination needed?", ar: "هل يلزم أخذ مصل التيتانوس في هذه الحالة؟", icon: "💉" },
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
    const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
    const [activeMode, setActiveMode] = useState<AiChatMode>("health");
    const [historyModalOpen, setHistoryModalOpen] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const processedUrlKeyRef = useRef<string | null>(null);

    // Dynamic State Refs to keep callbacks completely stable & prevent infinite update loops
    const messagesRef = useRef(messages);
    messagesRef.current = messages;
    const selectedMedicationRef = useRef(selectedMedication);
    selectedMedicationRef.current = selectedMedication;
    const activeTopicRef = useRef(activeTopic);
    activeTopicRef.current = activeTopic;
    const activeConversationIdRef = useRef(activeConversationId);
    activeConversationIdRef.current = activeConversationId;
    const liveSearchEnabledRef = useRef(liveSearchEnabled);
    liveSearchEnabledRef.current = liveSearchEnabled;
    const isArabicRef = useRef(isArabic);
    isArabicRef.current = isArabic;

    // Responsive sidebar initialization & Keyboard shortcuts (Ctrl+B / Cmd+B)
    useEffect(() => {
        if (typeof window !== "undefined") {
            setSidebarOpen(window.innerWidth >= 1024);
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
                e.preventDefault();
                setSidebarOpen((prev) => !prev);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

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
                setTimeout(() => {
                    if (chatContainerRef.current) {
                        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                    }
                }, 100);
            }
        } catch (e) { console.error("Failed to load conversation:", e); }
    }, []);

    /* ── STREAMING send message (Rock-solid, zero re-render cycle) ── */
    const sendMessage = useCallback(async (text: string, overrideMedication?: any) => {
        if (!text.trim() || isSending) return;

        const currentMed = overrideMedication || selectedMedicationRef.current;
        const currentTopic = activeTopicRef.current;
        const currentLiveSearch = liveSearchEnabledRef.current;
        const currentLangArabic = isArabicRef.current;

        // Smart auto-detect mode from user's message text
        const detectedMode = detectModeFromText(text);
        const resolvedMode: AiChatMode = currentMed
            ? (currentMed.type === "wound" ? "wound" : detectedMode === "context" ? "context" : "medication")
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
            inputRef.current.style.height = "44px";
        }

        const assistantId = `stream-${Date.now()}`;
        const placeholder: ChatMessageData = {
            id: assistantId,
            role: "assistant",
            content: "",
            isLiveSearch: currentLiveSearch,
            keyPoints: [],
            suggestedFollowUps: [],
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, placeholder]);

        try {
            const history = [...messagesRef.current, userMessage].slice(-20).map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const medPayload = currentMed
                ? {
                    ...(currentMed.analysis_json || currentMed),
                    focusedTopic: currentTopic || currentMed.focusedTopic || currentMed.topic,
                    topic: currentTopic || currentMed.topic,
                  }
                : undefined;

            const res = await fetch("/api/ai/chat/stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: resolvedMode,
                    question: text.trim(),
                    conversationId: activeConversationIdRef.current,
                    messageHistory: history.slice(0, -1),
                    language: currentLangArabic ? "ar" : "en",
                    medicationData: medPayload,
                    forceLiveSearch: currentLiveSearch,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                setMessages((prev) => prev.filter((m) => m.id !== assistantId));
                if (res.status === 402) setError(currentLangArabic ? "يلزم الاشتراك في باقة ULTRA لاستخدام مساعد Qure AI." : "ULTRA plan subscription required to access Qure AI.");
                else if (res.status === 401) setError(currentLangArabic ? "يرجى تسجيل الدخول" : "Please log in");
                else setError(errData.error || (currentLangArabic ? "فشل في الحصول على استجابة" : "Failed to get response"));
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
                            speakVoiceOs((currentLangArabic ? "تنبيه طبي مهم: " : "Important Medical Warning: ") + warningTxt);
                        }

                        if (event.conversationId && event.conversationId !== activeConversationIdRef.current) {
                            setActiveConversationId(event.conversationId);
                            loadConversations();
                        }
                    }

                    if (event.type === "error") {
                        setError(event.error || (currentLangArabic ? "خطأ في البث" : "Stream error"));
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
            setError(e?.message || (currentLangArabic ? "فشل إرسال الرسالة" : "Failed to send message"));
        } finally {
            setIsSending(false);
            setIsStreaming(false);
        }
    }, [isSending, loadConversations, speakVoiceOs]);

    const sendMessageRef = useRef(sendMessage);
    sendMessageRef.current = sendMessage;

    /* ── Handle URL params, sessionStorage Context, & Background Context Binding ── */
    useEffect(() => {
        const currentUrlKey = searchParams ? searchParams.toString() : "";
        if (processedUrlKeyRef.current === currentUrlKey && currentUrlKey !== "") {
            return;
        }
        processedUrlKeyRef.current = currentUrlKey;

        let initialMedication: any = null;
        let initialQuestion: string | null = null;
        let initialTopic: string | null = null;
        let shouldAutoSend = false;
        let isNewChat = false;

        // 1. Check SessionStorage
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

        // 2. Check URL SearchParams
        if (searchParams) {
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
        }

        if (isNewChat) {
            setActiveConversationId(null);
            setMessages([]);
            setError(null);
            setAutoScroll(true);
            if (!initialMedication) {
                setSelectedMedication(null);
                setActiveTopic(null);
                setActiveMode("health");
            }
        }

        if (initialMedication) {
            setSelectedMedication(initialMedication);
            const isWound = initialMedication.type === "wound";
            setActiveMode(isWound ? "wound" : "medication");
            if (initialTopic) {
                setActiveTopic(initialTopic);
            }
        } else if (!isNewChat && initialTopic) {
            setActiveTopic(initialTopic);
        }

        if (initialQuestion && shouldAutoSend) {
            void sendMessageRef.current(initialQuestion, initialMedication);
        } else if (initialQuestion && !shouldAutoSend) {
            setInput(initialQuestion);
        }
    }, [searchParams]);

    /* ── Handle clinical context switch (Medication or Wound) ── */
    const handleSelectMedication = useCallback((item: any) => {
        setSelectedMedication(item);
        if (!item) {
            setActiveTopic(null);
            setActiveMode("health");
        } else {
            const isWound = item.type === "wound";
            setActiveMode(isWound ? "wound" : "medication");
        }
    }, []);

    /* ── Auto-scroll strictly on container, zero window jitter ── */
    useEffect(() => {
        if (!chatContainerRef.current) return;
        if (messages.length === 0) {
            chatContainerRef.current.scrollTop = 0;
            return;
        }
        if (autoScroll) {
            const el = chatContainerRef.current;
            el.scrollTop = el.scrollHeight;
        }
    }, [messages, isStreaming, autoScroll]);

    /* ── Smart Anchor Scrolling & Keyboard Dismiss on Upward Scroll ── */
    const handleScroll = useCallback(() => {
        const container = chatContainerRef.current;
        if (!container) return;
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        const atBottom = distanceFromBottom < 100;
        setAutoScroll(atBottom);
        setShowScrollBottomBtn(!atBottom && messages.length > 1);

        // Automatically dismiss virtual keyboard if user scrolls up through message history
        if (distanceFromBottom > 150 && document.activeElement === inputRef.current) {
            inputRef.current?.blur();
        }
    }, [messages.length]);

    const scrollToBottom = useCallback(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
        setAutoScroll(true);
        setShowScrollBottomBtn(false);
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
            const transcript = event.results[0][0].transcript;
            setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
            setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
        setIsListening(true);
    }, [isListening, isArabic]);

    /* ── Keyboard handling: Desktop Enter sends, Mobile Enter adds newline ── */
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const isTouchDevice = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
        
        if (e.key === "Enter" && !e.shiftKey && !isTouchDevice) {
            e.preventDefault();
            sendMessage(input);
        }
    }, [sendMessage, input]);

    /* ── Auto-grow textarea smoothly from 44px to 140px ── */
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value.slice(0, 2000));
        const el = e.target;
        el.style.height = "auto";
        el.style.height = `${Math.max(44, Math.min(el.scrollHeight, 140))}px`;
    }, []);

    const handleNewChat = useCallback(() => {
        setActiveConversationId(null);
        setMessages([]);
        setError(null);
        setSelectedMedication(null);
        setActiveTopic(null);
        setInput("");
        setAutoScroll(true);
        setActiveMode("health");
        try {
            sessionStorage.removeItem("qure_ai_active_context");
        } catch {}
        if (typeof window !== "undefined") {
            router.replace("/ai");
        }
    }, [router]);

    const handleSelectConversation = useCallback((conv: ConversationSummary) => {
        loadConversation(conv.id);
        setSelectedMedication(null);
        setActiveTopic(null);
        setInput("");
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
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

    // Dynamic Quick Prompt Chips based on active clinical state
    const quickChips = useMemo(() => {
        if (selectedMedication?.type === "wound" || activeMode === "wound") {
            return QUICK_PROMPTS_WOUND;
        }
        if (selectedMedication || activeMode === "medication") {
            return QUICK_PROMPTS_MED;
        }
        return QUICK_PROMPTS_GENERAL;
    }, [selectedMedication, activeMode]);

    /* ── Loading State ── */
    if (loading) {
        return (
            <main className="h-[100dvh] pt-16 sm:pt-20 px-4 bg-[#080D1A] flex items-center justify-center">
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
            className="fixed inset-0 pt-14 sm:pt-16 md:pt-20 z-40 flex overflow-hidden h-[100dvh] max-h-[100dvh]"
            dir={isArabic ? "rtl" : "ltr"}
            style={{ background: "#080D1A" }}
        >
            {/* ── Native Slide-Over Drawer / Desktop Sidebar ── */}
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

            {/* ── Main Chat Area (Dynamic Viewport 100dvh) ── */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative z-10 overflow-hidden bg-[#080D1A]">
                
                {/* Top Chat Sub-Header (Clean Minimal Controls • Zero Redundant Badges) */}
                <div className="shrink-0 flex items-center justify-between px-3 sm:px-6 py-2 border-b border-white/[0.06] bg-[#080D1A]/95 backdrop-blur-xl">
                    <div className="flex items-center gap-2">
                        {/* Sidebar Toggle Button */}
                        <button
                            type="button"
                            onClick={() => setSidebarOpen((prev) => !prev)}
                            className={cn(
                                "min-h-[40px] px-3 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold select-none touch-manipulation",
                                sidebarOpen
                                    ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                                    : "bg-white/[0.03] hover:bg-cyan-500/10 active:bg-cyan-500/15 border-white/[0.08] text-slate-300"
                            )}
                            title={
                                sidebarOpen
                                    ? (isArabic ? "إخفاء سجل المحادثات (Ctrl+B)" : "Hide History (Ctrl+B)")
                                    : (isArabic ? "إظهار سجل المحادثات (Ctrl+B)" : "Show History (Ctrl+B)")
                            }
                            aria-label={sidebarOpen ? "Hide sidebar" : "Open sidebar"}
                        >
                            <Menu className="w-4 h-4" />
                            <span className="text-xs font-medium">
                                {isArabic
                                    ? (sidebarOpen ? "إخفاء" : "السجل")
                                    : (sidebarOpen ? "Hide" : "Chats")
                                }
                            </span>
                        </button>
                    </div>
                </div>

                {/* ── Chat Messages Scroll Container ── */}
                <div
                    ref={chatContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 space-y-3 scrollbar-thin overscroll-contain"
                    style={{ WebkitOverflowScrolling: "touch" }}
                >
                    <div className="max-w-3xl mx-auto space-y-3">

                        {/* Welcome Empty State (Ultra Clean & High-End Aesthetic) */}
                        {messages.length === 0 && (
                            <div className="py-6 sm:py-10 text-center flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto">
                                {selectedMedication ? (
                                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#0E1A33] border border-cyan-500/30 text-xs shadow-md animate-fade-in max-w-full">
                                        <div className={cn(
                                            "w-6 h-6 rounded-xl flex items-center justify-center shrink-0 border",
                                            selectedMedication.type === "wound"
                                                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                                : "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
                                        )}>
                                            {selectedMedication.type === "wound" ? (
                                                <Bandage className="w-3.5 h-3.5" />
                                            ) : (
                                                <Pill className="w-3.5 h-3.5" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="font-bold text-cyan-300 shrink-0">
                                                {isArabic ? "تم الربط:" : "Linked:"}
                                            </span>
                                            <span className="font-bold text-white truncate max-w-[180px] sm:max-w-[280px]">
                                                {selectedMedication.drug_name || selectedMedication.drugName || selectedMedication.title || (isArabic ? "مستحضر دوائي" : "Medication")}
                                            </span>
                                            {activeTopic && (
                                                <>
                                                    <span className="text-slate-600 shrink-0">•</span>
                                                    <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-200 text-[11px] font-semibold border border-cyan-500/40 shrink-0 truncate max-w-[150px] sm:max-w-[220px]">
                                                        {activeTopic.replace(/^تفاصيل\s*الجرعة:\s*/, "")}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedMedication(null);
                                                setActiveTopic(null);
                                                setActiveMode("health");
                                            }}
                                            className="ms-1 p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer shrink-0"
                                            title={t("Unlink", "إلغاء الربط")}
                                            aria-label={t("Unlink context", "إلغاء الربط")}
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-[#132342] to-[#0A1224] border border-cyan-500/30 flex items-center justify-center shadow-lg select-none">
                                        <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent font-display">
                                            Qure
                                        </span>
                                    </div>
                                )}

                                <div className="space-y-1.5 px-2">
                                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                                        {selectedMedication
                                            ? (isArabic ? `استشارة سريرية حول ${selectedMedication.drug_name || selectedMedication.drugName || "العنصر المحدد"}` : `Clinical Consultation for ${selectedMedication.drug_name || selectedMedication.drugName || "Selected Item"}`)
                                            : t("Qure AI Medical Assistant", "المساعد الطبي الذكي Qure AI")}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                                        {selectedMedication
                                            ? (isArabic
                                                ? (activeTopic ? `الجزئية المحددة: ${activeTopic} • اسأل أي سؤال وسيجيبك الذكاء الاصطناعي بدقة كاملة.` : "اطرح أي استفسار حول الجرعات أو الآثار الجانبية أو التوافق مع ملفك الصحي.")
                                                : (activeTopic ? `Focused topic: ${activeTopic} • Ask anything for instant clinical reasoning.` : "Ask about dosages, side effects, or personalized suitability with your health profile."))
                                            : t(
                                                "Ask about your scanned medications, verify interactions, or analyze treatment regimens with AI precision.",
                                                "اسأل عن أدويتك المسجلة، وتحقق من التداخلات الدوائية والجرعات بدقة الذكاء الاصطناعي."
                                            )}
                                    </p>
                                </div>

                                {/* Quick Prompts Responsive Grid (1-Col on ultra-narrow, 2-Col on normal screens) */}
                                <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 sm:gap-2.5 w-full pt-2 px-1">
                                    {quickChips.map((chip, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => sendMessage(isArabic ? chip.ar : chip.en)}
                                            className="p-3 rounded-2xl text-xs text-start font-medium border border-white/[0.08] bg-[#0C1527]/90 hover:bg-[#111D36] hover:border-cyan-500/40 text-slate-300 hover:text-white active:scale-[0.98] transition-all duration-150 flex flex-col justify-between gap-2 shadow-sm touch-manipulation cursor-pointer group min-h-[72px]"
                                        >
                                            <div className="w-7 h-7 rounded-xl bg-white/[0.05] border border-white/[0.08] group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10 flex items-center justify-center text-sm transition-colors shrink-0">
                                                {chip.icon}
                                            </div>
                                            <span className="text-[11.5px] font-medium leading-snug line-clamp-2 text-slate-200 group-hover:text-white">
                                                {isArabic ? chip.ar : chip.en}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Action to link scan from history if not attached */}
                                {!selectedMedication && (
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setHistoryModalOpen(true)}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-white/[0.08] hover:border-cyan-500/40 bg-[#0C1527]/90 hover:bg-[#111D36] text-slate-300 hover:text-cyan-300 text-xs font-semibold shadow-sm active:scale-[0.98] transition-all touch-manipulation cursor-pointer"
                                        >
                                            <History className="w-3.5 h-3.5 text-cyan-400" />
                                            <span>{isArabic ? "ربط فحص من سجلك الطبي" : "Link a scan from medical history"}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Messages List */}
                        {messages.map((msg, idx) => (
                            <ChatMessage
                                key={msg.id || idx}
                                message={msg}
                                isArabic={isArabic}
                                accentColor={activeMode === "context" ? "violet" : activeMode === "medication" ? "emerald" : "cyan"}
                                onSuggestionClick={handleSuggestionClick}
                            />
                        ))}

                        {/* Error Banner */}
                        {error && (
                            <div className="flex items-center justify-center animate-fade-in my-2">
                                <div className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-2.5 text-xs text-red-200 text-center font-medium">
                                    {error}
                                </div>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>
                </div>

                {/* ── STICKY BOTTOM INPUT DOCK (Zero-Clutter • One-Handed Ergonomics) ── */}
                <div className="shrink-0 relative px-3 sm:px-6 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-white/[0.06] bg-[#080D1A]/95 backdrop-blur-2xl">
                    {/* ── Floating "Back to Bottom" Pill Button (Positioned cleanly right above input dock) ── */}
                    {showScrollBottomBtn && (
                        <div className="absolute -top-10 sm:-top-11 left-1/2 -translate-x-1/2 z-30 animate-fade-in pointer-events-auto">
                            <button
                                type="button"
                                onClick={scrollToBottom}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0E1A33]/95 border border-cyan-500/40 hover:bg-[#122244] active:scale-95 text-cyan-300 text-xs font-semibold shadow-xl backdrop-blur-md transition-all cursor-pointer touch-manipulation"
                            >
                                <ArrowDown className="w-3.5 h-3.5 animate-bounce text-cyan-400" />
                                <span>{isArabic ? "أحدث الرسائل" : "Latest Messages"}</span>
                            </button>
                        </div>
                    )}
                    <div className="max-w-3xl mx-auto space-y-2">

                        {/* Attached Medical Context Pill */}
                        {selectedMedication && (
                            <div className="flex items-center">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0E1A33] border border-cyan-500/30 text-xs shadow-sm animate-fade-in max-w-full">
                                    <div className={cn(
                                        "w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border",
                                        selectedMedication.type === "wound"
                                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                            : "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
                                    )}>
                                        {selectedMedication.type === "wound" ? (
                                            <Bandage className="w-3 h-3" />
                                        ) : (
                                            <Pill className="w-3 h-3" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="font-bold text-cyan-300 shrink-0">
                                            {isArabic ? "تم الربط:" : "Linked:"}
                                        </span>
                                        <span className="font-bold text-white truncate max-w-[180px] sm:max-w-[280px]">
                                            {selectedMedication.drug_name || selectedMedication.drugName || selectedMedication.title || (isArabic ? "فحص سريري" : "Clinical Scan")}
                                        </span>
                                        {activeTopic && (
                                            <>
                                                <span className="text-slate-600 shrink-0">•</span>
                                                <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-200 text-[11px] font-semibold border border-cyan-500/35 shrink-0 truncate max-w-[140px] sm:max-w-[200px]">
                                                    {activeTopic.replace(/^تفاصيل\s*الجرعة:\s*/, "")}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedMedication(null);
                                            setActiveTopic(null);
                                            setActiveMode("health");
                                        }}
                                        className="ms-0.5 p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                                        title={t("Unlink", "إلغاء الربط")}
                                        aria-label={t("Unlink context", "إلغاء الربط")}
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Main Chat Input Container */}
                        <div className="rounded-2xl sm:rounded-3xl border border-white/[0.10] focus-within:border-cyan-500/50 bg-[#0B132B] shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-200 overflow-hidden">
                            <div className="flex items-end gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5">
                                <textarea
                                    id="clinical-chat-input"
                                    name="clinical-chat-input"
                                    aria-label={isArabic ? "صندوق كتابة الاستفسار الطبي" : "Clinical medical prompt input"}
                                    autoComplete="off"
                                    ref={inputRef}
                                    value={input}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder={
                                        selectedMedication && activeTopic
                                            ? (isArabic
                                                ? `اسأل حول ${activeTopic}...`
                                                : `Ask about ${activeTopic}...`)
                                            : selectedMedication
                                                ? (isArabic
                                                    ? `اسأل عن ${selectedMedication.drug_name || selectedMedication.drugName || "الدواء"}...`
                                                    : `Ask about ${selectedMedication.drug_name || selectedMedication.drugName || "medication"}...`)
                                                : liveSearchEnabled
                                                    ? (isArabic ? "ابحث في المراجع السريرية..." : "Search clinical databases...")
                                                    : (isArabic ? "اكتب استفسارك الطبي هنا..." : "Type your medical question here...")
                                    }
                                    className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-white placeholder:text-slate-500 text-[13.5px] sm:text-[14.5px] leading-relaxed py-2 resize-none min-h-[46px] max-h-[140px]"
                                    disabled={isSending}
                                    dir={isArabic ? "rtl" : "ltr"}
                                    rows={1}
                                />

                                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pb-1">
                                    {/* Attach Scan History Button */}
                                    <button
                                        type="button"
                                        onClick={() => setHistoryModalOpen(true)}
                                        disabled={isSending}
                                        className={cn(
                                            "w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-all duration-150 active:scale-95 touch-manipulation cursor-pointer select-none",
                                            selectedMedication
                                                ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                                                : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] text-slate-400 hover:text-white"
                                        )}
                                        title={t("Link clinical scan from history", "ربط فحص من السجل الطبي")}
                                        aria-label={t("Link clinical scan from history", "ربط فحص من السجل الطبي")}
                                    >
                                        <History className="w-4 h-4" />
                                    </button>

                                    {/* Live Search Quick Button */}
                                    <button
                                        type="button"
                                        onClick={() => setLiveSearchEnabled((prev) => !prev)}
                                        disabled={isSending}
                                        className={cn(
                                            "w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-all duration-150 active:scale-95 touch-manipulation cursor-pointer select-none",
                                            liveSearchEnabled
                                                ? "bg-sky-500/20 border-sky-500/40 text-sky-300 shadow-sm"
                                                : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] text-slate-400 hover:text-white"
                                        )}
                                        title={t("Toggle Live Medical Web Search", "تفعيل/إلغاء البحث السريري المباشر عبر الإنترنت")}
                                        aria-label={t("Toggle Live Medical Web Search", "تفعيل/إلغاء البحث السريري المباشر عبر الإنترنت")}
                                    >
                                        <Globe className={cn("w-4 h-4", liveSearchEnabled ? "text-sky-300" : "text-slate-400")} />
                                    </button>

                                    {/* Voice Input Button */}
                                    <button
                                        type="button"
                                        onClick={toggleVoice}
                                        disabled={isSending}
                                        className={cn(
                                            "w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-all duration-150 active:scale-95 touch-manipulation cursor-pointer select-none",
                                            isListening
                                                ? "bg-red-500/20 border-red-500/40 text-red-300 animate-pulse shadow-sm"
                                                : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] text-slate-400 hover:text-white"
                                        )}
                                        title={t("Voice input", "إدخال صوتي")}
                                        aria-label={t("Voice input", "إدخال صوتي")}
                                    >
                                        {isListening ? (
                                            <div className="flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                                                <MicOff className="w-4 h-4 text-red-300" />
                                            </div>
                                        ) : (
                                            <Mic className="w-4 h-4" />
                                        )}
                                    </button>

                                    {/* Send Button */}
                                    <button
                                        type="button"
                                        onClick={() => sendMessage(input)}
                                        disabled={isSending || !input.trim()}
                                        className={cn(
                                            "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-150 select-none touch-manipulation",
                                            input.trim() && !isSending
                                                ? "bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 text-slate-950 font-bold shadow-[0_2px_10px_rgba(6,182,212,0.35)] hover:brightness-110 active:scale-95 cursor-pointer"
                                                : "bg-white/[0.05] border border-white/[0.06] text-slate-600 cursor-not-allowed"
                                        )}
                                        title={t("Send message", "إرسال الرسالة")}
                                        aria-label={t("Send message", "إرسال الرسالة")}
                                    >
                                        {isSending ? (
                                            <div className="w-4 h-4 border-2 border-slate-900 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <ArrowUp className={cn("w-4 h-4", input.trim() ? "text-slate-950 stroke-[2.5]" : "text-slate-600")} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Hint row */}
                        <div className={cn(
                            "flex items-center px-1.5",
                            input.length > 0 ? "justify-between" : "justify-center"
                        )}>
                            <p className="text-[10.5px] text-slate-500 hidden lg:block">
                                {t("Enter to send  •  Shift+Enter for new line  •  Ctrl+B for sidebar", "Enter للإرسال  •  Shift+Enter لسطر جديد  •  Ctrl+B للسجل")}
                            </p>
                            {input.length > 0 && (
                                <p className={cn(
                                    "text-[10.5px] font-mono",
                                    input.length > 1800 ? "text-amber-400" : "text-slate-500"
                                )}>
                                    {input.length}/2000
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Modal for Selecting Past Medication or Wound Scans ── */}
            <MedicationSelectModal
                isArabic={isArabic}
                onSelect={handleSelectMedication}
                selected={selectedMedication}
                onNavigateToScan={() => router.push("/scan")}
                isOpen={historyModalOpen}
                onClose={() => setHistoryModalOpen(false)}
            />
        </main>
    );
}
