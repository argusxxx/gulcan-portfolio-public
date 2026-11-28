/* Shared analytics preferences for all public portfolio pages. */
(() => {
  "use strict";
  const key = "gulcan-analytics-v1";
  let choice = null;
  try { choice = localStorage.getItem(key); } catch (_) {}
  const privacySignal = navigator.globalPrivacyControl === true || navigator.doNotTrack === "1";
  let loaded = false;
  function start() {
    if (loaded || privacySignal || choice !== "yes") return;
    const script = document.createElement("script");
    script.src = "https://www.statcounter.com/counter/counter.js";
    script.async = true;
    loaded = true;
    document.head.appendChild(script);
  }
  const panel = document.createElement("section");
  panel.className = "analytics-choice";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Analytics preferences");
  panel.innerHTML = '<p><strong>Analytics preferences</strong><br>May we use optional analytics to improve this website? <a href="/privacy/">Privacy Policy</a>.</p><div class="analytics-actions"><button type="button" data-choice="no">Decline</button><button type="button" data-choice="yes">Allow analytics</button></div><p class="analytics-signal" hidden>Your browser requests that tracking be disabled.</p>';
  document.body.appendChild(panel);
  const settings = document.querySelectorAll("[data-analytics-settings]");
  const allow = panel.querySelector('[data-choice="yes"]');
  if (privacySignal) {
    allow.disabled = true;
    panel.querySelector(".analytics-signal").hidden = false;
  }
  settings.forEach(button => {
    button.hidden = false;
    button.addEventListener("click", () => {
      panel.hidden = false;
      panel.querySelector("button").focus();
    });
  });
  panel.addEventListener("click", event => {
    const button = event.target.closest("button[data-choice]");
    if (!button || button.disabled) return;
    const next = button.dataset.choice;
    const wasLoaded = loaded;
    choice = next;
    let persisted = false;
    try { localStorage.setItem(key, next); persisted = true; } catch (_) {}
    panel.hidden = true;
    if (next === "yes") start();
    else if (wasLoaded && persisted) location.reload();
    else if (wasLoaded) {
      // Stop future tracking on navigation; cannot undo requests already sent.
      location.reload();
    } else if (settings.length) settings[0].focus({preventScroll:true});
  });
  if (choice === "yes") start();
  else if (choice !== "no" && !privacySignal) panel.hidden = false;
  window.addEventListener("storage", event => {
    if (event.key === key && event.newValue !== choice) location.reload();
  });
})();
