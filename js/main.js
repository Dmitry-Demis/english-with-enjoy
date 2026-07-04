// =========================================================
// Общий скрипт сайта: меню, вкладки, скролл-анимации, "наверх"
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  initNavToggle();
  initTabs();
  initScrollReveal();
  initBackToTop();
  initSubgroupToggles();
});

/* ---------- кликабельные плитки подпунктов (bento, разворачивают примеры) ---------- */

function initSubgroupToggles() {
  document.querySelectorAll(".subgroup-tile").forEach((tile) => {
    tile.addEventListener("click", () => {
      const isOpen = tile.classList.toggle("is-open");
      const body = tile.nextElementSibling;
      if (body && body.classList.contains("subgroup-body")) {
        body.classList.toggle("is-open", isOpen);
      }
      const parentGroup = tile.closest(".level-subgroup");
      if (parentGroup) {
        parentGroup.classList.toggle("is-expanded", isOpen);
      }
    });
  });
}

/* ---------- мобильное меню ---------- */

function initNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.classList.toggle("is-active", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.classList.remove("is-active");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* ---------- вкладки (поддерживает вложенные группы + запоминание выбора) ---------- */

function initTabs() {
  const containers = Array.from(document.querySelectorAll("[data-tabs]"));

  function scopedButtons(container) {
    return [...container.querySelectorAll(".tab-btn")].filter(
      (b) => b.closest("[data-tabs]") === container
    );
  }

  function scopedPanels(container) {
    return [...container.querySelectorAll(".tab-panel")].filter(
      (p) => p.closest("[data-tabs]") === container
    );
  }

  function activate(container, target) {
    const buttons = scopedButtons(container);
    const panels = scopedPanels(container);
    const btn = buttons.find((b) => b.dataset.tabTarget === target);
    const panel = panels.find((p) => p.dataset.tabPanel === target);
    if (!btn || !panel) return;

    buttons.forEach((b) => b.classList.remove("is-active"));
    panels.forEach((p) => p.classList.remove("is-active"));
    btn.classList.add("is-active");
    panel.classList.add("is-active");
  }

  containers.forEach((container, index) => {
    const storageKey = `tabs-state-${index}`;

    const saved = localStorage.getItem(storageKey);
    if (saved) activate(container, saved);

    scopedButtons(container).forEach((btn) => {
      btn.addEventListener("click", () => {
        activate(container, btn.dataset.tabTarget);
        localStorage.setItem(storageKey, btn.dataset.tabTarget);
      });
    });
  });
}

/* ---------- анимация появления при скролле ---------- */

function initScrollReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0, rootMargin: "0px 0px -10% 0px" }
  );

  items.forEach((el) => observer.observe(el));
}

/* ---------- кнопка "наверх" ---------- */

function initBackToTop() {
  const btn = document.querySelector(".to-top");
  if (!btn) return;

  window.addEventListener("scroll", () => {
    btn.classList.toggle("is-visible", window.scrollY > 600);
  });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
