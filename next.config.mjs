/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  outputFileTracingIncludes: {
    '/[[...slug]]': [
      './*.html',
      './blog/**/*',
      './authors/**/*',
      './admin/**/*',
      './pages/**/*'
    ]
  },
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true
      },
      {
        source: '/index.html',
        destination: '/',
        permanent: true
      },
      {
        source: '/:path+/index.html',
        destination: '/:path+',
        permanent: true
      },
      {
        source: '/:path((?!google[a-zA-Z0-9]+).+)\\.html',
        destination: '/:path',
        permanent: true
      },
      {
        source: '/journal',
        destination: '/blog',
        permanent: true
      },
      {
        source: '/media',
        destination: '/projects',
        permanent: true
      },
      {
        source: '/gallery',
        destination: '/projects',
        permanent: true
      },
      {
        source: '/about',
        destination: '/team',
        permanent: true
      },
      {
        source: '/careers',
        destination: '/team',
        permanent: true
      },
      {
        source: '/protocol',
        destination: '/projects',
        permanent: true
      },
      {
        source: '/legal/terms-of-service',
        destination: '/terms-of-service',
        permanent: true
      },
      {
        source: '/legal/privacy-policy',
        destination: '/privacy-policy',
        permanent: true
      },
      {
        source: '/pages/product-design',
        destination: '/ui-ux-3d-design',
        permanent: true
      },
      {
        source: '/pages/contacts',
        destination: '/#contact',
        permanent: true
      }
    ];
  },
  async rewrites() {
    return {
      fallback: [
        {
          source: '/:folder(_nuxt|three|gltf|models|videos|audio|data|svg|images)/:path*',
          destination: 'https://kprverse.com/:folder/:path*'
        }
      ]
    };
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com https://fonts.bunny.net https://va.vercel-scripts.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com https://fonts.bunny.net; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com https://fonts.bunny.net https://cdnjs.cloudflare.com; media-src 'self' data: blob: https:; connect-src 'self' https://ntfy.sh https://va.vercel-scripts.com https://vitals.vercel-insights.com https://*.vercel.app https://backend.watchshopbd.com https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://*.google.com https://*.firebaseio.com https://*.googleapis.com; frame-src 'self' https://www.youtube.com https://player.vimeo.com https://*.vercel.app; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin'
          }
        ]
      },
      {
        source: '/:folder(assets|images|styles|fonts|_astro|_nuxt|three|gltf|models|videos|audio|data|svg)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/:page(admin|login|profile|gaming|collections|resume|rafsan_page|scratch_cuberto_live)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
