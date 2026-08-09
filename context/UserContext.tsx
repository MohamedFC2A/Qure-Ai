"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { TERMS_VERSION } from "@/lib/legal/terms";

interface UserProfile {
    username?: string;
    full_name?: string;
    gender?: 'male' | 'female' | 'other';
    age?: number;
    height?: string;
    weight?: string;
}

interface UserState {
    user: any | null;
    profile: UserProfile | null;
    plan: 'free' | 'ultra';
    credits: number;
    loading: boolean;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserState | undefined>(undefined);

const getLocalDevUser = () => {
    if (process.env.NODE_ENV !== "development" || typeof document === "undefined") return null;
    if (!document.cookie.split("; ").some((cookie) => cookie === "qurescan_dev_auth=1")) return null;

    return {
        id: "local-dev-user",
        email: "local.dev@qurescan.local",
        created_at: new Date("2026-01-01T00:00:00.000Z").toISOString(),
        user_metadata: {
            username: "local_dev",
            terms_accepted_at: new Date().toISOString(),
            terms_version: TERMS_VERSION,
        },
    };
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [plan, setPlan] = useState<'free' | 'ultra'>('free');
    const [credits, setCredits] = useState(0);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const refreshUser = useCallback(async () => {
        try {
            const localDevUser = getLocalDevUser();
            if (localDevUser) {
                setUser(localDevUser);
                setProfile({
                    username: "local_dev",
                    gender: "other",
                    age: 30,
                    height: "175 cm",
                    weight: "75 kg",
                });
                setPlan("ultra");
                setCredits(999);
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                try {
                    const [profileRes, creditsRes] = await Promise.all([
                        supabase
                            .from('profiles')
                            .select('username, full_name, gender, age, height, weight, plan')
                            .eq('id', user.id)
                            .maybeSingle(),
                        fetch('/api/credits/status'),
                    ]);

                    if (profileRes.data) {
                        const profileData = profileRes.data;
                        setProfile({
                            username: profileData.username,
                            full_name: profileData.full_name,
                            gender: profileData.gender,
                            age: profileData.age,
                            height: profileData.height,
                            weight: profileData.weight
                        });
                        if (profileData.plan === 'ultra') {
                            setPlan('ultra');
                        }
                    }

                    if (creditsRes.ok) {
                        const data = await creditsRes.json();
                        setPlan(data.plan);
                        setCredits(Number(data.totalAvailable ?? 0));
                    }
                } catch (e) {
                    console.warn("UserProvider: Failed to fetch credits/profile", e);
                }
            } else {
                setPlan('free');
                setCredits(0);
                setProfile(null);
            }
        } catch (error) {
            console.error("User context refresh error", error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        refreshUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            refreshUser();
        });

        return () => subscription.unsubscribe();
    }, [refreshUser, supabase]);

    return (
        <UserContext.Provider value={{ user, profile, plan, credits, loading, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};
