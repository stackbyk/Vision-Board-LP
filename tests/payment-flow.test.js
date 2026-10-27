import { readFileSync } from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import assert from "node:assert/strict";

function setup({ consent = true, fail = false, hold = false, phoneValid = true, verified = true, analyticsBlocked = false, pixelBlocked = false, pixelMissing = false, storage = new Map(), href = "https://example.com/", cookies = "" } = {}) {
  const elements = new Map();
  function element() {
    const classes = new Set();
    return { value: "", textContent: "", checked: consent, disabled: false, open: true,
      events: {}, classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name) },
      setAttribute() {}, append() {}, replaceChildren() {},
      addEventListener(name, callback) { this.events[name] = callback; },
      showModal() { this.open = true; queueMicrotask(() => observer?.()); },
      close() { this.open = false; this.events.close?.(); },
    };
  }
  const document = { cookie: cookies, querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, element());
    return elements.get(selector);
  }, createElement: element };
  for (const [selector, value] of [["#vb-name", "Test Attendee"], ["#vb-email", "test@example.com"], ["#vb-phone", "9663243142"]]) document.querySelector(selector).value = value;
  const form = document.querySelector("#booking-form");
  form.elements = { namedItem: () => document.querySelector("#vb-session") };
  const dialog = document.querySelector("#booking-dialog");
  const requests = [];
  const analytics = [];
  const pixelEvents = [];
  let options, opened = 0, uuids = 0, observer, release;
  const phone = { promise: Promise.resolve(), isValidNumber: () => phoneValid,
    getNumber: () => "+919663243142", getSelectedCountryData: () => ({ dialCode: "91" }), setCountry() {} };
  class Razorpay {
    constructor(config) { options = config; }
    open() { assert.equal(dialog.open, false); opened++; }
  }
  class MutationObserver { constructor(callback) { observer = callback; } observe() {} }
  const fetch = async (url, init) => {
    requests.push({ url, body: JSON.parse(init.body) });
    if (hold) await new Promise(resolve => { release = resolve; });
    return { ok: !fail, json: async () => url.includes("verify-payment")
      ? { verified, saved: verified }
      : { orderId: "order-1", keyId: "test-key", amount: 99900 } };
  };
  const context = { URL, document, window: { location: { href }, intlTelInput: () => phone, gtag: (...args) => {
    if (analyticsBlocked) throw new Error("blocked");
    analytics.push(args);
  } }, MutationObserver, Razorpay,
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    crypto: { randomUUID: () => { uuids++; return "f18f47c0-8df6-452e-9091-32d9e3d87867"; } },
    fetch, queueMicrotask, console: { error() {} } };
  if (!pixelMissing) context.window.fbq = (...args) => {
    if (pixelBlocked) throw new Error("Pixel blocked");
    pixelEvents.push(args);
  };
  vm.runInNewContext(readFileSync(new URL("../payment.js", import.meta.url), "utf8"), context);
  return { elements, dialog, requests, analytics, pixelEvents, submit: () => form.events.submit({ preventDefault() {} }),
    release: () => release(), get options() { return options; }, get opened() { return opened; }, get uuids() { return uuids; } };
}

test("double click makes one request; closes before checkout; cancel restores details", async () => {
  const s = setup({ hold: true });
  const pending = s.submit();
  await s.submit();
  await new Promise(setImmediate); // Flush the phone-utils readiness promise.
  assert.equal(s.elements.get("#vb-pay").disabled, true);
  assert.equal(s.elements.get("#vb-msg").classList.contains("payment-opening"), true);
  assert.equal(s.requests.length, 1);
  s.release();
  await pending;
  assert.equal(s.uuids, 1);
  assert.equal(s.requests[0].body.consent, true);
  assert.equal(s.requests[0].body.bookingId, "f18f47c0-8df6-452e-9091-32d9e3d87867");
  assert.equal(s.opened, 1);
  assert.equal(s.dialog.open, false);
  s.options.modal.ondismiss();
  await Promise.resolve();
  assert.equal(s.dialog.open, true);
  assert.equal(s.elements.get("#vb-pay").disabled, false);
  assert.equal(s.elements.get("#vb-name").value, "Test Attendee");
  assert.equal(s.elements.get("#vb-phone").value, "9663243142");
});

test("unchecked consent stops before requests or UUID generation", async () => {
  const s = setup({ consent: false });
  await s.submit();
  assert.equal(s.requests.length, 0);
  assert.equal(s.uuids, 0);
  assert.equal(s.analytics.length, 0);
  assert.equal(s.pixelEvents.length, 0);
  assert.match(s.elements.get("#vb-msg").textContent, /Please agree/);
});

test("failed preparation keeps registration open and restores button", async () => {
  const s = setup({ fail: true });
  await s.submit();
  await Promise.resolve();
  assert.equal(s.opened, 0);
  assert.equal(s.dialog.open, true);
  assert.equal(s.elements.get("#vb-pay").disabled, false);
  assert.equal(s.elements.get("#vb-msg").textContent, "Something went wrong, please try again");
});

test("invalid name, email, or phone stops before payment preparation", async () => {
  for (const field of ["#vb-name", "#vb-email", "#vb-phone"]) {
    const s = setup({ phoneValid: field !== "#vb-phone" });
    if (field !== "#vb-phone") s.elements.get(field).value = "";
    await s.submit();
    assert.equal(s.requests.length, 0);
    assert.equal(s.opened, 0);
    assert.equal(s.analytics.length, 0);
    assert.equal(s.pixelEvents.length, 0);
    assert.equal(s.elements.get("#vb-pay").disabled, false);
  }
});

test("GA4 checkout follows validation; purchase follows verification and deduplicates across reload", async () => {
  const storage = new Map();
  const s = setup({ storage });
  await s.submit();
  assert.equal(s.analytics.length, 1);
  assert.equal(s.analytics[0][1], "begin_checkout");
  const checkout = s.analytics[0][2];
  assert.equal(checkout.value, 999);
  assert.equal(checkout.currency, "INR");
  assert.equal(checkout.items[0].item_name, "Vision Board Workshop - 31 Oct 2026");
  const response = { razorpay_payment_id: "payment-1" };
  await s.options.handler(response);
  await s.options.handler(response);
  assert.equal(s.analytics.filter(event => event[1] === "purchase").length, 1);
  assert.equal(s.analytics[1][2].transaction_id, s.requests[0].body.bookingId);
  const refreshed = setup({ storage });
  await refreshed.submit();
  await refreshed.options.handler(response);
  assert.equal(refreshed.analytics.filter(event => event[1] === "purchase").length, 0);
});

test("unverified payment never emits purchase; blocked analytics does not stop checkout", async () => {
  const s = setup({ verified: false });
  await s.submit();
  await s.options.handler({ razorpay_payment_id: "payment-1" });
  assert.equal(s.analytics.filter(event => event[1] === "purchase").length, 0);
  const blocked = setup({ analyticsBlocked: true });
  await blocked.submit();
  assert.equal(blocked.opened, 1);
  await blocked.options.handler({ razorpay_payment_id: "payment-1" });
  assert.equal(blocked.elements.get("#vb-pay").disabled, false);
});

test("booking carries Meta cookies, fallback click ID and campaign URL unchanged", async () => {
  const href = "https://example.com/?fbclid=click123&utm_source=meta&utm_medium=paid&utm_campaign=workshop&utm_content=creative1";
  const s = setup({ href, cookies: "_fbp=fb.1.100.200" });
  await s.submit();
  const data = s.requests[0].body;
  assert.equal(data.fbp, "fb.1.100.200");
  assert.match(data.fbc, /^fb\.1\.\d{13}\.click123$/);
  assert.equal(data.event_source_url, href);
  assert.equal(data.utm_source, "meta");
  assert.equal(data.utm_medium, "paid");
  assert.equal(data.utm_campaign, "workshop");
  assert.equal(data.utm_content, "creative1");
  const existing = setup({ href, cookies: "_fbc=fb.1.111.original" });
  await existing.submit();
  assert.equal(existing.requests[0].body.fbc, "fb.1.111.original");
});

test("Pixel checkout and verified Purchase reuse the existing UUID and deduplicate", async () => {
  const storage = new Map();
  const s = setup({ storage });
  await s.submit();
  assert.equal(s.uuids, 1);
  assert.equal(s.pixelEvents.length, 1);
  assert.equal(s.pixelEvents[0][0], "track");
  assert.equal(s.pixelEvents[0][1], "InitiateCheckout");
  assert.equal(s.pixelEvents[0][2].value, 999);
  assert.equal(s.pixelEvents[0][2].currency, "INR");
  assert.equal(s.pixelEvents[0][2].content_name, "Vision Board Workshop - 31 Oct 2026");
  assert.equal(s.pixelEvents[0][3].eventID, s.requests[0].body.bookingId);
  await s.options.handler({ razorpay_payment_id: "payment-1" });
  await s.options.handler({ razorpay_payment_id: "payment-1" });
  const purchases = s.pixelEvents.filter(event => event[1] === "Purchase");
  assert.equal(purchases.length, 1);
  assert.equal(purchases[0][3].eventID, s.requests[0].body.bookingId);
  assert.equal(purchases[0][2].value, 999);
  const refreshed = setup({ storage });
  await refreshed.submit();
  await refreshed.options.handler({ razorpay_payment_id: "payment-1" });
  assert.equal(refreshed.pixelEvents.filter(event => event[1] === "Purchase").length, 0);
});

test("Pixel never records an unverified purchase and cannot block checkout or GA4", async () => {
  const s = setup({ verified: false });
  await s.submit();
  await s.options.handler({ razorpay_payment_id: "payment-1" });
  assert.equal(s.pixelEvents.filter(event => event[1] === "Purchase").length, 0);
  for (const option of [{ pixelBlocked: true }, { pixelMissing: true }]) {
    const blocked = setup(option);
    await blocked.submit();
    assert.equal(blocked.opened, 1);
    await blocked.options.handler({ razorpay_payment_id: "payment-1" });
    assert.equal(blocked.elements.get("#vb-pay").disabled, false);
    assert.equal(blocked.analytics.filter(event => event[1] === "purchase").length, 1);
  }
});

test("Pixel base queues initialization and PageView with noindex and noscript intact", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const script = html.match(/<!-- Meta Pixel -->\s*<script>([\s\S]*?)<\/script>/)[1];
  const scripts = [];
  const context = { document: { createElement: () => ({}), getElementsByTagName: () => [
    { parentNode: { insertBefore: value => scripts.push(value) } },
  ] } };
  context.window = context;
  vm.runInNewContext(script, context);
  assert.equal(scripts[0].src, "https://connect.facebook.net/en_US/fbevents.js");
  assert.equal(context.fbq.queue[0][0], "init");
  assert.equal(context.fbq.queue[0][1], "1064122738786472");
  assert.equal(context.fbq.queue[1][1], "PageView");
  assert.match(html, /name="robots" content="noindex, nofollow"/);
  assert.match(html, /<noscript><img[\s\S]*?1064122738786472&amp;ev=PageView&amp;noscript=1/);
});
