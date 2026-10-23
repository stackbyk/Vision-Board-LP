// Add or edit video entries here: { name, youtubeUrl, title: "Optional title" }. No fixed limit.
const videoTestimonials = [
  {
    name: "Avatika Pandey",
    youtubeUrl: "https://youtube.com/shorts/w3n_mzQs2S0?si=5TOdIy_8Db6W6KM-",
  },
  {
    name: "Shreya Agarwal",
    youtubeUrl: "",
  },
  {
    name: "Jaiveer Shekhawat",
    youtubeUrl: "",
  },
  {
    name: "Piyush",
    youtubeUrl: "",
  },
  { name: "Person 5", youtubeUrl: "" },
  { name: "Person 6", youtubeUrl: "" },
];
// Edit reviews here. Put photos in avatars/ and set avatar: 'avatars/name.jpg'.
const writtenTestimonials = [
  {
    quote: "Add review here",
    name: "Person Name",
    role: "Role @ Company",
    avatar: "",
  },
  {
    quote: "Add review here",
    name: "Person Name",
    role: "Role @ Company",
    avatar: "",
  },
  {
    quote: "Add review here",
    name: "Person Name",
    role: "Role @ Company",
    avatar: "",
  },
  {
    quote: "Add review here",
    name: "Person Name",
    role: "Role @ Company",
    avatar: "",
  },
  {
    quote: "Add review here",
    name: "Person Name",
    role: "Role @ Company",
    avatar: "",
  },
  {
    quote: "Add review here",
    name: "Person Name",
    role: "Role @ Company",
    avatar: "",
  },
];

(() => {
  const stage = document.querySelector("#testimonial-stage");
  const personIcon =
    '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="10" r="6"/><path d="M4 30v-4a12 12 0 0 1 24 0v4z"/></svg>';
  videoTestimonials.forEach((item) => {
    const card = document.createElement("figure");
    card.className = "testimonial-video";
    const media = document.createElement("div");
    media.className = "testimonial-media";
    const config = getVideoConfig(item.youtubeUrl);
    const label = item.name || "Workshop participant";
    if (config?.type === "youtube") {
      const id = config.src.split("/embed/")[1].split("?")[0];
      const thumbnail = document.createElement("img");
      thumbnail.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
      thumbnail.alt = `Video testimonial from ${label}`;
      thumbnail.loading = "lazy";
      thumbnail.addEventListener("error", () => thumbnail.remove());
      media.append(thumbnail);
    }
    const play = document.createElement(
      config?.type === "youtube" ? "button" : "span",
    );
    play.className = "testimonial-custom-play";
    play.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 4 12 8-12 8z"/></svg>';
    if (config?.type === "youtube") {
      play.type = "button";
      play.setAttribute("aria-label", `Play testimonial from ${label}`);
      play.addEventListener("click", () => {
        const iframe = document.createElement("iframe");
        iframe.src = config.src;
        iframe.title = item.title || `Video testimonial from ${label}`;
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        // Keep the fallback available: cross-origin player errors do not
        // reliably trigger the iframe element's error event.
        const fallback = document.createElement('a');
        fallback.className = 'testimonial-youtube-fallback';
        fallback.href = item.youtubeUrl;
        fallback.target = '_blank';
        fallback.rel = 'noopener noreferrer';
        fallback.textContent = 'Watch on YouTube';
        iframe.addEventListener('error', () => iframe.remove());
        media.classList.add('has-youtube-player');
        media.replaceChildren(iframe, fallback);
      });
    } else {
      media.setAttribute("role", "img");
      media.setAttribute("aria-label", `Video placeholder for ${label}`);
      play.setAttribute("aria-hidden", "true");
    }
    media.append(play);
    card.append(media);
    if (item.name) {
      const caption = document.createElement("figcaption");
      caption.textContent = item.name;
      card.append(caption);
    }
    if (item.title) {
      const title = document.createElement("p");
      title.className = "testimonial-video-title";
      title.textContent = item.title;
      card.append(title);
    }
    stage.append(card);
  });
  const previous = document.querySelector(".video-prev");
  const next = document.querySelector(".video-next");
  function updateNavigation() {
    previous.disabled = stage.scrollLeft < 2;
    next.disabled =
      stage.scrollLeft + stage.clientWidth >= stage.scrollWidth - 2;
  }
  function navigate(direction) {
    const gap = parseFloat(getComputedStyle(stage).columnGap) || 0;
    stage.scrollBy({
      left: direction * (stage.clientWidth + gap),
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  previous.addEventListener("click", () => navigate(-1));
  next.addEventListener("click", () => navigate(1));
  stage.addEventListener("scroll", updateNavigation, { passive: true });
  stage.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      navigate(event.key === "ArrowRight" ? 1 : -1);
    }
  });
  new ResizeObserver(updateNavigation).observe(stage);
  updateNavigation();
  const reviews = document.querySelector("#testimonial-reviews");
  writtenTestimonials.forEach((item) => {
    const card = document.createElement("article");
    card.className = "testimonial-review";
    const quote = document.createElement("blockquote");
    quote.textContent = item.quote;
    const footer = document.createElement("footer");
    const avatar = document.createElement("div");
    avatar.className = "testimonial-avatar";
    avatar.innerHTML = personIcon;
    if (item.avatar) {
      const photo = document.createElement("img");
      photo.src = item.avatar;
      photo.alt = `Portrait of ${item.name}`;
      photo.loading = "lazy";
      photo.addEventListener("error", () => {
        avatar.innerHTML = personIcon;
      });
      avatar.replaceChildren(photo);
    } else {
      avatar.setAttribute("role", "img");
      avatar.setAttribute("aria-label", `Avatar placeholder for ${item.name}`);
    }
    const details = document.createElement("div");
    const name = document.createElement("p");
    name.className = "review-name";
    name.textContent = item.name;
    const role = document.createElement("p");
    role.className = "review-role";
    role.textContent = item.role;
    details.append(name, role);
    footer.append(avatar, details);
    card.append(quote, footer);
    reviews.append(card);
  });
})();
