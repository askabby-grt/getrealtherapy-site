document.addEventListener("DOMContentLoaded", async function () {
  await loadIncludes();
  setYear();
  loadGoogleTag();
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
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
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
