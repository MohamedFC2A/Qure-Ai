import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import clsx from "clsx";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
import { Navbar } from "@/components/Navbar";
import { SettingsProvider } from "@/context/SettingsContext";
import { UserProvider } from "@/context/UserContext";
import { ScanProvider } from "@/context/ScanContext";
import { GoogleAdsense } from "@/components/GoogleAdsense";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" });

export const metadata: Metadata = {
    title: "Qure Ai | تحليل الأدوية الذكي | Pharmaceutical Analysis",
    description: "QURE AI — منصة ذكاء طبي لتحليل الأدوية والتحقق من السلامة الدوائية. Advanced AI-powered medication analysis and pharmaceutical intelligence.",
    keywords: ["medication analysis", "تحليل أدوية", "AI", "pharmaceutical", "safety"],
    openGraph: {
        title: "Qure Ai | تحليل الأدوية الذكي",
        description: "منصة ذكاء طبي متقدمة لتحليل الأدوية والتحقق من السلامة الدوائية",
        locale: "ar_SA",
        alternateLocale: ["en_US"],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Qure Ai — Medication Intelligence",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ar" dir="rtl" suppressHydrationWarning>
            <head>
                {/* Cairo font for Arabic UI */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body
                className={clsx(inter.className, inter.variable, "min-h-screen relative")}
                suppressHydrationWarning
            >
                <GoogleAdsense pId="8970399272088568" />
                <LiquidBackground />
                <SettingsProvider>
                    <UserProvider>
                        <ScanProvider>
                            <Navbar />
                            <div className="pb-28 sm:pb-0 min-h-[calc(100vh-80px)]">
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
