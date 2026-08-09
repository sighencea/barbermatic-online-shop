/* Barbermatic — product detail page.
 * Client-renders a product from data/products.json by ?slug=. At the
 * API-connection stage the build can additionally emit a static per-slug page
 * for maximum SEO; this same logic still drives gallery/accordion interaction.
 */
(function () {
  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function getSlug() {
    return new URLSearchParams(location.search).get("slug");
  }

  var state = { activeThumb: 0 };

  function buildThumbs(product) {
    var thumbs = [];
    (product.images || []).forEach(function (img) {
      thumbs.push({ img: img.src, label: img.alt || product.title });
    });
    (product.placeholders || []).forEach(function (label) {
      thumbs.push({ label: label });
    });
    if (!thumbs.length) thumbs.push({ label: product.title });
    return thumbs;
  }

  function renderStage(product, thumbs) {
    var stage = $("[data-stage]");
    // Remove any previously rendered media (keep the zoom button).
    stage.querySelectorAll("[data-stage-media]").forEach(function (n) { n.remove(); });
    var t = thumbs[state.activeThumb] || thumbs[0];
    var media;
    if (t.img) {
      media = el("img");
      media.src = t.img;
      media.alt = t.label;
    } else {
      media = el("div", "ph ph--warm2", t.label + " photo");
    }
    media.setAttribute("data-stage-media", "");
    stage.insertBefore(media, stage.firstChild);
  }

  function renderThumbRail(product, thumbs) {
    var rail = $("[data-thumb-rail]");
    rail.innerHTML = "";
    thumbs.forEach(function (t, i) {
      var btn = el("button", "thumb" + (i === state.activeThumb ? " is-active" : ""));
      btn.type = "button";
      btn.setAttribute("aria-label", "View " + t.label);
      if (t.img) {
        var im = el("img"); im.src = t.img; im.alt = t.label; btn.appendChild(im);
      } else {
        btn.appendChild(el("div", "ph", t.label));
      }
      btn.addEventListener("click", function () {
        state.activeThumb = i;
        renderThumbRail(product, thumbs);
        renderStage(product, thumbs);
      });
      rail.appendChild(btn);
    });
  }

  function renderInfo(product) {
    var info = $("[data-info]");
    info.innerHTML = "";
    var soldOut = !(product.available > 0);

    info.appendChild(el("div", "eyebrow", soldOut ? "SOLD" : "ONE OF ONE"));
    var h1 = el("h1", "pdp__title", product.title);
    info.appendChild(h1);
    info.appendChild(el("div", "pdp__price", product.price));
    info.appendChild(el("p", "pdp__desc", product.description || ""));

    // Traits
    var traits = el("div", "traits");
    (product.traits || []).forEach(function (tr) {
      var t = el("div", "trait");
      t.appendChild(el("div", "trait__glyph", tr.glyph));
      var body = el("div");
      body.appendChild(el("div", "trait__title", tr.title));
      body.appendChild(el("div", "trait__body", tr.body));
      t.appendChild(body);
      traits.appendChild(t);
    });
    info.appendChild(traits);

    // Availability
    var avail = el("div", "availability" + (soldOut ? " is-sold" : ""));
    avail.appendChild(el("span", "dot"));
    avail.appendChild(document.createTextNode(soldOut ? "This piece has found its owner" : "Only 1 available"));
    info.appendChild(avail);

    // CTA row
    var row = el("div", "cta-row");
    var cta = el("button", "btn btn--solid");
    cta.type = "button";
    var wish = el("button", "wishlist-btn", "⌗");
    wish.type = "button";
    wish.setAttribute("aria-label", "Add to wishlist");

    var purchasable = window.Catalog.isPurchasable(product);
    var inBag = window.Bag.has(product.slug);

    function paintCta() {
      inBag = window.Bag.has(product.slug);
      if (soldOut) {
        cta.textContent = "SOLD OUT"; cta.disabled = true; cta.classList.add("is-sold");
      } else if (!purchasable) {
        cta.textContent = "CHECKOUT COMING SOON"; cta.disabled = true; cta.classList.add("is-sold");
      } else if (inBag) {
        cta.textContent = "IN YOUR BAG"; cta.disabled = true;
      } else {
        cta.textContent = "ADD TO BAG"; cta.disabled = false; cta.classList.remove("is-sold");
      }
    }
    paintCta();

    cta.addEventListener("click", function () {
      if (soldOut || !purchasable) return;
      var added = window.Bag.add({ slug: product.slug, variantId: product.variantId });
      if (added) paintCta();
    });

    row.appendChild(cta);
    row.appendChild(wish);
    info.appendChild(row);

    // Reassurance
    var re = el("div", "reassure");
    re.appendChild(el("span", "key", "⚿"));
    re.appendChild(document.createTextNode(" Secure checkout "));
    re.appendChild(el("span", "sep", "•"));
    re.appendChild(document.createTextNode(" Worldwide Shipping"));
    info.appendChild(re);

    // Accordions
    var acc = el("div", "accordions");
    (product.accordions || []).forEach(function (a) {
      var wrap = el("div", "accordion");
      var btn = el("button", "accordion__btn");
      btn.type = "button";
      btn.appendChild(document.createTextNode(a.title));
      var chev = el("span", "accordion__chevron", "⌄");
      btn.appendChild(chev);
      var panel = el("div", "accordion__panel", a.body);
      panel.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      btn.addEventListener("click", function () {
        var open = panel.hidden;
        panel.hidden = !open;
        chev.textContent = open ? "⌃" : "⌄";
        btn.setAttribute("aria-expanded", String(open));
      });
      wrap.appendChild(btn);
      wrap.appendChild(panel);
      acc.appendChild(wrap);
    });
    info.appendChild(acc);
  }

  function renderRelated(product, all) {
    var grid = $("[data-related]");
    if (!grid) return;
    grid.innerHTML = "";
    all.filter(function (p) { return p.slug !== product.slug; })
      .slice(0, 4)
      .forEach(function (p) {
        var a = el("a", "card");
        a.href = "product.html?slug=" + encodeURIComponent(p.slug);
        var media = el("div", "related-card__media");
        if (p.images && p.images[0]) {
          var im = el("img"); im.src = p.images[0].src; im.alt = p.images[0].alt || p.title;
          media.appendChild(im);
        } else {
          media.appendChild(el("div", "ph", (p.placeholders && p.placeholders[0]) || (p.material.toLowerCase() + " photo")));
        }
        a.appendChild(media);
        var body = el("div", "related-card__body");
        var name = el("div", "related-card__name");
        name.appendChild(document.createTextNode(p.title));
        name.appendChild(el("br"));
        name.appendChild(el("span", null, p.knotSpec || p.knot));
        body.appendChild(name);
        var r = el("div", "related-card__row");
        r.appendChild(el("span", "related-card__price", p.price));
        r.appendChild(el("span", "related-card__status", p.oneOfOne ? "ONE OF ONE" : "1 AVAILABLE"));
        body.appendChild(r);
        a.appendChild(body);
        grid.appendChild(a);
      });
  }

  function renderNotFound() {
    var main = $("[data-pdp]");
    main.innerHTML = "";
    var box = el("div");
    box.style.gridColumn = "1 / -1";
    box.style.padding = "40px 0 80px";
    box.appendChild(el("h1", "pdp__title", "Piece not found"));
    var p = el("p", "pdp__desc", "We couldn't find that piece. It may have found its owner.");
    box.appendChild(p);
    var back = el("a", "link-accent", "← Back to shop");
    back.href = "index.html#brushes";
    box.appendChild(back);
    main.appendChild(box);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var slug = getSlug();
    window.Catalog.all().then(function (all) {
      var product = all.find(function (p) { return p.slug === slug; }) || all[0];
      if (!product) { renderNotFound(); return; }

      document.title = "Barbermatic · " + product.title;
      var metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && product.description) metaDesc.setAttribute("content", product.description);

      // Highlight this product's category in the main menu.
      if (window.setActiveNavCategory) window.setActiveNavCategory(product.category);

      var thumbs = buildThumbs(product);
      state.activeThumb = 0;
      renderThumbRail(product, thumbs);
      renderStage(product, thumbs);
      renderInfo(product);
      renderRelated(product, all);
    }).catch(function (err) {
      console.error(err);
      renderNotFound();
    });
  });
})();
