/**
 * Barbermatic — Shopify → GitHub rebuild relay (Cloudflare Worker).
 *
 * Shopify can't send GitHub's auth header, so this tiny relay sits between them:
 *   Shopify webhook (products/update, inventory_levels/update)
 *     -> this Worker (verifies Shopify's HMAC signature)
 *       -> GitHub repository_dispatch (event_type "shopify-sync")
 *         -> the "Build & Deploy" workflow reruns; live catalog refreshes ~1-2 min.
 *
 * The HMAC check means only genuine Shopify webhooks can trigger a rebuild — a
 * random POST to this URL is rejected.
 *
 * Environment (Cloudflare dashboard -> Worker -> Settings -> Variables):
 *   SHOPIFY_WEBHOOK_SECRET  (secret)  Shopify webhook signing secret
 *   GITHUB_TOKEN            (secret)  GitHub PAT, Contents: read/write on the repo
 *   GITHUB_OWNER            (var)     e.g. "sighencea"
 *   GITHUB_REPO             (var)     e.g. "barbermatic-online-shop"
 *   EVENT_TYPE             (var)      "shopify-sync" (must match deploy.yml)
 */

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const hmacHeader = request.headers.get("X-Shopify-Hmac-Sha256") || "";
    const raw = await request.arrayBuffer();

    if (!(await verifyHmac(raw, hmacHeader, env.SHOPIFY_WEBHOOK_SECRET))) {
      return new Response("Invalid signature", { status: 401 });
    }

    // Respond 200 to Shopify immediately (it wants a 2xx within ~5s) and fire the
    // GitHub dispatch in the background. Log failures rather than failing the
    // webhook, so Shopify doesn't retry-storm.
    ctx.waitUntil(
      triggerRebuild(env).catch((e) => console.error("repository_dispatch failed:", e))
    );
    return new Response("ok", { status: 200 });
  },
};

async function verifyHmac(rawBody, hmacHeaderB64, secret) {
  if (!secret || !hmacHeaderB64) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, rawBody);
  const computedB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return timingSafeEqual(computedB64, hmacHeaderB64);
}

// Length-checked, constant-time string compare (avoids leaking via timing).
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function triggerRebuild(env) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/dispatches`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
      "Accept": "application/vnd.github+json",
      "User-Agent": "barbermatic-shopify-sync",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ event_type: env.EVENT_TYPE || "shopify-sync" }),
  });
  if (!res.ok) {
    throw new Error(`GitHub ${res.status}: ${await res.text()}`);
  }
}
