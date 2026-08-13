# Supabase Auth Cutover for Vuneli

This runbook replaces Better Auth with Supabase Auth **without changing any existing Vuneli user ID or user-linked product record**. Do not delete the legacy `user`, `account`, `session`, or `verification` tables during this cutover.

## 1. Configure Supabase Auth

In the existing Supabase project, enable **Email** and **Google** providers. Set the site URL to `https://vuneli.com` and add the following redirect URLs:

| Use | Redirect URL |
|---|---|
| English sign-in, OAuth, and recovery | `https://vuneli.com/en/auth/callback` |
| Greek sign-in, OAuth, and recovery | `https://vuneli.com/el/auth/callback` |

Use the Google OAuth client ID and client secret in the **Supabase Auth Google provider** configuration. They are no longer read by the Vuneli Worker for authentication.

## 2. Add Worker secrets

Add these values in the Cloudflare Worker settings before publishing this code. Never commit them to Git.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Existing Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key; the existing `NEXT_PUBLIC_SUPABASE_ANON_KEY` remains supported as a fallback |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key used solely to map an authenticated Supabase identity to the pre-existing Vuneli profile |

## 3. Create the mapping table

Run [`supabase/migrations/20260813_add_auth_identity.sql`](../supabase/migrations/20260813_add_auth_identity.sql) in the Supabase SQL editor. This only creates `public.auth_identity`; it does not alter existing profiles or business tables.

## 4. Audit before creating transition accounts

Create a database backup first. Then run the migration script locally with environment variables set securely:

```bash
npm run auth:migrate-legacy -- --dry-run
```

Review the emitted counts. Google-only legacy users are intentionally skipped: after cutover they authorize with Google and are linked to their existing Vuneli profile by verified email. Legacy email/password users are created as confirmed Supabase users **without a password**, so they must use password recovery to choose a new password.

After count review, run the apply command once:

```bash
npm run auth:migrate-legacy
```

## 5. Validate before inviting users

Validate new registration, email confirmation, password recovery, Google sign-in, session refresh, protected pages, profile retrieval, and one existing user’s linked product records. Then invite existing password users to use **Forgot password** on the Vuneli sign-in page.

## 6. Keep a rollback window

Retain legacy Better Auth tables and the pre-cutover deployment until sign-in and existing-record access are confirmed in production. The mapping table is additive, so rolling back application code does not require deleting user data.
