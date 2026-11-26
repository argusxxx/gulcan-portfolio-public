/* Reveal project names as their images enter the viewport on phones.
   Desktop keeps the architectural drawing hover effect. */
(() => {
  "use strict";
  const gallery = document.querySelector(".pg-gallery");
  if (!gallery || !("IntersectionObserver" in window)) return;
  const cards = [...gallery.querySelectorAll(".pg-card")];
  const smallScreen = window.matchMedia("(max-width: 700px)");
  let observer = null;

  function activate() {
    observer?.disconnect();
    observer = null;
    gallery.classList.remove("pg-mobile-reveal");
    cards.forEach(card => card.classList.remove("is-visible"));
    if (!smallScreen.matches) return;

    gallery.classList.add("pg-mobile-reveal");
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08, rootMargin: "0px 0px -12% 0px" });
    cards.forEach(card => observer.observe(card));
  }

  activate();
  if (smallScreen.addEventListener) {
    smallScreen.addEventListener("change", activate);
  } else {
    smallScreen.addListener(activate);
  }
})();
