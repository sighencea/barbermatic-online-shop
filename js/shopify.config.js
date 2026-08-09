/* Barbermatic — public Shopify configuration (NON-SECRET).
 *
 * Safe to commit. Contains no credentials. The Storefront API token is NEVER
 * placed here or anywhere in the browser bundle — it lives only as a GitHub
 * Actions secret and is used at build time (see scripts/build-catalog.mjs).
 *
 * Until `shopDomain` is set and products carry a real `variantId`, checkout is
 * disabled and the storefront runs on the seeded data/products.json.
 */
window.BARBERMATIC_CONFIG = {
  /* Your Shopify domain, e.g. "barbermatic.myshopify.com" (or a custom checkout
     domain). Leave "" until the store is connected. Checkout permalinks are
     built from this. */
  shopDomain: "",

  /* Only products carrying this Shopify tag AND published to the dedicated sales
     channel are pulled by the build. Two-key, default-deny. */
  productTag: "barbermatic",

  currency: "EUR"
};
