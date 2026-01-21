"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Wrench, Construction, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-24">
            <GlassCard className="max-w-lg w-full p-8 text-center border-amber-500/20 bg-amber-500/5">
                <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/30">
                        <Construction className="w-12 h-12 text-amber-400" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-white mb-3">
                    لوحة التحكم تحت الصيانة
                </h1>
                <h2 className="text-lg text-white/60 mb-4">
                    Dashboard Under Maintenance
                </h2>

                <p className="text-white/50 text-sm leading-relaxed mb-6">
                    نعمل حالياً على تحسين لوحة التحكم لتقديم تجربة أفضل. سنعود قريباً!
                    <br />
                    We're currently improving the dashboard for a better experience. Be back soon!
                </p>

                <div className="flex items-center justify-center gap-2 text-amber-300/80 text-sm mb-8">
                    <Clock className="w-4 h-4" />
                    <span>الوقت المتوقع: قريباً</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link href="/scan">
                        <Button className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0">
                            <Wrench className="w-4 h-4" />
                            اذهب للمسح الضوئي
                        </Button>
                    </Link>
                    <Link href="/">
                        <Button variant="outline" className="border-white/15 text-white/70 hover:bg-white/10">
                            الصفحة الرئيسية
                        </Button>
                    </Link>
                </div>
            </GlassCard>
        </div>
    );
}
