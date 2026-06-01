export default function HistoryLoading() {
    return (
        <div className="min-h-screen bg-[var(--q-base)] p-4 md:p-8 animate-fade-in">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl skeleton" />
                    <div className="space-y-2">
                        <div className="h-8 w-48 skeleton rounded" />
                        <div className="h-4 w-32 skeleton rounded" />
                    </div>
                </div>

                {/* Search/Filter bar */}
                <div className="h-12 w-full rounded-xl skeleton" />

                {/* History cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="rounded-xl skeleton" style={{ height: '200px' }} />
                    ))}
                </div>
            </div>
        </div>
    );
}