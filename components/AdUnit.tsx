"use client";

import { useEffect, useRef } from "react";

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

export const AdUnit = () => {
    const adRef = useRef<HTMLModElement | null>(null);

    useEffect(() => {
        if (process.env.NODE_ENV !== "production") return;
        if (!adRef.current) return;
        if (adRef.current.dataset.adsbygoogleStatus === "done") return;

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e || "");
            if (!message.includes("already have ads")) {
                console.warn("AdSense unavailable:", message);
            }
        }
    }, []);

    return (
        <div className="w-full my-4 overflow-hidden rounded-xl border border-white/10 bg-black/20">
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={{ display: "block" }}
                data-ad-format="fluid"
                data-ad-layout-key="-fi-1j-1t-1p+la"
                data-ad-client="ca-pub-8970399272088568"
                data-ad-slot="4140965413"
            />
        </div>
    );
};
