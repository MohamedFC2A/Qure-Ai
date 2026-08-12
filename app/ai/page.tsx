import { Suspense } from "react";
import { AiChatPage } from "@/components/ai/AiChatPage";

export const metadata = {
    title: "Aura-OS Ai (AOS AI) — QureScan",
    description: "Your intelligent clinical health & medication assistant powered by Aura-OS Ai (AOS AI).",
};

export default function AiPage() {
    return (
        <Suspense fallback={<AiPageLoading />}>
            <AiChatPage />
        </Suspense>
    );
}

function AiPageLoading() {
    return (
        <main className="min-h-screen pt-20 px-4">
            <div className="mx-auto max-w-4xl space-y-4 mt-8">
                <div className="h-12 skeleton rounded-2xl" />
                <div className="h-[60vh] skeleton rounded-2xl" />
                <div className="h-14 skeleton rounded-2xl" />
            </div>
        </main>
    );
}
