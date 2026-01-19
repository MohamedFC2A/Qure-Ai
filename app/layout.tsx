import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import clsx from "clsx";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "MedVision AI | Pharmaceutical Analysis",
    description: "Advanced AI-powered medication analysis and pharmaceutical intelligence.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={clsx(inter.className, "min-h-screen relative")} suppressHydrationWarning>
                <LiquidBackground />
                <Navbar />
                {children}
            </body>
        </html>
    );
}
