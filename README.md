# Instant Cleaning Quote — independent residential cleaning micro-SaaS

A branded quote-link MVP for US residential cleaning businesses. Homeowners see a **preliminary** range from owner-controlled, deterministic pricing rules and can send their inquiry to the business.

**Status:** local source MVP, not deployed, not merchant-approved, not demonstrated with paying customers. Demo fixture rates are fictional.

## Quick start
```bash
npm install
cp .env.example .env.local
npm run dev
npm test
npm run typecheck
npm run build
```

Use `/demo` to try the no-backend demo. With a **new isolated Supabase project** and the schema applied, an active business is accessible at `/q/[slug]`. A private demonstration can be created via `npm run business:preview`.

Do not seed real businesses with `scripts/example-pricing.json`: **example prices only**. Manual onboarding requires the owner's actual, consented rate sheet and enabled service ZIPs.

## Product features
- Home page and $39/mo setup request form
- 7-step mobile-responsive estimator, no AI price guesses
- Server-recalculated monetary ranges in integer cents, service-area checks, configurable services/extras and frequency multipliers
- Lead consent, DB persistence, transactional email with pending notification retry
- Tenant-isolated storage and no anonymous lead reading
- Expiring private demos with fictional prices only
- Disabled-by-default verified-signature subscription webhook scaffold, not a payment checkout
- Basic legal drafts; require professional review

## Architecture and rollout
Read `docs/architecture.md`, `docs/deployment.md`, `docs/mvp-scope.md`, `docs/customer-acquisition.md`. SQL in `supabase/migrations`.

## Important unresolved dependencies
No deployment or CI has been verified. No owner account for Supabase, Resend, Vercel or Lemon Squeezy has been configured for this *new* app. The existing Supabase account is for Litoral Trace and must not be reused.

## Sales materials
`docs/prospectos-2026-10-25.csv` includes 20 publicly sourced preliminary prospects. `docs/private-sales-demos.md` and `docs/outreach-drafts.md` describe the three concepts and unsent messages. They are **not** proof of human interest or permission to contact.
