"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/profile?tab=settings");
    }, [router]);

    return (
        <div className="min-h-screen pt-24 flex justify-center items-center">
            <div className="animate-spin w-8 h-8 border-2 border-cyan-400 rounded-full border-t-transparent" />
        </div>
    );
}
