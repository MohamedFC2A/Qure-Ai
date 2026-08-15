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
    isProfileIncomplete: boolean;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserState | undefined>(undefined);

const getLocalDevUser = () => {
    if (process.env.NODE_ENV !== "development" || typeof window === "undefined") return null;
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname === "::1";
    if (!isLocalhost) return null;

    const hasDevAuthCookie = document.cookie.includes("qurescan_dev_auth=1");
    if (!hasDevAuthCookie) return null;

    return {
        id: "360899ab-a2cb-4455-8508-3e274704a83e",
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
    const [plan, setPlan] = useState<'free' | 'ultra'>('ultra');
    const [credits, setCredits] = useState(999999);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const refreshUser = useCallback(async () => {
        try {
            const localDevUser = getLocalDevUser();
            if (localDevUser) {
                // In local dev, auto-login as localDevUser with ULTRA plan automatically
                setUser(localDevUser);
                setProfile({
                    username: "local_dev",
                    gender: "other",
                    age: 30,
                    height: "175 cm",
                    weight: "75 kg",
                });
                setPlan("ultra");
                setCredits(999999);
                setLoading(false);
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

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
                refreshUser();
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                setUser(session.user);
            }
        });

        return () => subscription.unsubscribe();
    }, [refreshUser, supabase]);

    const isProfileIncomplete = Boolean(
        user &&
        user.id !== "00000000-0000-0000-0000-000000000001" &&
        user.id !== "local-dev-user" &&
        (!profile || !profile.age || !profile.gender || !profile.height || !profile.weight)
    );

    return (
        <UserContext.Provider value={{ user, profile, plan, credits, loading, isProfileIncomplete, refreshUser }}>
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
