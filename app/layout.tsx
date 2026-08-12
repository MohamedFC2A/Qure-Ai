import type { Metadata, Viewport } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import clsx from "clsx";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
import { Navbar } from "@/components/Navbar";
import { SettingsProvider } from "@/context/SettingsContext";
import { UserProvider } from "@/context/UserContext";
import { ScanProvider } from "@/context/ScanContext";
import { GoogleAdsense } from "@/components/GoogleAdsense";
import { Footer } from "@/components/Footer";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

const cairo = Cairo({
    subsets: ["arabic", "latin"],
    variable: "--font-cairo",
    display: "swap",
    weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    themeColor: "#030712",
    colorScheme: "dark",
};

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://qurescan.com"),
    title: {
        default: "QureScan | منصة تحليل الأدوية والذكاء الصيدلاني",
        template: "%s | QureScan",
    },
    description: "منصة ذكاء طبي وصيدلاني متقدمة لتحليل الأدوية والتحقق من السلامة الدوائية والتداخلات الطبية فورياً.",
    keywords: [
        "medication analysis",
        "تحليل أدوية",
        "تداخلات دوائية",
        "سلامة صيدلانية",
        "openFDA",
        "AI Healthcare",
        "QureScan"
    ],
    authors: [{ name: "Qure AI", url: "https://qurescan.com" }],
    creator: "Qure AI",
    publisher: "QureScan Inc.",
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    openGraph: {
        title: "QureScan | منصة تحليل الأدوية والذكاء الصيدلاني",
        description: "تحليل الملصقات والوصفات الطبية بالذكاء الاصطناعي مع كشف التداخلات الدوائية والتحقق من قواعد FDA.",
        url: "https://qurescan.com",
        siteName: "QureScan",
        locale: "ar_SA",
        alternateLocale: ["en_US"],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "QureScan — Pharmaceutical Safety Intelligence",
        description: "Advanced AI-powered medication analysis and clinical safety guard.",
        creator: "@QureScan",
    },
};

const jsonLdSchema = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "SoftwareApplication",
            "name": "QureScan",
            "operatingSystem": "All",
            "applicationCategory": "HealthApplication",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "1250"
            },
            "description": "Advanced AI-powered medication label analysis and clinical drug interaction checker."
        },
        {
            "@type": "MedicalWebPage",
            "name": "QureScan Pharmaceutical Intelligence",
            "aspect": ["Diagnosis", "Treatment"],
            "medicalAudience": "Patient",
            "publisher": {
                "@type": "Organization",
                "name": "QureScan Inc.",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://qurescan.com/icon.svg"
                }
            }
        }
    ]
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ar" dir="rtl" className={clsx(inter.variable, cairo.variable)} suppressHydrationWarning>
            <head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
                />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){if(typeof window!=='undefined'){var removeAttr=function(node){if(node&&node.removeAttribute&&node.hasAttribute('bis_skin_checked')){node.removeAttribute('bis_skin_checked');}};var obs=new MutationObserver(function(mutations){mutations.forEach(function(m){if(m.type==='attributes'&&m.attributeName==='bis_skin_checked'){m.target.removeAttribute('bis_skin_checked');}if(m.addedNodes){m.addedNodes.forEach(function(n){removeAttr(n);});}});});obs.observe(document.documentElement,{attributes:true,childList:true,subtree:true,attributeFilter:['bis_skin_checked']});}})();`,
                    }}
                />
            </head>
            <body
                className={clsx(
                    cairo.className,
                    "min-h-screen relative flex flex-col justify-between overflow-x-hidden bg-[#030712] text-slate-100 antialiased selection:bg-[#06b6d4]/30 selection:text-white"
                )}
                suppressHydrationWarning
            >
                <GoogleAdsense pId="8970399272088568" />
                <LiquidBackground />
                <SettingsProvider>
                    <UserProvider>
                        <ScanProvider>
                            <Navbar />
                            <div className="flex-1 w-full pb-16 md:pb-0" suppressHydrationWarning>
                                {children}
                            </div>
                            <Footer />
                        </ScanProvider>
                    </UserProvider>
                </SettingsProvider>
            </body>
        </html>
    );
}
