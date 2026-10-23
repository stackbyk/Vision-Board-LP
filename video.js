// Set this to a YouTube watch/share/embed URL or a hosted .mp4 URL.
// Leave empty to keep the Workshop Preview placeholder.
const VIDEO_URL = '';

function getVideoConfig(value) {
  if (!value.trim()) return null;
  let url;
  try { url = new URL(value); } catch { return null; }
  if (!['https:', 'http:'].includes(url.protocol)) return null;
  const host = url.hostname.toLowerCase();
  let id;
  if (host === 'youtu.be') id = url.pathname.split('/')[1];
  if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
    const parts = url.pathname.split('/');
    id = url.pathname === '/watch' ? url.searchParams.get('v') : ['embed', 'shorts', 'live'].includes(parts[1]) ? parts[2] : null;
  }
  if (id && /^[\w-]{11}$/.test(id)) {
    return { type: 'youtube', src: `https://www.youtube-nocookie.com/embed/${id}?controls=1&playsinline=1&rel=0` };
  }
  if (/\.mp4$/i.test(url.pathname)) return { type: 'mp4', src: url.href };
  return null;
}

function renderWorkshopVideo(value) {
  const config = getVideoConfig(value);
  const preview = document.querySelector('#workshop-preview');
  if (!config) return;
  const player = document.createElement(config.type === 'youtube' ? 'iframe' : 'video');
  if (config.type === 'youtube') {
    player.title = 'Workshop Preview';
    player.allow = 'accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    player.allowFullscreen = true;
    player.referrerPolicy = 'strict-origin-when-cross-origin';
  } else {
    player.controls = true;
    player.playsInline = true;
    player.preload = 'none';
    player.setAttribute('aria-label', 'Workshop Preview');
    // Keep the clean preview if the supplied file cannot load.
    const placeholder = preview.firstElementChild.cloneNode(true);
    player.addEventListener('error', () => {
      preview.replaceChildren(placeholder);
      preview.setAttribute('role', 'img');
      preview.setAttribute('aria-label', 'Workshop Preview — video unavailable');
    });
  }
  player.src = config.src;
  preview.removeAttribute('role');
  preview.removeAttribute('aria-label');
  preview.replaceChildren(player);
}

renderWorkshopVideo(VIDEO_URL);
