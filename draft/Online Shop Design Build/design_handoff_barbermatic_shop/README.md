# Handoff: Barbermatic Luxury E-commerce — Homepage & Product Detail Page

## Overview
Design for barbermatic.com — an independent luxury e-commerce site replacing an Etsy-forwarded shop. Barbermatic is an Irish maker of handcrafted men's grooming objects (shaving brushes, safety razors, rollerball pens, worry objects, leather/tweed accessories), positioned as "an Irish house of handcrafted grooming objects and functional art for men." Two screens are designed: the Homepage and the Product Detail Page (Amboyna Burl Shaving Brush, €125, one-of-one).

## About the Design Files
The files in this bundle are **design references created in HTML** (`Home.dc.html`, `Product.dc.html`) — prototypes showing intended look and behavior, **not production code to copy directly**. The task is to recreate these designs in the target codebase's environment using its established patterns. If no codebase exists yet, the original brief recommends: Next.js (App Router) + TypeScript, Tailwind or modern CSS, server components, responsive images, commerce-provider abstraction (Shopify/Stripe-ready), structured data, WCAG 2.2 AA.

The `.dc.html` files use a lightweight template runtime (`{{ hole }}` placeholders, `<sc-for>`/`<sc-if>` loops, a `Component` logic class in a `<script>` tag). Read them as: template markup = JSX, logic class `renderVals()` = component props/state. All styling is inline — extract into your styling system.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and copy are final intent. Recreate pixel-perfectly, adapting to your component library. Product photography exists only for the Amboyna brush (`barbermatic_hero_image.png`); all other imagery is a **labelled placeholder** (dark diagonal-striped block with a monospace label naming the required photo) — do not invent images; keep placeholders until real photography is supplied.

## Design Tokens

### Colors
- Page background (near-black): `#0d0b09`
- Elevated surfaces / cards: `#120f0c`, `#100d0a`, `#14100c`
- Ivory section background: `#ece5da`; ivory-section text: `#1c1813`, secondary `#4c463c`
- Primary text: `#ece5da`; body/secondary: `#b8b0a2`; muted: `#8f8778`; faint: `#6e6759`
- Accent (muted brass/tan): `#c9a876`; accent on ivory: `#9a7b4f`; accent hover: `#d9bc8e`
- Sold-out / disabled: `#4c463c`
- Hairline borders: `rgba(232,225,214,0.06–0.15)`; accent borders: `rgba(201,168,118,0.4–0.8)`
- Placeholder stripes (dark): `#14100c`/`#1a1510`; warm variant: `#181209`/`#20180c`, `#241708`/`#2d1d0b`
- `::selection`: background `#c9a876`, color `#0d0b09`

### Typography
- Display serif: **Cormorant Garamond** (Google Fonts; weights 400/500/600, italics) — headlines, wordmark, pull quotes
- Interface sans: **Jost** (weights 300/400/500) — all UI, body, buttons
- Wordmark: Cormorant 22px, letter-spacing 0.32em, ALL CAPS; sub-line "HANDMADE IN IRELAND" 8px, 0.42em, accent color
- H1 hero: clamp(44px, 4.6vw, 72px), Cormorant 500, line-height 1.08, letter-spacing 0.04em, ALL CAPS
- H1 product: 44px Cormorant 500, line-height 1.12, sentence case
- H2 sections: clamp(30–32px, 3vw, 44–46px), Cormorant 500, line-height 1.15
- Eyebrows/labels: Jost 10–12px, letter-spacing 0.18–0.26em, ALL CAPS
- Body: Jost 13–15px weight 300, line-height 1.8–1.85
- Buttons: Jost 11–12px, letter-spacing 0.22–0.24em, ALL CAPS

### Spacing & Layout
- Section horizontal padding: 64–80px desktop; section vertical: 64–80px
- Max content width (product page): 1440px centered
- Card gaps: 16px; collection tile gap: 2px on `#0d0b09` (hairline-grid effect)
- **No border radius anywhere** except circles (badges, dots). Sharp rectangles throughout.
- No drop shadows. Depth comes from surface-color steps and hairline borders.

### Motion
- Hover: image `scale(1.04)` over 0.6s; border-color and background transitions 0.3s
- Hero text: fade+rise 1s ease on load
- Respect `prefers-reduced-motion` (all animation/transitions disabled)

## Screens / Views

### 1. Homepage (`Home.dc.html`)

**Header (shared, sticky):** 3-col grid (logo | nav | utilities), padding 22px 48px, `rgba(13,11,9,0.92)` + blur(8px), bottom hairline. Nav: SHOP, ONE-OF-ONE, MATERIALS, THE MAKER, JOURNAL — 12px, 0.18em spacing, 36px gap. Utilities: search, account, bag icons (17px, 1.4 stroke) with a 15px circular accent badge showing bag count.

**Hero:** full-viewport-height 2-col grid (text `minmax(420px,1fr)` | image 1.3fr). Left: H1 "OBJECTS OF RITUAL. MADE BY HAND IN IRELAND." (two lines), 64×1px accent rule (36px margins), 3-line body copy (15px/300, max-width 320px), ghost button "DISCOVER THE COLLECTION" (16px 34px padding, 1px accent-tinted border; hover fills accent with dark text). Right: hero photo `object-fit:cover`, with a left-edge gradient (`#0d0b09` → transparent over 30%) blending into the text column, and a vertical pagination indicator on the right edge (01 / 120px track with 24px accent segment / 06). Headline alternates (designed variants): "THE ORDINARY RITUAL, MADE EXTRAORDINARY." and "MADE TO BE HELD. MADE TO ENDURE."

**Promise band (ivory):** `#ece5da`, 3-col grid (300px photo | text | 200px stamp), 56px gap, padding 72px 80px. Photo placeholder: "irish coastline photo", 200px tall. Text: eyebrow "THE BARBERMATIC PROMISE" (accent-on-ivory), H2 "No two pieces of timber carry the same history.", body max-width 460px. Right: stacked label "MADE BY HAND / COUNTY CORK" (9px, 0.3em) above a 110px circle outlined in `#9a7b4f` containing an ∞ glyph (Cormorant 44px).

**Collections strip:** 6 equal tiles, aspect 3:4, 2px gaps. Each: placeholder photo, bottom gradient scrim with tile name (10px, 0.18em caps) left and accent → arrow right. Tiles: SHAVING BRUSHES, SAFETY RAZORS, WRITING INSTRUMENTS, PERSONAL OBJECTS, LEATHER & TWEED, ONE-OF-ONE PIECES.

**Signature shaving brushes:** header row ("SIGNATURE SHAVING BRUSHES" 12px caps left, "VIEW ALL →" accent link right), then 5-col card grid, 16px gap. Card: `#120f0c`, hairline border (hover: accent-tinted border), 4:5 image area (real photo only for Amboyna; placeholders otherwise), then padding 16–20px with: material name (11px caps 0.2em), "Shaving Brush" (12px/300 muted), price (13px), meta row "24mm Knot · [5px accent dot] · 1 available" (10px). Products: IRONWOOD €105 / AMBOYNA BURL €125 / THUYA BURL €110 / SUNSHINE STONE €140 / PINECONE €95.

**Materials section:** 2-col (1.1fr image | 1fr text), min-height 440px. Left: "macro burl-grain photo" placeholder (warm-toned stripes). Right (padding 80px 88px): eyebrow "MATERIAL IS NEVER DECORATION", H2 "Grain. Colour. Character. / Nature decides first.", body, link "EXPLORE MATERIALS →".

**Maker section:** mirror of materials (text left on `#100d0a`, image right "maker at workbench photo"). Eyebrow "THE MAKER", H2 "Made slowly. / Chosen for life.", body about the County Cork workshop, link "OUR STORY →".

**Value-props strip:** 5 equal cells, hairline top/bottom borders and dividers, padding 30px 28px. Each: serif glyph (24px accent) + two-line 10px caps label. MADE BY HAND IN IRELAND · SMALL NUMBERS NEVER MASS PRODUCED · ONE-OF-ONE PIECES · BUILT TO BE USED BUILT TO LAST · MEANINGFUL GIFTS.

**Footer:** 5-col grid (1.2fr brand | 0.8fr SHOP links | 0.8fr INFORMATION | 0.8fr JOURNAL | 1.2fr newsletter), 48px gap, padding 64px 80px. Brand block: wordmark + tagline + 230px description + social links. Link columns: 11px caps heading, 12px/300 muted links, 10px gap. Newsletter: hairline-bordered box (`box-sizing:border-box`), "STAY CONNECTED" heading, note "Stories, new pieces and workshop notes. No noise.", bordered email input with → submit. Bottom bar: hairline top border, "© 2026 Barbermatic. All rights reserved." left, Privacy Policy / Terms right (11px faint).

### 2. Product Detail Page (`Product.dc.html`)

Same header/footer/value-strip as Home.

**Main layout:** 3-col grid — 96px thumbnail rail | main image `minmax(0,1.15fr)` | info column `minmax(360px,0.85fr)`, 40px gap, max-width 1440px, padding 36px 64px 72px. "← Back to shop" link spans full width above.

**Thumbnail rail:** vertical stack of 84px square buttons, 14px gap. Active thumb: `rgba(201,168,118,0.8)` border; inactive: faint hairline. Thumbs: full brush (real photo), handle detail, grain macro, base + mark (placeholders). Clicking swaps the main image.

**Main image:** min-height 640px, `#100d0a` + hairline border, photo cover-fit; zoom affordance bottom-right (38px square, hairline border, magnifier-plus icon).

**Info column:**
- Eyebrow "ONE-OF-ONE" (accent, 11px, 0.26em) — becomes "SOLD" in sold-out state
- H1 "Amboyna Burl Shaving Brush", price "€125.00" (20px/300)
- Description paragraph (14px/300, max-width 420px): "A one-of-one shaving brush turned from exceptional Amboyna burl…"
- **Traits grid** 2×2 (gap 26/24px): 36px accent-outlined circle with glyph + title (10px caps) + body (11.5px muted). ONE OF ONE "This exact piece will not be repeated." / MADE BY HAND "Shaped, finished and assembled in Ireland." / BUILT TO ENDURE "Made to be used, made to last." / NATURAL MATERIALS "Grain, colour and character unique to this piece."
- **Availability line:** 8px accent dot + "Only 1 available" (sold out: grey dot + "This piece has found its owner")
- **CTA row:** "ADD TO BAG" fills width — accent bg `#c9a876`, dark text `#171310`, 18px padding, hover `#d9bc8e`; sold-out: `#4c463c`, disabled, label "SOLD OUT". Beside it a 56px bordered wishlist button. One-of-one rule: bag quantity caps at 1 (adding once sets badge to 1; further clicks no-op).
- Reassurance line: "⚿ Secure checkout • Worldwide Shipping" (11.5px muted)
- **Accordions** (hairline dividers, 18px row padding, 11px caps titles, accent chevron): DETAILS (height ~105mm, stabilised Amboyna, "The piece shown is the piece you will receive"), KNOT & PERFORMANCE (24mm silvertip badger, hand-set), MATERIAL & PROVENANCE, SHIPPING & RETURNS (dispatch County Cork 2–3 working days, tracked worldwide, 14-day returns), CARE GUIDE. All closed by default; independent toggles.

**Editorial strip:** 4 equal square cells, 2px gaps: three macro placeholders (knot detail / burl grain / maker's mark) + quote cell on `#120f0c` — large serif open-quote, italic Cormorant 24px "The wood determines the character. I simply reveal it.", attribution "— THE MAKER" (10px caps).

**Included + related:** 2-col (240px | 1fr), 56px gap. INCLUDED list: 30px bordered glyph squares + labels — Presentation box, Care card, Brush care guide, Protective travel sleeve. YOU MAY ALSO LIKE: heading + prev/next arrow squares (prev disabled-faint), 4-col card grid: square placeholder image, name + knot spec, price left / status right (9px accent caps: ONE-OF-ONE or 1 AVAILABLE). Items: Thuya Burl €110 Silvertip / Ironwood €105 Finest / Sunshine Stone €140 Silvertip / Pinecone €95 Finest.

## Interactions & Behavior
- Header sticky with blur; bag badge reflects bag count
- Home hero: 1s fade+rise entrance on the text column
- All product cards: hover raises border to accent tint + image scale 1.04 (0.6s)
- Product gallery: thumbnail click swaps main image; active-thumb border state
- Accordions: click toggles open/close, chevron flips; independent
- Add to bag: increments bag badge, hard-capped at 1 for one-of-one pieces; disabled when sold out
- Sold-out state (design-time toggle in prototype): swaps eyebrow → SOLD, dot → grey, line → "This piece has found its owner", CTA → grey disabled "SOLD OUT". Implement as product availability state.
- Reduced motion: all animation/transition suppressed

## State Management
- `bagCount` (int) — global, shown in header badge
- `activeThumb` (index) — product gallery
- `accordionOpen` (map of section → bool)
- Product availability (`available` | `soldOut`) — from product data
- Data model per product: name, slug, material, price (EUR), knot spec, availability count, oneOfOne flag, images[]

## Accessibility
Semantic landmarks (header/nav/main/footer), real `<button>`s for thumbs/accordions/CTA, alt text on product photos, visible focus states (add — the prototype relies on hover), WCAG 2.2 AA contrast (muted `#8f8778` on `#0d0b09` is ~5.1:1; don't go lighter on smaller text), `prefers-reduced-motion` respected.

## Assets
- `barbermatic_hero_image.png` (1536×1024) — Amboyna burl brush on dark stone; used as homepage hero and product gallery photo. **Only real photo available.**
- Fonts: Cormorant Garamond + Jost via Google Fonts (self-host in production; `font-display: swap`)
- Icons: minimal 1.4px-stroke line icons (search, account, bag, magnifier); glyphs (∞, ✳, §, ◯, ♦, ❦, ❧, ⚿) are typographic — replace with proper line icons of matching weight if available
- **Photography still required:** collection tiles ×6, brush products ×4, Irish coastline, macro burl grain, maker at workbench, handle/grain/base details, knot macro, maker's mark

## Files
- `Home.dc.html` — homepage design reference
- `Product.dc.html` — product detail page design reference
- `barbermatic_hero_image.png` — hero/product photo
- Reference mockups: `barbermatic_mockup.png` (homepage), `barbermatic_product_details_page.png` (PDP)
