"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Scan, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Home() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const itemVariants = {
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

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 relative overflow-hidden">

            {/* Hero Section */}
            <motion.div
                className="z-10 text-center max-w-4xl mx-auto flex flex-col items-center"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants} className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-sm font-medium text-white/80">System Online v1.0</span>
                </motion.div>

                <motion.h1
                    variants={itemVariants}
                    className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/60 mb-8 drop-shadow-2xl"
                >
                    Pharmaceutical Intelligence <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-liquid-accent to-liquid-secondary">
                        Reimagined
                    </span>
                </motion.h1>

                <motion.p
                    variants={itemVariants}
                    className="text-lg md:text-xl text-white/60 max-w-2xl mb-12 leading-relaxed"
                >
                    Instantly analyze medications with military-grade computer vision.
                    Identify pills, check interactions, and access detailed medical data in seconds.
                </motion.p>

                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full justify-center">
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
                className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full z-10"
            >
                <GlassCard className="p-8 flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center mb-2">
                        <Scan className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Visual Recognition</h3>
                    <p className="text-white/50 text-sm">
                        Advanced AI models identify pills, bottles, and prescriptions with 99.8% confirmed accuracy.
                    </p>
                </GlassCard>

                <GlassCard className="p-8 flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center mb-2">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Instant Data</h3>
                    <p className="text-white/50 text-sm">
                        Get dosage, side effects, and manufacturer details instantly extracted from our global medical database.
                    </p>
                </GlassCard>

                <GlassCard className="p-8 flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center mb-2">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Safety First</h3>
                    <p className="text-white/50 text-sm">
                        Real-time contraindication analysis and safety warnings based on the latest pharmaceutical research.
                    </p>
                </GlassCard>
            </motion.div>

        </main>
    );
}
