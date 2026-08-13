import { NextRequest } from 'next/server';
import { createClient, type User as SupabaseUser } from "@supabase/supabase-js";
import { createHeaderSupabaseClient, getSupabaseServerConfig } from "@/lib/supabase/server";

type VuneliUser = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image: string | null;
};

type VuneliUserRow = {
  id: string;
  email: string;
  name: string;
  email_verified: boolean;
  image: string | null;
};

function toVuneliUser(row: VuneliUserRow): VuneliUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    emailVerified: row.email_verified,
    image: row.image,
  };
}

export type VuneliSession = {
  user: VuneliUser;
  session: {
    id: string;
    expiresAt: Date | null;
  };
};

function getBearerToken(headers: Headers): string | null {
  const authorization = headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length).trim() || null;
}

function profileName(supabaseUser: SupabaseUser): string {
  const metadataName = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name;
  return typeof metadataName === "string" && metadataName.trim()
    ? metadataName.trim()
    : supabaseUser.email?.split("@")[0] || "Vuneli user";
}

function getAdminClient() {
  const { url } = getSupabaseServerConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for Vuneli profile mapping.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function resolveVuneliUser(supabaseUser: SupabaseUser): Promise<VuneliUser> {
  const email = supabaseUser.email?.trim().toLowerCase();
  if (!email) throw new Error("Supabase Auth returned an identity without an email address.");

  const admin = getAdminClient();
  const mapped = await admin
    .from("auth_identity")
    .select("vuneli_user_id")
    .eq("supabase_user_id", supabaseUser.id)
    .maybeSingle();

  if (mapped.error) throw mapped.error;
  if (mapped.data?.vuneli_user_id) {
    const profile = await admin
      .from("user")
      .select("id, email, name, email_verified, image")
      .eq("id", mapped.data.vuneli_user_id)
      .maybeSingle();
    if (profile.error) throw profile.error;
    if (!profile.data) throw new Error("The mapped Vuneli user profile no longer exists.");
    await admin
      .from("auth_identity")
      .update({ last_authenticated_at: new Date().toISOString() })
      .eq("supabase_user_id", supabaseUser.id);
    return toVuneliUser(profile.data as VuneliUserRow);
  }

  const existing = await admin
    .from("user")
    .select("id, email, name, email_verified, image")
    .eq("email", email)
    .maybeSingle();
  if (existing.error) throw existing.error;

  const now = new Date().toISOString();
  const vuneliUser = existing.data || {
    id: `user_${crypto.randomUUID()}`,
    email,
    name: profileName(supabaseUser),
    email_verified: Boolean(supabaseUser.email_confirmed_at),
    image: typeof supabaseUser.user_metadata?.avatar_url === "string" ? supabaseUser.user_metadata.avatar_url : null,
    total_credits: 0,
    onboarding_completed: false,
    ai_credits_balance: 50,
    created_at: now,
    updated_at: now,
  };

  if (!existing.data) {
    const created = await admin.from("user").insert(vuneliUser).select("id, email, name, email_verified, image").single();
    if (created.error) throw created.error;
    Object.assign(vuneliUser, created.data);
  }

  const linked = await admin.from("auth_identity").upsert({
    supabase_user_id: supabaseUser.id,
    vuneli_user_id: vuneliUser.id,
    last_authenticated_at: now,
  }, { onConflict: "supabase_user_id" });
  if (linked.error) throw linked.error;

  return toVuneliUser(vuneliUser as VuneliUserRow);
}

export async function getVuneliSession(headers: Headers): Promise<VuneliSession | null> {
  const token = getBearerToken(headers);
  const supabase = token
    ? createClient(getSupabaseServerConfig().url, getSupabaseServerConfig().publishableKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : createHeaderSupabaseClient(headers);

  const { data, error } = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser();
  if (error || !data.user) return null;

  const user = await resolveVuneliUser(data.user);
  return {
    user,
    session: {
      id: data.user.id,
      expiresAt: null,
    },
  };
}

export async function requireVuneliUserId(headers: Headers): Promise<string | null> {
  const session = await getVuneliSession(headers);
  return session?.user.id ?? null;
}

// Compatibility facade retained while protected routes migrate to Supabase Auth.
export const auth = {
  api: {
    getSession: async ({ headers }: { headers: Headers }) => getVuneliSession(headers),
  },
};

export async function getCurrentUser(request: NextRequest) {
  const session = await getVuneliSession(request.headers);
  return session?.user || null;
}
