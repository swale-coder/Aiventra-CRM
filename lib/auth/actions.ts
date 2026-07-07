"use client";

import { createClient } from "@/lib/supabase/client";

export interface OnboardingInput {
  orgName: string;
  gstin: string;
  reraId: string;
  city: string;
}

/**
 * Creates the organization and inserts the current authenticated user as its
 * Owner. Relies on the self-serve RLS policies in
 * supabase/migrations/002_self_serve_onboarding.sql — a signed-in user may
 * insert an organization row and add themselves to org_users.
 */
export async function completeOnboarding(input: OnboardingInput) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase isn't configured.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to create an organization.");

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: input.orgName,
      legal_name: input.orgName,
      gstin: input.gstin || null,
      rera_id: input.reraId || null,
      city: input.city || null,
    })
    .select()
    .single();

  if (orgError) throw orgError;

  const { error: memberError } = await supabase.from("org_users").insert({
    org_id: org.id,
    user_id: user.id,
    name: user.user_metadata?.full_name ?? user.email ?? "Owner",
    email: user.email ?? "",
    role: "Owner",
  });

  if (memberError) throw memberError;

  return org;
}
