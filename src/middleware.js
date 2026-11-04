import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname, search } = request.nextUrl;

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
