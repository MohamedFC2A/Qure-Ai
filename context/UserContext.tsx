"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

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

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [plan, setPlan] = useState<'free' | 'ultra'>('free');
    const [credits, setCredits] = useState(0);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const refreshUser = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Fetch credits, plan, and now Profile details
                try {
                    // Fetch profile separately to get detailed fields
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('username, full_name, gender, age, height, weight, plan')
                        .eq('id', user.id)
                        .single();

                    if (profileData) {
                        setProfile({
                            username: profileData.username,
                            full_name: profileData.full_name,
                            gender: profileData.gender,
                            age: profileData.age,
                            height: profileData.height,
                            weight: profileData.weight
                        });
                        // Allow local plan state to be updated if needed, though status API is source of truth for limits
                        // But let's stick to status API for plan/credits to ensure consistency with billing logic
                    }

                    const res = await fetch('/api/credits/status');
                    if (res.ok) {
                        const data = await res.json();
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
