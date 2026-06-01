import { Suspense } from "react";
import { AiChatPage } from "@/components/ai/AiChatPage";

export const metadata = {
    title: "NEXUS AI — Qure Ai",
    description: "Your intelligent health & medication assistant powered by NEXUS AI.",
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
