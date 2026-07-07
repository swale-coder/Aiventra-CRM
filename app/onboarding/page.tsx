"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, MapPin, Sparkles, Users, CheckCircle2, ArrowRight, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { completeOnboarding } from "@/lib/auth/actions";

const steps = [
  { title: "Organization", icon: Building2 },
  { title: "Builder Profile", icon: MapPin },
  { title: "Invite Team", icon: Users },
  { title: "All Set", icon: Sparkles },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [org, setOrg] = useState({
    name: "Skyline Developers Pvt Ltd",
    gstin: "24AASCS1234K1Z8",
    reraId: "PR/GJ/AHMEDABAD/AH01/PART/2024/RA05678",
    city: "Ahmedabad, Gujarat",
  });
  const [profile, setProfile] = useState({
    yearsInBusiness: "14",
    activeProjectsCount: "3",
    unitsDelivered: "1,240",
    specialization: "Premium residential & mixed-use",
  });

  async function handleFinish() {
    if (!isSupabaseConfigured) {
      router.push("/dashboard");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await completeOnboarding({ orgName: org.name, gstin: org.gstin, reraId: org.reraId, city: org.city });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create your workspace. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-aiventra-bg px-4 py-10">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: "radial-gradient(600px circle at 50% 0%, rgba(255,107,0,0.08), transparent 60%)" }}
      />
      <div className="w-full max-w-xl">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-aiventra-ink">
            <Sparkles size={15} className="text-aiventra-orange" />
          </div>
          <span className="font-display text-sm font-semibold">Aiventra AI CRM</span>
        </div>

        {/* Stepper */}
        <div className="mb-8 flex items-center justify-center">
          {steps.map((s, i) => (
            <div key={s.title} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors ${
                    i < step
                      ? "border-aiventra-orange bg-aiventra-orange text-white"
                      : i === step
                      ? "border-aiventra-orange text-aiventra-orange"
                      : "border-black/10 text-black/30"
                  }`}
                >
                  {i < step ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                <span className={`text-[10px] font-medium ${i <= step ? "text-aiventra-ink" : "text-black/30"}`}>
                  {s.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`mx-2 mb-4 h-0.5 w-10 sm:w-16 ${i < step ? "bg-aiventra-orange" : "bg-black/10"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-black/[0.06] bg-white p-7 shadow-lift sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold text-aiventra-ink">Set up your organization</h2>
                  <p className="text-sm text-black/45">Tell us about your real estate company.</p>
                  <Field label="Organization name" value={org.name} onChange={(v) => setOrg((o) => ({ ...o, name: v }))} />
                  <Field label="GSTIN" value={org.gstin} onChange={(v) => setOrg((o) => ({ ...o, gstin: v }))} />
                  <Field label="RERA registration ID" value={org.reraId} onChange={(v) => setOrg((o) => ({ ...o, reraId: v }))} />
                  <Field label="City / HQ" value={org.city} onChange={(v) => setOrg((o) => ({ ...o, city: v }))} />
                </div>
              )}
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold text-aiventra-ink">Builder profile</h2>
                  <p className="text-sm text-black/45">This appears on customer-facing materials.</p>
                  <Field label="Years in business" value={profile.yearsInBusiness} onChange={(v) => setProfile((p) => ({ ...p, yearsInBusiness: v }))} />
                  <Field label="Active projects" value={profile.activeProjectsCount} onChange={(v) => setProfile((p) => ({ ...p, activeProjectsCount: v }))} />
                  <Field label="Total units delivered" value={profile.unitsDelivered} onChange={(v) => setProfile((p) => ({ ...p, unitsDelivered: v }))} />
                  <Field label="Specialization" value={profile.specialization} onChange={(v) => setProfile((p) => ({ ...p, specialization: v }))} />
                </div>
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold text-aiventra-ink">Invite your team</h2>
                  <p className="text-sm text-black/45">Assign roles with role-based access control (RBAC).</p>
                  {[
                    { name: "Priya Shah", role: "Sales Manager" },
                    { name: "Aarav Patel", role: "Sales Executive" },
                    { name: "Ishaan Trivedi", role: "Site Engineer" },
                  ].map((m) => (
                    <div key={m.name} className="flex items-center justify-between rounded-xl border border-black/[0.06] px-4 py-3">
                      <span className="text-sm font-medium text-aiventra-ink">{m.name}</span>
                      <span className="rounded-full bg-black/[0.05] px-2.5 py-1 text-xs font-medium text-black/60">{m.role}</span>
                    </div>
                  ))}
                  <button className="text-sm font-medium text-aiventra-orange hover:underline">+ Add another team member</button>
                </div>
              )}
              {step === 3 && (
                <div className="flex flex-col items-center py-6 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-aiventra-orange to-[#FF9152]"
                  >
                    <CheckCircle2 size={30} className="text-white" />
                  </motion.div>
                  <h2 className="font-display text-xl font-semibold text-aiventra-ink">Workspace ready</h2>
                  <p className="mt-1.5 max-w-sm text-sm text-black/45">
                    Skyline Developers is set up. Your AI dashboard, lead pipeline, and project workspace are ready to go.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" size="sm" disabled={step === 0 || saving} onClick={() => setStep((s) => Math.max(0, s - 1))}>
              <ArrowLeft size={14} /> Back
            </Button>
            {step < steps.length - 1 ? (
              <Button size="sm" onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>
                Continue <ArrowRight size={14} />
              </Button>
            ) : (
              <Button size="sm" onClick={handleFinish} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <>Go to dashboard <ArrowRight size={14} /></>}
              </Button>
            )}
          </div>
          {error && (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-red-500">
              <AlertCircle size={12} /> {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-black/50">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-black/10 bg-black/[0.02] px-3.5 py-2.5 text-sm text-aiventra-ink outline-none focus:border-aiventra-orange/50 focus:ring-2 focus:ring-aiventra-orange/15"
      />
    </label>
  );
}
