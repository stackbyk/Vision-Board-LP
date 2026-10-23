// EDIT CARD TEXT HERE
const forYouIf = [
  'You have many things you want to do, but don’t know what to prioritise.',
  'You have big ambitions, but don’t know where to start.',
  'Work has taken over, and your personal goals keep taking a back seat.',
  'You’ve set goals before, but struggle to stay consistent.',
  'You want to make a vision board, but don’t know how to begin.',
  'You’ve made a vision board before, but haven’t done much with it.',
];

(() => {
  const grid = document.querySelector('#for-you-grid');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('awaiting-reveal');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 }) : null;
  forYouIf.forEach(text => {
    const card = document.createElement('li');
    card.className = 'for-you-card';
    const badge = document.createElement('span');
    badge.className = 'for-you-check';
    badge.setAttribute('aria-hidden', 'true');
    badge.innerHTML = '<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>';
    const content = document.createElement('span');
    content.textContent = text;
    card.append(badge, content);
    grid.append(card);
    if (observer && !motion.matches) {
      card.classList.add('awaiting-reveal');
      observer.observe(card);
    }
  });
  motion.addEventListener('change', () => {
    if (motion.matches) {
      observer?.disconnect();
      grid.querySelectorAll('.awaiting-reveal').forEach(card => card.classList.remove('awaiting-reveal'));
    }
  });
})();
