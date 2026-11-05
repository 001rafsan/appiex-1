import assert from 'node:assert/strict';
import fs from 'node:fs';

const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
assert.equal(config.framework, 'nextjs', 'Vercel must build using the Next.js framework preset');
assert(!('builds' in config), 'Legacy builds overrides Next.js framework compilation');
assert(!('routes' in config), 'Legacy routes can bypass Next.js app routing and conflict with redirects');
assert(!('outputDirectory' in config), 'Do not force static output for the Next.js renderer');
assert(pkg.scripts.build?.includes('next build'), 'Build must execute next build');
assert(fs.existsSync('src/app/[[...slug]]/route.js'), 'Catch-all Next.js HTML route missing');
assert(fs.existsSync('src/lib/appiex-html-polish.mjs'), 'Blog renderer missing');
assert(fs.existsSync('styles/appiex-editorial-polish.css'), 'Shared blog design stylesheet missing');
assert(fs.existsSync('scripts/sync-nextjs-public.mjs'), 'Static asset sync script missing');
const redirects = config.redirects || [];
assert(redirects.some(rule =>
  rule.destination === 'https://appiex.com/:path*' &&
  rule.has?.some(match => match.type === 'host' && match.value === 'www.appiex.com')),
  'www → apex canonical redirect missing');
console.log('Vercel config passed: framework-aware Next.js deployment, no legacy static builders/routes, canonical host redirect retained.');
