import crypto from "crypto";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } =
    req.body || {};

  if (
    typeof razorpay_order_id !== "string" ||
    typeof razorpay_payment_id !== "string" ||
    typeof razorpay_signature !== "string" ||
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !["string", "number"].includes(typeof bookingId) ||
    !String(bookingId)
  ) {
    return res.status(400).json({ verified: false });
  }

  // 1. Verify the signature
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(razorpay_signature);
  const verified = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!verified) {
    return res.json({ verified: false });
  }

  // 2. Bind the client ID to the server-created order, then update that same row.
  try {
    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const order = await rzp.orders.fetch(razorpay_order_id);
    if (String(order.notes?.booking_id) !== String(bookingId)) {
      return res.status(400).json({ verified: false, saved: false });
    }
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const { error } = await supabase
      .from("bookings")
      .update({
        payment_status: "paid",
      })
      .eq("id", bookingId)
      .select("id")
      .single();

    if (error) {
      console.error("Could not mark booking paid:", error.message);
      return res.status(500).json({ verified: true, saved: false });
    }
  } catch (err) {
    console.error("verify-payment error:", err?.message || err);
    return res.status(500).json({ verified: true, saved: false });
  }

  // The payment is genuine even if the database update had a hiccup
  return res.json({ verified: true, saved: true });
}
