import fs from 'node:fs';
import path from 'node:path';
import { improveHtml } from '../src/lib/appiex-html-polish.mjs';

const root = process.cwd();
const isCheck = process.argv.includes('--check');
const pages = ['index.html', 'blog.html'];

function addPages(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) addPages(absolute);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      pages.push(path.relative(root, absolute).split(path.sep).join('/'));
    }
  }
}
addPages(path.join(root, 'blog'));

let changed = 0;
let legacyHeadlinesFixed = 0;
for (const relative of pages) {
  const full = path.join(root, relative);
  const original = fs.readFileSync(full, 'utf8');
  const route = relative === 'index.html' ? [] :
    (relative === 'blog.html' ? ['blog'] : relative.slice(0, -5).split('/'));
  const updated = improveHtml(original, route);

  if (updated !== original) {
    changed++;
    if (/id="cms-article-h1"/.test(original) &&
        (original.match(/<h1[^>]*id="cms-article-h1"[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] !==
        (updated.match(/<h1[^>]*id="cms-article-h1"[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]) {
      legacyHeadlinesFixed++;
    }
    if (!isCheck) fs.writeFileSync(full, updated, 'utf8');
  }
}

console.log(`Editorial static source: ${pages.length} HTML pages; ${changed} page(s) ${isCheck ? 'still need updating' : 'updated'}; ${legacyHeadlinesFixed} H1 fixes.`);
if (isCheck && changed) {
  console.error('Static HTML has fallen out of sync with the Appiex editorial renderer.');
  process.exitCode = 1;
}
