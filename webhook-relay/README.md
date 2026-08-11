# Auto-rebuild relay (Shopify → GitHub)

Makes "I edited a product in Shopify and it appeared on the site" true, ~1–2 min,
with no manual **Run workflow**. A Cloudflare Worker receives Shopify webhooks,
verifies their signature, and triggers the `Build & Deploy` workflow via GitHub's
`repository_dispatch` (event type **`shopify-sync`**, already wired in `deploy.yml`).

One-time setup, ~15 minutes. All point-and-click except pasting the Worker code.

---

## 1. GitHub — create a token (Personal Access Token)

GitHub → **Settings** (your account) → **Developer settings** → **Personal access
tokens** → **Fine-grained tokens** → **Generate new token**:

- **Resource owner:** `sighencea`
- **Repository access:** *Only select repositories* → `barbermatic-online-shop`
- **Permissions → Repository permissions → Contents:** **Read and write**
  *(this is what `repository_dispatch` needs)*
- Generate, then **copy the token** (starts `github_pat_…`) — you'll paste it into
  the Worker in step 2.

> Classic-token alternative: a token with the `repo` scope also works.

---

## 2. Cloudflare — create the Worker

Cloudflare dashboard → **Workers & Pages** → **Create** → **Create Worker**:

1. Name it e.g. `barbermatic-shopify-sync` → **Deploy** (creates a default worker).
2. **Edit code** → delete the sample, paste the contents of
   `shopify-sync-worker.js` (in this folder) → **Deploy**.
3. **Settings → Variables and Secrets** → add:

   | Name | Type | Value |
   |------|------|-------|
   | `GITHUB_TOKEN` | **Secret** (encrypt) | the PAT from step 1 |
   | `SHOPIFY_WEBHOOK_SECRET` | **Secret** (encrypt) | from step 3 below |
   | `GITHUB_OWNER` | Text | `sighencea` |
   | `GITHUB_REPO` | Text | `barbermatic-online-shop` |
   | `EVENT_TYPE` | Text | `shopify-sync` |

4. Copy the Worker's URL (e.g. `https://barbermatic-shopify-sync.<you>.workers.dev`).

> You can add `SHOPIFY_WEBHOOK_SECRET` after step 3 and redeploy — Shopify shows it
> only once you're on the webhooks page.

---

## 3. Shopify — create the webhooks

Shopify admin → **Settings → Notifications → Webhooks** (scroll down):

1. At the bottom, copy the **webhook signing secret** → paste it as
   `SHOPIFY_WEBHOOK_SECRET` in the Worker (step 2, table) and redeploy.
2. **Create webhook** ×2, both **Format: JSON**, **URL:** your Worker URL:
   - Event: **Product update**
   - Event: **Inventory level update**

---

## 4. Test it

1. Edit any Barbermatic product in Shopify (e.g. change a price) and save.
2. Within ~1–2 min, GitHub → **Actions** shows a new **Build & Deploy** run whose
   trigger is `repository_dispatch` (event `shopify-sync`).
3. When it's green, hard-refresh the live site — the change is there.

---

## Notes

- **Bulk edits:** each change fires a webhook, but `deploy.yml` uses
  `concurrency: { group: pages, cancel-in-progress: true }`, so a burst collapses
  into one final rebuild instead of stacking up.
- **Security:** the Worker rejects any request whose Shopify HMAC signature doesn't
  match `SHOPIFY_WEBHOOK_SECRET`, so the public URL can't be used to spam rebuilds.
- **Secrets live only in Cloudflare** — none of this is committed. The Worker source
  here contains no credentials.
- **No-code alternative:** the same flow works with a Pipedream workflow (Shopify
  trigger → HTTP request to GitHub's `/dispatches`). The Worker is preferred because
  it keeps the relay in-repo and adds signature verification.
