/* Barbermatic — bag / cart page.
 * Resolves stored selections against the catalog, renders lines, and builds a
 * Shopify cart permalink for checkout. Until the store is connected, checkout
 * is disabled with an explanatory note.
 */
(function () {
  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function money(amount, currency) {
    var sym = currency === "EUR" ? "€" : "";
    return sym + Number(amount || 0).toFixed(2);
  }

  function renderEmpty(root) {
    root.innerHTML = "";
    var box = el("div", "cart-empty");
    box.appendChild(el("p", "page__lead", "Your bag is empty. Every piece is one-of-one — when one speaks to you, it is yours alone."));
    var back = el("a", "btn btn--ghost");
    back.href = "index.html#brushes";
    back.textContent = "DISCOVER THE COLLECTION";
    box.appendChild(back);
    root.appendChild(box);
  }

  function render(root, lines, all) {
    root.innerHTML = "";

    var list = el("div", "cart-list");
    var total = 0;
    var currency = "EUR";

    lines.forEach(function (line) {
      var product = all.find(function (p) { return p.slug === line.slug; });
      if (!product) return;
      total += product.priceAmount || 0;
      currency = product.currency || currency;

      var row = el("div", "cart-line");
      var media = el("div", "cart-line__media");
      if (product.images && product.images[0]) {
        var im = el("img"); im.src = product.images[0].src; im.alt = product.images[0].alt || product.title;
        media.appendChild(im);
      } else {
        media.appendChild(el("div", "ph", (product.placeholders && product.placeholders[0]) || "photo"));
      }
      row.appendChild(media);

      var mid = el("div");
      var nameLink = el("a", "cart-line__name", product.title);
      nameLink.href = "product.html?slug=" + encodeURIComponent(product.slug);
      mid.appendChild(nameLink);
      mid.appendChild(el("div", "cart-line__type", product.type + " · One-of-one"));
      var remove = el("button", "cart-line__remove", "Remove");
      remove.type = "button";
      remove.addEventListener("click", function () {
        window.Bag.remove(product.slug);
        boot();
      });
      mid.appendChild(remove);
      row.appendChild(mid);

      row.appendChild(el("div", "cart-line__price", money(product.priceAmount, currency)));
      list.appendChild(row);
    });

    root.appendChild(list);

    var summary = el("div", "cart-summary");
    summary.appendChild(el("span", null, "Subtotal"));
    summary.appendChild(el("span", "cart-summary__total", money(total, currency)));
    root.appendChild(summary);

    // Checkout
    var checkoutLines = lines.map(function (l) { return { variantId: l.variantId, qty: 1 }; });
    var url = window.Catalog.checkoutUrl(checkoutLines);

    var cta = el("button", "btn btn--solid", "PROCEED TO CHECKOUT");
    cta.type = "button";
    cta.style.width = "100%";
    if (url) {
      cta.addEventListener("click", function () { window.location.href = url; });
    } else {
      cta.disabled = true;
      cta.classList.add("is-sold");
      cta.textContent = "CHECKOUT COMING SOON";
    }
    root.appendChild(cta);

    if (!url) {
      var note = el("p", "reassure", null);
      note.style.marginTop = "16px";
      note.textContent = "Secure Shopify checkout will be enabled once the store is connected.";
      root.appendChild(note);
    } else {
      var re = el("div", "reassure");
      re.style.marginTop = "16px";
      re.appendChild(el("span", "key", "⚿"));
      re.appendChild(document.createTextNode(" Secure Shopify checkout "));
      re.appendChild(el("span", "sep", "•"));
      re.appendChild(document.createTextNode(" Worldwide Shipping"));
      root.appendChild(re);
    }
  }

  function boot() {
    var root = $("[data-cart-root]");
    var lines = window.Bag.read();
    if (!lines.length) { renderEmpty(root); return; }
    window.Catalog.all().then(function (all) {
      // Drop any stored line whose product no longer exists in the catalog.
      var valid = lines.filter(function (l) { return all.some(function (p) { return p.slug === l.slug; }); });
      if (valid.length !== lines.length) window.Bag.write(valid);
      if (!valid.length) { renderEmpty(root); return; }
      render(root, valid, all);
    }).catch(function (err) {
      console.error(err);
      root.innerHTML = "<p class='page__lead'>Something went wrong loading your bag.</p>";
    });
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
