import { readFileSync } from "node:fs";
import crypto from "node:crypto";
import { test } from "node:test";
import assert from "node:assert/strict";

const id = "f18f47c0-8df6-452e-9091-32d9e3d87867";
function setup() {
  const saved = [];
  const source = readFileSync(new URL("../api/razorpay-webhook.js", import.meta.url), "utf8")
    .replace(/^import .*;\r?\n/gm, "").replace("export const config", "const config")
    .replace("export default async function handler", "async function handler");
  class Razorpay { orders = { fetch: async () => ({ notes: { booking_id: id } }) }; }
  const handler = new Function("crypto", "Razorpay", "createClient", "recordCapturedPayment", "process", "console", `${source};return handler;`)(
    crypto, Razorpay, () => ({}), async (_db, bookingId, payment) => saved.push({ bookingId, payment }),
    { env: { RAZORPAY_WEBHOOK_SECRET: "test-secret" } }, { error() {} });
  return { saved, handler };
}
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, end() { return this; }, json(body) { this.body = body; return this; } });
async function deliver(s, body, tamper = false) {
  const raw = Buffer.from(JSON.stringify(body, null, 2)); // Whitespace is part of the signature.
  const signature = crypto.createHmac("sha256", "test-secret").update(raw).digest("hex");
  const req = { method: "POST", headers: { "x-razorpay-signature": signature },
    async *[Symbol.asyncIterator]() { yield tamper ? Buffer.from(raw.toString() + " ") : raw; } };
  const res = response();
  await s.handler(req, res);
  return res;
}
test("signed captured event records booking and verified paise amount", async () => {
  const s = setup();
  const payment = { id: "pay-1", order_id: "order-1", status: "captured", currency: "INR", amount: 99900 };
  assert.equal((await deliver(s, { event: "payment.captured", payload: { payment: { entity: payment } } })).code, 200);
  assert.deepEqual(s.saved, [{ bookingId: id, payment }]);
});
test("raw-body tampering is rejected; ignored signed events return 200", async () => {
  const s = setup();
  assert.equal((await deliver(s, { event: "payment.captured" }, true)).code, 401);
  assert.equal((await deliver(s, { event: "payment.authorized" })).code, 200);
  assert.equal(s.saved.length, 0);
});
