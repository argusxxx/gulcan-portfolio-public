/* GitHub Pages returns this same document with HTTP 404 for missing paths.
   Localize the visible error without redirecting or changing the missing URL. */
(() => {
  "use strict";
  const tr = /^\/tr(?:\/|$)/.test(location.pathname);
  if (!tr) return;
  document.documentElement.lang = "tr";
  document.title = "Sayfa bulunamadı | Gülcan Anlıtan — Mimarlık";
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = "Sayfa bulunamadı.";
  const set = (selector, text) => {
    const el = document.querySelector(selector);
    if (el) el.textContent = text;
  };
  const attr = (selector, name, value) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute(name, value);
  };
  set(".skip", "İçeriğe geç");
  attr(".ed-nav", "aria-label", "Ana menü");
  attr(".ed-identity", "href", "/tr/");
  set(".ed-role", "Mimar ve İç Mekân Tasarımcısı");
  const links = [
    ["/", "/tr/", "Ana Sayfa"],
    ["/portfolio/", "/tr/portfolyo/", "Portfolyo"],
    ["/about/", "/tr/hakkimda/", "Hakkımda"],
    ["/#contact", "/tr/#contact", "İletişim"]
  ];
  for (const [from, to, label] of links) {
    const el = document.querySelector('.ed-nav-links a[href="' + from + '"]');
    if (el) { el.href = to; el.textContent = label; }
  }
  attr(".ed-language", "aria-label", "Dil seçimi");
  document.querySelector('.ed-language a[lang="en"]')?.removeAttribute("aria-current");
  attr('.ed-language a[lang="tr"]', "aria-current", "true");
  attr(".ed-menu-button", "aria-label", "Menüyü aç");
  set(".inner-hero .eyebrow", "404 / Sayfa bulunamadı");
  const title = document.querySelector(".inner-hero h1");
  if (title) {
    const emphasis = document.createElement("em");
    emphasis.textContent = "bulunamadı.";
    title.replaceChildren("Sayfa", document.createElement("br"), emphasis);
  }
  set(".inner-hero p", "Aradığınız sayfaya ulaşılamıyor. Portfolyoyu incelemek için ana sayfaya dönebilirsiniz.");
  set(".inner-hero .text-link", "Ana sayfaya dön ↗");
  attr(".inner-hero .text-link", "href", "/tr/");
  attr(".ed-footer-brand", "href", "/tr/");
  const privacy = document.querySelector('.ed-footer-links a[href="/privacy/"]');
  if (privacy) { privacy.href = "/tr/gizlilik/"; privacy.textContent = "Gizlilik"; }
})();
