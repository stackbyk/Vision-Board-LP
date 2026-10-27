import { sendMetaPurchase } from "./meta-purchase.js";

// amount is always Razorpay's verified integer paise amount, never browser input.
export async function recordCapturedPayment(db, bookingId, payment, send = sendMetaPurchase) {
  if (payment.status !== "captured" || payment.currency !== "INR" ||
      !Number.isSafeInteger(payment.amount) || payment.amount <= 0 || !payment.id) {
    throw new Error("Payment is not a captured INR payment");
  }
  const { data: booking, error } = await db.from("bookings")
    .update({ payment_status: "paid", razorpay_payment_id: payment.id, amount: payment.amount })
    .eq("id", bookingId).select("*").single();
  if (error || !booking) throw new Error("Booking update failed");
  // Analytics failure must not turn a verified payment into a failed payment.
  try { await send(booking, { supabase: db }); } catch { console.error("Meta CAPI: purchase delivery failed"); }
  return booking;
}
