/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: [],
    },
    async rewrites() {
        const isDev = process.env.NODE_ENV !== 'production'
        if (isDev) {
            return [
                {
                    source: '/api/:path*',
                    destination: 'http://localhost:3001/:path*',
                },
            ]
        }
        return []
    },
    async headers() {
        const isDev = process.env.NODE_ENV !== 'production'
        const scriptSrc = isDev ? "script-src 'self' 'unsafe-eval'" : "script-src 'self'"
        const connectSrc = isDev
            ? "connect-src 'self' ws: http://localhost:* https://api.deepseek.com https://kg-api.cloud"
            : "connect-src 'self' https://api.deepseek.com https://kg-api.cloud"
        const csp = [
            "default-src 'self'",
            "img-src 'self' data: blob:",
            "style-src 'self' 'unsafe-inline'",
            "font-src 'self' data:",
            scriptSrc,
            connectSrc,
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
