// Add or edit video entries here: { name, youtubeUrl, title: "Optional title", thumbnail: "Optional image URL" }. No fixed limit.
const videoTestimonials = [
  {
    name: "Avatika Pandey",
    youtubeUrl: "https://youtube.com/shorts/w3n_mzQs2S0?si=5TOdIy_8Db6W6KM-",
  },
  {
    name: "Shreya Agarwal",
    youtubeUrl: "https://youtube.com/shorts/RA2P5Gp5GLg?si=VjmejFoGgtHGvHPN",
  },
  {
    name: "Jaiveer Shekhawat",
    youtubeUrl: "https://youtube.com/shorts/ujvuqiqUAC8?si=M7QANtPXoEGP-Oc9",
  },
  {
    name: "Piyush",
    youtubeUrl: "https://youtube.com/shorts/c7co7upeyMo?si=IJcNA9qUUch21woC",
  },
  {
    name: "Disha Atolia",
    youtubeUrl: "https://youtube.com/shorts/Q0Oq_5U1Fd4?si=bySDa8JuKF2uuS5a",
  },
  {
    name: "Vivek Vardhan",
    youtubeUrl: "https://youtube.com/shorts/RLUwjR7e3CI?si=mjjZ0wqcuiji5N2Q",
  },
];
// Edit reviews here. Put photos in avatars/ and set avatar: 'avatars/name.jpg'.
const writtenTestimonials = [
  {
    quote:
      "“Shraddha has made possible for me to visualise and reflect on my goals for the year. The workshop on Vision board clearly is a banger, and the follow up sessions within the community keeps you going. I would surely recommend anyone to attend her workshops and bring a positive change in their life.” ",
    name: "Ramneet Singh",
    role: "Founder @ Augmntdd. Media",
    avatar: "avatars/ranmeet.png",
  },
  {
    quote:
      "“I attended Shraddha's vision board workshop and had my board created with both intentions and actions on it. Sometimes, vision board just remains as a vision and does not translate into reality. But I am so grateful to Shraddha that she spent 1 on 1 time with me post the workshop to come up with relevant and inspiring actions that I could see it becoming real in just 2 months. Now my vision board makes a lot of sense and clarity to me. Thank you Shraddha!”",
    name: "Abinaya R",
    role: "Manager @ Lend A Hand India",
    avatar: "avatars/abinaya.png",
  },
  {
    quote:
      "“I had a really lovely experience at the Vision Board workshop by Livin' My Dream hosted by Shraddha. I've made vision boards before, but this session felt much more thoughtful and meaningful. It made me slow down and really reflect on what I want, instead of just creating something that looks nice.\n\nThe session was warm, insightful, and very supportive. It gave me clarity and helped me think about my goals in a more intentional and grounded way. I genuinely walked away feeling more aligned and clear.\n\nI'd highly recommend it to anyone looking for a deeper, more mindful way to do vision boarding.”",
    name: "Harshita Poddar",
    role: "ISCP @ Kaplan",
    avatar: "avatars/harshitha.png",
  },
  {
    quote:
      "“Attending Shraddha's vision board workshop was a truly great experience. It helped me visualize my dreams with such clarity that I could literally see my next 1 year unfolding in front of me. The session was not just about creating a board but it was about aligning my thoughts, energy, and actions toward my goals. Grateful for this experience! Highly recommended ❤️”",
    name: "Keshav Deora",
    role: "Workshop Participant",
    avatar: "avatars/keshav.png",
  },
  {
    quote:
      "“I recently attended the Vision Board workshop and it was an absolutely transformative experience. Shraddha is a wonderful host and an inspiring mentor who created a warm, safe space for everyone to dream big and get clarity on their goals. Her step-by-step guidance, practical tips and encouraging feedback made the process simple, powerful and deeply personal. Thank you, Shraddha, for pouring so much heart into the session and for helping me walk away with a clear, actionable vision for my future. Highly recommended to anyone who wants to reset, refocus and realign their life goals through a meaningful, hands-on workshop.”",
    name: "Prateek Singh",
    role: "Co-founder & CEO @ Brevistay",
    avatar: "avatars/prateek.png",
  },
  {
    quote:
      "“I did the online vision board activity with Shraddha and it was such a treat! It was thoughtful, calming, empathetic, and interactive. There was ample space given to be yourself yet accountability was also placed subtly so that focus building can happen followed by action. I liked the group, the content of the workshop, as well as the outcome. You can definitely trust your time to this program.”",
    name: "Shreya Nandy",
    role: "Freelance Writer",
    avatar: "avatars/shreya.png",
  },
];

(() => {
  const stage = document.querySelector("#testimonial-stage");
  const personIcon =
    '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="10" r="6"/><path d="M4 30v-4a12 12 0 0 1 24 0v4z"/></svg>';
  let stopCurrentVideo = null;
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
      thumbnail.src =
        item.thumbnail || `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
      thumbnail.alt = `Video testimonial from ${label}`;
      thumbnail.loading = "lazy";
      let thumbnailLevel = item.thumbnail ? 0 : 1;
      const useFallback = () => {
        if (thumbnailLevel === 0) {
          thumbnailLevel = 1;
          thumbnail.src = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
        } else if (thumbnailLevel === 1) {
          thumbnailLevel = 2;
          thumbnail.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
        } else thumbnail.remove();
      };
      thumbnail.addEventListener("error", useFallback);
      thumbnail.addEventListener("load", () => {
        if (thumbnailLevel === 1 && thumbnail.naturalWidth <= 120)
          useFallback();
      });
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
        if (stopCurrentVideo) stopCurrentVideo();
        const previewNodes = [...media.childNodes];
        const iframe = document.createElement("iframe");
        iframe.src = config.src;
        iframe.title = item.title || `Video testimonial from ${label}`;
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        // Keep the fallback available: cross-origin player errors do not
        // reliably trigger the iframe element's error event.
        const fallback = document.createElement("a");
        fallback.className = "testimonial-youtube-fallback";
        fallback.href = item.youtubeUrl;
        fallback.target = "_blank";
        fallback.rel = "noopener noreferrer";
        fallback.textContent = "Watch on YouTube";
        iframe.addEventListener("error", () => iframe.remove());
        media.classList.add("has-youtube-player");
        media.replaceChildren(iframe);
        const caption = card.querySelector("figcaption");
        if (caption) caption.after(fallback);
        else card.append(fallback);
        stopCurrentVideo = () => {
          media.replaceChildren(...previewNodes);
          media.classList.remove("has-youtube-player");
          fallback.remove();
          stopCurrentVideo = null;
        };
      });
    } else {
      media.setAttribute("role", "img");
      media.setAttribute("aria-label", `Video placeholder for ${label}`);
      play.setAttribute("aria-hidden", "true");
      const emptyLabel = document.createElement("span");
      emptyLabel.className = "testimonial-empty-label";
      emptyLabel.textContent = "Add video link";
      media.append(emptyLabel);
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
  const dots = document.createElement("div");
  dots.className = "video-pagination";
  dots.setAttribute("aria-label", "Video pages");
  stage.parentElement.append(dots);
  function pagePositions() {
    const count = Math.max(
      1,
      parseInt(
        getComputedStyle(stage.parentElement).getPropertyValue(
          "--visible-videos",
        ),
      ) || 1,
    );
    const gap = parseFloat(getComputedStyle(stage).columnGap) || 0;
    const step =
      (stage.firstElementChild?.getBoundingClientRect().width || 0) + gap;
    const maximum = Math.max(0, stage.scrollWidth - stage.clientWidth);
    const positions = [0];
    for (let i = count; i < videoTestimonials.length; i += count) {
      const position = Math.min(i * step, maximum);
      if (position > positions[positions.length - 1] + 2)
        positions.push(position);
    }
    return positions;
  }
  function currentPage(positions) {
    return positions.reduce(
      (best, position, index) =>
        Math.abs(position - stage.scrollLeft) <
        Math.abs(positions[best] - stage.scrollLeft)
          ? index
          : best,
      0,
    );
  }
  function goTo(position) {
    if (stopCurrentVideo) stopCurrentVideo();
    stage.scrollTo({
      left: position,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  function updateNavigation() {
    stage.parentElement.style.setProperty(
      "--video-center",
      `${8 + (stage.querySelector(".testimonial-media")?.getBoundingClientRect().height || 0) / 2}px`,
    );
    const positions = pagePositions();
    previous.disabled = next.disabled = positions.length < 2;
    if (dots.children.length !== positions.length) {
      dots.replaceChildren(
        ...positions.map((_, index) => {
          const button = document.createElement("button");
          button.type = "button";
          button.setAttribute("aria-label", `Go to video page ${index + 1}`);
          button.addEventListener("click", () =>
            goTo(pagePositions()[index] || 0),
          );
          return button;
        }),
      );
    }
    [...dots.children].forEach((button, index) =>
      button.setAttribute(
        "aria-current",
        String(index === currentPage(positions)),
      ),
    );
  }
  function navigate(direction) {
    const positions = pagePositions();
    goTo(
      positions[
        (currentPage(positions) + direction + positions.length) %
          positions.length
      ],
    );
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
