"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type BillboardSlide = {
    src: string;
    alt: string;
    href?: string;
    badge?: string;
    title?: string;
    subtitle?: string;
    rtl?: boolean;
};

export function AdBillboard({
    slides,
    autoAdvanceMs = 6500,
    className,
}: {
    slides: BillboardSlide[];
    autoAdvanceMs?: number;
    className?: string;
}) {
    const safeSlides = useMemo(() => slides.filter((s) => Boolean(s?.src)), [slides]);
    const [activeIndex, setActiveIndex] = useState(0);
    const trackRef = useRef<HTMLDivElement | null>(null);
    const interactingRef = useRef(false);
    const hoveringRef = useRef(false);
    const lastManualAtRef = useRef(0);

    const scrollToIndex = useCallback((nextIndex: number, behavior: ScrollBehavior = "smooth") => {
        const el = trackRef.current;
        if (!el) return;
        const width = el.clientWidth || 1;
        el.scrollTo({ left: width * nextIndex, behavior });
    }, []);

    const goTo = useCallback(
        (nextIndex: number) => {
            if (safeSlides.length === 0) return;
            const clamped = ((nextIndex % safeSlides.length) + safeSlides.length) % safeSlides.length;
            lastManualAtRef.current = Date.now();
            setActiveIndex(clamped);
            scrollToIndex(clamped);
        },
        [safeSlides.length, scrollToIndex]
    );

    const prev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
    const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;
        const handler = () => {
            if (!el) return;
            const width = el.clientWidth || 1;
            const idx = Math.round(el.scrollLeft / width);
            setActiveIndex((prevState) => (idx === prevState ? prevState : idx));
        };
        el.addEventListener("scroll", handler, { passive: true });
        return () => el.removeEventListener("scroll", handler);
    }, []);

    useEffect(() => {
        if (safeSlides.length <= 1) return;
        const id = window.setInterval(() => {
            const now = Date.now();
            if (hoveringRef.current) return;
            if (interactingRef.current) return;
            if (now - lastManualAtRef.current < 8000) return;
            setActiveIndex((prevState) => {
                const nextIndex = (prevState + 1) % safeSlides.length;
                scrollToIndex(nextIndex);
                return nextIndex;
            });
        }, Math.max(2500, autoAdvanceMs));
        return () => window.clearInterval(id);
    }, [autoAdvanceMs, safeSlides.length, scrollToIndex]);

    useEffect(() => {
        // Ensure correct positioning after resize
        const onResize = () => scrollToIndex(activeIndex, "auto");
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [activeIndex, scrollToIndex]);

    if (safeSlides.length === 0) {
        return (
            <div className={cn("w-full rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70", className)}>
                Add images to `public/billboard/` and pass them to `AdBillboard`.
            </div>
        );
    }

    return (
        <div
            className={cn("relative w-full", className)}
            onMouseEnter={() => {
                hoveringRef.current = true;
            }}
            onMouseLeave={() => {
                hoveringRef.current = false;
            }}
        >
            <div className="absolute -inset-3 rounded-[32px] bg-gradient-to-r from-cyan-500/20 via-purple-500/10 to-fuchsia-500/20 blur-2xl opacity-70" />
            <div className="absolute inset-0 rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(14,165,233,0.12)]" />
            <div
                ref={trackRef}
                className={cn(
                    "relative z-10 flex w-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar",
                    "rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/20"
                )}
                onPointerDown={() => {
                    interactingRef.current = true;
                    lastManualAtRef.current = Date.now();
                }}
                onPointerUp={() => {
                    interactingRef.current = false;
                    lastManualAtRef.current = Date.now();
                }}
                onPointerCancel={() => {
                    interactingRef.current = false;
                    lastManualAtRef.current = Date.now();
                }}
            >
                {safeSlides.map((slide, i) => {
                    const isSvg = slide.src.toLowerCase().endsWith(".svg");
                    const isRtl = Boolean(slide.rtl);
                    const Content = (
                        <div className="relative min-w-full snap-center">
                            {isSvg ? (
                                <img
                                    src={slide.src}
                                    alt={slide.alt}
                                    className="w-full h-[220px] sm:h-[340px] md:h-[420px] object-cover"
                                    loading={i === 0 ? "eager" : "lazy"}
                                />
                            ) : (
                                <div className="relative w-full h-[220px] sm:h-[340px] md:h-[420px]">
                                    <Image
                                        src={slide.src}
                                        alt={slide.alt}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
                                        quality={95}
                                        priority={i === 0}
                                        className="object-cover"
                                    />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/0" />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/20" />

                            {(slide.badge || slide.title || slide.subtitle) && (
                                <div className="absolute left-4 right-4 bottom-4 sm:left-6 sm:right-6 sm:bottom-6">
                                    <div className={cn("max-w-3xl", isRtl && "ml-auto text-right")} dir={isRtl ? "rtl" : "ltr"}>
                                        {slide.badge && (
                                            <div className={cn(
                                                "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/15 backdrop-blur-md text-white/80 text-[11px] sm:text-xs font-semibold",
                                                isRtl && "flex-row-reverse"
                                            )}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                                {slide.badge}
                                            </div>
                                        )}
                                        {slide.title && (
                                            <div className="mt-3 text-lg sm:text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow">
                                                {slide.title}
                                            </div>
                                        )}
                                        {slide.subtitle && (
                                            <div className="mt-2 text-sm sm:text-base text-white/75 leading-relaxed">
                                                {slide.subtitle}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {slide.href && (
                                <div className="absolute top-4 right-4">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/15 backdrop-blur-md text-white/85 text-xs font-semibold">
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">{isRtl ? "فتح" : "Open"}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );

                    return slide.href ? (
                        <Link
                            key={`${slide.src}-${i}`}
                            href={slide.href}
                            className="relative min-w-full snap-center focus:outline-none focus:ring-2 focus:ring-cyan-400/50 rounded-3xl"
                        >
                            {Content}
                        </Link>
                    ) : (
                        <div key={`${slide.src}-${i}`} className="relative min-w-full snap-center">
                            {Content}
                        </div>
                    );
                })}
            </div>

            {/* Desktop arrows */}
            {safeSlides.length > 1 && (
                <>
                    <button
                        type="button"
                        aria-label="Previous slide"
                        onClick={prev}
                        className={cn(
                            "hidden sm:flex items-center justify-center",
                            "absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full",
                            "bg-black/40 border border-white/10 text-white/80 hover:text-white hover:bg-black/55",
                            "backdrop-blur-md shadow-lg shadow-black/30 transition-all"
                        )}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        aria-label="Next slide"
                        onClick={next}
                        className={cn(
                            "hidden sm:flex items-center justify-center",
                            "absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full",
                            "bg-black/40 border border-white/10 text-white/80 hover:text-white hover:bg-black/55",
                            "backdrop-blur-md shadow-lg shadow-black/30 transition-all"
                        )}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </>
            )}

            {/* Dots */}
            {safeSlides.length > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                    {safeSlides.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            aria-label={`Go to slide ${i + 1}`}
                            onClick={() => goTo(i)}
                            className={cn(
                                "h-2.5 rounded-full transition-all",
                                i === activeIndex ? "w-6 bg-cyan-400/90" : "w-2.5 bg-white/20 hover:bg-white/35"
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
