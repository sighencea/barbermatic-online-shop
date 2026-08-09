/* Barbermatic — build-time catalog prerender.
 *
 * Runs in CI (GitHub Actions), NEVER in the browser. Fetches products tagged
 * `barbermatic` from the Shopify Storefront API using a token supplied as an
 * Actions secret, then:
 *   1. rewrites data/products.json
 *   2. regenerates the product grid inside index.html (between the BM:PRODUCTS
 *      markers)
 *
 * If no token is present (e.g. a contributor's fork, or before the store is
 * connected), it logs and exits 0 so the seeded data/products.json is kept and
 * the build still succeeds.
 *
 * Requires Node 18+ (global fetch).
 *
 * ---- Environment ---------------------------------------------------------
 *   SHOPIFY_STORE_DOMAIN     e.g. "barbermatic.myshopify.com"   (secret or var)
 *   SHOPIFY_STOREFRONT_TOKEN Storefront API access token         (SECRET)
 *   SHOPIFY_API_VERSION      e.g. "2025-01"          (optional, default below)
 *   PRODUCT_TAG              default "barbermatic"                (optional)
 *
 * ---- Shopify setup this expects ------------------------------------------
 *   - Products tagged with PRODUCT_TAG and published to the sales channel the
 *     Storefront token is scoped to (two-key, default-deny).
 *   - Long-form editorial stored as product metafields. Set the namespace/keys
 *     in METAFIELDS below to match what you create in Shopify.
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || "";
const TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN || "";
const API_VERSION = process.env.SHOPIFY_API_VERSION || "2025-01";
const TAG = process.env.PRODUCT_TAG || "barbermatic";

// Metafield identifiers to read for editorial copy. Adjust to match Shopify.
const METAFIELDS = [
  { namespace: "barbermatic", key: "knot_spec" },
  { namespace: "barbermatic", key: "traits" },      // JSON: [{glyph,title,body}]
  { namespace: "barbermatic", key: "accordions" },  // JSON: [{title,body}]
];

function numericVariantId(gid) {
  // "gid://shopify/ProductVariant/1234567890" -> "1234567890" (for cart permalinks)
  const m = String(gid || "").match(/(\d+)$/);
  return m ? m[1] : "";
}

const QUERY = `
query Products($query: String!, $mf: [HasMetafieldsIdentifier!]!) {
  products(first: 50, query: $query) {
    edges {
      node {
        handle
        title
        descriptionHtml
        description
        tags
        productType
        totalInventory
        priceRange { minVariantPrice { amount currencyCode } }
        images(first: 8) { edges { node { url altText } } }
        variants(first: 1) { edges { node { id availableForSale quantityAvailable } } }
        metafields(identifiers: $mf) { key namespace value type }
      }
    }
  }
}`;

async function fetchProducts() {
  const res = await fetch(`https://${DOMAIN}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { query: `tag:${TAG}`, mf: METAFIELDS },
    }),
  });
  if (!res.ok) throw new Error(`Shopify HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error("Shopify GraphQL errors: " + JSON.stringify(json.errors));
  return json.data.products.edges.map((e) => e.node);
}

function mfValue(node, key) {
  const mf = (node.metafields || []).find((m) => m && m.key === key);
  return mf ? mf.value : null;
}
function mfJson(node, key, fallback) {
  const v = mfValue(node, key);
  if (!v) return fallback;
  try { return JSON.parse(v); } catch { return fallback; }
}

function toCurrencySymbol(code) {
  return code === "EUR" ? "€" : code === "GBP" ? "£" : code === "USD" ? "$" : "";
}

function mapProduct(node) {
  const price = node.priceRange.minVariantPrice;
  const amount = Number(price.amount);
  const sym = toCurrencySymbol(price.currencyCode);
  const variant = node.variants.edges[0]?.node;
  const images = node.images.edges.map((e) => ({ src: e.node.url, alt: e.node.altText || node.title }));
  const knotSpec = mfValue(node, "knot_spec") || "";
  const available = node.totalInventory != null ? node.totalInventory : (variant?.quantityAvailable ?? 0);

  // Category comes from a single `category:<slug>` tag (e.g. category:razors).
  // Decides which shop page the product appears on. Product Type stays the
  // specific sub-type (e.g. "Safety Razor" vs "Gillette Razor") for display.
  const catTag = (node.tags || []).map((t) => /^category:(.+)$/i.exec(t)).find(Boolean);
  const category = catTag ? catTag[1].trim().toLowerCase() : "";

  return {
    slug: node.handle,
    title: node.title,
    material: node.title.replace(/shaving brush/i, "").trim().toUpperCase(),
    type: node.productType || "Shaving Brush",
    category,
    price: `${sym}${amount.toFixed(2)}`,
    priceAmount: amount,
    currency: price.currencyCode,
    knot: knotSpec || "24mm Knot",
    knotSpec: knotSpec,
    available,
    oneOfOne: available <= 1,
    variantId: numericVariantId(variant?.id),
    images,
    placeholders: images.length ? [] : [`${node.title.toLowerCase()} photo`],
    description: node.description || "",
    traits: mfJson(node, "traits", []),
    accordions: mfJson(node, "accordions", []),
  };
}

function cardHtml(p) {
  const media = p.images.length
    ? `<img src="${p.images[0].src}" alt="${p.images[0].alt}">`
    : `<div class="ph">${(p.placeholders[0] || "photo")}</div>`;
  const avail = p.available > 0 ? `${p.available} available` : "sold";
  return `    <a class="card" href="product.html?slug=${p.slug}">
      <div class="card__media">${media}</div>
      <div class="card__body">
        <div class="card__material">${p.material}</div>
        <div class="card__type">${p.type}</div>
        <div class="card__price">${p.price}</div>
        <div class="card__meta"><span>${p.knot}</span><span class="dot"></span><span>${avail}</span></div>
      </div>
    </a>`;
}

async function regenIndexGrid(products) {
  const file = join(ROOT, "index.html");
  const html = await readFile(file, "utf8");
  const start = "<!-- BM:PRODUCTS:START";
  const end = "<!-- BM:PRODUCTS:END -->";
  const si = html.indexOf(start);
  const ei = html.indexOf(end);
  if (si === -1 || ei === -1) { console.warn("index.html markers not found; skipping grid regen"); return; }
  const before = html.slice(0, html.indexOf("-->", si) + 3);
  const after = html.slice(ei);
  const cards = products.slice(0, 5).map(cardHtml).join("\n");
  const grid = `\n  <div class="card-grid card-grid--5" data-product-grid>\n${cards}\n  </div>\n  `;
  await writeFile(file, before + grid + after, "utf8");
  console.log("Regenerated index.html product grid.");
}

async function main() {
  if (!DOMAIN || !TOKEN) {
    console.log("Shopify not configured (SHOPIFY_STORE_DOMAIN / SHOPIFY_STOREFRONT_TOKEN missing).");
    console.log("Keeping seeded data/products.json. Build continues.");
    return;
  }
  console.log(`Fetching products tagged "${TAG}" from ${DOMAIN} ...`);
  const nodes = await fetchProducts();
  const products = nodes
    .filter((n) => (n.tags || []).includes(TAG))
    .map(mapProduct);
  console.log(`Mapped ${products.length} product(s).`);

  const out = {
    _comment: "GENERATED by scripts/build-catalog.mjs. Do not edit by hand.",
    generatedAt: new Date().toISOString(),
    source: "shopify",
    products,
  };
  await writeFile(join(ROOT, "data", "products.json"), JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log("Wrote data/products.json");

  await regenIndexGrid(products);
}

main().catch((err) => { console.error(err); process.exit(1); });
