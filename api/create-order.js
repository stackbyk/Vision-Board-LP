import Razorpay from "razorpay";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { name, email, phone } = req.body;

    const order = await rzp.orders.create({
      amount: 49900, // in paise, so ₹499. Change to your real price
      currency: "INR",
      receipt: "vb_" + Date.now(),
      notes: { name, email, phone },
    });

    res.json({ orderId: order.id, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error(err);
    const reason = err?.error?.description || err?.message || "Unknown error";
    res.status(500).json({ error: reason });
  }
}
