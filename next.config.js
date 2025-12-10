/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "img-src 'self' data: blob:",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "script-src 'self'",
      "connect-src 'self' https://api.deepseek.com https://kg-api.cloud",
      "frame-ancestors 'none'",
    ].join('; ')

    const common = [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
    ]

    return [
      {
        source: '/:path*',
        headers: common,
      },
    ]
  },
}

module.exports = nextConfig
