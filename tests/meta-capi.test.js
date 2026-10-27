import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { metaPurchasePayload, sendMetaPurchase } from "../lib/meta-purchase.js";
import { recordCapturedPayment } from "../lib/paid-booking.js";

const booking = { id: "f18f47c0-8df6-452e-9091-32d9e3d87867", name: "  Test Attendee  ",
  email: " TEST@EXAMPLE.COM ", phone: "+91 96632 43142", amount: 99900,
  payment_status: "paid", capi_sent: false, fbp: "fb.1.123.456", fbc: "fb.1.123.click",
  client_ip: "203.0.113.5", client_user_agent: "Test browser", event_source_url: "https://example.com/?utm_source=meta" };
const env = { META_PIXEL_ID: "1064122738786472", META_CAPI_ACCESS_TOKEN: "test-token", META_TEST_EVENT_CODE: "TEST123" };
const hash = value => createHash("sha256").update(value).digest("hex");

function database() {
  const row = { ...booking, capi_claim_token: null, capi_claimed_at: null };
  return { row, from() { return { update(value) {
    const filters = [];
    let lease = false;
    function apply() {
      const matches = filters.every(([key, match]) => row[key] === match) && (!lease || row.capi_claimed_at === null);
      if (matches) Object.assign(row, value);
      return { data: matches ? { ...row } : null, error: null };
    }
    const query = { eq(key, match) { filters.push([key, match]); return this; },
      or() { lease = true; return this; }, select() { return this; },
      maybeSingle: async () => apply(), single: async () => apply(),
      then(resolve, reject) { return Promise.resolve().then(apply).then(resolve, reject); } };
    return query;
  } }; } };
}

test("CAPI hashes identifiers, retains browser context, uses paise and booking UUID", () => {
  const body = metaPurchasePayload(booking, env);
  const event = body.data[0];
  assert.equal(body.test_event_code, "TEST123");
  assert.equal(body.access_token, env.META_CAPI_ACCESS_TOKEN);
  assert.equal(event.event_id, booking.id);
  assert.equal(event.event_name, "Purchase");
  assert.equal(event.action_source, "website");
  assert.equal(event.custom_data.value, 999);
  assert.equal(event.custom_data.currency, "INR");
  assert.deepEqual(event.user_data.em, [hash("test@example.com")]);
  assert.deepEqual(event.user_data.ph, [hash("919663243142")]);
  assert.deepEqual(event.user_data.fn, [hash("test")]);
  assert.deepEqual(event.user_data.ln, [hash("attendee")]);
  assert.deepEqual(event.user_data.country, [hash("in")]);
  assert.equal(event.user_data.fbp, booking.fbp);
  assert.equal(event.user_data.fbc, booking.fbc);
  assert.equal(event.user_data.client_ip_address, booking.client_ip);
  assert.equal(event.user_data.client_user_agent, booking.client_user_agent);
  assert.equal(metaPurchasePayload(booking, {}).test_event_code, undefined);
});

test("concurrent verification and webhook only send once; sent flag waits for Meta success", async () => {
  const db = database();
  let sends = 0, finish;
  const options = { env, supabase: db, fetch: async (url, init) => {
    sends++;
    assert.equal(url, "https://graph.facebook.com/v26.0/1064122738786472/events");
    assert.equal(url.includes("test-token"), false);
    assert.equal(JSON.parse(init.body).data[0].event_id, booking.id);
    await new Promise(resolve => { finish = resolve; });
    return { ok: true, json: async () => ({ events_received: 1 }) };
  } };
  const first = sendMetaPurchase(booking, options);
  const second = sendMetaPurchase(booking, options);
  await new Promise(setImmediate);
  assert.equal(sends, 1);
  assert.equal(db.row.capi_sent, false);
  finish();
  assert.deepEqual(await Promise.all([first, second]), [true, false]);
  assert.equal(db.row.capi_sent, true);
  await sendMetaPurchase(booking, options); // Stale caller still cannot claim a sent row.
  assert.equal(sends, 1);
});

test("failure releases claim without setting sent; retry can deliver", async () => {
  const db = database();
  let logs = 0;
  const options = { env, supabase: db, log: () => { logs++; }, fetch: async () => { throw new Error("never logged sensitive details"); } };
  assert.equal(await sendMetaPurchase(booking, options), false);
  assert.equal(db.row.capi_sent, false);
  assert.equal(db.row.capi_claim_token, null);
  assert.equal(logs, 1);
  options.fetch = async () => ({ ok: true, json: async () => ({ events_received: 1 }) });
  assert.equal(await sendMetaPurchase(booking, options), true);
});

test("unpaid bookings cannot send and analytics failure cannot break a paid booking", async () => {
  const db = database();
  let sends = 0;
  assert.equal(await sendMetaPurchase({ ...booking, payment_status: "pending" }, { env, supabase: db, fetch: () => { sends++; } }), false);
  assert.equal(sends, 0);
  const saved = await recordCapturedPayment(db, booking.id,
    { id: "pay-1", amount: 99900, currency: "INR", status: "captured" }, async () => false);
  assert.equal(saved.payment_status, "paid");
  assert.equal(saved.amount, 99900);
  assert.equal(saved.razorpay_payment_id, "pay-1");
});
