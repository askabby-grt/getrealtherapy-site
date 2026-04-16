document.addEventListener("DOMContentLoaded", async function () {
  await loadIncludes();
  setYear();
  loadGoogleTag();
  setupMobileNav();
  setupSubmenus();
});

async function loadIncludes() {
  const includeTargets = [
    { selector: "#siteHeader", path: "/assets/includes/header.html" },
    { selector: "#siteFooter", path: "/assets/includes/footer.html" }
  ];

  for (const item of includeTargets) {
    const target = document.querySelector(item.selector);
    if (!target) continue;

    try {
      const response = await fetch(item.path, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load " + item.path);
      }
      const html = await response.text();
      target.innerHTML = html;
    } catch (error) {
      console.error(error);
    }
  }
}

function setYear() {
  const yearNodes = document.querySelectorAll("[data-year], #year");
  if (!yearNodes.length) return;

  const year = String(new Date().getFullYear());
  yearNodes.forEach(function (node) {
    node.textContent = year;
  });
}

function loadGoogleTag() {
  const GA_ID = "G-8YW12523HN";

  if (!GA_ID) return;
  if (document.querySelector('script[data-gtag="true"]')) return;

  const gtagScript = document.createElement("script");
  gtagScript.async = true;
  gtagScript.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
  gtagScript.setAttribute("data-gtag", "true");
  document.head.appendChild(gtagScript);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", GA_ID);
}

function setupMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  const overlay = document.querySelector(".site-nav-overlay");
  if (!toggle || !nav || !overlay) return;

  function openNav() {
    nav.classList.add("is-open");
    overlay.hidden = false;
    overlay.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("nav-open");
  }

  function closeNav() {
    nav.classList.remove("is-open");
    overlay.classList.remove("is-open");
    overlay.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
  }

  toggle.addEventListener("click", function () {
    const isOpen = nav.classList.contains("is-open");
    if (isOpen) {
      closeNav();
    } else {
      openNav();
    }
  });

  overlay.addEventListener("click", closeNav);

  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      closeNav();
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeNav();
    }
  });
}

function setupSubmenus() {
  const toggles = document.querySelectorAll(".site-nav__submenu-toggle");
  if (!toggles.length) return;

  toggles.forEach(function (toggle) {
    toggle.addEventListener("click", function (event) {
      const parent = toggle.closest(".site-nav__item--has-submenu");
      if (!parent) return;

      const isDesktop = window.matchMedia("(min-width: 981px)").matches;
      if (!isDesktop) {
        event.preventDefault();
      }

      const isOpen = parent.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  });
}
