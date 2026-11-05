import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname, search } = request.nextUrl;

  // Server-side protection for the legacy admin UI. The old HTML password gate
  // did not protect sensitive data because its secret was visible in page source.
  const isAdminPath = /^\/admin(?:\/|$|\.html$)/i.test(pathname);
  if (isAdminPath) {
    const user = process.env.APPIEX_ADMIN_USER;
    const password = process.env.APPIEX_ADMIN_PASSWORD;
    const secureHeaders = {
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'Vary': 'Authorization'
    };

    if (!user || !password) {
      return new NextResponse('Admin access is not configured.', {
        status: 503,
        headers: secureHeaders
      });
    }

    const authorization = request.headers.get('authorization') || '';
    let verified = false;
    if (authorization.startsWith('Basic ')) {
      try {
        const decoded = atob(authorization.slice(6));
        const separator = decoded.indexOf(':');
        verified = separator > 0 &&
          decoded.slice(0, separator) === user &&
          decoded.slice(separator + 1) === password;
      } catch (_) {
        verified = false;
      }
    }
    if (!verified) {
      return new NextResponse('Admin authentication required.', {
        status: 401,
        headers: {
          ...secureHeaders,
          'WWW-Authenticate': 'Basic realm="Appiex Admin", charset="UTF-8"'
        }
      });
    }
  }

  // Block sensitive dotfiles or backup extensions (OWASP / Cloudflare Security)
  if (/^\/(?:\.env.*|.*\.(?:bak|sql|log|md)|scratch\/.*|\.git.*)$/i.test(pathname)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Redirect /home to /
  if (pathname.toLowerCase() === '/home' || pathname.toLowerCase() === '/home.html') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = search;
    return NextResponse.redirect(url, 308);
  }

  // Strip .html from any direct incoming request (except Google verification files)
  if (pathname.endsWith('.html') && !/^\/google[a-zA-Z0-9]+\.html$/i.test(pathname)) {
    let cleanPath = pathname.replace(/\/index\.html$/i, '/').replace(/\.html$/i, '');
    if (!cleanPath) cleanPath = '/';
    const url = request.nextUrl.clone();
    url.pathname = cleanPath;
    url.search = search;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|assets|images|styles|fonts|scripts|_astro|_nuxt|wp-content|favicon).*)',
  ],
};
