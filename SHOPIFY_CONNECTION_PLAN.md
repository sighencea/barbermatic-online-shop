# Shopify connection runbook

Step-by-step to connect live Shopify products to the site. The site is already
built to receive them — this is **configuration, not coding**. Work top to
bottom; the two tracks (Shopify admin ↔ GitHub) can run in parallel, then meet
at Phase 4.

**Roughly 1–2 hours** including a careful end-to-end checkout test.

---

## How it will work (recap, 60 seconds)

- The catalog is fetched from Shopify **at build time** (GitHub Actions), using a
  Storefront API token stored as a GitHub **secret** — the token never reaches
  the browser.
- The build writes `data/products.json` and regenerates the homepage grid, then
  deploys to GitHub Pages.
- A product appears only if it is **tagged `barbermatic`** *and* **published to
  the token's sales channel** (two-key, default-deny — keeps your other products
  out).
- Each product's menu page is decided by one **`category:<slug>`** tag.
- Checkout uses a **Shopify cart permalink** → Shopify's hosted checkout. No
  token in the browser, no server. Shopify owns inventory and blocks overselling.

---

## Pre-flight — have these ready before you start

- [ ] Shopify admin access with permission to create apps and edit products.
- [ ] Admin/write access to this GitHub repo (to add secrets + push).
- [ ] Node 18+ installed locally (`node -v`) for the local test in Phase 4.
- [ ] Decide your API version — a current stable one, e.g. **`2025-01`**
      (check Shopify admin → the version picker in any app's API settings).
- [ ] Pick **1–2 pilot products** to connect first and prove the pipeline before
      doing the whole catalog.

---

## Decisions to lock first (5 min)

1. **Inclusion gate:** keep the **`barbermatic` tag** (already wired). ✅ recommended.
2. **Category tag per product** (exactly one), from:
   `category:razors`, `category:shaving-brushes`, `category:writing-instruments`,
   `category:accessories`.
3. **How much product data to launch with** — pick the level:
   - **Minimum (fastest):** price, ≥1 image, inventory, description, the two tags.
     Card + product page work; no traits/accordions/material label refinements.
   - **Full:** the above **plus** metafields (`material`, `spec`, `traits`,
     `accordions`) for the rich product page.
   You can launch Minimum and add metafields later — nothing breaks.

---

## Phase 1 — Shopify: prepare the pilot products (admin)

For each pilot product:

- [ ] **Tag** `barbermatic`.
- [ ] **Tag** one `category:<slug>` (e.g. `category:razors`).
- [ ] **Product Type** = the specific sub-type ("Safety Razor", "Gillette /
      Cartridge Razor", "Shaving Brush", "Rollerball Pen", …). RAZORS holds both
      safety and cartridge because both carry `category:razors`.
- [ ] **Price** set.
- [ ] **Images** uploaded (first image is the card + main product image).
- [ ] **Inventory:** quantity **1**, **Track quantity = ON**, **"Continue
      selling when out of stock" = OFF**. (This is the one-of-one anti-oversell
      guarantee.)
- [ ] **Description** written (this becomes the product-page description).

### (Full level only) Create metafield definitions
Settings → **Custom data** → **Products** → Add definition. Namespace **`barbermatic`**:

| Key | Type | Content |
|-----|------|---------|
| `material` | Single line text | Card label, e.g. "AMBOYNA BURL" |
| `spec` | Single line text | Small spec on the card, e.g. "24mm Silvertip" / "3-Piece" / "Rollerball" |
| `traits` | JSON | `[{"glyph":"1/1","title":"ONE OF ONE","body":"…"}, …]` |
| `accordions` | JSON | `[{"title":"DETAILS","body":"…"}, …]` |

- [ ] Definitions created, then filled in on each pilot product.

> The keys above must match `METAFIELDS` in `scripts/build-catalog.mjs`. The
> build reads `material` (falls back to the upper-cased title) and `spec` (falls
> back to a legacy `knot_spec` metafield, then to blank — the card omits the spec
> cleanly when empty). If you name definitions differently, update that array.

---

## Phase 2 — Shopify: Storefront API token + channel

Route A (recommended, most control): **custom app**.

- [ ] Settings → **Apps and sales channels** → **Develop apps** → **Create an app**
      (name e.g. "Barbermatic Storefront").
- [ ] **Configure Storefront API scopes** → enable:
      - `unauthenticated_read_product_listings` (products)
      - `unauthenticated_read_product_inventory` (availability / sold-out)
- [ ] **Install app**.
- [ ] **API credentials** → copy the **Storefront API access token** (this is the
      public-safe token). Keep it handy for Phase 3.
- [ ] Note your **store domain**: `something.myshopify.com`.
- [ ] **Publish the pilot products to this app's channel.** On each product →
      *Sales channels / Publishing* → make sure the app/channel is ticked. This
      is the second key of the gate.

> Route B alternative: add the **Headless** sales channel, which also issues a
> Storefront API token — same result. Either is fine.

### Quick token smoke test (before touching GitHub)
Run in a terminal (replace domain + token). Expect your pilot products back:

```bash
curl -X POST "https://YOUR-STORE.myshopify.com/api/2025-01/graphql.json" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Storefront-Access-Token: YOUR_TOKEN" \
  -d '{"query":"{ products(first:5, query:\"tag:barbermatic\"){edges{node{title handle tags totalInventory}}}}"}'
```

- [ ] Returns the pilot product(s). If **empty**, see Troubleshooting below.

---

## Phase 3 — GitHub: secrets, variables, checkout domain

Repo → **Settings** → **Secrets and variables** → **Actions**:

- [ ] **New repository secret** `SHOPIFY_STORE_DOMAIN` = `YOUR-STORE.myshopify.com`
- [ ] **New repository secret** `SHOPIFY_STOREFRONT_TOKEN` = the Storefront token
- [ ] **Variables** tab → `SHOPIFY_API_VERSION` = `2025-01`
- [ ] **Variables** tab → `PRODUCT_TAG` = `barbermatic`

Then enable checkout in the committed config:

- [ ] Edit `js/shopify.config.js` → set `shopDomain: "YOUR-STORE.myshopify.com"`.
      (Non-secret — this is what builds the checkout permalink in the browser.)
      Commit it.

---

## Phase 4 — Test locally BEFORE deploying

From the repo folder (PowerShell):

```powershell
$env:SHOPIFY_STORE_DOMAIN="YOUR-STORE.myshopify.com"
$env:SHOPIFY_STOREFRONT_TOKEN="YOUR_TOKEN"
$env:SHOPIFY_API_VERSION="2025-01"
$env:PRODUCT_TAG="barbermatic"
node scripts/build-catalog.mjs
```

- [ ] Script prints "Mapped N product(s)" and "Wrote data/products.json".
- [ ] Open `data/products.json` and check each pilot product:
      - `variantId` is a **numeric** string (not empty) — needed for checkout.
      - `category` is correct.
      - `price`, `images`, `available` look right.
      - (Full) `material`, `spec`, `traits`, `accordions` populated.
- [ ] Serve and click through:
      ```powershell
      python -m http.server 8000   # then open http://localhost:8000
      ```
      - [ ] Home grid + `shop.html` category pages show the pilot products.
      - [ ] Product page renders (gallery, description, traits/accordions).
      - [ ] "Add to bag" enables; the bag's **Proceed to Checkout** opens the
            Shopify checkout for that variant (use Shopify's test mode / a
            bogus-gateway order to complete one safely).

> Local test edits `data/products.json` and the `index.html` grid. You do **not**
> need to commit those — CI regenerates them on every deploy. You can
> `git checkout data/products.json index.html` to restore the seed if you like.

---

## Phase 5 — Deploy

- [ ] Repo → **Settings → Pages → Source: GitHub Actions** (not "deploy from
      branch").
- [ ] Commit + push to `main` (include the `shopify.config.js` change).
- [ ] Watch **Actions** → the "Build & Deploy" run: the build step fetches from
      Shopify (secrets present), then deploys.
- [ ] Open the live URL. Confirm real products + working checkout.

> On the live site the catalog is real; the **repo files still show the seed**
> (the build regenerates them only inside the CI artifact). That's expected —
> not a bug.

---

## Phase 6 — End-to-end checkout + inventory test (do not skip)

- [ ] Buy a pilot one-of-one (test order). Confirm Shopify **created the order**
      and **decremented inventory to 0**.
- [ ] Re-run the deploy (push, or Actions → **Run workflow**). Confirm the sold
      item now shows **sold out** on the site.
- [ ] (Optional) Two-tab race: confirm Shopify **rejects the second checkout** —
      overselling is impossible.

---

## Phase 7 — Roll out the rest of the catalog

- [ ] Repeat Phase 1 for every remaining product (tags, type, price, images,
      inventory, description, metafields).
- [ ] Publish each to the token's channel.
- [ ] Re-run the deploy. Verify counts per category page.

---

## Phase 8 — Auto-rebuild on product changes (optional, can be a later day)

Makes "I edited a product in Shopify and it appeared" true, ~1–2 min, no manual
deploy.

- [ ] In Shopify create webhooks for **Product update** and **Inventory level
      update**.
- [ ] Point them at a small forwarder that calls GitHub's `repository_dispatch`
      with event type **`shopify-sync`** (the workflow already listens for it).
      Shopify can't send GitHub's auth header directly, so this needs a tiny
      relay (Pipedream / a Cloudflare Worker / similar). **Ask us and we'll wire
      it up.**

Until then: **Actions → Build & Deploy → Run workflow** rebuilds on demand, and
any push rebuilds too.

---

## Phase 9 — Custom domain (optional, whenever DNS is ready)

- [ ] `CNAME` already contains `barbermatic.com`. Point DNS at GitHub Pages
      (apex A/AAAA + `www` CNAME to `<user>.github.io`), then **enable Enforce
      HTTPS** in Pages settings. If not using the domain yet, delete `CNAME`
      before enabling Pages.

---

## Troubleshooting

**`/products` / the smoke test returns empty**
1. Product isn't tagged `barbermatic`.
2. Product isn't **published to the token's channel** (the second key).
3. Token missing `unauthenticated_read_product_listings` scope.
4. Wrong `SHOPIFY_API_VERSION`.

**Product shows but no price / can't check out**
- `variantId` empty in `products.json` → the product/variant didn't come back;
  re-check publish + scopes. Checkout needs the numeric variant id.

**"Sold out" never shows / availability wrong**
- Add the `unauthenticated_read_product_inventory` scope; ensure **Track
  quantity** is ON for the product.

**Wrong category page**
- Product missing/typo'd its single `category:<slug>` tag.

**Card label looks odd (e.g. whole title upper-cased)**
- Set the `material` metafield on the product — the build uses it for the card
  label, falling back to the upper-cased title only when it's empty.

---

## Rollback / safety

- If the build fails or returns nothing, it **exits cleanly and keeps the seeded
  catalog** — the site never deploys broken/empty. Fix config and re-run.
- Nothing here is destructive to Shopify; you're only reading products and
  (in Phase 6) placing a test order you control.

---

## Build refinements — DONE ✅

`scripts/build-catalog.mjs` now:
1. Reads a **`material`** metafield for the card label (falls back to the
   upper-cased title only when unset).
2. Reads a generic **`spec`** metafield (falls back to the legacy `knot_spec`,
   then blank) so razors / pens / accessories read naturally — and the card
   omits the spec cleanly when it's absent.

So tomorrow is config-only.
