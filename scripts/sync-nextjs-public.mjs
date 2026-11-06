import fs from 'fs';
import path from 'path';

const root = process.cwd();
const publicDir = path.join(root, 'public');

// Directories to sync into public/
const assetDirs = [
  'assets',
  'images',
  'styles',
  'fonts',
  'scripts',
  '_nuxt',
  'admin',
  'authors',
  'blog',
  'pages',
  '.well-known'
];

// Clean stale directories from public/ if removed from root
for (const staleDir of ['_astro', 'wp-content']) {
  const stalePath = path.join(publicDir, staleDir);
  if (fs.existsSync(stalePath)) {
    fs.rmSync(stalePath, { recursive: true, force: true });
  }
}

// Root static files to sync into public/
const rootFiles = fs.readdirSync(root).filter(f => {
  return (
    f.endsWith('.html') ||
    f.endsWith('.png') ||
    f.endsWith('.ico') ||
    f.endsWith('.xml') ||
    f.endsWith('.txt') ||
    f.endsWith('.webmanifest') ||
    f.startsWith('google')
  ) && f !== 'test_curv.txt' && f !== 'scratch_cuberto_live.html';
});

fs.mkdirSync(publicDir, { recursive: true });

for (const dir of assetDirs) {
  const src = path.join(root, dir);
  const dest = path.join(publicDir, dir);
  if (fs.existsSync(src)) {
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }
    fs.cpSync(src, dest, { recursive: true, force: true });
  }
}

for (const file of rootFiles) {
  const src = path.join(root, file);
  const dest = path.join(publicDir, file);
  if (fs.existsSync(src) && fs.statSync(src).isFile()) {
    fs.copyFileSync(src, dest);
  }
}


/* Ship the exact installed Lenis distribution from our own Next.js server.
 * Avoid a third-party runtime CDN and keep the JavaScript/CSS versions paired. */
const lenisFiles = [
  ['node_modules/lenis/dist/lenis.min.js', 'scripts/vendor/lenis.min.js'],
  ['node_modules/lenis/dist/lenis.css', 'styles/vendor/lenis.css']
];
for (const [sourceFile, outputFile] of lenisFiles) {
  const source = path.join(root, sourceFile);
  if (!fs.existsSync(source)) {
    throw new Error(`Lenis asset missing: ${sourceFile}. Run npm ci before building.`);
  }
  const destination = path.join(publicDir, outputFile);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

console.log(`[Next.js Sync] Synced ${assetDirs.length} directories and ${rootFiles.length} root files to public/`);
