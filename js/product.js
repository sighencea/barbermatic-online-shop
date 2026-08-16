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

    // Kit products: one physical piece offered as several Shopify variants
    // (e.g. Handle Only / Synthetic Knot / Silvertip Knot). Rendered as option
    // chips; only one option of the piece may ever be in the bag.
    var kit = window.Catalog.isKit(product);
    var sellable = window.Catalog.sellableOptions(product);
    var selectedVariant = null; // kit: none until the customer picks a chip
    var soldOut = kit ? sellable.length === 0 : !(product.available > 0);

    info.appendChild(el("div", "eyebrow", soldOut ? "SOLD" : "ONE OF ONE"));
    var h1 = el("h1", "pdp__title", product.title);
    info.appendChild(h1);
    var priceEl = el("div", "pdp__price", product.price);
    info.appendChild(priceEl);
    info.appendChild(el("p", "pdp__desc", product.description || ""));

    // Option chips (kit products only)
    var chipEls = [];
    if (kit) {
      var optWrap = el("div", "pdp-options");
      optWrap.appendChild(el("div", "pdp-options__label", (product.optionName || "Option").toUpperCase()));
      var chipRow = el("div", "pdp-options__chips");
      product.variants.forEach(function (v) {
        var chip = el("button", "chip", v.title);
        chip.type = "button";
        var vSellable = v.availableForSale && v.available > 0;
        if (!vSellable) chip.classList.add("is-unavailable");
        chip.setAttribute("aria-pressed", "false");
        chip.addEventListener("click", function () {
          selectedVariant = v;
          chipEls.forEach(function (c) {
            var on = c.__variant === v;
            c.classList.toggle("is-selected", on);
            c.setAttribute("aria-pressed", on ? "true" : "false");
          });
          showNotice("");
          paintPrice();
          paintAvailability();
          paintCta();
        });
        chip.__variant = v;
        chipEls.push(chip);
        chipRow.appendChild(chip);
      });
      optWrap.appendChild(chipRow);
      info.appendChild(optWrap);
    }

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
    var availText = document.createTextNode("");
    avail.appendChild(el("span", "dot"));
    avail.appendChild(availText);
    info.appendChild(avail);

    function paintAvailability() {
      var sold, text;
      if (soldOut) { sold = true; text = "This piece has found its owner"; }
      else if (!kit) { sold = false; text = "Only 1 available"; }
      else if (!selectedVariant) {
        sold = false;
        text = sellable.length + " option" + (sellable.length === 1 ? "" : "s") + " available";
      }
      else if (selectedVariant.availableForSale && selectedVariant.available > 0) {
        sold = false; text = "Only 1 available";
      }
      else { sold = true; text = "This option has found its owner"; }
      avail.classList.toggle("is-sold", sold);
      availText.textContent = text;
    }

    function paintPrice() {
      var price = (kit && selectedVariant) ? selectedVariant.price : product.price;
      priceEl.textContent = price;
      priceEls.forEach(function (p) { p.textContent = price; });
    }

    // Notice line (Shopify-style cart messages). Painted into the info column
    // and mirrored inside the mobile sticky bar so it's visible either way.
    var notice = el("div", "pdp-notice");
    notice.hidden = true;
    info.appendChild(notice);
    var noticeEls = [notice];
    function showNotice(text, ok) {
      noticeEls.forEach(function (n) {
        n.textContent = text || "";
        n.hidden = !text;
        n.classList.toggle("is-ok", !!ok);
      });
    }

    // CTA row
    var row = el("div", "cta-row");
    var cta = el("button", "btn btn--solid");
    cta.type = "button";
    var wish = el("button", "wishlist-btn", "⌗");
    wish.type = "button";
    wish.setAttribute("aria-label", "Add to wishlist");

    var purchasable = window.Catalog.isPurchasable(product);
    var inBag = window.Bag.has(product.slug);

    // Every button that reflects bag state (the main CTA + the mobile sticky-bar
    // CTA) is painted together from one place, so they can never disagree.
    var ctas = [cta];
    var priceEls = [];
    function paintCta() {
      inBag = window.Bag.has(product.slug);
      var label, disabled, sold;
      if (soldOut) { label = "SOLD OUT"; disabled = true; sold = true; }
      else if (!purchasable) { label = "CHECKOUT COMING SOON"; disabled = true; sold = true; }
      else if (kit && !selectedVariant) { label = "MAKE A SELECTION"; disabled = true; sold = true; }
      // Kit CTA stays active even when the piece is in the bag — clicking again
      // surfaces the explanatory notice instead (mirrors Shopify's behavior).
      else if (kit) { label = "ADD TO BAG"; disabled = false; sold = false; }
      else if (inBag) { label = "IN YOUR BAG"; disabled = true; sold = false; }
      else { label = "ADD TO BAG"; disabled = false; sold = false; }
      ctas.forEach(function (b) {
        b.textContent = label;
        b.disabled = disabled;
        b.classList.toggle("is-sold", sold);
      });
    }

    function addToBag() {
      if (soldOut || !purchasable) return;

      if (!kit) {
        if (window.Bag.add({ slug: product.slug, variantId: product.variantId })) paintCta();
        return;
      }

      if (!selectedVariant) return;

      // One kit option per piece: the same handle can't be sold twice.
      var existing = window.Bag.read().find(function (l) { return l.slug === product.slug; });
      if (existing && String(existing.variantId) === String(selectedVariant.id)) {
        showNotice("The maximum quantity of this item is already in your cart.");
        return;
      }
      if (existing || !(selectedVariant.availableForSale && selectedVariant.available > 0)) {
        showNotice("The product '" + product.title + " - " + selectedVariant.title + "' is already sold out.");
        return;
      }
      if (window.Bag.add({ slug: product.slug, variantId: selectedVariant.id })) {
        showNotice("Added to your bag.", true);
        paintCta();
      }
    }
    cta.addEventListener("click", addToBag);

    row.appendChild(cta);
    row.appendChild(wish);
    info.appendChild(row);

    // Mobile-only sticky Add-to-Bag bar. Lives on <body> so it's fixed to the
    // viewport (not clipped by the PDP grid); CSS hides it entirely on desktop
    // and keeps it off-screen until the main CTA scrolls out of view.
    (function buildStickyBar() {
      var old = document.querySelector("[data-pdp-sticky]");
      if (old) old.remove();
      var bar = el("div", "pdp-sticky");
      bar.setAttribute("data-pdp-sticky", "");
      var bnotice = el("div", "pdp-notice pdp-sticky__notice");
      bnotice.hidden = true;
      noticeEls.push(bnotice);
      var binfo = el("div", "pdp-sticky__info");
      binfo.appendChild(el("div", "pdp-sticky__name", product.title));
      var bprice = el("div", "pdp-sticky__price", product.price);
      priceEls.push(bprice);
      binfo.appendChild(bprice);
      var bcta = el("button", "btn btn--solid pdp-sticky__cta");
      bcta.type = "button";
      bcta.addEventListener("click", addToBag);
      bar.appendChild(bnotice);
      bar.appendChild(binfo);
      bar.appendChild(bcta);
      document.body.appendChild(bar);
      ctas.push(bcta);

      // Reveal the bar only once the main CTA row has scrolled away.
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          bar.classList.toggle("is-visible", !entries[0].isIntersecting);
        }, { rootMargin: "0px 0px -20% 0px" }).observe(row);
      } else {
        bar.classList.add("is-visible");
      }
    })();

    paintAvailability();
    paintCta();

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
