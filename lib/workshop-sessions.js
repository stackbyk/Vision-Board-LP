// Keep the API allowlist aligned with the session cards in index.html.
export const SESSION_SLOTS = [
  {
    value: "18 Nov 2026, 8:30 PM IST",
    date: "18 Nov 2026",
    day: "Wed, 18 Nov",
    label: "8:30 PM - 10:30 PM IST",
    datetime: "2026-11-18T20:30:00+05:30",
  },
  {
    value: "22 Nov 2026, 11:30 AM IST",
    date: "22 Nov 2026",
    day: "Sun, 22 Nov",
    label: "11:30 AM - 1:30 PM IST",
    datetime: "2026-11-22T11:30:00+05:30",
  },
];

export function workshopName(session) {
  const slot = SESSION_SLOTS.find(({ value }) => value === session);
  return slot ? `Vision Board Workshop - ${slot.date}` : "Vision Board Workshop";
}
