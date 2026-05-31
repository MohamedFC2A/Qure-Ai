"use client";

import { Button } from "@/components/ui/Button";
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Database,
    FileText,
    HeartPulse,
    ScanLine,
    ShieldCheck,
    Sparkles,
    Zap,
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import Link from "next/link";

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.12 },
    },
};

const itemVariants: Variants = {
    hidden: { y: 16, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 110, damping: 18 },
    },
};

const workflow = [
    { icon: ScanLine, label: "Capture", text: "Extract label text from medication photos." },
    { icon: Database, label: "Verify", text: "Check openFDA and web signals when available." },
    { icon: FileText, label: "Report", text: "Produce a readable safety review and next steps." },
];

const trustSignals = [
    { value: "3-step", label: "scan workflow" },
    { value: "FDA", label: "source checks" },
    { value: "Ultra", label: "private safety context" },
];

function ProductPreview() {
    return (
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">Live analysis</p>
                    <p className="mt-1 text-sm font-bold text-white">Ibuprofen 200 mg</p>
                </div>
                <div className="rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                    Verified
                </div>
            </div>

            <div className="grid gap-4 p-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-lg border border-white/10 bg-slate-900/65 p-4">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-300 text-slate-950">
                            <ScanLine className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">Image intake</p>
                            <p className="text-xs text-slate-400">Label text extracted</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-2.5 w-full rounded-full bg-white/10" />
                        <div className="h-2.5 w-5/6 rounded-full bg-white/10" />
                        <div className="h-2.5 w-3/5 rounded-full bg-white/10" />
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                        {["OCR", "FDA", "Web"].map((item) => (
                            <div key={item} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-2 text-[11px] font-semibold text-slate-300">
                                {item}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
                            <div>
                                <p className="text-sm font-bold text-white">Safety review</p>
                                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                                    Review stomach bleeding risk, NSAID cautions, overdose signs, and when to seek care.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                            <ShieldCheck className="h-4 w-4 text-emerald-200" />
                            <p className="mt-2 text-xs font-semibold text-white">Interactions</p>
                            <p className="text-[11px] text-slate-400">Care context ready</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                            <CheckCircle2 className="h-4 w-4 text-cyan-200" />
                            <p className="mt-2 text-xs font-semibold text-white">Export</p>
                            <p className="text-[11px] text-slate-400">PNG and PDF</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Home() {
    return (
        <main className="min-h-screen pb-24 pt-24 md:pb-16 md:pt-28">
            <motion.section
                className="clinical-page grid min-h-[calc(100vh-8rem)] items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants} className="max-w-2xl">
                    <div className="clinical-eyebrow">
                        <Sparkles className="h-3.5 w-3.5" />
                        Medication intelligence
                    </div>
                    <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                        Turn medication labels into clear safety reports.
                    </h1>
                    <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
                        QURE AI extracts label text, verifies reliable signals, and organizes warnings, dosage notes,
                        interactions, and source checks into one practical review.
                    </p>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                        <Link href="/scan" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full gap-2 px-7">
                                <ScanLine className="h-5 w-5" />
                                Start analysis
                            </Button>
                        </Link>
                        <Link href="/pricing" className="w-full sm:w-auto">
                            <Button variant="outline" size="lg" className="w-full gap-2 px-7">
                                View plans
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-8 grid grid-cols-3 gap-3">
                        {trustSignals.map((item) => (
                            <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                                <p className="text-lg font-bold text-white">{item.value}</p>
                                <p className="mt-1 text-xs leading-tight text-slate-500">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="relative">
                    <div className="absolute -inset-4 rounded-2xl bg-cyan-300/5 blur-2xl" />
                    <ProductPreview />
                </motion.div>
            </motion.section>

            <section className="clinical-page mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                {workflow.map((item) => (
                    <div key={item.label} className="clinical-panel p-5">
                        <item.icon className="h-5 w-5 text-cyan-200" />
                        <h2 className="mt-4 text-base font-bold text-white">{item.label}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.text}</p>
                    </div>
                ))}
            </section>

            <section className="clinical-page mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="clinical-panel p-6">
                    <HeartPulse className="h-6 w-6 text-emerald-200" />
                    <h2 className="mt-4 text-2xl font-bold text-white">Designed for review, not diagnosis.</h2>
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
                        The interface prioritizes uncertainty, safety warnings, source confidence, and clear next steps so
                        medication information is easier to verify with a clinician or pharmacist.
                    </p>
                </div>
                <div className="clinical-panel p-6">
                    <Zap className="h-6 w-6 text-amber-200" />
                    <h2 className="mt-4 text-2xl font-bold text-white">Ultra adds personal context.</h2>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400">
                        Private profiles, family care, medication memories, interaction guard, and exports are organized
                        around the person being scanned for.
                    </p>
                </div>
            </section>
        </main>
    );
}
