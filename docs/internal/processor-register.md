# Internal Processor Register (GAVRIQ Labs Global Website)

Internal governance document. Not published on the public website.
Review at least annually and whenever a new provider, script, SDK or
integration is added (see the Privacy/Tracking Deployment Gate in the
implementation prompt).

Last reviewed: 7 September 2026

| Provider | Purpose | Data categories | Processing location | Retention considerations | Security considerations | Review date |
|---|---|---|---|---|---|---|
| Cloudflare | DNS, CDN, hosting (Workers static assets), security/WAF/bot protection | IP address, request metadata, security/CDN logs | Global edge network; exact jurisdictions per Cloudflare's own disclosures (not independently verified here) | Governed by Cloudflare's log retention; keep our own security-log review window to ~30–90 days unless investigating an incident | Relied upon for TLS termination, DDoS/bot mitigation, header/redirect enforcement | Annually, or on any Cloudflare config change |
| Google Workspace | Business email for admin@gavriqlabsglobal.com; receiving/handling enquiries forwarded or replied to by email | Enquirer name, email, message content once received by email | Google global infrastructure (exact region not verified here) | Per normal business email retention practice; see Privacy Policy retention table | MX/SPF/DKIM/DMARC must remain correctly configured (see Phase 2 email security) | Annually |
| GitHub | Source control and deployment metadata for this repository | Commit metadata, no personal customer data expected | GitHub/Microsoft infrastructure | N/A — no personal information intentionally stored in the repo | Branch protection and review requirements recommended (see Phase 2) | Annually |
| Google Fonts | Serves Inter and Space Grotesk web fonts referenced by the site | Browser request metadata inherent to any external font request (IP, user-agent) | Google infrastructure | N/A — no cookies or identifiers set by this integration on our end | Included in CSP `style-src`/`font-src` allow-list | Annually |
| Website analytics | NOT CURRENTLY IN USE | — | — | — | — | Re-assess if analytics is ever proposed (Privacy/Tracking Deployment Gate) |
| Contact-form processor | NOT CURRENTLY IMPLEMENTED — the form is front-end only (`event.preventDefault()`); no submission is transmitted anywhere yet | — | — | — | Before wiring a real backend/email/form service, re-run the Privacy/Tracking Deployment Gate and update the Privacy Policy Section 9 (Service providers) | Before any contact-form backend is implemented |
| AI provider (website enquiries) | NOT IN USE — enquiry data is not sent to any AI system | — | — | — | See AI Privacy Gate before ever wiring one up | Before any AI integration touching visitor/enquiry data |

## Notes

- This table reflects what the repository and public DNS/email configuration were confirmed or assumed to contain as of the review date above. Cloudflare, Google Workspace and GitHub account-level settings (WAF rules, DMARC policy stage, branch protection) were not directly inspected from this environment and should be verified against the live consoles.
- Do not add a row implying a processing relationship that does not actually exist yet — add it only once the integration is real and has passed the deployment gate.
