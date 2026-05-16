/*
  Get Real Therapy - Global Form Handler

  IMPORTANT:
  Google Apps Script often writes the sheet successfully but blocks readable CORS responses.
  This file sends as text/plain JSON and uses no-cors mode.
  The Apps Script parses the JSON, verifies Turnstile, writes the sheet, and sends emails.
*/

(function () {
  "use strict";

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name) || "";
  }

  function getLandingPage() {
    try {
      const key = "grt_landing_page";
      const existing = sessionStorage.getItem(key);
      if (existing) return existing;
      sessionStorage.setItem(key, window.location.href);
      return window.location.href;
    } catch (error) {
      return window.location.href;
    }
  }

  function capitalizeName(value) {
    return String(value || "")
      .trimStart()
      .replace(/\s+/g, " ")
      .replace(/(^|[\s'-])([a-zA-Z])/g, function (match, prefix, letter) {
        return prefix + letter.toUpperCase();
      });
  }

  function formatPhone(value) {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 10);
    if (digits.length === 0) return "";
    if (digits.length < 4) return "(" + digits;
    if (digits.length < 7) return "(" + digits.slice(0, 3) + ") " + digits.slice(3);
    return "(" + digits.slice(0, 3) + ") " + digits.slice(3, 6) + "-" + digits.slice(6);
  }

  function getTurnstileToken(form) {
    const tokenField = form.querySelector('[name="cf-turnstile-response"]');
    return tokenField ? tokenField.value : "";
  }

  function setStatus(statusNode, message, type) {
    if (!statusNode) return;

    statusNode.textContent = message;

    if (type === "success") {
      statusNode.className = "field-success";
    } else if (type === "info") {
      statusNode.className = "field-info";
    } else {
      statusNode.className = "field-error";
    }
  }

  function buildPayload(form) {
    const formData = new FormData(form);
    const payload = {};

    formData.forEach(function (value, key) {
      payload[key] = value;
    });

    payload.form_name = form.dataset.formName || form.getAttribute("name") || "";
    payload.page_url = window.location.href;
    payload.page_slug = window.location.pathname;
    payload.page_type = document.body.dataset.pageType || "";
    payload.primary_goal = document.body.dataset.primaryGoal || "";
    payload.utm_source = getQueryParam("utm_source");
    payload.utm_medium = getQueryParam("utm_medium");
    payload.utm_campaign = getQueryParam("utm_campaign");
    payload.utm_term = getQueryParam("utm_term");
    payload.utm_content = getQueryParam("utm_content");
    payload.referrer = document.referrer || "";
    payload.landing_page = getLandingPage();
    payload.user_agent = navigator.userAgent || "";

    return payload;
  }

  function setupNameFormatting(form) {
    const fields = form.querySelectorAll('input[name="first_name"], input[name="last_name"]');

    fields.forEach(function (input) {
      input.addEventListener("blur", function () {
        input.value = capitalizeName(input.value);
      });
      input.addEventListener("change", function () {
        input.value = capitalizeName(input.value);
      });
    });
  }

  function setupPhoneFormatting(form) {
    const phone = form.querySelector('input[name="phone"]');
    if (!phone) return;

    phone.required = true;
    phone.pattern = "\\(\\d{3}\\) \\d{3}-\\d{4}";
    phone.title = "Please enter a 10-digit phone number.";
    phone.setAttribute("inputmode", "tel");
    phone.setAttribute("autocomplete", "tel");
    phone.setAttribute("maxlength", "14");
    phone.setAttribute("placeholder", "(555) 555-5555");

    phone.addEventListener("input", function () {
      phone.value = formatPhone(phone.value);
    });

    phone.addEventListener("blur", function () {
      phone.value = formatPhone(phone.value);
    });
  }

  function setupRequiredFields(form) {
    const preferredContact =
      form.querySelector('select[name="preferred_contact_method"]') ||
      form.querySelector('select[name="contact_method"]');

    if (preferredContact) {
      preferredContact.required = true;
    }
  }

  function setupForm(form) {
    const endpoint = form.dataset.endpoint;
    const statusNode = document.getElementById(form.dataset.statusTarget || "");
    if (!endpoint) return;

    setupNameFormatting(form);
    setupPhoneFormatting(form);
    setupRequiredFields(form);

    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton && !submitButton.dataset.originalText) {
      submitButton.dataset.originalText = submitButton.textContent;
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const firstName = form.querySelector('input[name="first_name"]');
      const lastName = form.querySelector('input[name="last_name"]');
      const phone = form.querySelector('input[name="phone"]');

      if (firstName) firstName.value = capitalizeName(firstName.value);
      if (lastName) lastName.value = capitalizeName(lastName.value);
      if (phone) phone.value = formatPhone(phone.value);

      if (!form.checkValidity()) {
        form.reportValidity();
        setStatus(statusNode, "Please complete the required fields.", "error");
        return;
      }

      if (!getTurnstileToken(form)) {
        setStatus(statusNode, "Please complete the verification before submitting.", "error");
        return;
      }

      const originalText = submitButton ? submitButton.dataset.originalText : "";

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
      }

      setStatus(statusNode, "Sending your message...", "info");

      try {
        await fetch(endpoint, {
          method: "POST",
          mode: "no-cors",
          body: JSON.stringify(buildPayload(form)),
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          }
        });

        setStatus(statusNode, "Thank you. Your message was received.", "success");

        if (window.gtag) {
          window.gtag("event", "form_submit_success", {
            form_name: form.dataset.formName || "",
            page_slug: window.location.pathname
          });
        }

        form.reset();

        if (window.turnstile) {
          window.turnstile.reset();
        }
      } catch (error) {
        setStatus(statusNode, "Something went wrong. Please refresh and try again.", "error");

        if (window.gtag) {
          window.gtag("event", "form_submit_error", {
            form_name: form.dataset.formName || "",
            error_message: String(error.message || error),
            page_slug: window.location.pathname
          });
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText || "Submit";
        }
      }
    });
  }

  ready(function () {
    document.querySelectorAll("form[data-endpoint]").forEach(setupForm);
  });
})();
