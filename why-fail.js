// EDIT ROW CONTENT HERE
const whyFail = [
  {
    number: "01",
    problem: "Too many goals. No clear focus.",
    title: "Find your priorities.",
    description:
      "Get clarity on what you really want before choosing your images.",
    icon: "target",
  },
  {
    number: "02",
    problem: "Too much guesswork. No guidance.",
    title: "Go from idea to finished board.",
    description: "Create it in two hours with live, step-by-step guidance.",
    icon: "route",
  },
  {
    number: "03",
    problem: "Big goals but no plan to get there.",
    title: "Put actions, not just goals, on your board.",
    description: "Define what you’ll actually do to move towards each goal.",
    icon: "clipboard",
  },
  {
    number: "04",
    problem: "Initial excitement. Little follow-through.",
    title: "Build habits that support your goals.",
    description:
      "Use reflection, reminders and check-ins to keep taking action.",
    icon: "calendar",
  },
];

(() => {
  const icons = {
    target:
      '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    route:
      '<circle cx="6" cy="5" r="2"/><circle cx="18" cy="19" r="2"/><path d="M8 5h8a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h8"/>',
    clipboard:
      '<rect x="5" y="4" width="14" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="m8 13 3 3 5-6"/>',
    calendar:
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18m-13 5 3 3 5-5"/>',
  };
  const list = document.querySelector("#why-fail-rows");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const observer =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.remove("awaiting-reveal");
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.12 },
        )
      : null;
  whyFail.forEach((item, index) => {
    const row = document.createElement("li");
    row.className = "why-fail-row";
    const problem = document.createElement("div");
    problem.className = "why-fail-problem";
    const badge = document.createElement("span");
    badge.className = "why-fail-number";
    badge.textContent = item.number;
    const problemText = document.createElement("span");
    problemText.className = "why-fail-problem-text";
    problemText.textContent = item.problem;
    problem.append(badge, problemText);
    const card = document.createElement("div");
    card.className = "why-fail-solution";
    card.tabIndex = 0;
    const heading = document.createElement("p");
    heading.className = "why-fail-solution-heading";
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("class", "why-fail-icon");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = icons[item.icon] || icons.target;
    const title = document.createElement("span");
    title.textContent = item.title;
    heading.append(icon, title);
    card.append(heading);
    if (item.description) {
      const description = document.createElement("p");
      description.className = "why-fail-description";
      description.textContent = item.description;
      card.append(description);
    }
    row.append(problem, card);
    list.append(row);
    if (observer && !motion.matches) {
      row.style.setProperty("--reveal-delay", `${index * 100}ms`);
      row.classList.add("awaiting-reveal");
      observer.observe(row);
    }
  });
  motion.addEventListener("change", () => {
    if (motion.matches) {
      observer?.disconnect();
      list
        .querySelectorAll(".awaiting-reveal")
        .forEach((row) => row.classList.remove("awaiting-reveal"));
    }
  });
})();
