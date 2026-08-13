/* Barbermatic — shared site behavior: the bag (localStorage) + header badge.
 * The bag stores only product selections (slug, variantId, qty) — never secrets.
 * One-of-one pieces are capped at qty 1 and deduped by slug.
 */
(function (global) {
  var KEY = "bm_cart";

  var Bag = {
    read() {
      try { return JSON.parse(localStorage.getItem(KEY)) || []; }
      catch (e) { return []; }
    },
    write(items) {
      localStorage.setItem(KEY, JSON.stringify(items));
      this.renderBadge();
    },
    count() {
      return this.read().reduce(function (n, i) { return n + (i.qty || 1); }, 0);
    },
    has(slug) {
      return this.read().some(function (i) { return i.slug === slug; });
    },
    /* Adds a one-of-one piece. No-op if already present (hard cap of 1). */
    add(item) {
      var items = this.read();
      if (items.some(function (i) { return i.slug === item.slug; })) return false;
      items.push({ slug: item.slug, variantId: item.variantId || "", qty: 1 });
      this.write(items);
      return true;
    },
    remove(slug) {
      this.write(this.read().filter(function (i) { return i.slug !== slug; }));
    },
    clear() { this.write([]); },
    renderBadge() {
      var badges = document.querySelectorAll("[data-bag-badge]");
      var c = this.count();
      badges.forEach(function (b) { b.textContent = String(c); });
    }
  };

  // The header/footer are injected asynchronously by js/include.js, so bind on
  // both DOMContentLoaded and the "includes:loaded" event it dispatches.
  // Mobile nav drawer. The header is injected async, so bind here (initChrome
  // runs on both DOMContentLoaded and includes:loaded). Idempotent via
  // dataset.bound on the toggle.
  function initMobileNav() {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector(".nav-toggle");
    if (!header || !toggle || toggle.dataset.bound) return;
    toggle.dataset.bound = "1";
    var nav = document.getElementById("mainNav");

    function setOpen(open) {
      header.classList.toggle("nav-open", open);
      document.body.classList.toggle("nav-locked", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    toggle.addEventListener("click", function () {
      setOpen(!header.classList.contains("nav-open"));
    });
    // Close after a link tap, on Escape, or when resizing back up to desktop.
    if (nav) {
      nav.addEventListener("click", function (e) {
        if (e.target.closest("a")) setOpen(false);
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1100) setOpen(false);
    });
  }

  function initChrome() {
    Bag.renderBadge();
    initMobileNav();
    // Newsletter forms are decorative placeholders until a provider is wired up.
    document.querySelectorAll("[data-newsletter]").forEach(function (form) {
      if (form.dataset.bound) return;
      form.dataset.bound = "1";
      form.addEventListener("submit", function (e) { e.preventDefault(); });
    });
    // Contact form: until the Formspree endpoint is set, intercept the submit
    // and reveal the fallback note instead of posting to the placeholder URL.
    document.querySelectorAll("[data-contact]").forEach(function (form) {
      if (form.dataset.bound) return;
      form.dataset.bound = "1";
      if ((form.getAttribute("action") || "").indexOf("your-form-id") !== -1) {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var note = form.querySelector("[data-contact-note]");
          if (note) note.hidden = false;
        });
      }
    });
  }
  // Cookie notice. This site sets no non-essential cookies of its own (the bag
  // uses functional localStorage), so this is an informational, dismissible
  // notice — not a consent gate. Dismissal is remembered in localStorage.
  function initCookieNotice() {
    try { if (localStorage.getItem("bm_cookie_ack")) return; } catch (e) { return; }
    if (document.querySelector(".cookie-notice")) return;
    var wrap = document.createElement("div");
    wrap.className = "cookie-notice";
    wrap.setAttribute("role", "region");
    wrap.setAttribute("aria-label", "Cookie notice");
    var p = document.createElement("p");
    p.innerHTML = 'We use essential cookies and local storage to run the shop and remember your bag, nothing for tracking or advertising. See our <a href="privacy-policy.html">Privacy Policy</a>.';
    var btn = document.createElement("button");
    btn.className = "btn btn--solid";
    btn.type = "button";
    btn.textContent = "GOT IT";
    btn.addEventListener("click", function () {
      try { localStorage.setItem("bm_cookie_ack", "1"); } catch (e) {}
      wrap.remove();
    });
    wrap.appendChild(p);
    wrap.appendChild(btn);
    document.body.appendChild(wrap);
  }

  document.addEventListener("DOMContentLoaded", initChrome);
  document.addEventListener("includes:loaded", initChrome);
  document.addEventListener("DOMContentLoaded", initCookieNotice);

  global.Bag = Bag;
})(window);
