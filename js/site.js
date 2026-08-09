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

  document.addEventListener("DOMContentLoaded", function () {
    Bag.renderBadge();
    // Newsletter forms are decorative placeholders until a provider is wired up.
    document.querySelectorAll("[data-newsletter]").forEach(function (form) {
      form.addEventListener("submit", function (e) { e.preventDefault(); });
    });
  });

  global.Bag = Bag;
})(window);
