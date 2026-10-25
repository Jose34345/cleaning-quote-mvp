# Architecture / threat boundaries

Next.js App Router → public UI + server POST routes → isolated Supabase Postgres project. Tailwind + custom CSS. Zod validates requests; pure pricing calculates integer cents both for visible estimate and authoritative lead submission.

## Data trust
- `GET /q/[slug]` only exposes enabled public choices; raw pricing JSON stays server-side.
- `POST /api/estimate` loads tenant config by active slug and recalculates. No PII saved.
- `POST /api/quotes` requires active tenant, explicit consent, rate-limit RPC, spam honeypot and DB idempotency key. Browser values never include money; the server recalculates. On email failure the lead remains pending for a retry script.
- `POST /api/setup-requests` stores sales inquiries separately. External sales notifications are optional.
- `/preview/[token]` requires hashed unguessable token with expiry, checks DB access on each request. Uses example pricing, never writes leads or authenticates tenant.
- Database tables are RLS protected without anon/authenticated policies. Privileged credentials only exist in the server environment. **Do not reuse any Litoral Trace Supabase project.**
- `POST /api/webhooks/lemonsqueezy` validates raw payload using SHA-256 HMAC timing-safe compare; does nothing unless `BILLING_LIVE_ENABLED=true`. A verified event atomically stores idempotency and updates the subscription with timestamp ordering. It is NOT a checkout implementation.

## Known deployment risk
- In-process Node request headers used for IP throttling must be configured behind a trusted reverse proxy. Never trust a caller-supplied forwarded IP directly for a high-security deployment. The HMAC salt must be secret. The DB rate function limits anonymous requests in 10-minute buckets; cleaning old windows is an operations task.
- Authenticated admin dashboard is intentionally not in scope. Owner data is delivered by email; internal scripts use privileged environment only.
- Demo/test mode never uses real leads or outbound mail.
- The billing webhook mapping presumes valid checkout custom data and a verified provider account. It is *disabled by default*. Payment setup and full integration tests are a GO/NO-GO criterion.

## Minimum analytics
- Public, non-PII `landing_view`, `demo_opened`, `quote_started`, `quote_completed` in `product_events`; unauthenticated events are untrusted telemetry, not proven human engagement.
- `lead_submitted` is emitted server-side only after the database insert. `checkout_started`/`payment_confirmed` are not emitted until a real checkout and verified webhook flow exist.
- `npm run metrics` prints raw counts only. No prospect interest, conversion or MRR is assumed from raw opens.
