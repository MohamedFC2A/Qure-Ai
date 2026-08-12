"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Mail,
    Lock,
    Github,
    AlertCircle,
    CheckCircle2,
    Fingerprint,
    Calendar,
    User,
    Ruler,
    Weight,
    Eye,
    EyeOff,
    ArrowRight,
    RotateCw,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { TERMS_VERSION, safeNextPath } from "@/lib/legal/terms";
import { useSettings } from "@/context/SettingsContext";

const loginSchema = z.object({
    email: z
        .string()
        .min(1, "Please enter your email address")
        .email("Please enter a valid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters"),
});

const signupSchema = loginSchema.extend({
    username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(20, "Username must be 20 characters or less")
        .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
    age: z.coerce
        .number()
        .int("Age must be a whole number")
        .min(1, "Age must be at least 1")
        .max(120, "Please enter a valid age"),
    gender: z.enum(["male", "female", "other"], {
        message: "Please select your gender",
    }),
    heightCm: z.coerce
        .number()
        .int("Height must be a whole number")
        .min(50, "Height must be at least 50 cm")
        .max(250, "Height must be under 250 cm"),
    weightKg: z.coerce
        .number()
        .min(10, "Weight must be at least 10 kg")
        .max(500, "Weight must be under 500 kg"),
    agreeToTerms: z.literal(true, {
        message: "You must agree to the Terms & Disclaimer to continue.",
    }),
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

function AuthFormContent({ type }: AuthFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
    const [resendCooldown, setResendCooldown] = useState<number>(0);
    const [resending, setResending] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();
    const schema = type === "signup" ? signupSchema : loginSchema;
    const isLocalDev = process.env.NODE_ENV === "development";
    const { resultsLanguage } = useSettings();
    const isArabic = resultsLanguage === "ar";
    const t = (en: string, ar: string) => (isArabic ? ar : en);

    const getNextPath = () => {
        const nextParam = searchParams.get("next");
        return safeNextPath(nextParam, "/scan");
    };

    const getCallbackUrl = () => {
        if (typeof window === "undefined") return "";
        const origin = window.location.origin || process.env.NEXT_PUBLIC_SITE_URL || "";
        const url = new URL("/auth/callback", origin);
        url.searchParams.set("next", getNextPath());
        return url.toString();
    };

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<AuthFormData>({
        resolver: zodResolver(schema) as any,
    });

    const watchPassword = watch("password", "");

    // Handle incoming URL parameters (e.g. ?verified=true, ?auth_error=..., ?email=...)
    useEffect(() => {
        const verified = searchParams.get("verified");
        const authError = searchParams.get("auth_error");
        const emailParam = searchParams.get("email");

        if (verified === "true") {
            setSuccessMessage(
                t(
                    "✓ Email verified successfully! Please enter your password to sign in.",
                    "✓ تم تأكيد البريد الإلكتروني بنجاح! يرجى إدخال كلمة المرور لتسجيل الدخول."
                )
            );
        }

        if (authError) {
            setError(
                decodeURIComponent(authError) ||
                    t("Authentication issue occurred. Please sign in.", "حدثت مشكلة أثناء التحقق. يرجى تسجيل الدخول.")
            );
        }

        if (emailParam) {
            setValue("email", decodeURIComponent(emailParam));
        }
    }, [searchParams, setValue, isArabic]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => {
            setResendCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    // Live session detection while waiting for email confirmation
    useEffect(() => {
        if (!registeredEmail) return;

        let isMounted = true;

        // 1. Listen for auth state changes from Supabase
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            if (session && isMounted) {
                setSuccessMessage(
                    isArabic
                        ? "✓ تم تفعيل الحساب وتأكيد البريد بنجاح! جاري تحويلك..."
                        : "✓ Account verified successfully! Redirecting..."
                );
                setTimeout(() => {
                    router.push(getNextPath());
                    router.refresh();
                }, 800);
            }
        });

        // 2. Poll for session periodically (every 3 seconds) in case link was opened in another window or device
        const interval = setInterval(async () => {
            if (!isMounted) return;
            const { data: { session } } = await supabase.auth.getSession();
            if (session && isMounted) {
                setSuccessMessage(
                    isArabic
                        ? "✓ تم تفعيل الحساب بنجاح! جاري تحويلك..."
                        : "✓ Account verified successfully! Redirecting..."
                );
                clearInterval(interval);
                setTimeout(() => {
                    router.push(getNextPath());
                    router.refresh();
                }, 800);
            }
        }, 3000);

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            clearInterval(interval);
        };
    }, [registeredEmail, router, isArabic]);

    const handleResendEmail = async () => {
        if (!registeredEmail || resendCooldown > 0 || resending) return;
        setResending(true);
        setError(null);
        setInfoMessage(null);
        try {
            const callbackUrl = getCallbackUrl();
            
            // Call server signup endpoint to resend via Resend/SMTP/Supabase
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: registeredEmail,
                    password: watchPassword || "TempPassword123!",
                    redirectTo: callbackUrl,
                }),
            });

            if (res.ok) {
                setInfoMessage(
                    t(
                        "A new confirmation link has been sent to your email.",
                        "تم إرسال رابط تأكيد جديد إلى بريدك الإلكتروني بنجاح."
                    )
                );
                setResendCooldown(60);
            } else {
                // Fallback to client SDK resend
                const { error: resendErr } = await supabase.auth.resend({
                    type: "signup",
                    email: registeredEmail,
                    options: {
                        emailRedirectTo: callbackUrl,
                    },
                });
                if (resendErr) throw resendErr;
                setInfoMessage(
                    t(
                        "A new confirmation link has been sent to your email.",
                        "تم إرسال رابط تأكيد جديد إلى بريدك الإلكتروني بنجاح."
                    )
                );
                setResendCooldown(60);
            }
        } catch (err: any) {
            setError(err.message || t("Failed to resend email.", "فشل إعادة إرسال البريد."));
        } finally {
            setResending(false);
        }
    };

    const onSubmit = async (data: AuthFormData) => {
        setIsLoading(true);
        setError(null);
        setInfoMessage(null);
        setSuccessMessage(null);

        const cleanEmail = data.email.trim().toLowerCase();
        const cleanPassword = data.password;

        try {
            if (type === "signup") {
                const callbackUrl = getCallbackUrl();
                if (!callbackUrl) {
                    throw new Error("Missing callback URL. Please refresh the page and try again.");
                }

                // 1. Try robust server-side registration route (multi-channel email dispatch)
                try {
                    const response = await fetch("/api/auth/signup", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: cleanEmail,
                            password: cleanPassword,
                            username: data.username?.trim(),
                            age: data.age,
                            gender: data.gender,
                            heightCm: data.heightCm,
                            weightKg: data.weightKg,
                            redirectTo: callbackUrl,
                        }),
                    });

                    const payload = await response.json();

                    if (!response.ok) {
                        throw new Error(payload.error || "Failed to create account.");
                    }

                    if (payload.alreadyRegistered) {
                        setError(
                            t(
                                "This email is already registered. Please sign in with your password.",
                                "هذا البريد الإلكتروني مسجل مسبقاً! يرجى تسجيل الدخول مباشرة بكلمة المرور الخاصة بك."
                            )
                        );
                        setIsLoading(false);
                        return;
                    }

                    // Hide signup form and show dedicated waiting screen
                    setRegisteredEmail(cleanEmail);
                    setResendCooldown(60);
                    setIsLoading(false);
                    return;
                } catch (serverErr: any) {
                    console.warn("[AuthForm] Server signup route fallback:", serverErr.message);
                    
                    // Fallback to direct client SDK signUp
                    const result = await supabase.auth.signUp({
                        email: cleanEmail,
                        password: cleanPassword,
                        options: {
                            emailRedirectTo: callbackUrl,
                            data: {
                                username: data.username?.trim(),
                                age: Number(data.age),
                                gender: data.gender,
                                height: `${data.heightCm} cm`,
                                weight: `${data.weightKg} kg`,
                                terms_accepted_at: new Date().toISOString(),
                                terms_version: TERMS_VERSION,
                            },
                        },
                    });

                    if (result.error) {
                        throw result.error;
                    }

                    // Detect already registered with empty identities
                    if (result.data.user && Array.isArray(result.data.user.identities) && result.data.user.identities.length === 0) {
                        setError(
                            t(
                                "This email is already registered. Please sign in with your password.",
                                "هذا البريد الإلكتروني مسجل مسبقاً! يرجى تسجيل الدخول مباشرة بكلمة المرور الخاصة بك."
                            )
                        );
                        setIsLoading(false);
                        return;
                    }

                    if (result.data.user && !result.data.session) {
                        setRegisteredEmail(cleanEmail);
                        setResendCooldown(60);
                        setIsLoading(false);
                        return;
                    }

                    router.push(getNextPath());
                    router.refresh();
                }
            } else {
                const result = await supabase.auth.signInWithPassword({
                    email: cleanEmail,
                    password: cleanPassword,
                });

                if (result.error) {
                    if (result.error.message.toLowerCase().includes("email not confirmed")) {
                        throw new Error(
                            t(
                                "Your email is not confirmed yet. Please check your inbox for the confirmation link.",
                                "لم يتم تأكيد بريدك الإلكتروني بعد. يرجى مراجعة صندوق الوارد للضغط على رابط التأكيد."
                            )
                        );
                    }
                    if (result.error.message.toLowerCase().includes("invalid login credentials")) {
                        throw new Error(
                            t(
                                "Invalid email or password. Please check your credentials and try again.",
                                "البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التحقق وإعادة المحاولة."
                            )
                        );
                    }
                    throw result.error;
                }

                router.push(getNextPath());
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || t("An error occurred during authentication", "حدث خطأ أثناء المصادقة"));
            console.error("Auth error:", err);
            setIsLoading(false);
        }
    };

    const handleOAuthLogin = async (provider: "google" | "github") => {
        setIsLoading(true);
        setError(null);
        setInfoMessage(null);
        try {
            const callbackUrl = getCallbackUrl();
            if (!callbackUrl) {
                throw new Error("Missing callback URL. Please refresh and try again.");
            }
            const { error: oAuthErr } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: callbackUrl,
                },
            });
            if (oAuthErr) throw oAuthErr;
        } catch (err: any) {
            setError(
                t(
                    `Failed to sign in with ${provider}: ${err?.message || ""}`,
                    `فشل تسجيل الدخول عبر ${provider === "google" ? "جوجل" : "جيت هاب"}: ${err?.message || ""}`
                )
            );
            setIsLoading(false);
            console.error("OAuth error:", err);
        }
    };

    const handleLocalDevLogin = async () => {
        setIsLoading(true);
        setError(null);
        setInfoMessage(null);

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
                if (
                    result.error.message.includes("Invalid login credentials") ||
                    result.error.message.includes("Email not confirmed")
                ) {
                    const signupRes = await supabase.auth.signUp({
                        email: payload.email,
                        password: payload.password,
                        options: {
                            data: { username: "LocalDevUser" },
                        },
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

    // If registered and awaiting email confirmation: Show dedicated clean confirmation state
    if (registeredEmail) {
        return (
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-6">
                <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto text-cyan-400">
                    <Mail className="w-7 h-7" />
                </div>

                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-300 font-medium">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                        <span>{t("Waiting for confirmation...", "بانتظار النقر على الرابط...")}</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        {t("Check Your Email", "تحقق من بريدك الإلكتروني")}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {t(
                            "We sent a secure activation link to:",
                            "تم إرسال رابط التفعيل الآمن إلى:"
                        )}
                    </p>
                    <div className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-cyan-300 select-all inline-block max-w-full truncate">
                        {registeredEmail}
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-start space-y-2.5">
                    <div className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                            {t(
                                "Click the link in the email from ANY phone or browser to activate your account and log in automatically.",
                                "اضغط على الرابط في الرسالة من أي هاتف (iPhone أو Android) أو كمبيوتر وسيتم تفعيل حسابك وتسجيل دخولك تلقائياً."
                            )}
                        </span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-slate-400 leading-relaxed">
                        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>
                            {t(
                                "Your profile data and password have been saved securely.",
                                "تم حفظ بياناتك الطبية وكلمة المرور الخاصة بك بأمان تام."
                            )}
                        </span>
                    </div>
                </div>

                {successMessage && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-start">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-emerald-200 leading-relaxed">{successMessage}</p>
                    </div>
                )}

                {infoMessage && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 text-start">
                        {infoMessage}
                    </div>
                )}

                {error && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 text-start">
                        {error}
                    </div>
                )}

                <div className="space-y-3 pt-2">
                    <Button
                        variant="secondary"
                        className="w-full text-xs font-semibold"
                        onClick={handleResendEmail}
                        disabled={resendCooldown > 0 || resending}
                    >
                        <RotateCw className={`w-3.5 h-3.5 me-2 ${resending ? "animate-spin" : ""}`} />
                        <span>
                            {resendCooldown > 0
                                ? t(`Resend Email in ${resendCooldown}s`, `إعادة الإرسال بعد ${resendCooldown} ثانية`)
                                : t("Resend Confirmation Email", "إعادة إرسال رابط التأكيد")}
                        </span>
                    </Button>

                    <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => {
                                setRegisteredEmail(null);
                                setError(null);
                                setInfoMessage(null);
                            }}
                            className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                            {t("← Change Email Address", "← تعديل البريد الإلكتروني")}
                        </button>

                        <Link href={`/login?email=${encodeURIComponent(registeredEmail)}`}>
                            <span className="text-xs text-cyan-400 hover:underline font-semibold">
                                {t("Sign In Directly", "الدخول بكلمة المرور")}
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="space-y-6">
                {/* Header */}
                <div className="text-center space-y-1.5">
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                        {type === "login"
                            ? t("Welcome Back", "مرحبًا بعودتك")
                            : t("Create Account", "إنشاء حساب جديد")}
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                        {type === "login"
                            ? t(
                                  "Enter your credentials to access your workspace",
                                  "أدخل بياناتك للوصول إلى مساحة عملك الطبية"
                              )
                            : t(
                                  "Set up your account for medication safety and clinical analysis",
                                  "أنشئ حسابك لتحليل الأدوية بدقة ومراجعة السلامة الدوائية"
                              )}
                    </p>
                </div>

                {/* Success message banner */}
                {successMessage && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-emerald-200 leading-relaxed">{successMessage}</p>
                    </div>
                )}

                {/* Informational message banner */}
                {infoMessage && (
                    <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-cyan-200 leading-relaxed">{infoMessage}</p>
                    </div>
                )}

                {/* Error banner */}
                {error && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-rose-200 leading-relaxed">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    {/* SECTION 1: ACCOUNT CREDENTIALS */}
                    <div className="space-y-3">
                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-300 ms-1 block">
                                {t("Email Address", "البريد الإلكتروني")}
                            </label>
                            <div className="relative">
                                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                <input
                                    {...register("email")}
                                    type="email"
                                    autoComplete="email"
                                    className="clinical-input ps-9 pe-4 py-2.5 text-xs sm:text-sm bg-slate-950 border-slate-800"
                                    placeholder={t("user@example.com", "name@example.com")}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-rose-400 text-xs ms-1 mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-300 ms-1 block">
                                    {t("Password", "كلمة المرور")}
                                </label>
                                <div className="flex items-center gap-2">
                                    {type === "signup" && (
                                        <span className="text-[11px] text-slate-400">
                                            {t("Min. 8 characters", "8 أحرف كحد أدنى")}
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                                    >
                                        {showPassword ? t("Hide", "إخفاء") : t("Show", "إظهار")}
                                    </button>
                                </div>
                            </div>
                            <div className="relative">
                                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                <input
                                    {...register("password")}
                                    type={showPassword ? "text" : "password"}
                                    autoComplete={type === "signup" ? "new-password" : "current-password"}
                                    className="clinical-input ps-9 pe-10 py-2.5 text-xs sm:text-sm bg-slate-950 border-slate-800"
                                    placeholder={t("Enter your password", "أدخل كلمة المرور")}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none p-1"
                                    title={showPassword ? t("Hide Password", "إخفاء كلمة المرور") : t("Show Password", "إظهار كلمة المرور")}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4 text-cyan-400" />
                                    ) : (
                                        <Eye className="w-4 h-4 text-slate-500" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-rose-400 text-xs ms-1 mt-1">{errors.password.message}</p>
                            )}
                        </div>
                    </div>

                    {/* SECTION 2: SIGNUP PROFILE FIELDS */}
                    {type === "signup" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                            {/* Username */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-300 ms-1 block">
                                    {t("Username", "اسم المستخدم")}
                                </label>
                                <div className="relative">
                                    <Fingerprint className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                    <input
                                        {...register("username")}
                                        className="clinical-input ps-9 pe-4 py-2.5 text-xs sm:text-sm bg-slate-950 border-slate-800"
                                        placeholder={t("e.g. Alex_99", "مثال: Alex_99")}
                                        autoComplete="username"
                                    />
                                </div>
                                {errors.username && (
                                    <p className="text-rose-400 text-xs ms-1 mt-1">{errors.username.message}</p>
                                )}
                            </div>

                            {/* Age & Gender */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-300 ms-1 block">
                                        {t("Age", "العمر")}
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                        <input
                                            {...register("age")}
                                            type="number"
                                            inputMode="numeric"
                                            className="clinical-input ps-9 pe-4 py-2.5 text-xs sm:text-sm bg-slate-950 border-slate-800"
                                            placeholder="25"
                                            min={1}
                                            max={120}
                                        />
                                    </div>
                                    {errors.age && (
                                        <p className="text-rose-400 text-xs ms-1 mt-1">{errors.age.message}</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-300 ms-1 block">
                                        {t("Gender", "الجنس")}
                                    </label>
                                    <div className="relative">
                                        <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                        <select
                                            {...register("gender")}
                                            className="clinical-input ps-9 pe-8 py-2.5 text-xs sm:text-sm appearance-none bg-slate-950 border-slate-800"
                                            defaultValue=""
                                        >
                                            <option value="" disabled className="bg-slate-900 text-slate-500">
                                                {t("Select...", "اختر...")}
                                            </option>
                                            <option value="male" className="bg-slate-900 text-white">
                                                {t("Male", "ذكر")}
                                            </option>
                                            <option value="female" className="bg-slate-900 text-white">
                                                {t("Female", "أنثى")}
                                            </option>
                                            <option value="other" className="bg-slate-900 text-white">
                                                {t("Other", "آخر")}
                                            </option>
                                        </select>
                                    </div>
                                    {errors.gender && (
                                        <p className="text-rose-400 text-xs ms-1 mt-1">{errors.gender.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Height & Weight */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-300 ms-1 block">
                                        {t("Height (cm)", "الطول (سم)")}
                                    </label>
                                    <div className="relative">
                                        <Ruler className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                        <input
                                            {...register("heightCm")}
                                            type="number"
                                            inputMode="numeric"
                                            className="clinical-input ps-9 pe-4 py-2.5 text-xs sm:text-sm bg-slate-950 border-slate-800"
                                            placeholder="175"
                                            min={50}
                                            max={250}
                                        />
                                    </div>
                                    {errors.heightCm && (
                                        <p className="text-rose-400 text-xs ms-1 mt-1">{errors.heightCm.message}</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-300 ms-1 block">
                                        {t("Weight (kg)", "الوزن (كجم)")}
                                    </label>
                                    <div className="relative">
                                        <Weight className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                        <input
                                            {...register("weightKg")}
                                            type="number"
                                            inputMode="decimal"
                                            step="0.1"
                                            className="clinical-input ps-9 pe-4 py-2.5 text-xs sm:text-sm bg-slate-950 border-slate-800"
                                            placeholder="70"
                                            min={10}
                                            max={500}
                                        />
                                    </div>
                                    {errors.weightKg && (
                                        <p className="text-rose-400 text-xs ms-1 mt-1">{errors.weightKg.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Terms & Disclaimer Agreement */}
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                                <div className="flex items-start gap-2.5">
                                    <input
                                        id="agreeToTerms"
                                        type="checkbox"
                                        className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                                        {...register("agreeToTerms")}
                                    />
                                    <label htmlFor="agreeToTerms" className="text-xs text-slate-300 leading-relaxed cursor-pointer select-none">
                                        {t("I agree to the", "أوافق على")}{" "}
                                        <Link href="/terms" className="text-cyan-400 hover:underline font-semibold" target="_blank">
                                            {t("Terms of Service & Medical Disclaimer", "الشروط وسياسات إخلاء المسؤولية الطبية")}
                                        </Link>
                                    </label>
                                </div>
                                {errors.agreeToTerms && (
                                    <p className="text-rose-400 text-xs ms-6">{String(errors.agreeToTerms.message || "")}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Submit Button (NO GLOW) */}
                    <Button
                        type="submit"
                        className="w-full font-bold mt-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl py-2.5 text-sm transition-colors"
                        size="md"
                        isLoading={isLoading}
                    >
                        {type === "login"
                            ? t("Sign In", "تسجيل الدخول")
                            : t("Create Account", "إنشاء الحساب والمتابعة")}
                    </Button>
                </form>

                {/* Social Login & Local Dev */}
                <div className="pt-5 border-t border-slate-800 space-y-3">
                    {isLocalDev && (
                        <Button
                            variant="outline"
                            className="w-full border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold rounded-xl"
                            onClick={handleLocalDevLogin}
                            disabled={isLoading}
                        >
                            <User className="w-4 h-4 me-2" />
                            <span>{t("Local Dev Instant Login", "دخول المطور المحلي الفوري")}</span>
                        </Button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <Button
                            variant="outline"
                            className="w-full text-xs font-medium border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl"
                            onClick={() => handleOAuthLogin("github")}
                            disabled={isLoading}
                        >
                            <Github className="w-4 h-4 me-2" />
                            <span>GitHub</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full text-xs font-medium border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl"
                            onClick={() => handleOAuthLogin("google")}
                            disabled={isLoading}
                        >
                            <svg className="w-4 h-4 me-2 shrink-0" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            <span>Google</span>
                        </Button>
                    </div>
                </div>

                {/* Footer Switch */}
                <div className="pt-2 text-center text-xs text-slate-400">
                    {type === "login" ? (
                        <>
                            {t("Don't have an account?", "ليس لديك حساب؟")}{" "}
                            <Link href="/signup" className="text-cyan-400 hover:underline font-semibold ms-1">
                                {t("Create account", "إنشاء حساب")}
                            </Link>
                        </>
                    ) : (
                        <>
                            {t("Already have an account?", "لديك حساب بالفعل؟")}{" "}
                            <Link href="/login" className="text-cyan-400 hover:underline font-semibold ms-1">
                                {t("Sign in", "تسجيل الدخول")}
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export const AuthForm = (props: AuthFormProps) => {
    return (
        <Suspense
            fallback={
                <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">
                    Loading authentication...
                </div>
            }
        >
            <AuthFormContent {...props} />
        </Suspense>
    );
};