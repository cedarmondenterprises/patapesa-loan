/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      // Public brand assets change infrequently. Next.js already gives hashed
      // /_next/static assets an immutable one-year cache; these explicit rules
      // give the same Lighthouse-friendly treatment to files in /public without
      // ever caching HTML, authenticated pages or API responses.
      ...['/favicon.svg', '/social-preview.png', '/social-preview.svg'].map((source) => ({
        source,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400',
          },
        ],
      })),
      ...['/robots.txt', '/sitemap.xml', '/ads.txt'].map((source) => ({
        source,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      })),
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};
