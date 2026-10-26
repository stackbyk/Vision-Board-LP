(() => {
  const bar = document.querySelector("#sticky-cta");
  const hero = document.querySelector("main.hero");
  const heroButton = document.querySelector(".hero-copy .cta");
  const dialog = document.querySelector("#booking-dialog");
  let heroVisible = true;
  document.body.style.setProperty("--sticky-cta-base-padding", getComputedStyle(document.body).paddingBottom);

  function reserveSpace() {
    if (!bar.hidden) document.body.style.setProperty("--sticky-cta-height", `${bar.offsetHeight}px`);
  }
  function updateVisibility() {
    const show = !heroVisible && !dialog.open;
    bar.hidden = !show;
    reserveSpace();
    document.body.classList.toggle("sticky-cta-visible", show);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      updateVisibility();
    }, { threshold: 0 }).observe(hero);
  } else {
    const checkHero = () => {
      const bounds = hero.getBoundingClientRect();
      heroVisible = bounds.bottom > 0 && bounds.top < innerHeight;
      updateVisibility();
    };
    addEventListener("scroll", checkHero, { passive: true });
    addEventListener("resize", checkHero);
    checkHero();
  }
  new MutationObserver(updateVisibility).observe(dialog, { attributes: true, attributeFilter: ["open"] });
  dialog.addEventListener("close", updateVisibility);
  if ("ResizeObserver" in window) new ResizeObserver(reserveSpace).observe(bar);
  else addEventListener("resize", reserveSpace);
  document.querySelector("#sticky-cta-btn").addEventListener("click", () => {
    heroButton.click();
    updateVisibility();
  });
})();
