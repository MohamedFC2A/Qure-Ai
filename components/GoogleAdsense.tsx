"use client";

import Script from "next/script";

type Props = {
    pId: string;
};

export const GoogleAdsense = ({ pId }: Props) => {
    if (!pId) return null;

    return (
        <Script
            id="adsbygoogle-init"
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-${pId}`}
            crossOrigin="anonymous"
        />
    );
};
