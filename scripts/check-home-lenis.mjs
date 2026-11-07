import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const script = fs.readFileSync('scripts/appiex-home-lenis.js', 'utf8');

const vendorJs = '/scripts/vendor/lenis.min.js?v=20261107';
const appJs = '/scripts/appiex-home-lenis.js?v=20261107';
const vendorCss = '/styles/vendor/lenis.css?v=20261107';

assert(html.includes(vendorCss), 'Lenis CSS link missing in head');
assert(html.includes(vendorJs) && html.includes(appJs), 'Lenis scripts missing in index.html');
assert(html.indexOf(vendorJs) < html.indexOf(appJs), 'Lenis library must load before home script');
assert(script.includes('autoRaf: true'), 'autoRaf must be enabled for hardware sync');
assert(script.includes('easing: (t) => 1 - Math.pow(1 - t, 4)'), 'Must use quartic easing matching gaming page');
assert(script.includes('duration: 1.05'), 'Duration must match gaming page (1.05s)');
assert(script.includes('respectReducedMotion: true'), 'Accessibility guard required');
assert(script.includes('syncTouch: false'), 'Must preserve native touch physics');
assert(script.includes('window.lenis = instance;'), 'Global instance must be exposed');
assert(script.includes('pagehide'), 'Cleanup on navigation must exist');
console.log('Home Lenis smooth scroll validation passed!');
