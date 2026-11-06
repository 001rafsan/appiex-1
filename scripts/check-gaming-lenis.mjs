import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('gaming.html', 'utf8');
const script = fs.readFileSync('scripts/appiex-gaming-lenis.js', 'utf8');
const sync = fs.readFileSync('scripts/sync-nextjs-public.mjs', 'utf8');

const vendorJs = '/scripts/vendor/lenis.min.js?v=20261107';
const appJs = '/scripts/appiex-gaming-lenis.js?v=20261107';
const vendorCss = '/styles/vendor/lenis.css?v=20261107';

assert(html.includes('<body class="gaming-page">'), 'Gaming page body missing');
assert(html.includes(vendorCss), 'Lenis recommended CSS not included');
assert(html.includes(vendorJs) && html.includes(appJs), 'Lenis scripts missing');
assert(html.indexOf(vendorJs) < html.indexOf(appJs), 'Load Lenis before initialization');
assert(html.includes('data-lenis-prevent'), 'Protect nested mobile menu scrolling');
assert(script.includes('prefers-reduced-motion'), 'Reduced-motion support must remain');
assert(script.includes('respectReducedMotion: true'), 'Lenis accessibility guard missing');
assert(script.includes('syncTouch: false'), 'Keep native touch scroll');
assert(script.includes('anchors:'), 'Gaming section anchor links must work');
assert(script.includes('pagehide'), 'Cleanup on navigation must remain');
assert(!html.includes('https://unpkg.com/lenis'), 'Runtime should not rely on a CDN');
assert(sync.includes('node_modules/lenis/dist/lenis.min.js'), 'Build must bundle installed Lenis JS');
assert(sync.includes('node_modules/lenis/dist/lenis.css'), 'Build must bundle matching Lenis CSS');
for (const asset of ['public/scripts/vendor/lenis.min.js', 'public/styles/vendor/lenis.css']) {
  assert(fs.existsSync(asset) && fs.statSync(asset).size > 100, 'Missing built Lenis asset: ' + asset);
}
assert.equal((html.match(/<h1\b/gi) || []).length, 1, 'SEO H1 duplicated');
assert(html.includes('href="https://appiex.com/gaming"'), 'Canonical URL changed');
console.log('Gaming Lenis checks passed: paired local assets, anchors, motion preferences, existing SEO.');
