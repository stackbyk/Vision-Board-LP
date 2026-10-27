-- Run before deploying CAPI. No public SELECT/UPDATE privileges are added.
begin;
alter table public.bookings
  add column if not exists fbp text,
  add column if not exists fbc text,
  add column if not exists client_ip text,
  add column if not exists client_user_agent text,
  add column if not exists event_source_url text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists razorpay_payment_id text,
  add column if not exists amount bigint,
  add column if not exists capi_sent boolean not null default false,
  add column if not exists capi_claim_token uuid,
  add column if not exists capi_claimed_at timestamptz;
update public.bookings set capi_sent = false where capi_sent is null;
alter table public.bookings alter column capi_sent set default false;
alter table public.bookings alter column capi_sent set not null;
comment on column public.bookings.amount is 'Verified captured Razorpay amount in paise; divide by 100 for INR analytics.';
comment on column public.bookings.capi_claim_token is 'Server-only atomic CAPI delivery lease. capi_sent stays false until Meta accepts.';
commit;
