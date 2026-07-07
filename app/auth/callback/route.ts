import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Handles the redirect back from Supabase OAuth (Google SSO) / magic link sign-in,
// and also completes team-invite acceptance (see app/api/org/invite/route.ts): if the
// signed-in user has a pending org_invites row and no org membership yet, they're
// added to that organization directly instead of being sent through onboarding.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase.auth.exchangeCodeForSession(code);
      const user = data.user;

      if (user?.email) {
        const admin = createAdminClient();
        if (admin) {
          const { data: existingMembership } = await admin
            .from("org_users")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!existingMembership) {
            const { data: invite } = await admin
              .from("org_invites")
              .select("*")
              .ilike("email", user.email)
              .is("accepted_at", null)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (invite) {
              await admin.from("org_users").insert({
                org_id: invite.org_id,
                user_id: user.id,
                name: invite.name || user.user_metadata?.full_name || user.email,
                email: user.email,
                role: invite.role,
              });
              await admin.from("org_invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);
            }
          }
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}

