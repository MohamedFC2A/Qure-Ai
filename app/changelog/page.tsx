import { Suspense } from "react";
import { ChangelogView } from "@/components/changelog/ChangelogView";

export const metadata = {
    title: "Changelog & Updates — QureScan",
    description: "Real-time automated product changelog and release history for QureScan.",
};

export default function ChangelogPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen pt-24 px-4 max-w-4xl mx-auto">
                <div className="h-12 skeleton rounded-2xl mb-6" />
                <div className="h-96 skeleton rounded-3xl" />
            </main>
        }>
            <ChangelogView />
        </Suspense>
    );
}
