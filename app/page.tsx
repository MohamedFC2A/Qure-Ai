"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Scan, ShieldCheck, Zap } from "lucide-react";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { AdBillboard, type BillboardSlide } from "@/components/home/AdBillboard";

export default function Home() {
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
            },
        },
    };

    const billboardSlides: BillboardSlide[] = [
        {
            src: "/billboard/slide-1.svg",
            alt: "اللوحة الرئيسية: تحليل أي دواء بالذكاء الاصطناعي",
            badge: "QURE AI • اللوحة الرئيسية",
            title: "حلّل أي دواء خلال ثوانٍ",
            subtitle: "OCR فائق + تحليل عميق + تحقق من FDA والويب",
            href: "/scan",
            rtl: true,
        },
        {
            src: "/billboard/slide-2.svg",
            alt: "تحقق موثوق من FDA والويب",
            badge: "مصادر موثوقة",
            title: "تحقق مزدوج من FDA والويب",
            subtitle: "أسماء أدق، مصانع موثوقة، وتصنيف واضح.",
            href: "/scan",
            rtl: true,
        },
        {
            src: "/billboard/slide-3.svg",
            alt: "نتائج بتنسيق تقرير مع تصدير عالي الجودة",
            badge: "ترقية تجربة المستخدم",
            title: "نتائج بتنسيق تقرير احترافي",
            subtitle: "واجهة موبايل أولاً + تصدير عالي الجودة.",
            href: "/scan",
            rtl: true,
        },
    ];

    return (
        <main className="flex min-h-screen flex-col items-center justify-start pt-24 sm:pt-28 pb-24 sm:pb-16 px-4 sm:px-6 md:px-24 relative overflow-hidden">

            {/* Hero Section */}
            <motion.div
                className="z-10 text-center max-w-5xl mx-auto w-full flex flex-col items-center"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants} className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-white/80">Online</span>
                </motion.div>

                <motion.div variants={itemVariants} className="w-full max-w-4xl">
                    <AdBillboard slides={billboardSlides} />
                </motion.div>

                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-8 sm:mt-10">
                    <Link href="/scan">
                        <Button size="lg" className="w-full sm:w-auto gap-2 group">
                            <Scan className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Start Analysis
                        </Button>
                    </Link>
                    <Link href="/demo">
                        <Button variant="glass" size="lg" className="w-full sm:w-auto gap-2">
                            Watch Demo
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </motion.div>
            </motion.div>

            {/* Feature Grid */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="mt-16 md:mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full z-10"
            >
                <GlassCard className="p-6 sm:p-8 flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center mb-2">
                        <Scan className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Visual Recognition</h3>
                    <p className="text-white/50 text-sm sm:text-base">
                        Advanced AI models identify pills, bottles, and prescriptions with 99.8% confirmed accuracy.
                    </p>
                </GlassCard>

                <GlassCard className="p-6 sm:p-8 flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center mb-2">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Instant Data</h3>
                    <p className="text-white/50 text-sm sm:text-base">
                        Get dosage, side effects, and manufacturer details instantly extracted from our global medical database.
                    </p>
                </GlassCard>

                <GlassCard className="p-6 sm:p-8 flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center mb-2">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Safety First</h3>
                    <p className="text-white/50 text-sm sm:text-base">
                        Real-time contraindication analysis and safety warnings based on the latest pharmaceutical research.
                    </p>
                </GlassCard>
            </motion.div>

        </main>
    );
}
