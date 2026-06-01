export default function RootLoading() {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[var(--q-base)] z-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 animate-pulse" />
                <div className="flex gap-1.5 mt-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
}