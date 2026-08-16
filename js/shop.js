/* Barbermatic — shop / category listing.
 * Renders the product grid from data/products.json, filtered by ?category=.
 * No category => "Discover All". Unknown category => graceful empty state.
 */
(function () {
  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function getCategory() {
    return new URLSearchParams(location.search).get("category") || "";
  }

  function productCard(p) {
    var a = el("a", "card");
    a.href = "product.html?slug=" + encodeURIComponent(p.slug);

    var media = el("div", "card__media");
    if (p.images && p.images[0]) {
      var im = el("img"); im.src = p.images[0].src; im.alt = p.images[0].alt || p.title;
      media.appendChild(im);
    } else {
      media.appendChild(el("div", "ph", (p.placeholders && p.placeholders[0]) || (p.material.toLowerCase() + " photo")));
    }
    a.appendChild(media);

    var body = el("div", "card__body");
    body.appendChild(el("div", "card__material", p.material));
    body.appendChild(el("div", "card__type", p.type));
    body.appendChild(el("div", "card__price", p.price));

    var meta = el("div", "card__meta");
    if (p.knot) {
      meta.appendChild(el("span", null, p.knot));
      meta.appendChild(el("span", "dot"));
    }
    var avail;
    if (window.Catalog.isKit(p)) {
      var opts = window.Catalog.sellableOptions(p).length;
      avail = opts > 0 ? opts + " option" + (opts === 1 ? "" : "s") + " available" : "sold";
    } else {
      avail = p.available > 0 ? p.available + " available" : "sold";
    }
    meta.appendChild(el("span", null, avail));
    body.appendChild(meta);

    a.appendChild(body);
    return a;
  }

  function renderEmpty(root, label) {
    root.innerHTML = "";
    var box = el("div", "shop-empty");
    box.appendChild(el("p", null,
      "New " + (label ? label.toLowerCase() : "pieces") +
      " are being finished in the County Cork workshop. Every piece is one of one. Check back soon."));
    var back = el("a", "btn btn--ghost");
    back.href = "shop.html";
    back.textContent = "DISCOVER ALL";
    box.appendChild(back);
    root.appendChild(box);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var slug = getCategory();
    var label = slug ? window.Catalog.categoryLabel(slug) : null;

    var titleEl = $("[data-shop-title]");
    var eyebrowEl = $("[data-shop-eyebrow]");
    var countEl = $("[data-shop-count]");
    var root = $("[data-shop-root]");

    // Heading reflects the category (or "All Pieces").
    var heading = slug ? (label || "Shop") : "All Pieces";
    document.title = "Barbermatic · " + heading;
    titleEl.textContent = heading;
    eyebrowEl.textContent = slug ? "THE COLLECTION" : "DISCOVER ALL";

    window.Catalog.byCategory(slug).then(function (products) {
      countEl.textContent = products.length
        ? products.length + (products.length === 1 ? " piece" : " pieces")
        : "";

      if (!products.length) { renderEmpty(root, label); return; }

      var grid = el("div", "shop-grid");
      products.forEach(function (p) { grid.appendChild(productCard(p)); });
      root.innerHTML = "";
      root.appendChild(grid);
    }).catch(function (err) {
      console.error(err);
      root.innerHTML = "<p class='shop-empty'>Something went wrong loading the collection.</p>";
    });
  });
})();
