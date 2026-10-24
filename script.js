const bookingDialog = document.querySelector('#booking-dialog');
document.querySelector('.hero-copy .cta').addEventListener('click', () => bookingDialog.showModal());
document.querySelector('#close-dialog').addEventListener('click', () => bookingDialog.close());
bookingDialog.addEventListener('click', (event) => {
  if (event.target === bookingDialog) {
    const bounds = bookingDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) bookingDialog.close();
  }
});

// Workshop timeline content: edit the six steps here.
const workshopTimeline = [
 { number: '01', chip: '0-20 min', title: 'Pause & Reflect', description: 'Begin with guided meditation and affirmations. Make space to think about what you really want.' },
 { number: '02', chip: '20-45 min', title: 'Choose Your Priorities', description: 'Explore different areas of your life and choose the goals that matter most to you.' },
 { number: '03', chip: '45-100 min', title: 'Create Your Board Live', description: 'Choose from a variety of pictures using pre-designed Canva templates.' },
 { number: '04', chip: '100-120 min', title: 'Present Your Vision', description: 'Share your board in a small cohort. Get feedback and inspiration from others’ boards.' },
 { number: '05', chip: 'Optional', title: 'Get the Hardcopy of Your Vision Board', description: 'Receive a printed copy of your completed Vision Board at your doorstep if you share the final board with us within 7 days after the workshop.' },
 { number: '06', chip: 'Ongoing', title: 'Keep Working On It', description: 'Continue working towards your goals through regular check-ins.' },
];
(() => {
 const section = document.querySelector('.workshop-timeline');
 const motion = matchMedia('(prefers-reduced-motion: reduce)');
 let interacted = false;
 const timers = [];
 const steps = workshopTimeline.map((item, index) => {
  const step = document.createElement('li'); step.className = 'workshop-timeline-step';
  const node = document.createElement('span'); node.className = 'workshop-timeline-node'; node.textContent = item.number; node.setAttribute('aria-hidden', 'true');
  const connector = document.createElement('span'); connector.className = 'workshop-timeline-connector'; connector.setAttribute('aria-hidden', 'true');
  const card = document.createElement('div'); card.className = 'workshop-timeline-card'; card.tabIndex = 0;
  const title = document.createElement('h3'); title.textContent = item.title; title.id = `workshop-step-${index + 1}`; card.setAttribute('aria-labelledby', title.id);
  const description = document.createElement('p'); description.textContent = item.description;
  card.append(title, description); step.append(node, connector, card);
  section.querySelector(index < 4 ? '#workshop-timeline-inside' : '#workshop-timeline-after').append(step);
  const activate = () => { interacted = true; steps.forEach(other => other.classList.remove('is-active', 'is-lit')); step.classList.add('is-active'); };
  card.addEventListener('pointerenter', activate); card.addEventListener('focus', activate); card.addEventListener('click', activate);
  card.addEventListener('keydown', event => {
   const offset = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
   if (offset) { event.preventDefault(); steps[(index + offset + steps.length) % steps.length].querySelector('.workshop-timeline-card').focus(); }
  });
  return step;
 });
 const lines = [...section.querySelectorAll('.workshop-timeline-list')];
 const resize = () => lines.forEach(line => line.style.setProperty('--line-width', `${line.clientWidth}px`));
 new ResizeObserver(resize).observe(section); resize();
 let revealed = false;
 function reveal() {
  if (revealed) return; revealed = true; section.classList.add('is-revealed');
  steps.forEach((step, index) => {
   step.querySelector('.workshop-timeline-card').style.transitionDelay = motion.matches ? '0ms' : `${index * 100}ms`;
   const timer = setTimeout(() => {
    if (!interacted) { steps.forEach(other => other.classList.remove('is-lit')); step.classList.add('is-lit'); }
    step.querySelector('.workshop-timeline-card').style.transitionDelay = '0ms';
   }, motion.matches ? 0 : index * 150);
   timers.push(timer);
  });
 }
 if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { reveal(); observer.disconnect(); } }, { threshold: .08 });
  observer.observe(section);
 } else reveal();
 motion.addEventListener('change', () => { if (motion.matches) { timers.forEach(clearTimeout); reveal(); section.querySelectorAll('.workshop-timeline-card').forEach(card => card.style.transitionDelay = '0ms'); } });
})();
