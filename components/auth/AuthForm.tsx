"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Lock, Github, AlertCircle, Fingerprint, Calendar, User, Ruler, Weight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { TERMS_VERSION, safeNextPath } from "@/lib/legal/terms";
import { useSettings } from "@/context/SettingsContext";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const signupSchema = loginSchema.extend({
    username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(20, "Username must be 20 characters or less")
        .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
    age: z.coerce.number().int().min(1, "Please enter a valid age").max(120, "Please enter a valid age"),
    gender: z.enum(["male", "female", "other"], { message: "Please select your gender" }),
    heightCm: z.coerce.number().int().min(50, "Please enter a valid height").max(250, "Please enter a valid height"),
    weightKg: z.coerce.number().min(10, "Please enter a valid weight").max(500, "Please enter a valid weight"),
    agreeToTerms: z.literal(true, { message: "You must agree to the Terms & Disclaimer." }),
});

type AuthFormData = {
    email: string;
    password: string;
    username?: string;
    age?: number;
    gender?: "male" | "female" | "other";
    heightCm?: number;
    weightKg?: number;
    agreeToTerms?: boolean;
};

interface AuthFormProps {
    type: "login" | "signup";
}

export const AuthForm = ({ type }: AuthFormProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();
    const schema = type === "signup" ? signupSchema : loginSchema;
    const isLocalDev = process.env.NODE_ENV === "development";
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const getNextPath = () => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            return safeNextPath(params.get("next"), "/scan");
        }
        return "/scan";
    };

    const getCallbackUrl = () => {
        if (typeof window === "undefined") return "";
        const origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
        const url = new URL("/auth/callback", origin);
        url.searchParams.set("next", getNextPath());
        return url.toString();
    };

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AuthFormData>({
        resolver: zodResolver(schema) as any,
    });

    const onSubmit = async (data: AuthFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            let result;
            if (type === "signup") {
                const callbackUrl = getCallbackUrl();
                if (!callbackUrl) throw new Error("Missing callback URL. Please refresh and try again.");

                result = await supabase.auth.signUp({
                    email: data.email,
                    password: data.password,
                    options: {
                        emailRedirectTo: callbackUrl,
                        data: {
                            username: data.username!,
                            age: data.age!,
                            gender: data.gender!,
                            height: `${data.heightCm!} cm`,
                            weight: `${data.weightKg!} kg`,
                            terms_accepted_at: new Date().toISOString(),
                            terms_version: TERMS_VERSION,
                        },
                    },
                });
            } else {
                result = await supabase.auth.signInWithPassword({
                    email: data.email,
                    password: data.password,
                });
            }

            if (result.error) {
                throw result.error;
            }

            if (type === "signup" && result.data.user && !result.data.session) {
                setError(t("Please check your email to confirm your account.", "يرجى التحقق من بريدك الإلكتروني لتأكيد حسابك."));
                setIsLoading(false);
                return;
            }

            router.push(getNextPath());
            router.refresh();
        } catch (err: any) {
            setError(err.message || t("An error occurred during authentication", "حدث خطأ أثناء تسجيل الدخول"));
            console.error("Auth error:", err);
            setIsLoading(false);
        }
    };

    const handleOAuthLogin = async (provider: 'google' | 'github') => {
        setIsLoading(true);
        setError(null);
        try {
            const callbackUrl = getCallbackUrl();
            if (!callbackUrl) throw new Error("Missing callback URL. Please refresh and try again.");
            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: callbackUrl,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(t(`Failed to sign in with ${provider}`, `فشل تسجيل الدخول عبر ${provider === 'google' ? 'جوجل' : 'جيت هاب'}`));
            setIsLoading(false);
            console.error("OAuth error:", err);
        }
    };

    const handleLocalDevLogin = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/dev/login", { method: "POST" });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || "Failed to prepare local dev login");
            }

            document.cookie = "qurescan_dev_auth=1; path=/; max-age=2592000; samesite=lax";

            if (payload.mode === "offline") {
                window.location.href = getNextPath();
                return;
            }

            const result = await supabase.auth.signInWithPassword({
                email: payload.email,
                password: payload.password,
            });

            if (result.error) {
                if (result.error.message.includes("Invalid login credentials") || result.error.message.includes("Email not confirmed")) {
                    const signupRes = await supabase.auth.signUp({
                        email: payload.email,
                        password: payload.password,
                        options: {
                            data: { username: "LocalDevUser" }
                        }
                    });
                    if (signupRes.error) throw signupRes.error;
                    window.location.href = getNextPath();
                    return;
                }
                throw result.error;
            }

            window.location.href = getNextPath();
        } catch (err: any) {
            setError(err.message || "Failed local dev login");
            setIsLoading(false);
            console.error("Local dev auth error:", err);
        }
    };

    return (
        <GlassCard className="w-full max-w-md p-6 sm:p-8" hoverEffect={false}>
            <div className="space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                        {type === "login" ? t("Welcome Back", "مرحبًا بعودتك") : t("Create Account", "إنشاء حساب")}
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1.5 leading-relaxed">
                        {type === "login"
                            ? t("Enter your credentials to access your workspace", "أدخل بيانات الدخول للوصول إلى مساحة عملك")
                            : t("Set up your account for medication analysis and safety review", "أنشئ حسابك لتحليل الأدوية ومراجعة السلامة")}
                    </p>
                </div>

                {error && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-rose-200 leading-relaxed">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 ms-1">{t("Email", "البريد الإلكتروني")}</label>
                        <div className="relative">
                            <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <input
                                {...register("email")}
                                type="email"
                                className="clinical-input ps-10 pe-4 py-2.5 text-xs sm:text-sm"
                                placeholder={t("user@example.com", "user@example.com")}
                            />
                        </div>
                        {errors.email && (
                            <p className="text-rose-400 text-xs ms-1">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 ms-1">{t("Password", "كلمة المرور")}</label>
                        <div className="relative">
                            <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <input
                                {...register("password")}
                                type="password"
                                className="clinical-input ps-10 pe-4 py-2.5 text-xs sm:text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                        {errors.password && (
                            <p className="text-rose-400 text-xs ms-1">{errors.password.message}</p>
                        )}
                    </div>

                    {/* Signup extra fields */}
                    {type === "signup" && (
                        <div className="space-y-4 pt-1">
                            {/* Username */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-300 ms-1">{t("Username", "اسم المستخدم")}</label>
                                <div className="relative">
                                    <Fingerprint className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    <input
                                        {...register("username")}
                                        className="clinical-input ps-10 pe-4 py-2.5 text-xs sm:text-sm"
                                        placeholder={t("e.g. Alien_X", "مثال: Alien_X")}
                                        autoComplete="username"
                                    />
                                </div>
                                {errors.username && (
                                    <p className="text-rose-400 text-xs ms-1">{errors.username.message}</p>
                                )}
                            </div>

                            {/* Age & Gender */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-300 ms-1">{t("Age", "العمر")}</label>
                                    <div className="relative">
                                        <Calendar className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        <input
                                            {...register("age")}
                                            type="number"
                                            inputMode="numeric"
                                            className="clinical-input ps-10 pe-4 py-2.5 text-xs sm:text-sm"
                                            placeholder="25"
                                            min={1}
                                            max={120}
                                        />
                                    </div>
                                    {errors.age && (
                                        <p className="text-rose-400 text-xs ms-1">{errors.age.message}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-300 ms-1">{t("Gender", "الجنس")}</label>
                                    <div className="relative">
                                        <User className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        <select
                                            {...register("gender")}
                                            className="clinical-input ps-10 pe-8 py-2.5 text-xs sm:text-sm appearance-none bg-slate-900"
                                            defaultValue=""
                                        >
                                            <option value="" disabled className="bg-slate-900 text-slate-500">
                                                {t("Select...", "اختر...")}
                                            </option>
                                            <option value="male" className="bg-slate-900">{t("Male", "ذكر")}</option>
                                            <option value="female" className="bg-slate-900">{t("Female", "أنثى")}</option>
                                            <option value="other" className="bg-slate-900">{t("Other", "آخر")}</option>
                                        </select>
                                    </div>
                                    {errors.gender && (
                                        <p className="text-rose-400 text-xs ms-1">{errors.gender.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Height & Weight */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-300 ms-1">{t("Height (cm)", "الطول (سم)")}</label>
                                    <div className="relative">
                                        <Ruler className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        <input
                                            {...register("heightCm")}
                                            type="number"
                                            inputMode="numeric"
                                            className="clinical-input ps-10 pe-4 py-2.5 text-xs sm:text-sm"
                                            placeholder="180"
                                            min={50}
                                            max={250}
                                        />
                                    </div>
                                    {errors.heightCm && (
                                        <p className="text-rose-400 text-xs ms-1">{errors.heightCm.message}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-300 ms-1">{t("Weight (kg)", "الوزن (كجم)")}</label>
                                    <div className="relative">
                                        <Weight className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        <input
                                            {...register("weightKg")}
                                            type="number"
                                            inputMode="decimal"
                                            className="clinical-input ps-10 pe-4 py-2.5 text-xs sm:text-sm"
                                            placeholder="75"
                                            min={10}
                                            max={500}
                                            step="0.1"
                                        />
                                    </div>
                                    {errors.weightKg && (
                                        <p className="text-rose-400 text-xs ms-1">{errors.weightKg.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Terms */}
                            <div className="p-3.5 rounded-xl bg-amber-400/10 border border-amber-400/20">
                                <div className="flex items-start gap-2.5">
                                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                    <div className="min-w-0">
                                        <p className="text-xs text-white font-bold">{t("Terms & Disclaimer", "الشروط وإخلاء المسؤولية")}</p>
                                        <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                                            {t(
                                                "This app provides informational review. Always verify with a clinician/pharmacist.",
                                                "هذا التطبيق يوفر مراجعة إرشادية. تأكد دائمًا مع الطبيب أو الصيدلاني."
                                            )}
                                        </p>
                                        <div className="mt-2.5 flex items-start gap-2">
                                            <input
                                                id="agreeToTerms"
                                                type="checkbox"
                                                className="mt-0.5 h-3.5 w-3.5 rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-0"
                                                {...register("agreeToTerms")}
                                            />
                                            <label htmlFor="agreeToTerms" className="text-xs text-slate-300 select-none">
                                                {t("I agree to the", "أوافق على")}{" "}
                                                <Link href="/terms" className="text-cyan-300 hover:underline font-semibold">
                                                    {t("Terms & Disclaimer", "الشروط والإخلاء")}
                                                </Link>
                                            </label>
                                        </div>
                                        {errors.agreeToTerms && (
                                            <p className="text-rose-400 text-xs mt-1.5">{String(errors.agreeToTerms.message || "")}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <Button type="submit" className="w-full font-bold mt-2" size="md" isLoading={isLoading} glow>
                        {type === "login" ? t("Sign In", "تسجيل الدخول") : t("Create Account", "إنشاء حساب")}
                    </Button>
                </form>

                {/* Social Login & Local Dev */}
                <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
                    {isLocalDev && (
                        <Button
                            variant="outline"
                            className="w-full border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20 text-xs font-semibold"
                            onClick={handleLocalDevLogin}
                            disabled={isLoading}
                        >
                            <User className="w-4 h-4 me-2" />
                            <span>{t("Local Dev Login", "دخول المطور المحلي")}</span>
                        </Button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <Button variant="outline" className="w-full text-xs font-medium border-white/10" onClick={() => handleOAuthLogin('github')} disabled={isLoading}>
                            <Github className="w-4 h-4 me-2" />
                            <span>Github</span>
                        </Button>
                        <Button variant="outline" className="w-full text-xs font-medium border-white/10" onClick={() => handleOAuthLogin('google')} disabled={isLoading}>
                            <svg className="w-4 h-4 me-2 shrink-0" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span>Google</span>
                        </Button>
                    </div>
                </div>

                <div className="mt-4 text-center text-xs text-slate-400">
                    {type === "login" ? (
                        <>
                            {t("Don't have an account?", "ليس لديك حساب؟")}{" "}
                            <Link href="/signup" className="text-cyan-300 hover:underline font-semibold">
                                {t("Sign up", "اشتراك")}
                            </Link>
                        </>
                    ) : (
                        <>
                            {t("Already have an account?", "لديك حساب بالفعل؟")}{" "}
                            <Link href="/login" className="text-cyan-300 hover:underline font-semibold">
                                {t("Log in", "تسجيل الدخول")}
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </GlassCard>
    );
};