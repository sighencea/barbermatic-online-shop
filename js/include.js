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

  async function boot() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-include]"));
    await Promise.all(nodes.map(loadInclude));
    fillYear(document);
    document.dispatchEvent(new Event("includes:loaded"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
