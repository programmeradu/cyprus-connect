import { createClient } from "@supabase/supabase-js";

const dryRun = process.argv.includes("--dry-run");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this migration.");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let offset = 0;
const pageSize = 100;
let inspected = 0;
let prepared = 0;

const authUsersByEmail = new Map();
for (let page = 1; ; page += 1) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;
  data.users.forEach((authUser) => {
    if (authUser.email) authUsersByEmail.set(authUser.email.toLowerCase(), authUser);
  });
  if (data.users.length < 1000) break;
}

while (true) {
  const { data: users, error } = await supabase
    .from("user")
    .select("id, email, name, email_verified, image")
    .order("created_at", { ascending: true })
    .range(offset, offset + pageSize - 1);
  if (error) throw error;
  if (!users?.length) break;

  for (const legacyUser of users) {
    inspected += 1;
    const alreadyMigrated = authUsersByEmail.get(legacyUser.email.toLowerCase());
    if (alreadyMigrated) continue;

    const { data: accounts, error: accountsError } = await supabase
      .from("account")
      .select("provider_id")
      .eq("user_id", legacyUser.id);
    if (accountsError) throw accountsError;

    const hasPasswordAccount = accounts?.some((account) =>
      ["credential", "email", "password"].includes(account.provider_id),
    );
    const hasGoogleOnlyAccount = accounts?.some((account) => account.provider_id === "google") && !hasPasswordAccount;
    if (hasGoogleOnlyAccount) continue;

    prepared += 1;
    if (dryRun) continue;

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: legacyUser.email,
      email_confirm: legacyUser.email_verified,
      user_metadata: { full_name: legacyUser.name, avatar_url: legacyUser.image },
    });
    if (createError) throw createError;
    authUsersByEmail.set(legacyUser.email.toLowerCase(), created.user);

    const { error: identityError } = await supabase.from("auth_identity").upsert({
      supabase_user_id: created.user.id,
      vuneli_user_id: legacyUser.id,
    });
    if (identityError) throw identityError;
  }

  if (users.length < pageSize) break;
  offset += pageSize;
}

console.log(JSON.stringify({ dryRun, inspected, accountsToCreate: prepared }, null, 2));
