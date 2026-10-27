import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

// Isolate the real handlers from all external services and credentials.
function setup({ saveError = null, insertError = null, deferred = false } = {}) {
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
    orders = {
      create: async (order) => { notes = order.notes; calls.push("order"); return deferred ? new Promise(resolve => { releaseOrder = () => resolve({ id: "order-1" }); }) : { id: "order-1" }; },
      fetch: async (id) => { assert.equal(id, "order-1"); return { notes }; },
    };
  }
  const load = (file) => {
    const source = readFileSync(new URL(`../api/${file}`, import.meta.url), "utf8")
      .replace(/^import .*;\r?\n/gm, "")
      .replace("export default async function handler", "async function handler");
    return new Function("Razorpay", "createClient", "crypto", "process", "console", `${source}; return handler;`)(
      Razorpay, createClient, crypto, { env }, { error() {} },
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
  assert.deepEqual(Object.keys(s.rows[0]).sort(), ["name", "email", "phone", "country_code", "payment_status", "consent", "slot_label", "slot_datetime", "id"].sort());
  assert.equal(s.rows[0].payment_status, "pending");
  assert.equal(s.rows[0].consent, true);
  assert.equal(s.rows[0].slot_label, s.booking.session);
  assert.equal(s.rows[0].slot_datetime, "2026-10-31T11:30:00+05:30");
  assert.equal(s.rows[0].country_code, "91");
  const paid = s.response();
  await s.verify({ method: "POST", body: s.payment }, paid);
  assert.deepEqual(paid.body, { verified: true, saved: true });
  assert.deepEqual(s.updates, [{ value: { payment_status: "paid" }, column: "id", id: created.body.bookingId }]);
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
