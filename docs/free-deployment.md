# Free deployment plan — commercial market validation (2026-10-25)

**Selected validation stack:** Netlify Free (Next.js 16, App Router and API routes), a **separate** Supabase Free project, and Resend Free. Keep all production and customer data isolated from Litoral Trace. Do not add a payment method or buy a domain to validate demand. The public domain can be `YOUR-SITE.netlify.app`.

## Verified provider documentation

- Netlify Free: $0, 300 monthly credits with a hard stop. Netlify supports current Next.js via OpenNext, including SSR and API routes. Each production deployment costs **15 credits**, bandwidth **20/GB**, web requests **2/10,000**, and function compute **10/GB-hour**. Do not waste credits with frequent production pushes: use pull-request deploy previews. Sources: https://www.netlify.com/pricing/ and https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/ and https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/
- Supabase Free: 500 MB PostgreSQL; projects may pause after approximately 7 days of low activity, requiring an account owner to resume. Create a **new dedicated project** and apply `001_initial.sql` **then** `002_product_events.sql`. The free tier cannot promise production uptime. Sources: https://supabase.com/pricing and https://supabase.com/docs/guides/platform/free-project-pausing
- Resend Free: 3,000 emails/month, 100/day, and up to three verified domains. Configure a verified sender domain/subdomain before sending to arbitrary external owners. Sources: https://resend.com/pricing and https://resend.com/changelog/three-domains-on-the-free-tier
- Vercel Hobby explicitly forbids commercial use, including apps built for financial gain: do not deploy this commercial MVP on Hobby. Source: https://vercel.com/docs/limits/fair-use-guidelines
- Cloudflare Workers Free permits 100,000 daily requests with a 10 ms CPU/request limit, but full Next.js 16 requires an adapter (vinext is currently beta). Do not switch stacks until Netlify is shown to be unsuitable. Sources: https://developers.cloudflare.com/workers/platform/limits/ and https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/

## Deployment sequence (manual account connection required)

1. Run GitHub Actions CI: `node --test tests/repository-smoke.smoke.mjs`, `npm install`, `npm run typecheck`, `npm test`, `npm run build`. The optional **database integration suite is skipped** when isolated `TEST_DB_*` credentials are absent; a green normal CI **does not verify multi-tenant PostgreSQL isolation**.
2. Register/sign into Netlify Free, **do not enable paid features**, import GitHub `Jose34345/cleaning-quote-mvp`, branch `main`, with framework autodetection. Build command `npm run build`; site framework publish output is `.next`. Use Netlify's automatically created `*.netlify.app` URL. The application must run as SSR; **do not use `next export`** because this app has server routes.
3. Separately create a **new Supabase Free project** (not the Litoral Trace project), review quota and project ownership, and run migrations 001 then 002. Verify grants and RLS. Do not share existing production DB or service-role keys.
4. In Netlify environment variables set server-only `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and a random 32+ character `ABUSE_HASH_SECRET`. Leave `BILLING_LIVE_ENABLED=false`. Set `NEXT_PUBLIC_SITE_URL` to the issued Netlify URL (then redeploy to inject public vars into the client bundle).
5. For outbound email, authenticate a **dedicated sending subdomain** (e.g., `quotes-mail.litoraltrace.com` *only if approved*) and set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SALES_NOTIFY_EMAIL`, and `NEXT_PUBLIC_CONTACT_EMAIL`. Existing domain ownership alone does not verify email DNS sender. If no sender is configured, stored leads remain pending; do not claim notifications are functional.
6. Verify the live demo `/demo` end to end **without a database**, then test the real customer flow against a **sandbox business only**, with mock contact info. Check owner email delivery, multi-tenant isolation, abuse limits, no exposed credentials, DB failures, and notification retry. Apply the privacy and retention review before collecting real leads.
7. Do **not** activate checkout or publish pricing as payable until merchant approval and real provider testing; billing is disabled by default. Request setup is a sales interest form, not a paid subscription.

## Domain choice

Start with `YOUR-SITE.netlify.app` ($0, no DNS risk). Only later consider `quote.litoraltrace.com`: it costs nothing to add a DNS subdomain under an existing domain but mixes an unrelated cleaning product with the RegTech parent brand and risks accidental DNS changes. **Do not alter `lacey.litoraltrace.com`, email MX or other live records.**

## Decision gate

GO for **non-collecting demo** only after CI + live render + quote simulation. GO for real leads only after isolated DB, verified email delivery, legal/privacy review and security testing. NO-GO for payments while billing integrations are unapproved.
