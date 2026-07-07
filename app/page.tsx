"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("karan@skylinedevelopers.in");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Demo mode: no Supabase project connected yet — go straight to the dashboard.
    if (!isSupabaseConfigured) {
      router.push(params.get("redirectTo") || "/dashboard");
      return;
    }

    const supabase = createClient();
    if (!supabase) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    router.push(params.get("redirectTo") || "/dashboard");
    router.refresh();
  }

  async function handleGoogleSignIn() {
    if (!isSupabaseConfigured) {
      router.push("/dashboard");
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-aiventra-ink px-4">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(700px circle at 20% 20%, rgba(255,107,0,0.22), transparent 60%), radial-gradient(600px circle at 85% 80%, rgba(255,107,0,0.14), transparent 55%)",
        }}
      />
      <div className="grain-overlay pointer-events-none absolute inset-0 opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <motion.div
            animate={{ boxShadow: ["0 0 0 0 rgba(255,107,0,0.5)", "0 0 0 18px rgba(255,107,0,0)"] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-aiventra-orange to-[#FF9152]"
          >
            <Sparkles size={28} className="text-white" />
          </motion.div>
          <h1 className="font-display text-2xl font-bold text-white">Aiventra AI CRM</h1>
          <p className="mt-1.5 text-sm text-white/45">Build. Sell. Predict.</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-aiventra-orange/25 bg-aiventra-orange/10 p-3 text-xs text-white/70">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-aiventra-orange" />
            <span>
              Demo mode — no Supabase project connected. Sign in goes straight to the dashboard.
              Add your project to <code className="text-aiventra-orange">.env.local</code> to enable real auth.
            </span>
          </div>
        )}

        <div className="glass-dark rounded-3xl p-7 shadow-lift">
          <p className="mb-1 font-display text-lg font-semibold text-white">Welcome back</p>
          <p className="mb-6 text-sm text-white/45">Sign in to Skyline Developers workspace</p>

          <form className="space-y-3.5" onSubmit={handleSignIn}>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-aiventra-orange/50 focus:ring-2 focus:ring-aiventra-orange/20"
                placeholder="you@company.com"
                required
              />
            </div>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-aiventra-orange/50 focus:ring-2 focus:ring-aiventra-orange/20"
                placeholder={isSupabaseConfigured ? "Your password" : "•••••••••• (any value in demo mode)"}
                required={isSupabaseConfigured}
              />
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle size={12} /> {error}
              </p>
            )}

            <div className="flex items-center justify-between pt-1 text-xs text-white/40">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-aiventra-orange" /> RBAC secured · Row Level Security
              </span>
            </div>

            <Button className="w-full" size="lg" type="submit" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Sign in"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] text-white/30">or continue with</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleGoogleSignIn}
              className="rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-white/70 hover:bg-white/10"
            >
              Google SSO
            </button>
            <Link href="/signup" className="rounded-xl border border-white/10 bg-white/5 py-2.5 text-center text-xs font-medium text-white/70 hover:bg-white/10">
              New organization
            </Link>
          </div>

          <p className="mt-5 text-center text-xs text-white/35">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-aiventra-orange hover:underline">
              Create one
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-[11px] text-white/30">
          Aiventra AI CRM · Demo workspace for Skyline Developers Pvt Ltd
        </p>
      </motion.div>
    </div>
  );
}
