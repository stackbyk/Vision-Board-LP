// SVG clipping maps to the visible star bounds (x = 2..22), not glyph whitespace.
let starRatingId = 0;
function StarRating({ rating = 4.92, max = 5, size = 22 } = {}) {
  const value = Math.min(max, Math.max(0, rating));
  const instanceId = starRatingId++;
  const container = document.createElement("span");
  container.className = "stars";
  container.setAttribute("role", "img");
  container.setAttribute("aria-label", `Rated ${value} out of ${max}`);
  const ns = "http://www.w3.org/2000/svg";
  const path = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";
  for (let i = 0; i < max; i++) {
    const fill = Math.min(1, Math.max(0, value - i));
    const clipId = `star-clip-${instanceId}-${i}`;
    const star = document.createElementNS(ns, "svg");
    star.setAttribute("viewBox", "0 0 24 24");
    star.setAttribute("width", size);
    star.setAttribute("height", size);
    star.setAttribute("aria-hidden", "true");
    star.innerHTML = `
      <defs>
        <clipPath id="${clipId}" clipPathUnits="userSpaceOnUse">
          <rect x="0" y="0" width="${2 + fill * 20}" height="24" />
        </clipPath>
      </defs>
      <path d="${path}" fill="rgba(255,255,255,0.35)" />
      <path d="${path}" fill="currentColor" clip-path="url(#${clipId})" />`;
    container.append(star);
  }
  return container;
}

const rating = 4.92;
document.querySelector(".rating .stars").replaceWith(StarRating({ rating }));
document.querySelector(".rating-value").textContent = rating;

const bookingDialog = document.querySelector("#booking-dialog");
document
  .querySelectorAll(".hero-copy .cta")
  .forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      bookingDialog.showModal();
    }),
  );
document
  .querySelector("#close-dialog")
  .addEventListener("click", () => bookingDialog.close());
bookingDialog.addEventListener("click", (event) => {
  if (event.target === bookingDialog) {
    const bounds = bookingDialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      bookingDialog.close();
  }
});

// Workshop cards: edit the six steps and their image alt text here.
const workshopSteps = [
  {
    imageAlt: "Guided meditation and journaling to pause and reflect",
    title: "Pause & Reflect",
    description:
      "Begin with guided meditation and affirmations. Make space to think about what you really want.",
  },
  {
    imageAlt: "Choosing life goals and priorities",
    title: "Choose Your Priorities",
    description:
      "Explore different areas of your life and choose the goals that matter most to you.",
  },
  {
    imageAlt: "Creating a vision board live using Canva templates",
    title: "Create Your Board Live",
    description:
      "Choose from a variety of pictures using pre-designed Canva templates.",
  },
  {
    imageAlt: "Participants sharing their vision boards in a group",
    title: "Present Your Vision",
    description:
      "Share your board in a small cohort. Get feedback and inspiration from others’ boards.",
  },
  {
    imageAlt: "Printed hardcopy of a completed vision board",
    title: "Get the Hardcopy of Your Vision Board",
    description:
      "Receive a printed copy of your completed Vision Board at your doorstep if you share the final board with us within 7 days after the workshop.",
  },
  {
    imageAlt: "Planner for regular check-ins and goal progress",
    title: "Keep Working On It",
    description:
      "Continue working towards your goals through regular check-ins.",
  },
];
(() => {
  const list = document.querySelector("#workshop-steps");
  workshopSteps.forEach((item, index) => {
    const card = document.createElement("li");
    card.className = "workshop-step-card";
    const label = document.createElement("span");
    label.className = "workshop-step-label";
    label.textContent = `Step ${index + 1}`;
    const title = document.createElement("h3");
    title.textContent = item.title;
    card.append(label, title);
    if (index >= 4) {
      const tag = document.createElement("span");
      tag.className = "workshop-after-tag";
      tag.textContent = "After the workshop";
      card.append(tag);
    }
    const image = document.createElement("img");
    image.src = `images/${index + 1}.webp`;
    image.alt = item.imageAlt;
    image.loading = "lazy";
    image.width = 640;
    image.height = 300;
    const description = document.createElement("p");
    description.textContent = item.description;
    card.append(image, description);
    list.append(card);
  });
})();

// Reveal empty board slots without altering their decorative tilts.
(() => {
  const slots = [...document.querySelectorAll(".board-slot")];
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  if (motion.matches || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const slot = entry.target;
        slot.classList.add("is-revealing");
        slot.classList.remove("awaiting-reveal");
        setTimeout(() => slot.classList.remove("is-revealing"), 800);
        observer.unobserve(slot);
      });
    },
    { threshold: 0.1 },
  );
  slots.forEach((slot) => {
    slot.classList.add("awaiting-reveal");
    observer.observe(slot);
  });
  motion.addEventListener("change", () => {
    if (motion.matches) {
      observer.disconnect();
      slots.forEach((slot) =>
        slot.classList.remove("awaiting-reveal", "is-revealing"),
      );
    }
  });
})();

// Draw the extras thread, then reveal its hanging cards.
(() => {
  const section = document.querySelector(".workshop-extras");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  if (motion.matches || !("IntersectionObserver" in window)) return;
  section.classList.add("extras-awaiting");
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      section.classList.add("extras-revealing");
      section.classList.remove("extras-awaiting");
      setTimeout(() => section.classList.remove("extras-revealing"), 1300);
      observer.disconnect();
    },
    { threshold: 0.12 },
  );
  observer.observe(section);
  motion.addEventListener("change", () => {
    if (motion.matches) {
      observer.disconnect();
      section.classList.remove("extras-awaiting", "extras-revealing");
    }
  });
})();

// Reveal the coach photo and biography without adding card hover motion.
(() => {
  const section = document.querySelector(".meet-coach");
  const card = section.querySelector(".coach-card");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  if (motion.matches || !("IntersectionObserver" in window)) return;
  section.classList.add("coach-awaiting");
  card.classList.add("coach-revealing");
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      section.classList.remove("coach-awaiting");
      setTimeout(() => card.classList.remove("coach-revealing"), 650);
      observer.disconnect();
    },
    { threshold: 0.1 },
  );
  observer.observe(section);
  motion.addEventListener("change", () => {
    if (motion.matches) {
      observer.disconnect();
      section.classList.remove("coach-awaiting");
      card.classList.remove("coach-revealing");
    }
  });
})();

// Edit FAQ questions and answers here; the first question starts open.
const workshopFaq = [
  [
    "Do I need prior experience to attend this workshop?",
    "Not at all! This workshop is beginner-friendly and designed to guide you step-by-step, whether it’s your first vision board or you’re refining your goal-setting process.",
  ],
  [
    "What materials do I need for the workshop?",
    "You’ll receive two Canva templates to create your digital vision board. If you prefer a physical version, you can use a card sheet, scissors, glue, and magazines or printed images. Instructions will be provided for both.",
  ],
  [
    "What if I don’t know how to use Canva?",
    "No problem! We provide clear, easy-to-follow instructions, and you can always choose to make your vision board on a card sheet instead.",
  ],
  [
    "What if I can’t attend on the selected date?",
    "If you cannot attend, let us know in advance. We’ll do our best to accommodate you in another session or provide additional resources to catch up.",
  ],
  [
    "Will the recording of the workshop be provided?",
    "No, the recording will not be shared. However, the guidebook and the Canva templates would be shared for future reference.",
  ],
  [
    "Will I really achieve my goals after the workshop?",
    "This workshop equips you with the tools, strategies, and support to turn your aspirations into reality. Paired with your commitment and consistent action, you’ll have everything you need to succeed in 2027.",
  ],
  [
    "Will I be making the vision board during the workshop?",
    "Yes, we’ll give you dedicated time to prepare your vision board. You can ask queries on the chat and we’ll try our best to resolve them.",
  ],
];
(() => {
  const section = document.querySelector(".workshop-faq");
  const list = section.querySelector(".faq-list");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const entries = workshopFaq.map(([question, answer], index) => {
    const item = document.createElement("article");
    item.className = "faq-item";
    const heading = document.createElement("h3");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "faq-question";
    button.id = `faq-question-${index + 1}`;
    button.setAttribute("aria-controls", `faq-answer-${index + 1}`);
    button.setAttribute("aria-expanded", String(index === 0));
    const label = document.createElement("span");
    label.textContent = `${index + 1}. ${question}`;
    const icon = document.createElement("span");
    icon.className = "faq-toggle-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="M5 12h14"/><path class="faq-icon-vertical" d="M12 5v14"/></svg>';
    button.append(label, icon);
    heading.append(button);
    const panel = document.createElement("div");
    panel.className = "faq-answer";
    panel.id = `faq-answer-${index + 1}`;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-labelledby", button.id);
    const inner = document.createElement("div");
    inner.className = "faq-answer-inner";
    const text = document.createElement("p");
    text.textContent = answer;
    inner.append(text);
    panel.append(inner);
    if (index === 0) item.classList.add("is-open");
    else {
      panel.inert = true;
      panel.style.visibility = "hidden";
    }
    item.append(heading, panel);
    list.append(item);
    return { item, button, panel, timer: null };
  });
  function setOpen(entry, open) {
    clearTimeout(entry.timer);
    entry.button.setAttribute("aria-expanded", String(open));
    entry.panel.inert = !open;
    if (open) entry.panel.style.visibility = "visible";
    entry.item.classList.toggle("is-open", open);
    if (!open) {
      if (motion.matches) entry.panel.style.visibility = "hidden";
      else
        entry.timer = setTimeout(() => {
          entry.panel.style.visibility = "hidden";
        }, 400);
    }
  }
  entries.forEach((entry, index) => {
    entry.button.addEventListener("click", () => {
      const open = entry.button.getAttribute("aria-expanded") !== "true";
      entries.forEach((other) => setOpen(other, other === entry && open));
    });
    entry.button.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowDown") next = (index + 1) % entries.length;
      if (event.key === "ArrowUp")
        next = (index - 1 + entries.length) % entries.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = entries.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        entries[next].button.focus();
      }
    });
  });
  if (!motion.matches && "IntersectionObserver" in window) {
    section.classList.add("faq-awaiting");
    const observer = new IntersectionObserver(
      (changes) => {
        if (!changes.some((change) => change.isIntersecting)) return;
        entries.forEach((entry, index) => {
          entry.item.style.transitionDelay = `${index * 80}ms`;
        });
        section.classList.remove("faq-awaiting");
        setTimeout(
          () =>
            entries.forEach((entry) => (entry.item.style.transitionDelay = "")),
          1100,
        );
        observer.disconnect();
      },
      { threshold: 0.08 },
    );
    observer.observe(section);
    motion.addEventListener("change", () => {
      if (motion.matches) {
        observer.disconnect();
        section.classList.remove("faq-awaiting");
        entries.forEach((entry) => (entry.item.style.transitionDelay = ""));
      }
    });
  }
})();
