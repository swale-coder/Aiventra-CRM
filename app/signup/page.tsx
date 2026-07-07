"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, User, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured) {
      router.push("/onboarding");
      return;
    }

    const supabase = createClient();
    if (!supabase) return;

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-aiventra-ink px-4">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(700px circle at 80% 20%, rgba(255,107,0,0.2), transparent 60%), radial-gradient(600px circle at 15% 85%, rgba(255,107,0,0.14), transparent 55%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-aiventra-orange to-[#FF9152]">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Create your workspace</h1>
          <p className="mt-1.5 text-sm text-white/45">Aiventra AI CRM · Build. Sell. Predict.</p>
        </div>

        <div className="glass-dark rounded-3xl p-7 shadow-lift">
          {done ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 size={34} className="mb-3 text-aiventra-orange" />
              <p className="font-display text-lg font-semibold text-white">Check your inbox</p>
              <p className="mt-1.5 text-sm text-white/45">
                We&apos;ve sent a confirmation link to {email}. Verify your email to activate your account.
              </p>
              <Link href="/" className="mt-5 text-sm font-medium text-aiventra-orange hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-1 font-display text-lg font-semibold text-white">Get started</p>
              <p className="mb-6 text-sm text-white/45">Create your builder account</p>

              <form className="space-y-3.5" onSubmit={handleSignUp}>
                <div className="relative">
                  <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-aiventra-orange/50 focus:ring-2 focus:ring-aiventra-orange/20"
                    required
                  />
                </div>
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-aiventra-orange/50 focus:ring-2 focus:ring-aiventra-orange/20"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    minLength={6}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-aiventra-orange/50 focus:ring-2 focus:ring-aiventra-orange/20"
                    required={isSupabaseConfigured}
                  />
                </div>

                {error && (
                  <p className="flex items-center gap-1.5 text-xs text-red-400">
                    <AlertCircle size={12} /> {error}
                  </p>
                )}

                <Button className="w-full" size="lg" type="submit" disabled={loading}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : "Create account"}
                </Button>
              </form>

              <p className="mt-5 text-center text-xs text-white/35">
                Already have a workspace?{" "}
                <Link href="/" className="font-medium text-aiventra-orange hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
