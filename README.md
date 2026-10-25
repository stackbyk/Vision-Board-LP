# Vision Board Workshop: Landing Page

Landing page for **Livin' My Dream**'s live online Vision Board Workshop, run by CA Shraddha Kalani. One job: get a visitor from "what is this?" to "I'm booking a seat."

Live: https://livin-my-dream-vision-board.vercel.app/

---

## Why this exists

The workshop runs in small batches, so seats sell out by word of mouth and Instagram. Before this page, there was nowhere to send people who asked "what happens in the 2 hours, and is it worth it?" This page answers that in one scroll and ends in a booking action.

The page is built around the workshop's own numbers:

| Number | Where it shows up |
|---|---|
| **500+** people have made their boards | Hero social proof |
| **4.92 / 5** average rating | Hero, under the headline |
| **2 hours** | Hero feature strip, timeline, "Create it in two hours" |
| **8+ years** of coach experience | Coach bio |
| **6 video + 6 written** testimonials | Testimonials section |
| **7** FAQs | FAQ accordion |

---

## What's on the page

Eleven sections, top to bottom. The order is deliberate: proof first, then objections, then the offer details, then the person behind it.

| # | Section | What it does |
|---|---|---|
| 1 | Announcement bar | Urgency line: "Small batch. Limited seats." |
| 2 | Hero | Headline, 500+ / 4.92 proof, CTA, workshop preview video slot, 5-item feature strip |
| 3 | Testimonials | 6 video testimonials (YouTube Shorts) + 6 written reviews with photos |
| 4 | Is this for you? | 6 checklist cards, plus one honest "this may not be for you" note |
| 5 | Why most boards fail | 4 problem → fix rows |
| 6 | Why build with us | 4 rotating circles, auto-cycle every 4 s |
| 7 | Inside the 2-hour workshop | 6-step timeline (4 live + 2 after) |
| 8 | Actual vision boards | 3 real participant boards |
| 9 | Also included | 4 extras: playlist, affirmations, daily motivation, weekly check-ins |
| 10 | Meet your coach | Bio, photo, 4 social links |
| 11 | FAQ | 7 questions, one open at a time |

### The 2 hours, minute by minute

| Step | Minutes | Length | Share of session |
|---|---|---|---|
| 01 Pause & Reflect | 0-20 | 20 min | 17% |
| 02 Choose Your Priorities | 20-45 | 25 min | 21% |
| 03 Create Your Board Live | 45-100 | 55 min | 46% |
| 04 Present Your Vision | 100-120 | 20 min | 17% |
| 05 Hardcopy (optional) | within 7 days of the session | n/a | n/a |
| 06 Keep Working On It | ongoing check-ins | n/a | n/a |

Nearly half the session (55 of 120 minutes) is hands-on building. That's why the page says "leave with a ready board".

---

## Tech stack

Deliberately boring. No framework, no bundler, no `npm install`.

- **HTML / CSS / vanilla JS**, with no dependencies and no build step
- **Fonts:** DM Serif Display (headings) + DM Sans (body) via Google Fonts
- **Hosting:** Vercel (static)
- **Payments:** Razorpay Checkout (see [Payments](#payments-razorpay), in progress)

Why no framework: it's a single page with no routing and no shared state. A framework would add build time and a node_modules folder without adding a feature.

### Size of the codebase

| | |
|---|---|
| Files | 30 (12 code, 10 images, 3 docs, 5 misc) |
| Lines of code | ~1,700 (440 HTML, 313 CSS in `styles.css`, ~960 JS and section CSS) |
| Code weight | ~96 KB total, uncompressed |
| Images | ~5.1 MB across 10 files |
| Runtime dependencies | **0** |
| Build time | **0 s** |

---

## Run it locally

```bash
python -m http.server 3000
```

Open http://localhost:3000. You can also double-click `index.html`. The only thing that needs internet is Google Fonts.

---

## Project structure

```
Vision-Board-LP/
├── index.html            all page content and section markup
├── styles.css            global layout, brand tokens, hero, timeline, extras, coach, FAQ
├── script.js             booking dialog, timeline, FAQ, scroll-reveal animations
├── video.js              hero preview video (YouTube or MP4)
├── testimonials.js/.css  video + written testimonial carousel
├── for-you.js/.css       "This workshop is for you if..." cards
├── why-fail.js/.css      problem → fix rows
├── build-with-us.js/.css rotating benefit circles
├── images/               participant boards (VB1-3) and coach photo
├── avatars/              6 testimonial profile photos
└── BUILD-WITH-US.md      notes for the benefits section
```

Each section owns its own JS and CSS file, so editing one section can't accidentally break another.

---

## How to edit content (no code knowledge needed)

All the copy lives in plain arrays at the top of each JS file. Change the text, save, refresh.

| To change... | Edit this | In file |
|---|---|---|
| Hero video | `VIDEO_URL` | `video.js` |
| Video testimonials | `videoTestimonials` | `testimonials.js` |
| Written reviews | `writtenTestimonials` | `testimonials.js` |
| "For you if..." cards | `forYouIf` | `for-you.js` |
| Why-boards-fail rows | `whyFail` | `why-fail.js` |
| Benefit circles | `buildBenefits` | `build-with-us.js` |
| Timeline steps and minutes | `workshopTimeline` | `script.js` |
| FAQ | `workshopFaq` | `script.js` |
| Participant boards | `<img>` tags in "Actual boards" | `index.html` |

### Adding a testimonial

```js
// testimonials.js, add to writtenTestimonials
{
  quote: "“Your quote here.”",
  name: "Full Name",
  role: "Job title @ Company",
  avatar: "avatars/name.png",
}
```

There's no cap on how many video or written testimonials you add.

### Setting the hero video

Paste a YouTube watch/share/embed URL or a direct `.mp4` link into `VIDEO_URL` in `video.js`. Leave it empty to keep the "Workshop Preview" placeholder. YouTube loads with autoplay and related-videos turned off; MP4 gets native controls and `preload="none"` so it doesn't cost bandwidth until played.

---

## Design system

| Token | Hex | Used for |
|---|---|---|
| `--purple` | `#472C7D` | Hero background, headings |
| `--lavender` | `#E5D8FF` | Announcement bar, badges |
| `--light-purple` | `#CC88FF` | Accents |
| `--lime` | `#E1FB62` | Primary CTA button |
| `--yellow` | `#FFBC59` | Rating stars |
| `--pink` | `#CD0067` | LIVE badge |
| `--white` | `#FFFFFF` | Text on purple, section backgrounds |

Type is controlled by just two variables, `--heading-size` and `--body-size`, which rescale at every breakpoint. Change them once and the whole page follows.

### Responsive behavior

The page adapts at **13 distinct breakpoints** across `styles.css` and `testimonials.css`, from 359 px (small phones) up to 1450 px (large desktop). The main mobile cutoff is **639 px**, and tablet is **640-1099 px**.

---

## Interactions and accessibility

- **Timeline cards, benefit circles, FAQ:** fully keyboard-navigable (Tab, arrow keys, Home/End, Enter/Space)
- **Benefit circles:** auto-rotate every **4 s**, pause on hover or focus, and resume **6 s** after the last interaction
- **Scroll animations:** triggered by `IntersectionObserver` (fires when 8-15% of a section is visible), so nothing animates offscreen
- **Reduced motion:** every animation checks `prefers-reduced-motion`. When it's on, auto-rotation, counters, and reveals are all disabled
- **Offscreen / hidden tab:** auto-rotation stops, saving CPU
- **Screen readers:** decorative icons are `aria-hidden`, FAQ uses `aria-expanded` / `aria-controls`, closed answers are `inert`

---

## Payments (Razorpay)

> **Status: not yet connected.** The hero button currently opens a placeholder dialog ("Workshop booking details will be available here soon"). The two other CTAs (*Create My Vision Board* in "Why most boards fail" and *I Want To Create Mine*) are still `href="#"`.

Planned flow, all on the same page with no redirect:

1. Visitor clicks any CTA → a modal asks for **name, email, phone**
2. Page calls `/api/create-order` (Vercel serverless function), which creates a Razorpay order server-side
3. Razorpay Checkout opens as an overlay (UPI QR on desktop, UPI apps on mobile)
4. On success, `/api/verify-payment` checks the signature before showing "Payment successful"
5. A Razorpay webhook (`payment.captured`) acts as a backup so no paid attendee is lost if they close the tab

Environment variables to set in Vercel:

```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
```

Never commit the key secret. Test in Razorpay **Test Mode** before switching to live keys. Amounts are in paise (₹499 = `49900`).

All three CTAs should open the same modal, so there's one booking flow and one place to change the price.

---

## Known issues and next steps

Real items from the current code, in rough priority order:

| Priority | Item | Why it matters |
|---|---|---|
| High | Connect Razorpay to all 3 CTAs | Right now none of them can take a booking |
| High | Compress images | `shreya.png` (1.9 MB), `VB3.png` (1.1 MB) and `VB2.png` (1.0 MB) make up **~78%** of the 5.1 MB image weight. Converting to WebP at proper display sizes should cut total image weight by well over half. Measure before and after with Lighthouse |
| Medium | Add the hero preview video | The slot currently shows a "coming soon" placeholder |
| Medium | Lazy-load below-the-fold images | Add `loading="lazy"` to boards and avatars |
| Medium | Add Open Graph tags | Link previews on WhatsApp and Instagram currently have no custom image |
| Low | Two Google Fonts `<link>` tags | `index.html` requests DM Sans twice (400 and 500/600); merge into one request |
| Low | Add analytics | See below |

---

## Measuring results

No analytics are installed yet, so there are no conversion numbers to report. Any "+20% bookings" claim would be made up. Once tracking is live, record these in a table like the one below.

| Metric | Baseline | Target | Actual |
|---|---|---|---|
| Visitors → CTA click | not tracked | set after 2 weeks of data | |
| CTA click → payment started | not tracked | | |
| Payment started → paid | not tracked | | |
| Page load (mobile, Lighthouse) | not measured | | |
| Seats filled per batch | | | |

A free setup that covers this is Google Analytics 4 or Plausible, with three events: `cta_click`, `checkout_opened`, `payment_success`.

---

## Credits

- Workshop, content, and brand: **CA Shraddha Kalani**, Livin' My Dream
- Instagram: [@livinmydream.india](https://www.instagram.com/livinmydream.india/)
- LinkedIn: [shraddhakalani](https://www.linkedin.com/in/shraddhakalani/)
- YouTube: [@Livinmydream.shraddha](https://www.youtube.com/@Livinmydream.shraddha)
