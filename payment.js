const form = document.querySelector("#booking-form");
const msg = document.querySelector("#vb-msg");
const payBtn = document.querySelector("#vb-pay");
const dialog = document.querySelector("#booking-dialog");

// Keep the country dropdown in the dialog's top layer (inline in .iti).
const phoneInput = document.querySelector("#vb-phone");
const iti = window.intlTelInput ? window.intlTelInput(phoneInput, {
  initialCountry: "in",
  countryOrder: ["in", "us", "gb", "ae", "sg", "au", "ca"],
  separateDialCode: true,
  countrySearch: true,
  fixDropdownWidth: true,
  i18n: { searchPlaceholder: "Search country" },
  useFullscreenPopup: false,
  dropdownContainer: null,
  utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@24.5.0/build/js/utils.js",
}) : null;
const phoneReady = iti ? iti.promise.then(() => true).catch(() => false) : Promise.resolve(false);
const clearBookingError = () => { msg.textContent = ""; };
dialog.addEventListener("close", clearBookingError);
new MutationObserver(() => {
  clearBookingError();
  if (dialog.open && iti) iti.setCountry("in");
}).observe(dialog, {
  attributes: true, attributeFilter: ["open"],
});
phoneInput.addEventListener("countrychange", clearBookingError);
// Fit the inline dropdown within the dialog, opening upward when appropriate.
phoneInput.addEventListener("open:countrydropdown", () => {
  const wrapper = phoneInput.closest(".iti");
  const dropdown = wrapper.querySelector(".iti__dropdown-content");
  const list = wrapper.querySelector(".iti__country-list");
  const inputBounds = phoneInput.getBoundingClientRect();
  const bounds = dialog.getBoundingClientRect();
  const above = inputBounds.top - Math.max(bounds.top, 0) - 12;
  const below = Math.min(bounds.bottom, innerHeight) - inputBounds.bottom - 12;
  const upward = above > below;
  dropdown.style.top = upward ? "auto" : "100%";
  dropdown.style.bottom = upward ? "100%" : "auto";
  list.style.maxHeight = `${Math.max(60, Math.min(260, (upward ? above : below) - 44))}px`;
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.querySelector("#vb-name").value.trim();
  const email = document.querySelector("#vb-email").value.trim();

  if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
    msg.textContent = "Please enter your name and a valid email.";
    return;
  }
  if (!(await phoneReady)) {
    msg.textContent = "Phone validation could not load. Please refresh and try again.";
    return;
  }
  if (!iti.isValidNumber()) {
    msg.textContent = "Please enter a valid phone number for the selected country.";
    return;
  }
  const phone = iti.getNumber();
  const countryDialCode = iti.getSelectedCountryData().dialCode;

  payBtn.disabled = true;
  msg.textContent = "Opening secure payment...";

  try {
    const res = await fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, countryDialCode }),
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
