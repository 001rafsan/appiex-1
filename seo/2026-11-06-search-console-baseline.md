# Appiex Search Console baseline (18 October–4 November 2026)

Source: Google Search Console property `https://appiex.com/` read via the connected Windsor.ai `searchconsole` data source on 6 November 2026. Search Console limits/anonymizes some query data; query totals, page totals and daily totals may differ because of aggregation and privacy.

## Actual observed traffic
- **56** Google Search clicks across the available daily rows (last reported date 3 November, even though the requested range ended 4 November).
- Country grouping: Bangladesh **53 clicks / 103 impressions**, United States **2 / 31**, India **1 / 6**; 25 other countries had impressions but zero clicks.
- Query grouping: branded `appiex`: **53 clicks / 83 impressions / avg position 1.41**. `best software agency`: **1 click / 1 impression / avg position 2**. Remaining visible nonbranded queries recorded zero clicks.
- The query report exposed only **10 queries**. It is not a complete query universe and cannot establish total nonbranded clicks with precision.

## Real nonbrand query opportunities in GSC
| Query | Impressions | Clicks | Average position | Canonical landing page |
|---|---:|---:|---:|---|
| web design referral program | 4 | 0 | 100.25 | /refer |
| software agency | 2 | 0 | 52.50 | /best-software-agency |
| custom software vs saas | 1 | 0 | 86.00 | /blog/custom-software-vs-saas-which-is-better |
| saas custom software | 1 | 0 | 99.00 | /blog/custom-software-vs-saas-which-is-better |
| cost of custom web development in 2026 | 1 | 0 | 86.00 | /blog/how-much-does-a-custom-website-cost-in-2026 |
| website development cost | 1 | 0 | 87.00 | /blog/website-development-cost-bangladesh |
| website development cost in bangladesh | 1 | 0 | 77.00 | /blog/website-development-cost-bangladesh |
| website making price | 1 | 0 | 8.00 | /blog/website-development-cost-bangladesh |

These observations are too sparse for confident volume/competition estimates; do not interpret the high positions for the `appiex` brand as evidence of top nonbranded rankings.

## Page signals requiring careful interpretation
- /web-development: 57 impressions, 1 click. The query+page report attributes **54 impressions** to the brand `appiex`.
- /services: 64 impressions, zero clicks. The query+page report attributes **52 impressions** to the brand.
- /blog/technical-seo-checklist-for-business-websites: 38 impressions, zero clicks; query details may be anonymized.
- /ai-automation: 23 impressions, zero clicks; **19 visible branded impressions**.
- /blog/website-development-cost-bangladesh: 4 impressions, zero clicks.
- /refer: 22 impressions, 1 click; query+page shows the click came from `appiex`.

## Implementation actions
1. Use helpful buyer language on the existing /refer page and website-cost guides; do not generate exact-match doorway pages.
2. Publish one substantive, relevant new topic `/blog/ai-agents-vs-n8n-automation-for-business` based on current AI industry interest, **not** because Search Console has proved existing demand for that exact query.
3. Keep internal links from AI and n8n service pages and maintain canonical/indexing consistency.
4. Validate the new content is actually live on appiex.com after GitHub deployment.
5. Track 28-day and 90-day nonbranded queries, clicks, landing pages, WhatsApp clicks and **confirmed qualified leads**. A form submit attempt or click is not a paying client.

## Measurement caveat
The repository currently loads `/scripts/seo-conversion-tracker.js` on the inspected service pages. This script dynamically initializes Google Analytics if necessary; absence of the inline GA snippet in service HTML **does not alone prove GA4 is missing**. Verify observed requests and DebugView on the deployed website. The script also sends `generate_lead` for generic form submissions; this should not be treated as verified converted business leads without reconciliation to the CRM.

## Public guidance
- https://developers.google.com/search/docs/monitor-debug/google-analytics-search-console
- https://developers.google.com/search/docs/monitor-debug/bubble-chart-analysis
- https://developers.google.com/search/docs/monitor-debug/trends-start
