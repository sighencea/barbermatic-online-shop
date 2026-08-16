/* Barbermatic — catalog + checkout layer.
 * Reads the prerendered data/products.json. At the API-connection stage this
 * same JSON is regenerated in CI from Shopify; the shape does not change, so
 * nothing here needs to change.
 */
(function (global) {
  var CONFIG = global.BARBERMATIC_CONFIG || {};
  var _cache = null;

  function basePath() {
    // Resolve data/ relative to the site root regardless of page depth.
    var path = global.location.pathname;
    // Pages live at root (index.html, product.html) so root is "".
    return "";
  }

  var Catalog = {
    async load() {
      if (_cache) return _cache;
      var res = await fetch(basePath() + "data/products.json", { cache: "no-cache" });
      if (!res.ok) throw new Error("Failed to load catalog: " + res.status);
      var data = await res.json();
      _cache = data;
      return data;
    },

    async all() {
      var data = await this.load();
      return data.products || [];
    },

    async get(slug) {
      var products = await this.all();
      return products.find(function (p) { return p.slug === slug; }) || null;
    },

    /* True once the store is connected: a domain exists and the product has a
       real Shopify variant id. Until then, Add to Bag is disabled. */
    isPurchasable(product) {
      return !!(CONFIG.shopDomain && product && product.variantId);
    },

    /* "Kit" product: one physical piece sold as several Shopify variants
       (e.g. Handle Only / Synthetic Knot / Silvertip Knot). The PDP renders
       these as option chips and the bag allows only one option per piece. */
    isKit(product) {
      return !!(product && product.kit && product.variants && product.variants.length > 1);
    },

    /* Kit options a customer can still buy. */
    sellableOptions(product) {
      if (!this.isKit(product)) return [];
      return product.variants.filter(function (v) { return v.availableForSale && v.available > 0; });
    },

    findVariant(product, variantId) {
      if (!product || !product.variants) return null;
      return product.variants.find(function (v) { return String(v.id) === String(variantId); }) || null;
    },

    /* Build a Shopify cart permalink -> lands directly on Shopify's hosted
       checkout. No token, no server. lines: [{ variantId, qty }].
       Returns null if the store isn't connected yet. */
    checkoutUrl(lines) {
      if (!CONFIG.shopDomain) return null;
      var parts = (lines || [])
        .filter(function (l) { return l && l.variantId; })
        .map(function (l) { return l.variantId + ":" + (l.qty || 1); });
      if (!parts.length) return null;
      return "https://" + CONFIG.shopDomain + "/cart/" + parts.join(",");
    }
  };

  /* Category pages. `slug` matches the product `category` field (from the
     Shopify `category:*` tag). Order here is the nav order. */
  Catalog.CATEGORIES = [
    { slug: "shaving-brushes", label: "Shaving Brushes" },
    { slug: "razors", label: "Razors" },
    { slug: "writing-instruments", label: "Writing Instruments" },
    { slug: "edc", label: "Everyday Carry" },
    { slug: "accessories", label: "Accessories" }
  ];

  Catalog.categoryLabel = function (slug) {
    var c = Catalog.CATEGORIES.find(function (c) { return c.slug === slug; });
    return c ? c.label : null;
  };

  Catalog.byCategory = async function (slug) {
    var products = await Catalog.all();
    if (!slug) return products;
    return products.filter(function (p) { return p.category === slug; });
  };

  global.Catalog = Catalog;
})(window);
