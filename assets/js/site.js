document.addEventListener("DOMContentLoaded", async function () {
  await loadIncludes();
  setYear();
  loadGoogleTag();
  setupMobileNav();
  setupSubmenus();
  setupAnalyticsTracking();
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
  const GA_ID = "G-44SL3FKFTY";

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

/* =========================================
   GET REAL THERAPY - ANALYTICS TRACKING
   ========================================= */

function getPageContext() {
  const body = document.body || {};
  return {
    page_type: body.dataset.pageType || "unknown",
    service: body.dataset.service || "",
    page_slug: window.location.pathname,
    page_title: document.title || "",
    primary_goal: body.dataset.primaryGoal || ""
  };
}

function trackEvent(eventName, eventParams) {
  const params = Object.assign({}, getPageContext(), eventParams || {});

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(Object.assign({ event: eventName }, params));

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
}

function setupAnalyticsTracking() {
  trackEvent("site_page_view", {
    event_category: "engagement"
  });

  setupTrackedClicks();
  setupOutboundTracking();
  setupScrollDepthTracking();
  setupFormTracking();
  setupFaqTracking();
}

function setupTrackedClicks() {
  document.querySelectorAll("[data-track-event]").forEach(function (el) {
    if (el.dataset.trackingBound === "true") return;
    el.dataset.trackingBound = "true";

    el.addEventListener("click", function () {
      trackEvent(el.dataset.trackEvent, {
        event_category: el.dataset.trackCategory || "click",
        event_label: el.dataset.trackLabel || el.textContent.trim(),
        link_url: el.getAttribute("href") || "",
        cta_location: el.dataset.ctaLocation || "",
        destination_page: el.dataset.destinationPage || ""
      });
    });
  });
}

function setupOutboundTracking() {
  document.querySelectorAll('a[href^="http"]').forEach(function (link) {
    if (link.dataset.outboundBound === "true") return;
    link.dataset.outboundBound = "true";

    link.addEventListener("click", function () {
      const url = new URL(link.href);
      if (url.hostname === window.location.hostname) return;

      trackEvent("outbound_link_click", {
        event_category: "outbound",
        event_label: link.textContent.trim(),
        link_url: link.href
      });
    });
  });
}

function setupScrollDepthTracking() {
  const milestones = [25, 50, 75, 90];
  const fired = {};

  function onScroll() {
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop;
    const scrollHeight = doc.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;

    const percent = Math.round((scrollTop / scrollHeight) * 100);

    milestones.forEach(function (milestone) {
      if (percent >= milestone && !fired[milestone]) {
        fired[milestone] = true;
        trackEvent("scroll_depth", {
          event_category: "engagement",
          scroll_percent: milestone
        });
      }
    });

    if (fired[90]) {
      window.removeEventListener("scroll", throttledScroll);
    }
  }

  const throttledScroll = throttle(onScroll, 400);
  window.addEventListener("scroll", throttledScroll, { passive: true });
}

function setupFormTracking() {
  document.querySelectorAll("form").forEach(function (form) {
    if (form.dataset.formTrackingBound === "true") return;
    form.dataset.formTrackingBound = "true";

    const formName = form.dataset.formName || form.getAttribute("name") || form.id || "unnamed_form";

    form.addEventListener("focusin", function () {
      if (form.dataset.formStarted === "true") return;
      form.dataset.formStarted = "true";

      trackEvent("form_start", {
        event_category: "form",
        form_name: formName
      });
    });

    form.addEventListener("submit", function () {
      const invalidFields = Array.from(form.querySelectorAll(":invalid"));

      if (invalidFields.length) {
        trackEvent("form_validation_error", {
          event_category: "form",
          form_name: formName,
          invalid_field_count: invalidFields.length,
          invalid_fields: invalidFields.map(function (field) {
            return field.name || field.id || field.type || "unknown_field";
          }).join(",")
        });
        return;
      }

      trackEvent("form_submit_attempt", {
        event_category: "form",
        form_name: formName
      });
    });
  });
}

function setupFaqTracking() {
  const faqItems = document.querySelectorAll(".faq-item, details");
  if (!faqItems.length) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;

      const item = entry.target;
      if (item.dataset.faqViewed === "true") return;
      item.dataset.faqViewed = "true";

      const question = item.querySelector("h3, summary")?.textContent?.trim() || "FAQ item";

      trackEvent("faq_view", {
        event_category: "engagement",
        faq_question: question
      });

      observer.unobserve(item);
    });
  }, { threshold: 0.5 });

  faqItems.forEach(function (item) {
    observer.observe(item);
  });
}

function throttle(callback, wait) {
  let timeout = null;
  let previous = 0;

  return function () {
    const now = Date.now();
    const remaining = wait - (now - previous);
    const context = this;
    const args = arguments;

    if (remaining <= 0) {
      clearTimeout(timeout);
      timeout = null;
      previous = now;
      callback.apply(context, args);
    } else if (!timeout) {
      timeout = setTimeout(function () {
        previous = Date.now();
        timeout = null;
        callback.apply(context, args);
      }, remaining);
    }
  };
}
