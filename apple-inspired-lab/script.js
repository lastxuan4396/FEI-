(() => {
  const globalNav = document.getElementById("globalNav");
  const setNavState = () => {
    if (!globalNav) return;
    globalNav.classList.toggle("is-scrolled", window.scrollY > 20);
  };
  setNavState();
  window.addEventListener("scroll", setNavState, { passive: true });

  const rail = document.querySelector("[data-store-rail]");
  const prevBtn = document.querySelector("[data-rail-prev]");
  const nextBtn = document.querySelector("[data-rail-next]");

  if (rail && prevBtn && nextBtn) {
    const updateRailControls = () => {
      const maxScrollLeft = rail.scrollWidth - rail.clientWidth;
      prevBtn.disabled = rail.scrollLeft <= 4;
      nextBtn.disabled = rail.scrollLeft >= maxScrollLeft - 4;
    };

    const scrollByCards = (direction) => {
      const amount = Math.min(rail.clientWidth * 0.88, 460) * direction;
      rail.scrollBy({ left: amount, behavior: "smooth" });
    };

    prevBtn.addEventListener("click", () => scrollByCards(-1));
    nextBtn.addEventListener("click", () => scrollByCards(1));

    rail.addEventListener("scroll", () => {
      window.requestAnimationFrame(updateRailControls);
    });

    window.addEventListener("resize", updateRailControls);
    updateRailControls();
  }

  const storyTitle = document.querySelector("[data-story-title]");
  const storyCopy = document.querySelector("[data-story-copy]");
  const storySteps = Array.from(document.querySelectorAll(".story-step"));

  if (storyTitle && storyCopy && storySteps.length) {
    const activateStep = (step) => {
      storySteps.forEach((node) => node.classList.toggle("is-active", node === step));
      storyTitle.textContent = step.dataset.title || "";
      storyCopy.textContent = step.dataset.copy || "";
    };

    activateStep(storySteps[0]);

    const storyObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          activateStep(visible[0].target);
        }
      },
      {
        root: null,
        rootMargin: "-30% 0px -42% 0px",
        threshold: [0.2, 0.45, 0.7, 1],
      }
    );

    storySteps.forEach((step) => storyObserver.observe(step));
  }

  const reveals = Array.from(document.querySelectorAll(".reveal"));
  if (reveals.length) {
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
  }
})();
