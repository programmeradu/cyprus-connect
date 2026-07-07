# Netlify Deployment Guide for VerdeIQ

This guide provides the necessary steps and environment variables to deploy **VerdeIQ** to Netlify.

## 1. Prerequisites
- A Netlify account.
- Your project pushed to a Git repository (GitHub, GitLab, or Bitbucket).

## 2. Deployment Steps
1. Log in to the [Netlify Dashboard](https://app.netlify.com/).
2. Click **"Add new site"** > **"Import an existing project"**.
3. Connect your Git provider and select the `verdeiqapp` repository.
4. Netlify will automatically detect **Next.js**.
5. Ensure the following build settings are set (the `netlify.toml` file already handles this):
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
6. Click **"Deploy Site"**.

## 3. Environment Variables
You MUST add the following environment variables in the Netlify Dashboard (**Site settings** > **Environment variables**):

| Key | Value (Copy from below) |
|-----|-------|
| `TURSO_CONNECTION_URL` | `libsql://db-941d64ce-418c-43a8-8d2f-da8a089432ee-orchids.aws-us-west-2.turso.io` |
| `TURSO_AUTH_TOKEN` | `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjU1NTg5NTcsImlkIjoiNjkyZTZlNjAtM2ZlZS00NjhmLTllYTEtNzI4YjFlNzdlZDBiIiwicmlkIjoiN2YxMDRhZjktNWZhZS00NTEwLWFjMjItNGFiNTFlNDEwOTg3In0.YiWpMwErtZmqyLFSYoa67qtNkL-R5RlyNjANyfD_6-eYK1lxqy9xjuqdM1r1HQF5QosEYuFF72Snndt4d4HHDQ` |
| `GOOGLE_GEMINI_API_KEY` | `AIzaSyATAjxsalAd7qbj4y_NtrNknz7G78hng8I` |
| `CLIMATIQ_API_KEY` | `R4B7ATGK0H4JZ9127TCW57BA8G` |
| `OPENEI_API_KEY` | `siRkfZnC96Su8y0nAfbyJqj5Yvtej0dqd1LQ7bid` |
| `WIKIRATE_API_KEY` | `rTHbkHYvRVi5gBfJr9yQVAtt` |
| `BETTER_AUTH_SECRET` | `GjPrKZespPJstYaeuLhcqsKGNN/4VkG7L1X6Y95do8U=` |
| `BETTER_AUTH_URL` | `https://your-netlify-site-name.netlify.app` (Update after deployment) |
| `NEXT_PUBLIC_APP_URL` | `https://your-netlify-site-name.netlify.app` (Update after deployment) |
| `GOOGLE_CLIENT_ID` | `429966742866-bg42lqicvfijun55emerlrrp4rh9c3go.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `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` |
| `ELECTRICITY_MAPS_API_KEY` | `NiNHTDljoZe6NxE5HEoaUser` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_dHJ1c3R5LXNhaWxmaXNoLTc0LmNsZXJrLmFjY291bnRzLmRldiQ` |
| `CLERK_SECRET_KEY` | `sk_test_ZoM78OmqBBHAsgSuMMwt7GNy2p64iN7mHjxoCwgKP0` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://kamrmriauxjkoelncgjt.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthbXJtcmlhdXhqa29lbG5jZ2p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDkwMzEsImV4cCI6MjA3OTA4NTAzMX0.zX9Ao_6dmK77aQ61NR4s186c8REjpNOzpnAS_Ptb4f0` |
| `SUPABASE_DATABASE_URL` | `postgresql://postgres.kamrmriauxjkoelncgjt:Sammyone@1@aws-1-eu-west-1.pooler.supabase.com:5432/postgres` |
| `STRIPE_SECRET_KEY` | `sk_test_51MtKvMC9dojwoOvIAVRlUPmaanM8ZO12TmJj3zT6FyrZ2puQHRXZrQ1A29m0xyEKAW5spfD0LIcosoY0seHvqGNu00SsOnynOX` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_51MtKvMC9dojwoOvIxJlg5OW3jF0gTcNMoTPde60qL1XV3REDT5njohD93DksMR0xizM2ykdaPe1ZQq62ephkQIrW00PMYP7Vhy` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_IuFg7tqejD9wuqFBfS6aLTGMcf8LjTgH` |
| `PAYSTACK_SECRET_KEY` | `sk_live_4c5200458f7d98e8f78f9d2e270b752dafb0c0d5` |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | `pk_live_c8b08040a8e6ef5c092e69a8baceabd732fe2000` |
| `AUTUMN_SECRET_KEY` | `am_sk_test_GBW6SmKRD2hVwzstggCIHsHBZhBiAqmAkhuJJBM8pH` |

## 4. Important Post-Deployment Task
Once your site is deployed to Netlify (e.g., `https://verdeiq-sme.netlify.app`), you **must** update the following environment variables in the Netlify Dashboard to match your new URL:
1. `BETTER_AUTH_URL`
2. `NEXT_PUBLIC_APP_URL`
3. Update your **Stripe Webhook URL** in the Stripe Dashboard to `https://your-netlify-site-name.netlify.app/api/stripe/webhook`.
4. Update your **Google OAuth Redirect URI** in the Google Cloud Console.
