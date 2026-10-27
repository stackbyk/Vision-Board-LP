-- Run in Supabase SQL Editor before deploying the session-enabled booking form.
-- Existing bookings remain unchanged. Paid bookings retain this field on updates.
alter table public.bookings add column if not exists session text;

comment on column public.bookings.session is
  'Selected workshop session. Include in confirmation email and spreadsheet/CRM exports.';
