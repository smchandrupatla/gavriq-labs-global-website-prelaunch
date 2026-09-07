# GAVRIQ Labs Global Website

The corporate marketing and trust website for GAVRIQ Labs Global, served as a static site.

Production domain: **https://gavriqlabsglobal.com** (canonical — `www` redirects here)

## Brand positioning
GAVRIQ Labs Global is presented as a technology and innovation company focused on AI, intelligent automation, research and modern software engineering. Slogan: "Intelligent technology. Built with purpose."

GAVRIQ Labs Global Pty Ltd is the intended future legal entity. **Corporate registration (ABN/ACN) is currently in progress** — do not represent it as already registered anywhere on the site.

## Brand expansion used in the website
- G — Generative AI
- A — Advanced Intelligence
- V — Vision
- R — Reasoning
- I — Innovation
- Q — Quality

## Architecture
Mostly a static HTML/CSS/JS site, plus one small Worker script for the contact form. No build step, no framework. Pages:

```
/               index.html         Home
/privacy        privacy.html       Privacy Policy
/terms          terms.html         Terms of Use
/cookies        cookies.html       Cookie & Tracking Policy
/security       security.html      Security & Responsible Disclosure
/accessibility  accessibility.html Accessibility Statement (WCAG 2.2 AA target)
404.html                           Branded not-found page
.well-known/security.txt           RFC 9116 security contact
```

Shared assets: `styles.css`, `script.js`, `assets/logo.svg`.

Deployment configuration (Cloudflare Workers static assets + one Worker script):
- `wrangler.jsonc` — asset serving config (`html_handling: auto-trailing-slash` for clean URLs, `not_found_handling: 404-page`, `run_worker_first: ["/api/*"]` so the API route below reaches the Worker instead of being swallowed by the 404 fallback)
- `src/worker.js` — the Worker entry point. Handles `POST /api/contact` (validates input, rejects a hidden honeypot field, calls the Resend API to email admin@gavriqlabsglobal.com); every other path is served directly from static assets and never touches this script
- `_headers` — security response headers (see Security below)
- `.assetsignore` — excludes `.git`, `.wrangler`, `docs/`, `README.md`, `wrangler.jsonc` and `src/` from being uploaded as publicly servable files (Cloudflare Workers static assets does **not** exclude `.git` automatically — this file is required, not optional)

## Local development
Open `index.html` directly in a browser, or serve the folder with any static file server. To preview it the way Cloudflare will serve it (clean URLs, `_headers`, 404 routing), use Wrangler:

```
npx wrangler dev
```

## Deployment
Deployed to Cloudflare Workers (static assets) via `wrangler deploy`, using the Cloudflare Git integration from the `main` branch. Production and canonical domain: `gavriqlabsglobal.com`.

**www → apex redirect:** Cloudflare Workers static assets' `_redirects` file only supports relative, same-host redirects — it rejects cross-host rules like `www` → apex (deploy fails with `Invalid _redirects configuration: Only relative URLs are allowed`). The `www.gavriqlabsglobal.com` → `gavriqlabsglobal.com` canonical redirect must instead be configured as a **Cloudflare Redirect Rule or Bulk Redirect** at the dashboard/zone level (Rules → Redirect Rules), which runs at the edge independently of this Worker. This has not been configured from this repository and needs to be set up and verified in the Cloudflare dashboard.

## Contact form
The contact form POSTs to `/api/contact` (handled by `src/worker.js`), which sends the enquiry to **admin@gavriqlabsglobal.com** via [Resend](https://resend.com). Resend was chosen over Cloudflare's own Email Routing/`send_email` binding specifically because Email Routing would require pointing the zone's MX at Cloudflare, and the existing Google Workspace MX/SPF/DKIM must not be touched.

**One-time setup required (not done from this repo — needs your Resend account and Cloudflare access):**
1. Sign up at resend.com and add `gavriqlabsglobal.com` as a sending domain.
2. Add the DNS records Resend gives you (SPF/DKIM-style TXT records) in Cloudflare DNS. These are **additive** — they do not touch or replace the existing Google Workspace MX/SPF/DKIM records. Wait for Resend to show the domain as verified before going further, otherwise sending will fail or land as unverified.
3. Create a Resend API key.
4. Add it to the Worker as a secret — either `npx wrangler secret put RESEND_API_KEY` (needs `wrangler login` first) or via the Cloudflare dashboard → Workers & Pages → this Worker → Settings → Variables and Secrets → add `RESEND_API_KEY` as **Encrypted**. Never put the key in `wrangler.jsonc` or commit it to the repo.
5. Redeploy (push to `main`, or `wrangler deploy`).

Until the secret is set, `/api/contact` responds with a graceful "temporarily unavailable, email us directly" message instead of erroring — the form doesn't break, it just can't send until step 4 is done.

The form includes a hidden honeypot field and basic server-side validation (required fields, email format, length limits) against spam; there's no CAPTCHA/rate limiting beyond that yet — revisit if abuse becomes an issue.

## Privacy requirements
- Privacy-by-design: collect the minimum necessary, no unnecessary tracking, no analytics/marketing trackers by default.
- Enquiries are never treated as marketing consent (see `/privacy`).
- Website enquiry data is never used to train general-purpose AI models without explicit disclosure and authorisation.
- Before adding any script, SDK, analytics, tracker, embed, AI service, form processor, browser storage or third-party widget, run the Privacy/Tracking Deployment Gate and AI Privacy Gate described in the Phase 1/2 implementation notes, and keep `docs/internal/processor-register.md` current.
- All public privacy/security/accessibility enquiries route through **admin@gavriqlabsglobal.com** — no other public-facing addresses (privacy@, security@, contact@, legal@) should be introduced without a deliberate decision to do so.

## Security requirements
- HTTPS-only in production; TLS 1.2 minimum with TLS 1.3 enabled at Cloudflare.
- Security headers are set via `_headers`: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY`, and a `Content-Security-Policy-Report-Only` built from this repo's actual origin inventory (self + Google Fonts only). Move to an enforced `Content-Security-Policy` only after a monitoring period confirms no legitimate violations.
- `Strict-Transport-Security` (HSTS) is intentionally **not yet enabled** — enable only after verifying apex and `www` both serve HTTPS correctly in production, per the Phase 2 rollout notes. Do not add `preload` without a separate, explicit review.
- Vulnerability reports: see `/security` and `/.well-known/security.txt`.
- Never commit secrets, API keys or credentials to this repository.
- The `.assetsignore` file must always exclude `.git` and `.wrangler` — without it, git history (including past commits) is uploaded as publicly fetchable static files. Verify this after any change to deployment config.
- Google Workspace email DNS (MX, SPF, DKIM) must never be removed when touching DNS; deploy DMARC in staged mode (`p=none` → `p=quarantine` → `p=reject`), never jumping straight to enforcement.

## Accessibility target
WCAG 2.2 Level AA. See `/accessibility` for details and how to report an issue.

## Change control
- Keep Phase 1 (legal/privacy/trust) and Phase 2 (security/infrastructure) changes in separate, clearly labelled commits.
- Do not introduce new third-party scripts, trackers, or dependencies without passing the deployment gates referenced above.
- Do not weaken the CSP or disable security headers to "make an error go away" — fix the underlying cause instead.
- Recommended (external, not enforced by this repo): protected `main` branch, required PR review, no force-pushes, controlled Cloudflare deploy path (`main` → Cloudflare build → production).

## Contact
General and legal/security/accessibility enquiries: **admin@gavriqlabsglobal.com**
