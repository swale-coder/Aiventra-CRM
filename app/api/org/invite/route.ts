import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/types";

export async function POST(req: Request) {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (session.orgUser.role !== "Owner" && session.orgUser.role !== "Admin") {
    return NextResponse.json({ error: "Only Owners and Admins can invite team members." }, { status: 403 });
  }

  const { email, name, role } = (await req.json()) as { email?: string; name?: string; role?: Role };
  if (!email || !role) return NextResponse.json({ error: "Email and role are required." }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY isn't configured on the server." }, { status: 500 });

  const origin = new URL(req.url).origin;

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/callback`,
  });
  // "already registered" isn't fatal — the user may already have an account
  // and just needs to be added to this organization.
  if (inviteError && !inviteError.message?.toLowerCase().includes("already")) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase isn't configured." }, { status: 500 });

  const { error: dbError } = await supabase.from("org_invites").insert({
    org_id: session.orgUser.orgId,
    email: email.toLowerCase().trim(),
    name: name || null,
    role,
    invited_by: session.orgUser.id,
  });
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
