import crypto from "node:crypto";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";
import { recordCapturedPayment } from "../lib/paid-booking.js";

export const config = { api: { bodyParser: false } };
let database, gateway;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) return res.status(500).json({ received: false });
  let raw;
  try {
    const chunks = [];
    let length = 0;
    for await (const chunk of req) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      length += bytes.length;
      if (length > 1048576) return res.status(413).end();
      chunks.push(bytes);
    }
    raw = Buffer.concat(chunks);
    const supplied = req.headers["x-razorpay-signature"];
    if (typeof supplied !== "string" || !/^[a-f0-9]{64}$/i.test(supplied)) return res.status(401).end();
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(raw).digest();
    if (!crypto.timingSafeEqual(expected, Buffer.from(supplied, "hex"))) return res.status(401).end();
    const event = JSON.parse(raw.toString("utf8"));
    if (event.event !== "payment.captured") return res.status(200).json({ received: true });
    const payment = event.payload?.payment?.entity;
    if (!payment?.order_id) return res.status(200).json({ received: true });
    gateway ||= new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const order = await gateway.orders.fetch(payment.order_id);
    const bookingId = order.notes?.booking_id || order.receipt?.replace(/^vb_/, "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(bookingId))) {
      return res.status(200).json({ received: true });
    }
    database ||= createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    // Await bounded delivery instead of fire-and-forget, which serverless runtimes can terminate.
    await recordCapturedPayment(database, bookingId, payment);
    return res.status(200).json({ received: true });
  } catch {
    // Return a retryable status if the paid booking could not be persisted.
    console.error("Razorpay webhook: processing failed");
    return res.status(500).json({ received: false });
  }
}
