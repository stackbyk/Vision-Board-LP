const bookingDialog = document.querySelector("#booking-dialog");
document
  .querySelector(".hero-copy .cta")
  .addEventListener("click", () => bookingDialog.showModal());
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

// Workshop timeline content: edit the six steps here.
const workshopTimeline = [
  {
    number: "01",
    chip: "0-20 min",
    title: "Pause & Reflect",
    description:
      "Begin with guided meditation and affirmations. Make space to think about what you really want.",
  },
  {
    number: "02",
    chip: "20-45 min",
    title: "Choose Your Priorities",
    description:
      "Explore different areas of your life and choose the goals that matter most to you.",
  },
  {
    number: "03",
    chip: "45-100 min",
    title: "Create Your Board Live",
    description:
      "Choose from a variety of pictures using pre-designed Canva templates.",
  },
  {
    number: "04",
    chip: "100-120 min",
    title: "Present Your Vision",
    description:
      "Share your board in a small cohort. Get feedback and inspiration from others’ boards.",
  },
  {
    number: "05",
    chip: "Optional",
    title: "Get the Hardcopy of Your Vision Board",
    description:
      "Receive a printed copy of your completed Vision Board at your doorstep if you share the final board with us within 7 days after the workshop.",
  },
  {
    number: "06",
    chip: "Ongoing",
    title: "Keep Working On It",
    description:
      "Continue working towards your goals through regular check-ins.",
  },
];
(() => {
  const section = document.querySelector(".workshop-timeline");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let interacted = false;
  const timers = [];
  const steps = workshopTimeline.map((item, index) => {
    const step = document.createElement("li");
    step.className = "workshop-timeline-step";
    const node = document.createElement("span");
    node.className = "workshop-timeline-node";
    node.textContent = item.number;
    node.setAttribute("aria-hidden", "true");
    const connector = document.createElement("span");
    connector.className = "workshop-timeline-connector";
    connector.setAttribute("aria-hidden", "true");
    const card = document.createElement("div");
    card.className = "workshop-timeline-card";
    card.tabIndex = 0;
    const title = document.createElement("h3");
    title.textContent = item.title;
    title.id = `workshop-step-${index + 1}`;
    card.setAttribute("aria-labelledby", title.id);
    const description = document.createElement("p");
    description.textContent = item.description;
    card.append(title, description);
    step.append(node, connector, card);
    section
      .querySelector(
        index < 4 ? "#workshop-timeline-inside" : "#workshop-timeline-after",
      )
      .append(step);
    const activate = () => {
      interacted = true;
      steps.forEach((other) => other.classList.remove("is-active", "is-lit"));
      step.classList.add("is-active");
    };
    card.addEventListener("pointerenter", activate);
    card.addEventListener("focus", activate);
    card.addEventListener("click", activate);
    card.addEventListener("keydown", (event) => {
      const offset = {
        ArrowRight: 1,
        ArrowDown: 1,
        ArrowLeft: -1,
        ArrowUp: -1,
      }[event.key];
      if (offset) {
        event.preventDefault();
        steps[(index + offset + steps.length) % steps.length]
          .querySelector(".workshop-timeline-card")
          .focus();
      }
    });
    return step;
  });
  const lines = [...section.querySelectorAll(".workshop-timeline-list")];
  const resize = () =>
    lines.forEach((line) =>
      line.style.setProperty("--line-width", `${line.clientWidth}px`),
    );
  new ResizeObserver(resize).observe(section);
  resize();
  let revealed = false;
  function reveal() {
    if (revealed) return;
    revealed = true;
    section.classList.add("is-revealed");
    steps.forEach((step, index) => {
      step.querySelector(".workshop-timeline-card").style.transitionDelay =
        motion.matches ? "0ms" : `${index * 100}ms`;
      const timer = setTimeout(
        () => {
          if (!interacted) {
            steps.forEach((other) => other.classList.remove("is-lit"));
            step.classList.add("is-lit");
          }
          step.querySelector(".workshop-timeline-card").style.transitionDelay =
            "0ms";
        },
        motion.matches ? 0 : index * 150,
      );
      timers.push(timer);
    });
  }
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    observer.observe(section);
  } else reveal();
  motion.addEventListener("change", () => {
    if (motion.matches) {
      timers.forEach(clearTimeout);
      reveal();
      section
        .querySelectorAll(".workshop-timeline-card")
        .forEach((card) => (card.style.transitionDelay = "0ms"));
    }
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
