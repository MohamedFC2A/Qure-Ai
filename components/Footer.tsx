import Link from "next/link";

export const Footer = () => {
    return (
        <footer className="w-full py-6 mt-12 mb-24 md:mb-12 flex flex-col items-center justify-center gap-3 text-center z-10 relative opacity-90 hover:opacity-100 transition-opacity duration-300">
            {/* Engraved Text Effect with Interactive Heart */}
            <p className="text-sm md:text-base font-semibold text-zinc-400/80 tracking-wide [text-shadow:_1px_1px_2px_rgb(0_0_0_/_0.8),_-1px_-1px_1px_rgb(255_255_255_/_0.05)] cursor-default group">
                Made with <span className="inline-block text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.6)] transition-transform duration-300 group-hover:scale-125 group-hover:animate-pulse cursor-pointer">❤️</span> by <span className="font-bold text-zinc-300 hover:text-white transition-colors duration-300">Matany Labs</span>
            </p>

            {/* Premium Gradient Nexus Branding */}
            <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent opacity-80 hover:opacity-100 transition-all duration-500 [text-shadow:_0_0_20px_rgba(56,189,248,0.3)] hover:[text-shadow:_0_0_30px_rgba(56,189,248,0.6)]">
                Powered by NEXUS AI
            </p>
        </footer>
    );
};
