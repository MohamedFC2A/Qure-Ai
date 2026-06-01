export default function ScanLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--q-base)] p-4">
            <div className="w-full max-w-4xl space-y-6 animate-fade-in">
                {/* Scanner header skeleton */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl skeleton" />
                    <div className="space-y-2">
                        <div className="h-7 w-48 skeleton rounded" />
                        <div className="h-4 w-32 skeleton rounded" />
                    </div>
                </div>

                {/* Upload area skeleton */}
                <div className="w-full aspect-video max-h-[500px] rounded-2xl skeleton flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-white/20">
                        <div className="w-16 h-16 rounded-full skeleton" />
                        <div className="h-4 w-40 skeleton rounded" />
                    </div>
                </div>

                {/* Scan button skeleton */}
                <div className="h-14 w-full max-w-md mx-auto rounded-2xl skeleton" />

                {/* Info cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 rounded-xl skeleton" />
                    ))}
                </div>
            </div>
        </div>
    );
}