/* Optional Statcounter analytics. No third-party request before opt-in. */
(() => {
  "use strict";
  const key = "gulcan-analytics-v1";
  let choice = null;
  try { choice = localStorage.getItem(key); } catch (_) {}
  let loaded = false;
  const enable = () => {
    if (loaded) return;
    loaded = true;
    window.initStatCounter();
  };
  const panel = document.createElement("section");
  panel.className = "analytics-choice";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Optional analytics");
  panel.innerHTML = '<p><strong>Analytics preferences</strong><br>Optional Statcounter analytics records visits, IP addresses and approximate locations. <a href="/privacy/">Privacy details</a>.</p><div class="analytics-actions"><button type="button" data-choice="no">Decline</button><button type="button" data-choice="yes">Allow analytics</button></div>';
  document.body.appendChild(panel);
  const settings = document.querySelectorAll("[data-analytics-settings]");
  settings.forEach(button => {
    button.hidden = false;
    button.addEventListener("click", () => {
      panel.hidden = false;
      panel.querySelector("button").focus();
    });
  });
  panel.addEventListener("click", event => {
    const button = event.target.closest("button[data-choice]");
    if (!button) return;
    const next = button.dataset.choice;
    const wasLoaded = loaded;
    choice = next;
    try { localStorage.setItem(key, next); } catch (_) {}
    panel.hidden = true;
    if (next === "yes") enable();
    else if (wasLoaded) location.reload();
    else if (settings.length) settings[0].focus({preventScroll:true});
  });
  if (choice === "yes") enable();
  else if (choice !== "no") panel.hidden = false;
  window.addEventListener("storage", event => {
    if (event.key === key && event.newValue !== choice) location.reload();
  });
})();
