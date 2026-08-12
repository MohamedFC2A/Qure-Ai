"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowRight, Home, LogIn, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function AuthCodeError() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkExistingSession = async () => {
            try {
                const supabase = createClient();
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    router.replace("/scan");
                    return;
                }
            } catch (err) {
                console.warn("[AuthCodeError] Session check warning:", err);
            } finally {
                setChecking(false);
            }
        };

        checkExistingSession();
    }, [router]);

    if (checking) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
                <div className="flex items-center gap-3 text-slate-400 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                    <span>جاري التحقق من حالة الجلسة... / Checking session...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center pt-20 pb-12 px-4">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center shadow-xl">
                <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 text-amber-400">
                    <ShieldAlert className="w-7 h-7" />
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    تأكيد رابط الدخول
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
                    انتهت صلاحية الرابط أو تم استخدامه مسبقاً. إذا تم تفعيل حسابك، يمكنك تسجيل الدخول مباشرة بكلمة المرور الخاصة بك.
                </p>

                <div className="space-y-3">
                    <Link href="/login" className="block w-full">
                        <Button className="w-full font-bold text-sm" size="md">
                            <LogIn className="w-4 h-4 me-2" />
                            <span>تسجيل الدخول / Sign In</span>
                        </Button>
                    </Link>

                    <Link href="/" className="block w-full">
                        <Button variant="outline" className="w-full text-xs text-slate-300 hover:text-white border-slate-800 hover:bg-slate-800/60" size="md">
                            <Home className="w-4 h-4 me-2" />
                            <span>الصفحة الرئيسية / Home</span>
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
