-- Apply ONLY to a dedicated Instant Cleaning Quote Supabase project.
create extension if not exists pgcrypto;
create table public.businesses (
 id uuid primary key default gen_random_uuid(), slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 display_name text not null check(length(display_name) between 2 and 120),
 owner_email text not null, notification_email text not null,
 status text not null default 'demo' check(status in ('demo','active','paused')),
 pricing_config jsonb not null check(jsonb_typeof(pricing_config)='object'),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.quote_leads (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 submission_id uuid not null,
 customer_name text not null,customer_email text not null,customer_phone text,
 zip_code char(5) not null, service_type text not null,
 bedrooms int not null,bathrooms int not null,frequency text not null,
 selected_extras jsonb not null default '[]'::jsonb,
 estimated_min_cents integer not null,estimated_max_cents integer not null,
 consent_timestamp timestamptz not null, created_at timestamptz not null default now(),
 notification_status text not null default 'pending' check(notification_status in ('pending','sent')),
 notification_last_error text,
 constraint quote_lead_idempotency unique(business_id,submission_id)
);
create index quote_leads_by_business_time on public.quote_leads(business_id,created_at desc);
create table public.setup_requests (
 id uuid primary key default gen_random_uuid(),submission_id uuid not null unique,
 owner text not null,email text not null,business text not null,website text,message text,
 created_at timestamptz not null default now(),notification_status text not null default 'pending'
);
create table public.preview_links (
 id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses(id) on delete cascade,
 token_hash text not null unique,expires_at timestamptz not null,created_at timestamptz not null default now()
);
create index preview_expiry on public.preview_links(expires_at);
create table public.subscriptions (
 id uuid primary key default gen_random_uuid(),business_id uuid not null unique references public.businesses(id) on delete cascade,
 provider text not null,provider_customer_id text,
 provider_subscription_id text not null unique,status text not null,
 current_period_end timestamptz, last_event_at timestamptz not null default 'epoch',
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.processed_webhook_events (
 id uuid primary key default gen_random_uuid(),provider_event_id text not null unique,
 event_type text not null,processed_at timestamptz not null default now()
);
create table public.rate_windows (
 scope text not null, fingerprint text not null, window_start timestamptz not null,
 hits integer not null default 0,
 primary key(scope,fingerprint,window_start)
);
-- Never permit browsing of lead information via anon/authenticated roles.
alter table public.businesses enable row level security;
alter table public.quote_leads enable row level security;
alter table public.setup_requests enable row level security;
alter table public.preview_links enable row level security;
alter table public.subscriptions enable row level security;
alter table public.processed_webhook_events enable row level security;
alter table public.rate_windows enable row level security;
revoke all on public.businesses,public.quote_leads,public.setup_requests,public.preview_links,public.subscriptions,public.processed_webhook_events,public.rate_windows from anon,authenticated;
-- Only backend secret key may invoke rate limit. 10-minute buckets.
create or replace function public.claim_rate_slot(p_scope text,p_fingerprint text,p_limit integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare bucket timestamptz := to_timestamp(floor(extract(epoch from now())/600)*600); n integer;
begin
 if length(p_scope)>100 or length(p_fingerprint)<>64 or p_limit<1 or p_limit>100 then return false; end if;
 insert into public.rate_windows(scope,fingerprint,window_start,hits) values(p_scope,p_fingerprint,bucket,1)
 on conflict(scope,fingerprint,window_start) do update set hits=public.rate_windows.hits+1 returning hits into n;
 return n<=p_limit;
end; $$;
revoke all on function public.claim_rate_slot(text,text,integer) from public,anon,authenticated;
grant execute on function public.claim_rate_slot(text,text,integer) to service_role;
-- 24h cleanup of pseudonymous rate buckets can be scheduled later via DB cron.
-- Atomic idempotence and out-of-order protection for payment status.
create or replace function public.apply_subscription_event(
 p_event_id text,p_event_type text,p_business_id uuid,p_subscription_id text,
 p_customer_id text,p_status text,p_period_end timestamptz,p_event_at timestamptz)
returns boolean language plpgsql security definer set search_path = '' as $$
declare affected integer; latest_status text;
begin
 insert into public.processed_webhook_events(provider_event_id,event_type) values(p_event_id,p_event_type)
 on conflict(provider_event_id) do nothing;
 get diagnostics affected = row_count;
 if affected=0 then return false; end if;
 if not exists(select 1 from public.businesses where id=p_business_id) then raise exception 'Unknown business'; end if;
 insert into public.subscriptions(business_id,provider,provider_customer_id,provider_subscription_id,status,current_period_end,last_event_at)
 values(p_business_id,'lemonsqueezy',p_customer_id,p_subscription_id,p_status,p_period_end,p_event_at)
 on conflict(business_id) do update set provider_customer_id=excluded.provider_customer_id,
 provider_subscription_id=excluded.provider_subscription_id,status=excluded.status,current_period_end=excluded.current_period_end,
 last_event_at=excluded.last_event_at,updated_at=now()
 where public.subscriptions.last_event_at<=excluded.last_event_at;
 select s.status into latest_status from public.subscriptions s where s.business_id=p_business_id;
 update public.businesses set status=(case when latest_status in ('active','on_trial') then 'active' else 'paused' end),updated_at=now()
 where id=p_business_id;
 return true;
end; $$;
revoke all on function public.apply_subscription_event(text,text,uuid,text,text,text,timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.apply_subscription_event(text,text,uuid,text,text,text,timestamptz,timestamptz) to service_role;
