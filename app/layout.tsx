import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import clsx from "clsx";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
import { Navbar } from "@/components/Navbar";
import { SettingsProvider } from "@/context/SettingsContext";
import { UserProvider } from "@/context/UserContext";
import { ScanProvider } from "@/context/ScanContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Qure Ai | Pharmaceutical Analysis",
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
                <SettingsProvider>
                    <UserProvider>
                        <ScanProvider>
                            <Navbar />
                            <div className="pb-28 sm:pb-0">
                                {children}
                            </div>
                        </ScanProvider>
                    </UserProvider>
                </SettingsProvider>
            </body>
        </html>
    );
}
