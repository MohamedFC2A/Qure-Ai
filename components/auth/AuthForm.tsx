"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, Lock, Github, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { getBaseUrl } from "@/lib/config";

const schema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

interface AuthFormProps {
    type: "login" | "signup";
}

export const AuthForm = ({ type }: AuthFormProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        setError(null);

        try {
            let result;
            if (type === "signup") {
                result = await supabase.auth.signUp({
                    email: data.email,
                    password: data.password,
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

            router.push("/scan");
        } catch (err: any) {
            setError(err.message || "An error occurred during authentication");
            console.error("Auth error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOAuthLogin = async (provider: 'google' | 'github') => {
        setIsLoading(true);
        setError(null);
        try {
            // ... inside component ...

            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: `${getBaseUrl()}/auth/callback`,
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(`Failed to sign in with ${provider}: ${err.message}`);
            // Only reset loading if there was an immediate error, otherwise we're redirecting
            setIsLoading(false);
            console.error("OAuth error:", err);
        }
    };

    return (
        <GlassCard className="w-full max-w-md p-8 relative overflow-hidden" hoverEffect={false}>
            {/* Decorative elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-liquid-primary/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-liquid-secondary/30 rounded-full blur-3xl animate-pulse delay-1000" />

            <div className="relative z-10">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        {type === "login" ? "Welcome Back" : "Create Account"}
                    </h2>
                    <p className="text-white/60 mt-2">
                        {type === "login"
                            ? "Enter your credentials to access your workspace"
                            : "Join clearly the future of pharmaceutical analysis"}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-200">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80 ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                            <input
                                {...register("email")}
                                type="email"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-liquid-primary/50 focus:ring-1 focus:ring-liquid-primary/50 transition-all"
                                placeholder="doctor@medvision.ai"
                            />
                        </div>
                        {errors.email && (
                            <p className="text-red-400 text-xs ml-1">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                            <input
                                {...register("password")}
                                type="password"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-liquid-primary/50 focus:ring-1 focus:ring-liquid-primary/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                        {errors.password && (
                            <p className="text-red-400 text-xs ml-1">{errors.password.message}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-liquid-primary to-liquid-secondary hover:opacity-90 transition-opacity"
                        size="lg"
                        isLoading={isLoading}
                    >
                        {type === "login" ? "Sign In" : "Create Account"}
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="w-full" onClick={() => handleOAuthLogin('github')} disabled={isLoading}>
                            <Github className="w-5 h-5 mr-2" />
                            Github
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => handleOAuthLogin('google')} disabled={isLoading}>
                            <div className="w-5 h-5 rounded-full bg-white mr-2" />
                            Google
                        </Button>
                    </div>
                </div>

                <div className="mt-6 text-center text-sm text-white/60">
                    {type === "login" ? (
                        <>
                            Don't have an account?{" "}
                            <Link href="/signup" className="text-white hover:underline font-medium">
                                Sign up
                            </Link>
                        </>
                    ) : (
                        <>
                            Already have an account?{" "}
                            <Link href="/login" className="text-white hover:underline font-medium">
                                Log in
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </GlassCard>
    );
};
