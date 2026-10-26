import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

const AMOUNT_PAISE = 99900; // ₹999. The price is set only here, on the server.
const CURRENCY = "INR";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { name, email, phone, countryDialCode, consent } = req.body || {};

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

    // Check env vars are present
    if (
      !process.env.SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      !process.env.RAZORPAY_KEY_ID ||
      !process.env.RAZORPAY_KEY_SECRET
    ) {
      console.error("Missing environment variables");
      return res.status(500).json({
        error: "Server is not configured correctly (missing env vars).",
      });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // 2. Save the lead FIRST, as "pending"
    const { data: booking, error: insertError } = await supabase
      .from("bookings")
      .insert({
        name: cleanName,
        email: cleanEmail,
        phone,
        country_code: countryDialCode ? String(countryDialCode) : null,
        amount: AMOUNT_PAISE,
        currency: CURRENCY,
        status: "pending",
        consent: consent === true,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Supabase insert failed:", insertError.message);
      return res
        .status(500)
        .json({ error: "Could not save your details. Please try again." });
    }

    // 3. Create the Razorpay order
    try {
      const rzp = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const order = await rzp.orders.create({
        amount: AMOUNT_PAISE,
        currency: CURRENCY,
        receipt: "vb_" + Date.now(),
        notes: { booking_id: String(booking.id) },
      });

      // 4. Link the order to the saved lead
      await supabase
        .from("bookings")
        .update({ razorpay_order_id: order.id })
        .eq("id", booking.id);

      return res.json({
        orderId: order.id,
        keyId: process.env.RAZORPAY_KEY_ID,
        amount: AMOUNT_PAISE,
        currency: CURRENCY,
        bookingId: booking.id,
      });
    } catch (orderErr) {
      // The lead stays saved even if Razorpay fails
      await supabase
        .from("bookings")
        .update({ status: "order_failed" })
        .eq("id", booking.id);
      throw orderErr;
    }
  } catch (err) {
    console.error("create-order error:", err?.message || err, err?.error || "");
    res
      .status(500)
      .json({
        error: "Something went wrong starting your payment. Please try again.",
      });
  }
}
