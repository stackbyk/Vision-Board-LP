const form = document.querySelector("#booking-form");
const msg = document.querySelector("#vb-msg");
const payBtn = document.querySelector("#vb-pay");
const dialog = document.querySelector("#booking-dialog");

document.querySelector("#booking-session-slots").addEventListener("change", (event) => {
  event.target.closest(".booking-session-card").scrollIntoView({
    inline: "center",
    block: "nearest",
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
  });
});

// Analytics only: keep this display price aligned with server AMOUNT_PAISE (₹999).
const ANALYTICS_TICKET_PRICE = 999;
function workshopName(session) {
  const date = session.split(",", 1)[0];
  return date ? `Vision Board Workshop - ${date}` : "Vision Board Workshop";
}
const trackedPurchases = new Set();
function trackWorkshopEvent(event, { bookingId, session, value = ANALYTICS_TICKET_PRICE } = {}) {
  try {
    if (typeof window.gtag !== "function") return;
    if (event === "purchase") {
      const key = `vb_ga4_purchase:${bookingId}`;
      if (trackedPurchases.has(bookingId)) return;
      try { if (localStorage.getItem(key)) return; } catch {}
      trackedPurchases.add(bookingId);
      try { localStorage.setItem(key, "1"); } catch {}
    }
    window.gtag("event", event, {
      ...(event === "purchase" ? { transaction_id: bookingId } : {}),
      value,
      currency: "INR",
      items: [{ item_name: workshopName(session), price: value, quantity: 1 }],
    });
  } catch { /* Analytics must never interrupt registration or payment. */ }
}

const trackedPixelPurchases = new Set();
function trackMetaEvent(eventName, bookingId, session, value = ANALYTICS_TICKET_PRICE) {
  try {
    if (!bookingId || typeof window.fbq !== "function") return;
    if (eventName === "Purchase") {
      const key = `vb_meta_purchase:${bookingId}`;
      if (trackedPixelPurchases.has(bookingId)) return;
      try { if (localStorage.getItem(key)) return; } catch {}
      trackedPixelPurchases.add(bookingId);
      try { localStorage.setItem(key, "1"); } catch {}
    }
    window.fbq("track", eventName, {
      value, currency: "INR", content_name: workshopName(session),
    }, { eventID: bookingId });
  } catch { /* A blocked Pixel must not affect registration or payment. */ }
}

// Keep the country dropdown in the dialog's top layer (inline in .iti).
const phoneInput = document.querySelector("#vb-phone");
const iti = window.intlTelInput
  ? window.intlTelInput(phoneInput, {
      initialCountry: "in",
      countryOrder: ["in", "us", "gb", "ae", "sg", "au", "ca"],
      separateDialCode: true,
      countrySearch: true,
      fixDropdownWidth: true,
      i18n: { searchPlaceholder: "Search country" },
      useFullscreenPopup: false,
      dropdownContainer: null,
      utilsScript:
        "https://cdn.jsdelivr.net/npm/intl-tel-input@24.5.0/build/js/utils.js",
    })
  : null;
const phoneReady = iti
  ? iti.promise.then(() => true).catch(() => false)
  : Promise.resolve(false);
const clearBookingError = () => {
  msg.textContent = "";
};
dialog.addEventListener("close", clearBookingError);
let preserveCountryOnReopen = false;
new MutationObserver(() => {
  clearBookingError();
  if (dialog.open) {
    if (iti && !preserveCountryOnReopen) iti.setCountry("in");
    preserveCountryOnReopen = false;
  }
}).observe(dialog, {
  attributes: true,
  attributeFilter: ["open"],
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

let submissionPending = false;
function bookingAttribution() {
  try {
    const url = new URL(window.location.href);
    const cookie = (name) => {
      const value = document.cookie.split(";").find(part => part.trim().startsWith(`${name}=`));
      return value ? decodeURIComponent(value.trim().slice(name.length + 1)) : null;
    };
    const fbclid = url.searchParams.get("fbclid");
    return {
      fbp: cookie("_fbp"),
      fbc: cookie("_fbc") || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : null),
      event_source_url: url.href,
      ...Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "utm_content"].map(key => [key, url.searchParams.get(key)])),
    };
  } catch { return {}; }
}
function setPaymentBusy(busy) {
  submissionPending = busy;
  payBtn.disabled = busy;
  payBtn.setAttribute("aria-busy", String(busy));
  msg.classList.remove("payment-opening");
}
function restoreRegistration(message) {
  preserveCountryOnReopen = true;
  if (!dialog.open) dialog.showModal();
  setPaymentBusy(false);
  // Let the existing open/close observers clear old errors first.
  queueMicrotask(() => { msg.textContent = message; });
}
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (submissionPending) return;
  const name = document.querySelector("#vb-name").value.trim();
  const email = document.querySelector("#vb-email").value.trim();
  const consent = document.querySelector("#vb-consent").checked;
  if (name.length < 2 || name.length > 100 || email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    msg.textContent = "Please enter your name and a valid email.";
    return;
  }
  if (!consent) {
    msg.textContent = "Please agree to receive workshop updates on WhatsApp and email.";
    return;
  }
  // Lock before awaiting phone utils so rapid clicks cannot start two requests.
  setPaymentBusy(true);
  if (!(await phoneReady)) {
    setPaymentBusy(false);
    msg.textContent = "Phone validation could not load. Please refresh and try again.";
    return;
  }
  if (!iti.isValidNumber()) {
    setPaymentBusy(false);
    msg.textContent = "Please enter a valid phone number for the selected country.";
    return;
  }
  const phone = iti.getNumber();
  const countryDialCode = iti.getSelectedCountryData().dialCode;
  const session = form.elements.namedItem("session").value;
  msg.textContent = "Opening secure payment...";
  msg.classList.add("payment-opening");
  try {
    const bookingId = crypto.randomUUID();
    trackWorkshopEvent("begin_checkout", { session });
    trackMetaEvent("InitiateCheckout", bookingId, session);
    if (typeof Razorpay !== "function") throw new Error("Checkout has not loaded");
    const res = await fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, name, email, phone, countryDialCode, consent, session, ...bookingAttribution() }),
    });
    if (!res.ok) throw new Error("Could not prepare payment");
    const { orderId, keyId, amount } = await res.json();
    let paymentCompleted = false;
    const rzp = new Razorpay({
      key: keyId,
      order_id: orderId,
      name: "Livin’ My Dream",
      description: workshopName(session),
      prefill: { name, email, contact: phone },
      notes: { session, booking_id: bookingId },
      theme: { color: "#472C7D" },
      handler: async (response) => {
        paymentCompleted = true;
        try {
          const v = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, bookingId }),
          });
          const { verified, saved } = await v.json();
          if (v.ok && verified === true) {
            trackWorkshopEvent("purchase", {
              bookingId,
              session,
              value: typeof amount === "number" ? amount / 100 : ANALYTICS_TICKET_PRICE,
            });
            trackMetaEvent("Purchase", bookingId, session,
              typeof amount === "number" ? amount / 100 : ANALYTICS_TICKET_PRICE);
          }
          restoreRegistration(verified && saved === false
            ? "Payment received, but your registration could not be updated. Please contact us with your payment ID: " + response.razorpay_payment_id
            : verified
            ? "Payment successful! Check your email for workshop details."
            : "Payment could not be verified. Please contact us with your payment ID: " + response.razorpay_payment_id);
        } catch {
          restoreRegistration("Payment verification could not complete. Please contact us with your payment ID: " + response.razorpay_payment_id);
        }
      },
      modal: {
        ondismiss: () => {
          if (!paymentCompleted) restoreRegistration("Payment cancelled.");
        },
      },
    });
    dialog.close();
    rzp.open();
  } catch (err) {
    console.error("Payment preparation failed:", err.message);
    restoreRegistration("Something went wrong, please try again");
  }
});
