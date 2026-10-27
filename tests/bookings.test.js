import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { isIP } from "node:net";
import { recordCapturedPayment } from "../lib/paid-booking.js";

// Isolate the real handlers from all external services and credentials.
function setup({ saveError = null, insertError = null, deferred = false, paymentStatus = "captured" } = {}) {
  const calls = [];
  let releaseInsert, releaseOrder;
  const rows = [];
  const updates = [];
  let notes;
  const env = { SUPABASE_URL: "mock", SUPABASE_SERVICE_ROLE_KEY: "server-only-mock",
    RAZORPAY_KEY_ID: "mock", RAZORPAY_KEY_SECRET: "test-secret" };
  const createClient = () => ({ from(table) {
    assert.equal(table, "bookings");
    return {
      insert(row) {
        rows.push(row);
        calls.push("insert");
        return deferred ? new Promise(resolve => { releaseInsert = () => resolve({ error: insertError }); }) : Promise.resolve({ error: insertError });
      },
      update(value) {
        return { eq(column, id) {
          updates.push({ value, column, id });
          return { select: () => ({ single: async () => ({ data: saveError ? null : { id }, error: saveError }) }) };
        } };
      },
    };
  } });
  class Razorpay {
    payments = { fetch: async () => ({ id: "payment-1", order_id: "order-1", status: paymentStatus, currency: "INR", amount: 99900 }) };
    orders = {
      create: async (order) => { notes = order.notes; calls.push("order"); return deferred ? new Promise(resolve => { releaseOrder = () => resolve({ id: "order-1" }); }) : { id: "order-1" }; },
      fetch: async (id) => { assert.equal(id, "order-1"); return { notes }; },
    };
  }
  const load = (file) => {
    const source = readFileSync(new URL(`../api/${file}`, import.meta.url), "utf8")
      .replace(/^import .*;\r?\n/gm, "")
      .replace("export default async function handler", "async function handler");
    return new Function("Razorpay", "createClient", "crypto", "process", "console", "isIP", "recordCapturedPayment", `${source}; return handler;`)(
      Razorpay, createClient, crypto, { env }, { error() {} }, isIP, (db, id, payment) => recordCapturedPayment(db, id, payment, async () => {}),
    );
  };
  const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
  const booking = { name: "Test Attendee", email: "test@example.com", phone: "+919663243142",
    bookingId: "f18f47c0-8df6-452e-9091-32d9e3d87867", countryDialCode: "91", consent: true, session: "31 Oct 2026, 11:30 AM IST" };
  const payment = {
    bookingId: "f18f47c0-8df6-452e-9091-32d9e3d87867", razorpay_order_id: "order-1", razorpay_payment_id: "payment-1",
    razorpay_signature: crypto.createHmac("sha256", env.RAZORPAY_KEY_SECRET).update("order-1|payment-1").digest("hex"),
  };
  return { calls, release: () => { releaseInsert(); releaseOrder(); }, create: load("create-order.js"), verify: load("verify-payment.js"), rows, updates, response, booking, payment };
}

test("one pending row, then paid update by the same ID; no extra schema columns", async () => {
  const s = setup();
  const created = s.response();
  await s.create({ method: "POST", body: s.booking }, created);
  assert.equal(created.body.bookingId, "f18f47c0-8df6-452e-9091-32d9e3d87867");
  assert.equal(s.rows.length, 1);
  assert.deepEqual(Object.keys(s.rows[0]).sort(), ["name", "email", "phone", "country_code", "payment_status", "consent", "slot_label", "slot_datetime", "id", "fbp", "fbc", "client_ip", "client_user_agent", "event_source_url", "utm_source", "utm_medium", "utm_campaign", "utm_content"].sort());
  assert.equal(s.rows[0].payment_status, "pending");
  assert.equal(s.rows[0].consent, true);
  assert.equal(s.rows[0].slot_label, s.booking.session);
  assert.equal(s.rows[0].slot_datetime, "2026-10-31T11:30:00+05:30");
  assert.equal(s.rows[0].country_code, "91");
  const paid = s.response();
  await s.verify({ method: "POST", body: s.payment }, paid);
  assert.deepEqual(paid.body, { verified: true, saved: true });
  assert.deepEqual(s.updates, [{ value: { payment_status: "paid", razorpay_payment_id: "payment-1", amount: 99900 }, column: "id", id: created.body.bookingId }]);
  assert.equal(s.rows.length, 1);
});

test("invalid signature or mismatched booking ID cannot update a row", async () => {
  const s = setup();
  await s.create({ method: "POST", body: s.booking }, s.response());
  for (const body of [{ ...s.payment, razorpay_signature: "invalid" }, { ...s.payment, bookingId: "someone-else" }]) {
    const res = s.response();
    await s.verify({ method: "POST", body }, res);
    assert.equal(res.body.verified, false);
  }
  assert.equal(s.updates.length, 0);
});

test("database update failure is reported without inserting another row", async () => {
  const s = setup({ saveError: { message: "mock failure" } });
  await s.create({ method: "POST", body: s.booking }, s.response());
  const res = s.response();
  await s.verify({ method: "POST", body: s.payment }, res);
  assert.equal(res.code, 500);
  assert.deepEqual(res.body, { verified: true, saved: false });
  assert.equal(s.rows.length, 1);
});

test("insert and order start in parallel without SELECT; save failure blocks checkout response", async () => {
  const s = setup({ deferred: true, insertError: { message: "failed" } });
  const res = s.response();
  const pending = s.create({ method: "POST", body: s.booking }, res);
  assert.deepEqual(s.calls, ["insert", "order"]);
  s.release();
  await pending;
  assert.equal(res.code, 500);
  assert.equal(res.body.error, "Something went wrong, please try again");
  assert.equal(res.body.orderId, undefined);
});

test("missing consent or invalid UUID stops both operations", async () => {
  const s = setup();
  for (const body of [{ ...s.booking, consent: false }, { ...s.booking, bookingId: "invalid" }]) {
    const res = s.response();
    await s.create({ method: "POST", body }, res);
    assert.equal(res.code, 400);
  }
  assert.deepEqual(s.calls, []);
});

test("booking stores attribution plus server-observed IP and user agent", async () => {
  const s = setup();
  await s.create({ method: "POST", headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1", "user-agent": "Test browser" },
    body: { ...s.booking, fbp: "fb.1.123.456", fbc: "fb.1.123.click", event_source_url: "https://example.com/?utm_source=meta", utm_source: "meta", utm_medium: "paid", utm_campaign: "test", utm_content: "ad1", client_ip: "spoofed" } }, s.response());
  assert.equal(s.rows[0].client_ip, "203.0.113.9");
  assert.equal(s.rows[0].client_user_agent, "Test browser");
  assert.equal(s.rows[0].utm_content, "ad1");
  assert.equal(s.rows[0].fbp, "fb.1.123.456");
});

test("verification uses Razorpay amount and rejects authorized-but-not-captured payments", async () => {
  const s = setup();
  await s.create({ method: "POST", body: s.booking }, s.response());
  await s.verify({ method: "POST", body: { ...s.payment, amount: 1 } }, s.response());
  assert.equal(s.updates[0].value.amount, 99900);
  const pending = setup({ paymentStatus: "authorized" });
  await pending.create({ method: "POST", body: pending.booking }, pending.response());
  const res = pending.response();
  await pending.verify({ method: "POST", body: pending.payment }, res);
  assert.equal(res.body.verified, false);
  assert.equal(pending.updates.length, 0);
});
