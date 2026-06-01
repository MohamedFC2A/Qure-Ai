export default function AuthLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--q-base)] p-4">
            <div className="w-full max-w-md space-y-6 animate-fade-in">
                {/* Logo skeleton */}
                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 rounded-2xl skeleton" />
                </div>

                {/* Form fields */}
                <div className="space-y-4">
                    <div className="h-14 rounded-xl skeleton" />
                    <div className="h-14 rounded-xl skeleton" />
                </div>

                {/* Button */}
                <div className="h-14 rounded-xl skeleton" />
            </div>
        </div>
    );
}