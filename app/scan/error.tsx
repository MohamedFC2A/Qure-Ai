"use client";

export default function ScanError({ error, reset }: { error: Error; reset: () => void }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--q-base)] p-4">
            <div className="text-center space-y-6 max-w-md animate-fade-in">
                <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
                    <svg className="w-10 h-10 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">Scan Error</h2>
                <p className="text-white/40 text-sm">Failed to load the scanner. Please try again.</p>
                <button
                    onClick={reset}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}