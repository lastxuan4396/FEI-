(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const globalNav = document.getElementById("globalNav");
  const setNavState = () => {
    if (!globalNav) return;
    globalNav.classList.toggle("is-scrolled", window.scrollY > 20);
  };
  setNavState();
  window.addEventListener("scroll", setNavState, { passive: true });

  const setupStoreRail = () => {
    const rail = document.querySelector("[data-store-rail]");
    const prevBtn = document.querySelector("[data-rail-prev]");
    const nextBtn = document.querySelector("[data-rail-next]");
    const progressBar = document.querySelector("[data-store-progress]");
    const dotsWrap = document.querySelector("[data-store-dots]");

    if (!rail || !prevBtn || !nextBtn) return;

    const cards = Array.from(rail.querySelectorAll(".store-card"));
    if (cards.length === 0) return;

    if (dotsWrap) {
      dotsWrap.innerHTML = cards.map(() => '<span class="store-dot"></span>').join("");
    }
    const dots = dotsWrap ? Array.from(dotsWrap.querySelectorAll(".store-dot")) : [];

    const updateControlsAndDepth = () => {
      const maxScrollLeft = Math.max(rail.scrollWidth - rail.clientWidth, 1);
      const scrollProgress = clamp(rail.scrollLeft / maxScrollLeft, 0, 1);

      prevBtn.disabled = rail.scrollLeft <= 4;
      nextBtn.disabled = rail.scrollLeft >= maxScrollLeft - 4;

      if (progressBar) {
        progressBar.style.width = `${12 + scrollProgress * 88}%`;
      }

      const viewportCenter = rail.scrollLeft + rail.clientWidth / 2;
      const spread = rail.clientWidth * 0.74;
      const cardStates = cards.map((card, index) => {
        const center = card.offsetLeft + card.offsetWidth / 2;
        const distance = Math.abs(center - viewportCenter);
        const normalized = clamp(distance / spread, 0, 1);
        const focus = 1 - normalized;
        return { card, index, distance, focus };
      });

      const activeState =
        cardStates.reduce((best, current) => (current.distance < best.distance ? current : best), cardStates[0]) ||
        cardStates[0];
      const activeIndex = activeState ? activeState.index : 0;

      cardStates.forEach(({ card, index, focus }) => {
        const scale = 0.92 + focus * 0.1;
        const lift = `${(1 - focus) * 18}px`;
        const alpha = 0.52 + focus * 0.48;
        const sat = 0.78 + focus * 0.35;
        const bright = 0.84 + focus * 0.22;

        card.style.setProperty("--focus", focus.toFixed(3));
        card.style.setProperty("--scale", scale.toFixed(3));
        card.style.setProperty("--lift", lift);
        card.style.setProperty("--alpha", alpha.toFixed(3));
        card.style.setProperty("--sat", sat.toFixed(3));
        card.style.setProperty("--bright", bright.toFixed(3));
        card.classList.toggle("is-focused", index === activeIndex);
      });

      dots.forEach((dot, index) => {
        dot.classList.toggle("is-active", index === activeIndex);
      });
    };

    let storeRaf = 0;
    const scheduleUpdate = () => {
      if (storeRaf) return;
      storeRaf = window.requestAnimationFrame(() => {
        storeRaf = 0;
        updateControlsAndDepth();
      });
    };

    const scrollByCards = (direction) => {
      const amount = Math.min(rail.clientWidth * 0.9, 460) * direction;
      rail.scrollBy({ left: amount, behavior: "smooth" });
    };

    prevBtn.addEventListener("click", () => scrollByCards(-1));
    nextBtn.addEventListener("click", () => scrollByCards(1));

    rail.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    if (!prefersReducedMotion) {
      cards.forEach((card) => {
        card.addEventListener("pointermove", (event) => {
          const rect = card.getBoundingClientRect();
          const xRatio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
          const yRatio = clamp((event.clientY - rect.top) / rect.height, 0, 1);

          const tiltY = (xRatio - 0.5) * 8;
          const tiltX = (0.5 - yRatio) * 6;

          card.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
          card.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
        });

        card.addEventListener("pointerleave", () => {
          card.style.setProperty("--tilt-y", "0deg");
          card.style.setProperty("--tilt-x", "0deg");
        });
      });
    }

    updateControlsAndDepth();
  };

  const setupStoryEngine = () => {
    const panel = document.querySelector("[data-story-panel]");
    const title = document.querySelector("[data-story-title]");
    const copy = document.querySelector("[data-story-copy]");
    const metric = document.querySelector("[data-story-metric]");
    const meta = document.querySelector("[data-story-meta]");
    const progress = document.querySelector("[data-story-progress]");
    const steps = Array.from(document.querySelectorAll(".story-step"));

    if (!panel || !title || !copy || !progress || steps.length === 0) return;

    let activeIndex = 0;

    const setActiveStep = (index) => {
      const safeIndex = clamp(index, 0, steps.length - 1);
      activeIndex = safeIndex;

      steps.forEach((step, idx) => {
        step.classList.toggle("is-active", idx === safeIndex);
        step.classList.toggle("is-past", idx < safeIndex);
      });

      const step = steps[safeIndex];
      title.textContent = step.dataset.title || "";
      copy.textContent = step.dataset.copy || "";
      if (metric) metric.textContent = step.dataset.metric || "";
      if (meta) meta.textContent = step.dataset.meta || "";
      panel.dataset.storyTheme = step.dataset.theme || "chip";
    };

    const updateContinuousProgress = () => {
      const first = steps[0];
      const last = steps[steps.length - 1];
      const firstTop = first.getBoundingClientRect().top + window.scrollY;
      const lastTop = last.getBoundingClientRect().top + window.scrollY;
      const lastBottom = lastTop + last.offsetHeight;
      const start = firstTop - window.innerHeight * 0.3;
      const end = lastBottom - window.innerHeight * 0.55;
      const cursor = window.scrollY + window.innerHeight * 0.5;
      const total = Math.max(end - start, 1);
      const ratio = clamp((cursor - start) / total, 0, 1);

      progress.style.width = `${12 + ratio * 88}%`;
      panel.style.setProperty("--stage-scale", (0.96 + ratio * 0.08).toFixed(3));
      panel.style.setProperty("--stage-shift", `${(0.5 - ratio) * 10}px`);
    };

    setActiveStep(0);
    updateContinuousProgress();

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          const index = steps.indexOf(visible[0].target);
          if (index >= 0) setActiveStep(index);
        }
      },
      {
        root: null,
        rootMargin: "-28% 0px -28% 0px",
        threshold: [0.2, 0.45, 0.7, 1],
      }
    );

    steps.forEach((step) => observer.observe(step));

    let storyRaf = 0;
    const scheduleProgress = () => {
      if (storyRaf) return;
      storyRaf = window.requestAnimationFrame(() => {
        storyRaf = 0;
        updateContinuousProgress();
      });
    };
    window.addEventListener("scroll", scheduleProgress, { passive: true });
    window.addEventListener("resize", scheduleProgress);
  };

  const setupReveal = () => {
    const reveals = Array.from(document.querySelectorAll(".reveal"));
    if (reveals.length === 0) return;

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        root: null,
        threshold: 0.2,
      }
    );

    reveals.forEach((node) => revealObserver.observe(node));
  };

  setupStoreRail();
  setupStoryEngine();
  setupReveal();
})();
