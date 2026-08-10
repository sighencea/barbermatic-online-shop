/* Barbermatic — public Shopify configuration (NON-SECRET).
 *
 * Safe to commit. Contains no credentials. The Storefront API token is NEVER
 * placed here or anywhere in the browser bundle — it lives only as a GitHub
 * Actions secret and is used at build time (see scripts/build-catalog.mjs).
 *
 * Product inclusion is decided at BUILD time (Vendor == "Barbermatic" AND a
 * valid `category:<slug>` tag — see scripts/build-catalog.mjs), NOT here. This
 * file only carries the public checkout domain + currency.
 *
 * Until `shopDomain` is set and products carry a real `variantId`, checkout is
 * disabled and the storefront runs on the seeded data/products.json.
 */
window.BARBERMATIC_CONFIG = {
  /* Your Shopify domain, e.g. "drksoap.myshopify.com" (or a custom checkout
     domain). Leave "" to disable checkout. Cart permalinks are built from this. */
  shopDomain: "drksoap.myshopify.com",

  currency: "EUR"
};
