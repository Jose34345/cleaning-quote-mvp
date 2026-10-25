-- Product analytics are deliberately anonymous. Do not store PII or client IP here.
create table public.product_events (
 id uuid primary key default gen_random_uuid(),
 event_name text not null check(event_name in ('landing_view','demo_opened','quote_started','quote_completed','lead_submitted','checkout_started','payment_confirmed')),
 business_id uuid references public.businesses(id) on delete set null,
 is_demo boolean not null default false,
 source text not null check(source in ('public','server')),
 created_at timestamptz not null default now()
);
create index product_events_time on public.product_events(created_at desc,event_name);
create index product_events_business on public.product_events(business_id,created_at desc);
alter table public.product_events enable row level security;
revoke all on public.product_events from anon,authenticated;
