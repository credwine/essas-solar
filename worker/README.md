# Sisoko Renewables — contact form email Worker

Sends contact-form submissions to **stayez.j@gmail.com** via Resend.
The site works without this (it falls back to a pre-filled email); deploying
this makes submissions arrive **silently in the background**.

## One-time deploy (about 3 minutes)

From this `worker/` folder:

```bash
# 1. Log in to Cloudflare (opens a browser once)
npx wrangler login

# 2. Store your Resend API key as an encrypted secret (paste key when prompted)
npx wrangler secret put RESEND_API_KEY

# 3. Deploy
npx wrangler deploy
```

Wrangler prints a URL like `https://essas-solar-contact.<your-subdomain>.workers.dev`.

## Point the site at it

Copy that URL into `assets/site.js` — set:

```js
var CONTACT_ENDPOINT = "https://essas-solar-contact.<your-subdomain>.workers.dev";
```

Commit + push. Done — the form now emails silently, and still falls back to a
pre-filled email if the endpoint is ever unreachable.

## From address

Resend requires the `from` domain to be verified in your Resend account.
- Quickest: verify **sisokorenewables.com** in Resend (DNS is on Cloudflare), then
  set `FROM_EMAIL = "Sisoko Renewables <leads@sisokorenewables.com>"` in `wrangler.toml`.
- Or reuse an already-verified domain you own.
- The default `onboarding@resend.dev` only delivers to your own Resend account email —
  fine for a first test, not for production.

`reply_to` is set to the visitor's email, so you can reply straight to the lead.
