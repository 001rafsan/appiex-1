# Appiex SEO priorities and verified blockers — 6 November 2026

## What is stopping stronger results

**P0 — Production content appears out of sync.** At the time of this audit, the externally retrieved homepage still displayed the old "Planet Jupiter" headline while GitHub `main` had the revised "Custom Websites & AI Automation" hero. This may reflect a stale deployment or crawler caching. GitHub CI passed, which only confirms the repository can build; it does not prove the latest code is served to visitors. Verify Vercel's **production project**, linked GitHub repository `rayat927/appiex`, production branch `main`, deployment SHA and `appiex.com` domain association. Do not alter `vercel.json` blindly; it retains legacy static build rules alongside Next.js configuration.

**P0 — Lead reporting overstated success.** The homepage uses a WhatsApp handoff. Previously, its inline JavaScript saved a fictitious 'delivered' conversation and 'new lead' in the *visitor's localStorage*, which is not a shared CRM or server receipt. The analytics script fired `generate_lead` on generic form submit and `book_consultation` when someone merely clicked the contact section. This change removes the fake browser CRM, clarifies the need to press **Send** in WhatsApp, and uses `contact_form_prepared`, `click_whatsapp` and `contact_cta_click` as engagement/intent measures. **No code change can confirm a WhatsApp message was sent without a reply/server-side integration.** Do not count these as paying customers. Future server-confirmed enquiries can legitimately emit `generate_lead`.

**P0 — Search Console sitemap hygiene.** The connected Google Search Console account for `https://appiex.com/`, as retrieved via Windsor.ai on 6 November, showed:
- `https://appiex.com/sitemap.xml`: 40 submitted URLs, 0 errors, last downloaded 5 November.
- `https://appiex.com/`: submitted as a sitemap incorrectly, 1 error.
- `https://appiex.com/legal/terms-of-service`: submitted as a sitemap incorrectly, 1 error.

Remove the two non-sitemap entries from the Sitemaps report in Google Search Console and keep only `https://appiex.com/sitemap.xml`. The latest GitHub sitemap has 44 entries, but the *connected Search Console data* reports 40; confirm which is actually live after deployment.

**P1 — Weak nonbranded visibility.** From 18 October through the latest available daily search report (3 November), the connected property recorded 56 daily-aggregated clicks; the available query report shows 53 branded `appiex` clicks and only one explicitly nonbranded click, `best software agency`. Privacy/anonymized query rows prevent a full keyword-by-keyword breakdown. Pages including `/blog/technical-seo-checklist-for-business-websites` (38 impressions, zero clicks) and `/web-development` (57 impressions, one click, with 54 known brand impressions) need buyer-intent discovery and credible evidence—not keyword stuffing.

## What this PR implements

1. Changes `index.html` to stop persisting visitor personal information in a fake shared localStorage CRM, accurately explain WhatsApp message handoff, and emit only anonymous intent events.
2. Changes `scripts/seo-conversion-tracker.js` to stop marking generic form submits as `generate_lead`, and stops treating contact CTAs as confirmed booked consultations.
3. Adds automated JS/handler syntax and event-integrity checks, plus a read-only scheduled/manual live SEO smoke workflow to catch missing deployed content.
4. Does **not** touch the actual lead receiver, domain routing, Vercel production credentials, visual design or application APIs.

## What still requires the site owner's action

- In Vercel, verify appiex.com is attached to the project that deploys `rayat927/appiex` `main`; compare the production commit with the latest GitHub `main` SHA and redeploy the newest commit if needed.
- Check the live homepage, the new AI/n8n guide, `robots.txt`, `sitemap.xml` and GA4 DebugView after deployment.
- In Search Console, clean up the two incorrectly submitted "sitemaps"; inspect important URLs and submit the correct XML sitemap.
- If Appiex wants server-confirmed form leads, implement a **real consent-aware backend** (spam protection, authenticated inbox/database or approved email route, encryption/access control, privacy notice) rather than the localStorage simulation.
- Track nonbranded impressions, organic landing-page visitors, qualified enquiries received in the actual inbox, and closed deals over comparable 28-day windows. Rankings and increased revenue cannot be guaranteed.

Official references:
- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- https://developers.google.com/analytics/devguides/collection/ga4/reference/events
