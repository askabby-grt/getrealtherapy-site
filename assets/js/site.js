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
  if (!toggle || !nav) return;

  toggle.addEventListener("click", function () {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("nav-open", isOpen);
  });

  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    });
  });
}

function setupSubmenus() {
  const toggles = document.querySelectorAll(".site-nav__submenu-toggle");
  if (!toggles.length) return;

  toggles.forEach(function (toggle) {
    toggle.addEventListener("click", function () {
      const parent = toggle.closest(".site-nav__item--has-submenu");
      if (!parent) return;

      const isOpen = parent.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  });
}
