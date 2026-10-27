import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const META_GRAPH_VERSION = "v26.0";
const hash = value => createHash("sha256").update(value).digest("hex");
const normalize = value => String(value || "").trim().toLowerCase();

export function metaPurchasePayload(booking, env = process.env) {
  const names = normalize(booking.name).split(/\s+/);
  const user_data = {
    em: [hash(normalize(booking.email))],
    ph: [hash(String(booking.phone).replace(/\D/g, ""))],
    fn: [hash(names[0])],
    ...(names.length > 1 ? { ln: [hash(names.at(-1))] } : {}),
    country: [hash("in")],
  };
  for (const [key, value] of Object.entries({ fbp: booking.fbp, fbc: booking.fbc,
    client_ip_address: booking.client_ip, client_user_agent: booking.client_user_agent })) {
    if (value) user_data[key] = value;
  }
  return {
    access_token: env.META_CAPI_ACCESS_TOKEN,
    ...(env.META_TEST_EVENT_CODE ? { test_event_code: env.META_TEST_EVENT_CODE } : {}),
    data: [{ event_name: "Purchase", event_time: Math.floor(Date.now() / 1000),
      event_id: String(booking.id), event_source_url: booking.event_source_url || undefined,
      action_source: "website", user_data,
      custom_data: { value: Number(booking.amount) / 100, currency: "INR",
        content_name: "Vision Board Workshop - 31 Oct 2026" } }],
  };
}

let client;
// Optional dependencies make concurrency/failure tests run without real API requests.
export async function sendMetaPurchase(booking, dependencies = {}) {
  const env = dependencies.env || process.env;
  if (booking.capi_sent || booking.payment_status !== "paid") return false;
  if (!env.META_PIXEL_ID || !env.META_CAPI_ACCESS_TOKEN) return false;
  if (!/^\d+$/.test(env.META_PIXEL_ID) || !Number.isSafeInteger(Number(booking.amount)) || Number(booking.amount) <= 0) return false;
  let db, token;
  const log = dependencies.log || (() => console.error("Meta CAPI: purchase delivery failed"));
  try {
    db = dependencies.supabase || (client ||= createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY));
    token = randomUUID();
    const now = Date.now();
    // A conditional UPDATE is atomic across processes. A five-minute lease permits recovery
    // after crashes; Meta also deduplicates ambiguous retries by Purchase + booking UUID.
    const { data: claimed, error } = await db.from("bookings")
      .update({ capi_claim_token: token, capi_claimed_at: new Date(now).toISOString() })
      .eq("id", booking.id).eq("capi_sent", false).eq("payment_status", "paid")
      .or(`capi_claimed_at.is.null,capi_claimed_at.lt.${new Date(now - 300000).toISOString()}`)
      .select("id").maybeSingle();
    if (error) throw new Error("claim");
    if (!claimed) return false;
    const response = await (dependencies.fetch || fetch)(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${env.META_PIXEL_ID}/events`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metaPurchasePayload(booking, env)), signal: AbortSignal.timeout(1500),
      });
    const result = await response.json();
    if (!response.ok || result.events_received !== 1) throw new Error("delivery");
    const { error: updateError } = await db.from("bookings")
      .update({ capi_sent: true, capi_claim_token: null, capi_claimed_at: null })
      .eq("id", booking.id).eq("capi_sent", false).eq("capi_claim_token", token);
    if (updateError) throw new Error("complete");
    return true;
  } catch {
    // Never log response bodies, payloads, personal data, tokens, or full request URLs.
    log();
    if (db && token) {
      try { await db.from("bookings").update({ capi_claim_token: null, capi_claimed_at: null })
        .eq("id", booking.id).eq("capi_sent", false).eq("capi_claim_token", token); } catch {}
    }
    return false;
  }
}
