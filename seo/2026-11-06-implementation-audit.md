# Appiex keyword evidence and SEO implementation audit
Date: November 6, 2026

## What was actually checked
- Reviewed the structure of **20 uploaded files** (seven CSVs and thirteen XLSX workbooks), including the large keyword master, the 630,000-candidate workbook, five service-specific workbooks, referral and partnership research, site destination maps, and executive plans.
- Processed every row in the seven uploaded CSV datasets with a streamed parser, including the 600,000-row global master and 113,653-row AI subset. Exact within-file duplicate count: **zero** for those two files. These files overlap each other and must **not** be added together as independent opportunities.
- Sampled and examined workbook sheet structure and research caveats. The 630,000 candidate count in the workbook is its stated count, **not** a verified count of search demand or a guarantee of independent SEO opportunities. The Bangladesh prospect list is a business development lead dataset, not a source of SEO ranking keywords, and no contacts were exposed.
- The keyword sets repeatedly label search volume, keyword difficulty, current rankings, and even intent as **not validated**. No verified Google Search Console or paid keyword-provider metrics were available.

## Main reliability problems
1. The 35,280 phrase map contains proposed /services/... URLs that are not the preferred existing Appiex service URLs. The 600,000 master likewise contains many proposed .html paths, which must map to canonical clean URLs.
2. The 5,540 referral/partnership dataset refers to an older appiex.vercel.app host and a proposed /partnerships slug. Appiex currently uses https://appiex.com/refer and https://appiex.com/partners.
3. Many of the 78 page destinations are proposed, not verified production pages. Do not produce hundreds of near-duplicate niche, city or keyword-variation pages.
4. The indexable business pages need unique user-focused titles and descriptions, useful original content, and internal links that help visitors reach the right service or quote.
5. Many uploaded candidates are mechanically generated combinations rather than observed search queries. Do not represent them as top-ranked, high-volume or proven leads.

## Changes made on this SEO branch
- Modified 17 **existing HTML content pages only**: homepage, core services, referral and partnership pages, projects, case studies and blog landing. No application source, framework routes, API handlers, CSS, build configuration or analytics scripts were edited.
- Updated titles, meta descriptions and the existing social-preview metadata to clarify page intent and differentiate services.
- Updated the homepage hero introduction and agency partner introduction while preserving layouts and calls to action.
- Replaced large keyword-chip blocks on five service pages (ecommerce, n8n, WhatsApp, redesign, ISP software) with practical buyer checklists and contextual links to existing canonical resources.
- Reconciled existing JSON-LD Service, Organization, WebPage and CollectionPage descriptions and pared overly broad knowsAbout lists to specific factual capabilities.
- Removed non-ranking meta keywords tags from affected pages; Google does not use them for ranking.

## Keyword placement policy
- Use one primary buyer intent per page, with a few natural related concepts.
- Differentiate home = broad software company; /web-development = website build; /ai-automation = AI agents; /n8n-automation = integration/workflow; /whatsapp-automation = official messaging use cases; /seo-marketing = technical SEO; /refer = introducer program; /partners = B2B agency outsourcing.
- Preserve informational intent for existing blog articles. Do not create thin duplicates for terms like "AI automation agency for (every city)".
- Avoid unverified performance claims, guaranteed Google ranks, unsupported locations and false case studies.
- Paid-search and SEO search-volume estimates are unverified until validated in an appropriate analytics source.

## Verification needed after deployment
1. Confirm Vercel has deployed the new `main` commit and spot-check all edited pages at desktop and mobile widths.
2. Check HTTP 200 responses, canonical tags, robots tags and valid JSON-LD on deployed URLs.
3. Confirm Google Search Console ownership, sitemap submission and the Page Indexing and Search Performance reports.
4. Measure Google organic clicks, non-branded queries, CTR and assisted conversions by landing page.
5. Validate GA4/lead attribution: source inspection found the GA4 measurement snippet on the homepage but not in the sampled service HTML files. This may limit cross-page attribution; it was **not** changed in this SEO-content-only pass.
6. Verify WhatsApp clicks, project form completions, qualified consultations and eventual paying customers before declaring conversion growth.

## Source references
- Google Search Essentials: https://developers.google.com/search/docs/essentials
- Google Search Central spam policies: https://developers.google.com/search/docs/essentials/spam-policies
- Google helpful-content guidance: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Keyword-to-page map: seo/2026-11-06-keyword-to-page-map.csv
- Existing prior map: seo/appiex-buyer-intent-keywords-2026.csv

**No rankings, lead numbers or conversion lifts are guaranteed or claimed by this audit.**
