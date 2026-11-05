/**
 * Appiex Next.js migration preflight.
 * Run: npm run check:migration
 * Intentionally uses only Node built-ins; no network or private credentials.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + message);
};

const vercel = JSON.parse(read('vercel.json'));
const pkg = JSON.parse(read('package.json'));
const sitemap = read('sitemap.xml');
const homepage = read('index.html');

check(vercel.framework === 'nextjs', 'Vercel uses the Next.js framework preset');
check(!vercel.builds && !vercel.routes, 'No legacy Vercel builds or routing catch-all');
check(/\bnext build\b/.test(pkg.scripts?.build || ''), 'Build runs Next.js');
check(fs.existsSync(path.join(root, 'src/app/[[...slug]]/route.js')), 'Legacy HTML handler exists');
check(/<link rel="canonical" href="https:\/\/appiex\.com\/">/.test(homepage), 'Homepage canonical is preserved');
check(homepage.includes('G-DF198MPZGT'), 'GA4 measurement ID is preserved');
check(!/Planet Jupiter/i.test(homepage), 'Homepage H1 uses business-relevant copy');

for (const file of ['api/visitors.js', 'src/app/api/visitors/route.js']) {
  const source = read(file);
  check(!/ADMIN_KEY\s*=\s*process\.env\.ADMIN_KEY\s*\|\|/.test(source), file + ' fails closed without admin credentials');
  check(!/ntfy\.sh/.test(source), file + ' has no public visitor-data stream');
}

const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
check(urls.length > 0, 'Sitemap has URLs');

for (const url of urls) {
  const parsed = new URL(url);
  if (parsed.origin !== 'https://appiex.com') {
    failures.push('Sitemap has a foreign origin: ' + url);
    continue;
  }
  const rel = parsed.pathname === '/' ? 'index' : decodeURIComponent(parsed.pathname.slice(1));
  const candidateFiles = [rel + '.html', path.join(rel, 'index.html')];
  const found = candidateFiles.some((candidate) => fs.existsSync(path.join(root, candidate)));
  if (!found) failures.push('Sitemap destination missing: ' + url);
}
console.log('Checked ' + urls.length + ' sitemap URLs.');

if (failures.length) {
  console.error('Migration checks failed: ' + failures.length);
  for (const issue of failures) console.error(' - ' + issue);
  process.exitCode = 1;
} else {
  console.log('Migration checks passed.');
}
