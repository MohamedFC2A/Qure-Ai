export default function PricingLoading() {
    return (
        <div className="min-h-screen bg-[var(--q-base)] p-4 md:p-8 animate-fade-in">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="h-10 w-64 skeleton rounded mx-auto" />
                    <div className="h-5 w-96 skeleton rounded mx-auto" />
                </div>

                {/* Pricing cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-2xl skeleton" style={{ height: '450px' }} />
                    ))}
                </div>
            </div>
        </div>
    );
}