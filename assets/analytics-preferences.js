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
  const tr = document.documentElement.lang === "tr";
  panel.setAttribute("aria-label", tr ? "Analiz tercihleri" : "Analytics preferences");
  panel.innerHTML = tr ? '<p><strong>Analiz tercihleri</strong><br>Siteyi geliştirmek için isteğe bağlı ziyaretçi istatistiklerini kullanmamıza izin verir misiniz? <a href="/tr/gizlilik/">Gizlilik Politikası</a>.</p><div class="analytics-actions"><button type="button" data-choice="no">Reddet</button><button type="button" data-choice="yes">İzin ver</button></div><p class="analytics-signal" hidden>Tarayıcınız takibin devre dışı bırakılmasını istiyor.</p>' : '<p><strong>Analytics preferences</strong><br>May we use optional analytics to improve this website? <a href="/privacy/">Privacy Policy</a>.</p><div class="analytics-actions"><button type="button" data-choice="no">Decline</button><button type="button" data-choice="yes">Allow analytics</button></div><p class="analytics-signal" hidden>Your browser requests that tracking be disabled.</p>';
  document.body.appendChild(panel);
  if (privacySignal) {
    panel.querySelector('[data-choice="yes"]').disabled = true;
    panel.querySelector(".analytics-signal").hidden = false;
  }
  function openPreferences() {
    panel.hidden = false;
    if (location.hash === "#analytics-preferences") {
      history.replaceState(null, "", location.pathname + location.search);
    }
  }
  panel.addEventListener("click", event => {
    const button = event.target.closest("button[data-choice]");
    if (!button || button.disabled) return;
    choice = button.dataset.choice;
    try { localStorage.setItem(key, choice); } catch (_) {}
    panel.hidden = true;
    if (choice === "yes") start();
    else if (loaded) location.reload();
  });
  if (location.hash === "#analytics-preferences") openPreferences();
  else if (choice === "yes") start();
  else if (choice !== "no" && !privacySignal) openPreferences();
  window.addEventListener("hashchange", () => {
    if (location.hash === "#analytics-preferences") openPreferences();
  });
  window.addEventListener("storage", event => {
    if (event.key === key && event.newValue !== choice) location.reload();
  });
})();
