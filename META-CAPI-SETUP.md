# Meta Purchase tracking

Webhook path: `/api/razorpay-webhook` on the deployed landing-page origin. Subscribe to **payment.captured** in the Razorpay dashboard and use the same webhook secret configured on the server.

## Server environment variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET` (distinct from the Razorpay API key secret)
- `META_PIXEL_ID=1064122738786472`
- `META_CAPI_ACCESS_TOKEN` (server only)
- `META_TEST_EVENT_CODE` (optional; omit/remove for production events)

Run `migrations/20261027_meta_capi.sql` in Supabase **before deployment**. In addition to the listed attribution/payment columns, this adds two server-only delivery-lease columns: `capi_claim_token` and `capi_claimed_at`. Existing RLS/public-read restrictions are unchanged. The earlier booking/RLS migrations and UUID-compatible booking IDs remain prerequisites.

## Delivery and verification

The browser sends `_fbp`, `_fbc` (or a `fbclid` fallback), full source URL and UTM parameters with its existing single order request. IP and user agent come from server request headers. The service key is never sent to the browser.

Verification checks the checkout signature and fetches Razorpay's order and payment. Only a captured INR payment records a paid booking. The signed webhook uses the captured payment entity and fetches the order to find its booking UUID. Both paths save `razorpay_payment_id` and `amount` (integer **paise**) on that row and call the shared helper. Browser-provided amounts are ignored.

The helper posts to Graph API **v26.0**. Reference: [Meta Graph API v26 changelog](https://developers.facebook.com/docs/graph-api/changelog/version26.0/) and [Meta's official SDK v26 release](https://github.com/facebook/facebook-nodejs-business-sdk/releases/tag/v26.0.0). No Meta SDK is installed. Normalized email, phone including country code, first/last name and `in` country are SHA-256 hashed. A missing last name is omitted rather than fabricated; cookie IDs, IP and user agent are sent unhashed.

An atomic conditional database update claims unsent paid bookings for one worker. `capi_sent` becomes true **only after** Meta reports one accepted event. A failed attempt releases the claim; an interrupted worker's lease expires after five minutes. Ambiguous network failures can be retried with the same event name and UUID so Meta can deduplicate them. Distributed HTTP delivery cannot guarantee literal exactly-once receipt after a crash; the database lock prevents simultaneous sends and Meta's stable event ID handles retries.

Meta HTTP delivery is awaited with a 1.5-second timeout; it is not fire-and-forget in a serverless function. Analytics errors are logged generically and never fail payment verification or a successful webhook. Signed ignored webhook events return 200. Invalid signatures return 401; booking/order persistence failures return 500 so Razorpay can retry. If Meta alone fails after the payment is saved, replay the signed captured webhook or run a controlled server-side retry for paid `capi_sent=false` rows. No scheduler/queue has been added.

The current repository has GA4 but no browser `fbq` Pixel calls. Those files were not supplemented with a Pixel here. If the Pixel is injected elsewhere, its Purchase must use the booking UUID as `eventID` to deduplicate against CAPI.

## Test without real purchases

Run Node's built-in tests: `node --test tests/*.test.js` (or pass the four test filenames explicitly on Windows). They mock Meta, Supabase and Razorpay and cover hashes, amount provenance, concurrency, retry, raw-body signatures, attribution, and existing form/GA4 behavior.

After deploying and configuring the database/env/webhook, use Razorpay Test mode and `META_TEST_EVENT_CODE` to confirm Purchase delivery in Meta Events Manager. No live Meta event, payment, database migration, or dashboard change was performed during local implementation.
