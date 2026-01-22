"use client";

import { useEffect } from "react";

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

export const AdUnit = () => {
    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error("AdSense error:", e);
        }
    }, []);

    return (
        <div className="w-full my-4 overflow-hidden rounded-xl border border-white/10 bg-black/20">
            <ins
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
