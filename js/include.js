/* Barbermatic — client-side HTML partial includes.
 * Static, no build step: each page drops a placeholder
 *   <div data-include="partials/header.html"></div>
 * and this loader fetches the file and swaps it in.
 *
 * NOTE: uses fetch(), so it does NOT work over file:// — serve over http(s)
 * (locally: `python -m http.server`; in production GitHub Pages is fine).
 *
 * After all includes are in the DOM it fills [data-year] with the current year
 * and dispatches a bubbling "includes:loaded" event so other scripts (e.g.
 * js/site.js) can bind to markup that was injected rather than in the page.
 */
(function () {
  async function loadInclude(el) {
    var url = el.getAttribute("data-include");
    if (!url) return;
    try {
      var res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error(res.status + " " + res.statusText);
      var tpl = document.createElement("template");
      tpl.innerHTML = (await res.text()).trim();
      el.replaceWith(tpl.content);
    } catch (e) {
      console.error("[include] failed to load " + url + ":", e);
    }
  }

  function fillYear(root) {
    var y = String(new Date().getFullYear());
    (root || document).querySelectorAll("[data-year]").forEach(function (n) {
      n.textContent = y;
    });
  }

  // A page (e.g. a product detail) can hint which category is active even
  // though its own URL isn't a category page. Set via setActiveNavCategory().
  var activeCategoryHint = null;

  // Mark the nav item matching the current page (+ ?category=), or the hinted
  // category. Safe to call repeatedly and before/after the header is injected.
  function markActiveNav() {
    var links = document.querySelectorAll(".main-nav a");
    if (!links.length) return;
    var curPage = location.pathname.split("/").pop() || "index.html";
    var curCat = new URLSearchParams(location.search).get("category") || "";
    links.forEach(function (a) {
      var tmp = document.createElement("a");
      tmp.href = a.getAttribute("href");
      var page = tmp.pathname.split("/").pop() || "index.html";
      var cat = new URLSearchParams(tmp.search).get("category") || "";
      var byLocation = page === curPage && cat === curCat;
      var byHint = activeCategoryHint && page === "shop.html" && cat === activeCategoryHint;
      if (byLocation || byHint) {
        a.classList.add("is-active");
        a.setAttribute("aria-current", "page");
      }
    });
  }

  // Called by product.js once it knows the product's category. Stores the hint
  // (so it applies even if the header loads later) and re-marks the nav.
  window.setActiveNavCategory = function (slug) {
    activeCategoryHint = slug || null;
    markActiveNav();
  };

  async function boot() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-include]"));
    await Promise.all(nodes.map(loadInclude));
    fillYear(document);
    markActiveNav();
    document.dispatchEvent(new Event("includes:loaded"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
