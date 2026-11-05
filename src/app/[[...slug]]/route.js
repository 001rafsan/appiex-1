import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { improveHtml } from '../../lib/appiex-html-polish.mjs';

export const runtime = 'nodejs';

function resolveHtmlPath(slugArray) {
  const rootDir = process.cwd();
  const publicDir = path.join(rootDir, 'public');

  const relPath = (!slugArray || slugArray.length === 0) ? 'index' : slugArray.join('/');

  // Prevent directory traversal
  const normalized = path.posix.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');

  const candidates = [
    path.join(publicDir, `${normalized}.html`),
    path.join(publicDir, normalized, 'index.html'),
    path.join(rootDir, `${normalized}.html`),
    path.join(rootDir, normalized, 'index.html')
  ];

  // If the slug already ended with .html (e.g. google verification)
  if (normalized.endsWith('.html')) {
    candidates.unshift(
      path.join(publicDir, normalized),
      path.join(rootDir, normalized)
    );
  }

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    } catch (e) {}
  }

  return null;
}


export async function GET(request, context) {
  const params = await context.params;
  const slug = (params && params.slug) ? params.slug : [];

  // Block sensitive dotfiles or backup extensions
  const joined = '/' + slug.join('/');
  if (/^\/(?:\.env.*|.*\.(?:bak|sql|log|md)|scratch\/.*|\.git.*)$/i.test(joined)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const htmlFile = resolveHtmlPath(slug);

  if (htmlFile) {
    const htmlContent = improveHtml(fs.readFileSync(htmlFile, 'utf8'), slug);
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
  }

  // Fallback to custom 404.html if route doesn't exist
  const notFoundFile = resolveHtmlPath(['404']);
  if (notFoundFile) {
    const html404 = fs.readFileSync(notFoundFile, 'utf8');
    return new NextResponse(html404, {
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  }

  return new NextResponse('404 Not Found', { status: 404 });
}

export async function HEAD(request, context) {
  const res = await GET(request, context);
  return new NextResponse(null, {
    status: res.status,
    headers: res.headers
  });
}
