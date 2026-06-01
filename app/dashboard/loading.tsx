export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-[var(--q-base)] p-4 md:p-8 animate-fade-in">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl skeleton" />
                    <div className="space-y-2">
                        <div className="h-8 w-56 skeleton rounded" />
                        <div className="h-4 w-36 skeleton rounded" />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-48 rounded-2xl skeleton" />
                    ))}
                </div>

                {/* History Section */}
                <div className="space-y-4">
                    <div className="h-6 w-40 skeleton rounded" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-32 rounded-xl skeleton" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}