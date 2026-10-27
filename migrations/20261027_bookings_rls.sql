-- Run in Supabase SQL Editor. Uses the columns already added to bookings.
begin;

alter table public.bookings enable row level security;
alter table public.bookings alter column payment_status set default 'pending';
alter table public.bookings alter column created_at set default now();

-- Public form clients may insert, but cannot list/return bookings or mark them paid.
-- Revoke inherited PUBLIC privileges too, so old permissive policies cannot expose rows.
revoke all privileges on table public.bookings from public, anon, authenticated;
grant insert (id, name, email, phone, country_code, slot_label, slot_datetime, payment_status, consent)
  on public.bookings to anon, authenticated;
grant all privileges on table public.bookings to service_role;

-- Needed only if the existing ID uses a serial/identity sequence instead of a UUID.
do $$
declare booking_sequence text;
begin
  booking_sequence := pg_get_serial_sequence('public.bookings', 'id');
  if booking_sequence is not null then
    execute format('grant usage on sequence %s to anon, authenticated', booking_sequence);
  end if;
end $$;

drop policy if exists booking_form_insert on public.bookings;
create policy booking_form_insert on public.bookings
  for insert to anon, authenticated
  with check (
    payment_status = 'pending'
    and slot_label = '31 Oct 2026, 11:30 AM IST'
    and slot_datetime = '2026-10-31T11:30:00+05:30'::timestamptz
    and consent = true
  );

-- Restrictive guard also applies if older permissive INSERT policies exist.
drop policy if exists booking_form_pending_only on public.bookings;
create policy booking_form_pending_only on public.bookings as restrictive
  for insert to anon, authenticated
  with check (
    payment_status = 'pending'
    and slot_label = '31 Oct 2026, 11:30 AM IST'
    and slot_datetime = '2026-10-31T11:30:00+05:30'::timestamptz
    and consent = true
  );

commit;
