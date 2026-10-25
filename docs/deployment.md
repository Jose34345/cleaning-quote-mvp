# Deployment guide — NOT DEPLOYED

1. Create a **new isolated** Supabase project in `us-east-1` after confirming organization and costs. Never point this at Litoral Trace.
2. Run `supabase/migrations/001_initial.sql` as migration, then review RLS/grants and test isolation.
3. Configure a verified transactional sender at Resend. Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SALES_NOTIFY_EMAIL` and `NEXT_PUBLIC_CONTACT_EMAIL`.
4. Generate a random long `ABUSE_HASH_SECRET`. Set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` only in secure server-only environment; do not use `NEXT_PUBLIC_` for secrets. Supabase's 2026 recommended keys begin with `sb_secret_`.
5. `npm install`, `npm run check`. Commit the lockfile generated during first successful install (none is bundled because npm registry access is unavailable in the build environment).
6. Create a **private** GitHub repository (`cleaning-quote-mvp`), attach this working directory and push. Connect to Vercel; configure production environment variables and deploy under the temporary Vercel subdomain.
7. Verify real production HTTP, mobile flow, server quote, lead save, correct owner notification, cross-tenant isolation, error path, and no secrets in browser bundle.
8. Before collecting money, verify merchant approval, hosted checkout and subscription association with server-supplied business ID; provision Lemon Squeezy signing secret; exercise checkout test mode + webhook retries and cancellation; only then set `BILLING_LIVE_ENABLED=true`.
9. Run scheduled `npm run notifications:retry` in a trusted worker or cron with secret-only access. Set deletion policy for 90-day leads, cleanup old rate buckets, and monitor failures.

## Quick commands (after dependencies installed)
```sh
npm run dev
npm run business:create -- --slug example-cleaning --name "Example Cleaning" --email owner@example.com --pricing scripts/example-pricing.json
npm run business:preview -- --slug example-cleaning
# Activation requires a verified subscription:
npm run business:activate -- --slug example-cleaning --payment-verified
```

## Unresolved
- No connected new Supabase instance, no API keys, no Resend verified sender, no Lemon Squeezy account approval, no Vercel deployment authorization/credentials.
- There is no verified live URL, no tested real payments, no confirmed commercial leads.
