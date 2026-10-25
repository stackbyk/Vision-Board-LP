const form = document.querySelector("#booking-form");
const msg = document.querySelector("#vb-msg");
const payBtn = document.querySelector("#vb-pay");
const dialog = document.querySelector("#booking-dialog");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.querySelector("#vb-name").value.trim();
  const email = document.querySelector("#vb-email").value.trim();
  const phone = document.querySelector("#vb-phone").value.trim();

  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !/^\d{10}$/.test(phone)) {
    msg.textContent =
      "Please enter your name, a valid email and a 10-digit phone number.";
    return;
  }

  payBtn.disabled = true;
  msg.textContent = "Opening secure payment...";

  try {
    const res = await fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone }),
    });
    if (!res.ok) {
      let reason = "Server error " + res.status;
      try {
        reason = (await res.json()).error || reason;
      } catch {}
      throw new Error(reason);
    }
    const { orderId, keyId } = await res.json();

    const rzp = new Razorpay({
      key: keyId,
      order_id: orderId,
      name: "Livin’ My Dream",
      description: "Vision Board Workshop",
      prefill: { name, email, contact: phone },
      theme: { color: "#472C7D" },
      handler: async (response) => {
        const v = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response),
        });
        const { verified } = await v.json();
        msg.textContent = verified
          ? "Payment successful! Check your email for workshop details."
          : "Payment could not be verified. Please contact us with your payment ID: " +
            response.razorpay_payment_id;
        payBtn.disabled = false;
      },
      modal: {
        ondismiss: () => {
          msg.textContent = "Payment cancelled.";
          payBtn.disabled = false;
        },
      },
    });
    rzp.open();
  } catch (err) {
    console.error(err);
    msg.textContent = "Error: " + err.message;
    payBtn.disabled = false;
  }
});
