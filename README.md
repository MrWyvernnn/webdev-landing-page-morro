# Morro — landing page

The landing page for Project Morro, an Android commitment alarm.

- **Stack:** Vite + React + Tailwind CSS v4 + Motion + Lenis, Cloudflare Worker + D1 for the waitlist
- **Hosting:** Cloudflare Workers static assets (`dist/` + `worker/index.ts`)
- **Forms:** double opt-in waitlist (`worker/`), behind a privacy consent dialog
- **Design:** warm monochrome on pure black, system type, no images or fonts

## Run

```bash
npm install
npm run dev      # http://localhost:5173 (proxies /api to the local Worker)
npm run build    # typecheck (site + worker) and build to dist/
npm run preview  # serve the build
npm test         # unit + handler tests (vitest)
```

`npm run dev` alone gives you the page with a dead form. For a working form, run the
Worker in a second terminal:

```bash
npx wrangler d1 migrations apply morro-waitlist --local
npm run worker:dev          # http://127.0.0.1:8787
```

Legal pages (`/privacy.html`, `/terms.html`), the sitemap and the app mark live in
`public/` and are copied to `dist/` unchanged.

## Waitlist backend

`POST /api/waitlist` stores the address as **pending** and emails a single confirmation
link. Nothing else is ever sent to an address that has not confirmed. The link is a
button on `/confirm` (not a bare GET) so mail scanners cannot confirm an address their
owner never agreed to.

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/waitlist` | POST | Validate, rate limit, store pending, send one confirmation |
| `/api/confirm` | POST | Spend a single-use token, mark confirmed |
| `/api/unsubscribe` | POST | Delete the address from the list |
| `/confirm` | GET | The confirmation page (token stays in the URL, `referrer-policy: no-referrer`) |
| `/unsubscribe` | GET | The unsubscribe page |

Rules the code enforces, with tests in `tests/worker.test.ts`:

- Consent must be an explicit `privacyAccepted: true`; marketing is a separate boolean.
- A hidden honeypot field or a submit faster than two seconds gets a success reply and no write.
- Eight attempts per IP per hour; IPs are stored only as `sha256(ip + IP_SALT)`.
- Tokens are 32 random bytes; only their SHA-256 is stored. They work once and expire in 48 h.
- A confirmed or unsubscribed address is never mailed again from this endpoint.
- New, resent and already-known addresses all get the same `202 {"ok":true}`, so the form
  cannot be used to test whether an address is on the list.
- Cross-site POSTs are rejected by `Origin` (allow-list in `APP_ORIGIN`).
- Prepared statements only; no string-built SQL.

## Deploying it

```bash
npx wrangler login
npx wrangler d1 create morro-waitlist         # copy the database_id into wrangler.jsonc
npx wrangler d1 migrations apply morro-waitlist --remote
npx wrangler secret put RESEND_API_KEY        # paste the key when prompted
npx wrangler secret put IP_SALT               # any long random string
```

Then set the sender in `wrangler.jsonc` under `vars`:

```jsonc
"vars": { "FROM_EMAIL": "Morro <hello@yourdomain.com>" }
```

`npm run deploy` builds `dist/` and uploads the Worker and assets together. Pages keep
being served straight from `dist/`, so `public/_headers` still applies to them; the API
sets its own headers in `worker/index.ts`.

Local secrets go in `.dev.vars` (already present, non-secret values only). Never commit a
real `RESEND_API_KEY`.
