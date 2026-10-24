// Edit the workshop benefits here.
const buildBenefits = [
  { title: 'Small cohorts, not crowded webinars', description: 'Get the space to share your vision, ask questions and receive feedback.' },
  { title: 'Create it live, not “later”', description: 'Work on your Vision Board during the session and leave with it ready.' },
  { title: 'Focus on goals, not just pretty pictures', description: 'Start with reflection and priorities before choosing what goes on your board.' },
  { title: 'Action beyond the board', description: "Various community initiatives to ensure your vision doesn't end with the workshop." },
];

(() => {
  const section = document.querySelector('.build-with-us');
  const group = section.querySelector('.build-circles');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const CYCLE_MS = 4000, RESUME_MS = 6000;
  let active = 0, timer, resume, hovering = false, focused = false, visible = false;
  const buttons = buildBenefits.map((item, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'build-circle';
    button.setAttribute('aria-pressed', String(index === 0));
    button.innerHTML = '<svg class="build-progress" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48" pathLength="100"/></svg>';
    const number = document.createElement('span'); number.className = 'build-number'; number.textContent = String(index + 1).padStart(2, '0'); number.setAttribute('aria-hidden', 'true');
    const title = document.createElement('span'); title.className = 'build-circle-title'; title.textContent = item.title;
    const description = document.createElement('span'); description.className = 'build-circle-description'; description.textContent = item.description;
    const content = document.createElement('span'); content.className = 'build-content'; content.append(number, title, description); button.append(content); group.append(button);
    button.addEventListener('focus', () => { interact(); activate(index); });
    button.addEventListener('click', () => { interact(); activate(index); });
    button.addEventListener('pointerenter', () => { if (finePointer.matches) { interact(); activate(index); } });
    button.addEventListener('keydown', event => {
      const offset = { ArrowRight:1, ArrowDown:1, ArrowLeft:-1, ArrowUp:-1 }[event.key];
      if (!offset) return;
      event.preventDefault(); interact();
      const next = (index + offset + buttons.length) % buttons.length;
      activate(next); buttons[next].focus();
    });
    return button;
  });
  function activate(index) {
    active = index;
    buttons.forEach((button, i) => { button.classList.toggle('is-active', i === index); button.setAttribute('aria-pressed', String(i === index)); });

  }
  function pause() { clearTimeout(timer); section.classList.remove('is-cycling'); }
  function schedule() {
    pause();
    if (motion.matches || hovering || focused || !visible || document.hidden) return;
    void section.offsetWidth; section.classList.add('is-cycling');
    timer = setTimeout(() => { activate((active + 1) % buttons.length); schedule(); }, CYCLE_MS);
  }
  function interact() { pause(); clearTimeout(resume); resume = setTimeout(schedule, RESUME_MS); }
  group.addEventListener('pointerenter', () => { if (finePointer.matches) { hovering = true; pause(); } });
  group.addEventListener('pointerleave', () => { hovering = false; interact(); });
  group.addEventListener('focusin', () => { focused = true; interact(); });
  group.addEventListener('focusout', event => { if (!group.contains(event.relatedTarget)) { focused = false; interact(); } });
  motion.addEventListener('change', schedule);
  document.addEventListener('visibilitychange', schedule);
  activate(0);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.target === section) { visible = entry.isIntersecting; schedule(); return; }
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('awaiting-reveal');
      const index = buttons.indexOf(entry.target), number = entry.target.querySelector('.build-number');
      if (!motion.matches) {
        const start = performance.now();
        const count = now => { const progress = Math.min(1,(now-start)/450); number.textContent = String(Math.round(progress*(index+1))).padStart(2,'0'); if (progress<1) requestAnimationFrame(count); };
        requestAnimationFrame(count);
      }
      observer.unobserve(entry.target);
    }), { threshold:.15 });
    observer.observe(section);
    buttons.forEach((button,index) => {
      if (!motion.matches) { button.classList.add('awaiting-reveal'); button.style.transitionDelay = `${index*100}ms`; }
      observer.observe(button);
    });
  } else { visible = true; schedule(); }
})();
