// EDIT ROW CONTENT HERE
const whyFail = [
  {
    number: "01",
    problem: "Too many goals. No clear focus.",
    problemDescription: "You end up with a random mix of dreams, and nothing feels real.",
    title: "Find your priorities.",
    description: "Get clear on what you really want before choosing your images. Clarity = progress.",
  },
  {
    number: "02",
    problem: "Too much guesswork. No guidance.",
    problemDescription: "You’re not sure what to include, so it feels unclear and confusing.",
    title: "Go from idea to finished board.",
    description: "Create it in two hours with live, step-by-step guidance.",
  },
  {
    number: "03",
    problem: "Big goals but no plan to get there.",
    problemDescription: "You know what you want, but there’s no action steps.",
    title: "Put actions, not just goals, on your board.",
    description: "Define what you’ll actually do to move towards each goal.",
  },
  {
    number: "04",
    problem: "Initial excitement. Little follow-through.",
    problemDescription: "You feel inspired at first, but it fades over time.",
    title: "Build habits that support your goals.",
    description: "Use reflection, reminders and check-ins to keep taking action.",
  },
];

(() => {
  const list = document.querySelector("#why-fail-rows");
  function createCard(item, solution) {
    const card = document.createElement("div");
    card.className = solution ? "why-fail-solution" : "why-fail-problem";
    const badge = document.createElement("span");
    badge.className = "why-fail-number";
    badge.textContent = item.number;
    const divider = document.createElement("span");
    divider.className = "why-fail-divider";
    divider.setAttribute("aria-hidden", "true");
    const content = document.createElement("div");
    content.className = "why-fail-card-content";
    const label = document.createElement("span");
    label.className = "why-fail-mobile-label";
    label.textContent = solution ? "How we do it differently" : "What goes wrong";
    const title = document.createElement("h3");
    title.textContent = solution ? item.title : item.problem;
    const description = document.createElement("p");
    description.textContent = solution ? item.description : item.problemDescription;
    content.append(label, title, description);
    card.append(badge, divider, content);
    return card;
  }
  whyFail.forEach((item) => {
    const row = document.createElement("li");
    row.className = "why-fail-row";
    const arrow = document.createElement("span");
    arrow.className = "why-fail-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.innerHTML = '<span class="why-fail-arrow-right">→</span><span class="why-fail-arrow-down">↓</span>';
    row.append(createCard(item, false), arrow, createCard(item, true));
    list.append(row);
  });
})();
