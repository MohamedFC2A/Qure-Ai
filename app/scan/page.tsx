import { ScannerInterface } from "@/components/scanner/ScannerInterface";
import { GlassCard } from "@/components/ui/GlassCard";

export default function ScanPage() {
    return (
        <main className="min-h-screen pt-24 pb-12 px-4 flex flex-col items-center relative">
            <div className="z-10 w-full max-w-4xl flex flex-col items-center">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 mb-4">
                        Medical Analysis
                    </h1>
                    <p className="text-white/60">
                        Upload an image of any medication to receive a comprehensive analysis.
                    </p>
                </div>

                <GlassCard className="w-full min-h-[500px] p-6 md:p-10 flex flex-col items-center justify-center" hoverEffect={false}>
                    <ScannerInterface />
                </GlassCard>
            </div>
        </main>
    );
}
