"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Volume2, Square, Loader2, Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";

interface VoiceReaderButtonProps {
    text: string;
    lang?: "ar" | "en";
    className?: string;
    size?: "xs" | "sm" | "md";
    label?: string;
    shortSummary?: string;
}

export function VoiceReaderButton({
    text,
    lang = "ar",
    className,
    size = "sm",
    label,
    shortSummary,
}: VoiceReaderButtonProps) {
    const { plan, user } = useUser();
    const router = useRouter();
    const isUltra = plan === "ultra";

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const stopSpeaking = useCallback(() => {
        if (audioRef.current) {
            try {
                audioRef.current.pause();
                audioRef.current.src = "";
            } catch (e) {
                // Ignore cleanup errors
            }
            audioRef.current = null;
        }
        setIsSpeaking(false);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        return () => {
            stopSpeaking();
        };
    }, [stopSpeaking]);

    const handleToggleSpeak = async () => {
        // Gated for Ultra plan users only
        if (!isUltra) {
            router.push("/pricing");
            return;
        }

        if (isSpeaking || isLoading) {
            stopSpeaking();
            return;
        }

        const sourceText = shortSummary || text;
        const cleanedText = sourceText
            .replace(/<[^>]*>/g, "")
            .replace(/[\*\_`#~]/g, "")
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
            .replace(/\n+/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        if (!cleanedText) return;

        setIsLoading(true);

        try {
            // Fetch pure neural MP3 audio stream from /api/tts
            const res = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: cleanedText, lang }),
            });

            if (!res.ok) {
                if (res.status === 403) {
                    router.push("/pricing");
                    return;
                }
                throw new Error(`TTS API failed with status ${res.status}`);
            }

            const blob = await res.blob();
            const audioBlob = new Blob([blob], { type: "audio/mpeg" });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio();
            audio.src = audioUrl;
            audioRef.current = audio;

            audio.onplay = () => {
                setIsLoading(false);
                setIsSpeaking(true);
            };

            audio.onended = () => {
                setIsSpeaking(false);
                audioRef.current = null;
                URL.revokeObjectURL(audioUrl);
            };

            audio.onerror = (e) => {
                console.warn("Audio element playback note:", e);
                setIsLoading(false);
                setIsSpeaking(false);
                audioRef.current = null;
            };

            await audio.play();
        } catch (err) {
            console.error("Neural TTS playback error:", err);
            setIsLoading(false);
            setIsSpeaking(false);
            if (audioRef.current) {
                audioRef.current = null;
            }
        }
    };

    const sizeClasses = {
        xs: "px-2 py-1 text-[11px] gap-1 rounded-lg",
        sm: "px-3 py-1.5 text-xs gap-1.5 rounded-xl",
        md: "px-4 py-2 text-sm gap-2 rounded-xl",
    }[size];

    return (
        <button
            type="button"
            onClick={handleToggleSpeak}
            title={
                !isUltra
                    ? lang === "ar"
                        ? "الاستماع الصوتي الذكي (ميزة حصرية لباقة Ultra ⚡)"
                        : "Smart Neural Audio (Exclusive Ultra Feature ⚡)"
                    : isSpeaking
                    ? lang === "ar"
                        ? "إيقاف القراءة"
                        : "Stop Reading"
                    : lang === "ar"
                    ? "استمع بالصوت البشري الذكي (خلاصة موجزة)"
                    : "Listen to Neural Brief"
            }
            className={cn(
                "inline-flex items-center justify-center font-medium transition-all duration-200 select-none shadow-sm",
                !isUltra
                    ? "bg-amber-500/10 text-amber-300 border border-amber-500/25 hover:bg-amber-500/20 hover:border-amber-500/40"
                    : isSpeaking
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse hover:bg-rose-500/30"
                    : isLoading
                    ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 cursor-wait"
                    : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/40 hover:text-cyan-200",
                sizeClasses,
                className
            )}
        >
            {!isUltra ? (
                <>
                    <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>{label || (lang === "ar" ? "استماع صوتي" : "Listen")}</span>
                    <span className="text-[9px] font-black tracking-wider px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 ml-1">
                        ULTRA
                    </span>
                </>
            ) : isLoading ? (
                <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-cyan-300" />
                    <span>{lang === "ar" ? "إعداد الخلاصة الصوتية..." : "Generating brief..."}</span>
                </>
            ) : isSpeaking ? (
                <>
                    <Square className="h-3.5 w-3.5 fill-rose-300 shrink-0" />
                    <span>{label || (lang === "ar" ? "إيقاف القراءة" : "Stop")}</span>
                    <span className="flex items-center gap-0.5 ml-1">
                        <span className="w-1 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1 h-3 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1 h-1.5 bg-rose-400 rounded-full animate-bounce" />
                    </span>
                </>
            ) : (
                <>
                    <Volume2 className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                    <span>{label || (lang === "ar" ? "استماع صوتي" : "Listen")}</span>
                </>
            )}
        </button>
    );
}
