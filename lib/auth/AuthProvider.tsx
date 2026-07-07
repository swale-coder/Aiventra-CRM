"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Role } from "@/lib/types";

export interface AuthOrgUser {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: Role;
  avatarColor: string;
  active: boolean;
}

export interface AuthOrganization {
  id: string | null;
  name: string;
  city: string;
  logoInitial: string;
}

interface AuthContextValue {
  user: User | null;
  orgUser: AuthOrgUser | null;
  organization: AuthOrganization;
  role: Role | null;
  loading: boolean;
  isDemoMode: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const FALLBACK_ORG_USER: AuthOrgUser = {
  id: "unconfigured",
  orgId: "unconfigured",
  name: "Guest",
  email: "",
  role: "Owner",
  avatarColor: "#FF6B00",
  active: true,
};

const FALLBACK_ORGANIZATION: AuthOrganization = {
  id: null,
  name: "Aiventra AI CRM",
  city: "",
  logoInitial: "A",
};

const AVATAR_PALETTE = ["#FF6B00", "#111111", "#FF9152", "#B85C00", "#FFB37A", "#4A4A4A"];

function colorForRole(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orgUser, setOrgUser] = useState<AuthOrgUser | null>(null);
  const [organization, setOrganization] = useState<AuthOrganization>(FALLBACK_ORGANIZATION);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const loadSession = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    setUser(authUser);

    if (!authUser) {
      setOrgUser(null);
      setOrganization(FALLBACK_ORGANIZATION);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("org_users")
      .select(
        "id, org_id, name, email, role, active, organizations ( id, name, city, gstin )"
      )
      .eq("user_id", authUser.id)
      .eq("active", true)
      .limit(1)
      .maybeSingle();

    if (data) {
      const org = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;
      setOrgUser({
        id: data.id,
        orgId: data.org_id,
        name: data.name,
        email: data.email,
        role: data.role as Role,
        avatarColor: colorForRole(data.email ?? data.id),
        active: data.active,
      });
      if (org) {
        setOrganization({
          id: org.id,
          name: org.name,
          city: org.city ?? "",
          logoInitial: (org.name?.[0] ?? "A").toUpperCase(),
        });
      }
    } else {
      // Authenticated but hasn't completed onboarding yet.
      setOrgUser(null);
      setOrganization(FALLBACK_ORGANIZATION);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadSession();

    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadSession();
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      const supabase = createClient();
      await supabase?.auth.signOut();
    }
    setUser(null);
    setOrgUser(null);
    setOrganization(FALLBACK_ORGANIZATION);
    router.push("/");
    router.refresh();
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      orgUser: isSupabaseConfigured ? orgUser : FALLBACK_ORG_USER,
      organization,
      role: (isSupabaseConfigured ? orgUser?.role : FALLBACK_ORG_USER.role) ?? null,
      loading,
      isDemoMode: !isSupabaseConfigured,
      refresh: loadSession,
      signOut,
    }),
    [user, orgUser, organization, loading, loadSession, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
