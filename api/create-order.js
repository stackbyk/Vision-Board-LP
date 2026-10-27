import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";
import { isIP } from "node:net";

const AMOUNT_PAISE = 99900; // ₹999. The price is set only here, on the server.
const CURRENCY = "INR";
// Keep aligned with SESSION_SLOTS in payment.js; never trust a client-supplied session.
const SELECTED_SLOT = "31 Oct 2026, 11:30 AM IST";
const SLOT_DATETIME = "2026-10-31T11:30:00+05:30";

// Reuse clients across requests in each warm server instance.
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null;
const rzp = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET }) : null;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { name, email, phone, countryDialCode, consent, session, bookingId } = req.body || {};

    // 1. Validate inputs
    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({ error: "Please enter your name." });
    }
    if (
      cleanEmail.length > 150 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({ error: "Please enter a valid email." });
    }
    if (typeof phone !== "string" || !/^\+[1-9]\d{7,14}$/.test(phone)) {
      return res
        .status(400)
        .json({ error: "Please enter a valid international phone number." });
    }
    if (session !== SELECTED_SLOT) {
      return res.status(400).json({ error: "Please refresh to load the available session." });
    }

    if (consent !== true) {
      return res.status(400).json({ error: "Please agree to receive workshop updates on WhatsApp and email." });
    }
    if (typeof bookingId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bookingId)) {
      return res.status(400).json({ error: "Invalid booking reference." });
    }
    if (!supabase || !rzp) {
      return res.status(500).json({ error: "Server is not configured correctly (missing env vars)." });
    }

    // Neither operation needs the other's result: one call, no insert SELECT.
    const text = (value, limit = 512) => typeof value === "string" ? value.slice(0, limit) : null;
    const header = (name) => Array.isArray(req.headers?.[name]) ? req.headers[name][0] : req.headers?.[name];
    const forwarded = header("x-forwarded-for")?.split(",")[0].trim();
    const clientIp = forwarded || req.socket?.remoteAddress;
    const attribution = req.body || {};
    const [saved, order] = await Promise.all([
      supabase.from("bookings").insert({
        id: bookingId,
        name: cleanName,
        email: cleanEmail,
        phone,
        country_code: countryDialCode ? String(countryDialCode) : null,
        slot_label: SELECTED_SLOT,
        slot_datetime: SLOT_DATETIME,
        consent: true,
        payment_status: "pending",
        fbp: text(attribution.fbp),
        fbc: text(attribution.fbc),
        client_ip: clientIp && isIP(clientIp) ? clientIp : null,
        client_user_agent: text(header("user-agent"), 2048),
        event_source_url: text(attribution.event_source_url, 4096),
        utm_source: text(attribution.utm_source),
        utm_medium: text(attribution.utm_medium),
        utm_campaign: text(attribution.utm_campaign),
        utm_content: text(attribution.utm_content),
      }),
      rzp.orders.create({
        amount: AMOUNT_PAISE,
        currency: CURRENCY,
        receipt: "vb_" + bookingId,
        notes: { booking_id: bookingId, session: SELECTED_SLOT },
      }),
    ]);
    if (saved.error) {
      console.error("Supabase insert failed:", saved.error.message);
      return res.status(500).json({ error: "Something went wrong, please try again" });
    }
    return res.json({ orderId: order.id, keyId: process.env.RAZORPAY_KEY_ID,
      amount: AMOUNT_PAISE, currency: CURRENCY, bookingId });
  } catch (err) {
    console.error("create-order error:", err?.message || err);
    return res.status(500).json({ error: "Something went wrong, please try again" });
  }
}
