"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { User, Ruler, Weight, Calendar, Fingerprint, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const schema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters").max(20).regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
    age: z.number().min(1, "Invalid age").max(120),
    gender: z.enum(["male", "female", "other"]),
    height: z.string().min(1, "Required (e.g., 180 cm)"),
    weight: z.string().min(1, "Required (e.g., 75 kg)"),
});

type FormData = z.infer<typeof schema>;

export const OnboardingModal = () => {
    const { user, profile, refreshUser } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        if (!user || !profile) return;

        const missing =
            !profile.username ||
            profile.age == null ||
            !profile.gender ||
            !profile.height ||
            !profile.weight;

        setIsOpen(missing);
    }, [user, profile]);

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        if (!user) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    username: data.username,
                    age: data.age,
                    gender: data.gender,
                    height: data.height,
                    weight: data.weight,
                })
                .eq("id", user.id);

            if (error) throw error;

            await refreshUser();
            setIsOpen(false);
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Failed to save profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <GlassCard className="w-full max-w-md p-6 sm:p-8" hoverEffect={false}>
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome to Qure Ai</h2>
                    <p className="text-white/60 text-sm">
                        To provide personalized AI medical insights, we need to know a bit about you.
                        <br />
                        <span className="text-xs text-white/40 mt-1 block">Your data is stored securely and used only for analysis.</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Username */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-white/70 ml-1">Username</label>
                        <div className="relative">
                            <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <input
                                {...register("username")}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-base text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                                placeholder="e.g. Alien_X"
                            />
                        </div>
                        {errors.username && <p className="text-red-400 text-xs ml-1">{errors.username.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Age */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-white/70 ml-1">Age</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="number"
                                    {...register("age", { valueAsNumber: true })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-base text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                                    placeholder="25"
                                />
                            </div>
                            {errors.age && <p className="text-red-400 text-xs ml-1">{errors.age.message}</p>}
                        </div>

                        {/* Gender */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-white/70 ml-1">Gender</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <select
                                    {...register("gender")}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-base text-white focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none"
                                >
                                    <option value="" className="bg-slate-900 text-white/50">Select</option>
                                    <option value="male" className="bg-slate-900">Male</option>
                                    <option value="female" className="bg-slate-900">Female</option>
                                    <option value="other" className="bg-slate-900">Other</option>
                                </select>
                            </div>
                            {errors.gender && <p className="text-red-400 text-xs ml-1">{errors.gender.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Height */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-white/70 ml-1">Height</label>
                            <div className="relative">
                                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    {...register("height")}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-base text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                                    placeholder="180 cm"
                                />
                            </div>
                            {errors.height && <p className="text-red-400 text-xs ml-1">{errors.height.message}</p>}
                        </div>

                        {/* Weight */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-white/70 ml-1">Weight</label>
                            <div className="relative">
                                <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    {...register("weight")}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-base text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                                    placeholder="75 kg"
                                />
                            </div>
                            {errors.weight && <p className="text-red-400 text-xs ml-1">{errors.weight.message}</p>}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90"
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving Profile...
                            </>
                        ) : (
                            "One-Click Profile Setup"
                        )}
                    </Button>
                </form>
            </GlassCard>
        </div>
    );
};
