# GAVRIQ Labs Global Website

The corporate marketing and trust website for GAVRIQ Labs Global, served as a static site.

Production domain: **https://gavriqlabsglobal.com** (canonical — `www` redirects here)

## Brand positioning
GAVRIQ Labs is presented as a technology and innovation company focused on AI, intelligent automation, research and modern software engineering.

## Brand expansion used in the website
- G — Generative AI
- A — Advanced Intelligence
- V — Vision
- R — Reasoning
- I — Innovation
- Q — Quality

The deeper name story references Gayathri, Abhay, Karthik and Supriya as the source inspiration for the constructed brand name.

## Run locally
Open `index.html` directly in a browser, or serve the folder with any static web server.

## Deployment
Deployed to Cloudflare Workers (static assets) via `wrangler deploy`, using the Cloudflare Git integration from the `main` branch. Production and canonical domain: `gavriqlabsglobal.com`.

## Contact form
The contact form is currently front-end only (`script.js` intercepts submit and shows a confirmation message). No submission is transmitted anywhere yet. Before wiring it to a real backend, form service, or email workflow, re-run the privacy/tracking deployment review described in `docs/internal/processor-register.md` and update the Privacy Policy's service-provider section accordingly.

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
