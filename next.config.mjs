const cspHeader = `
    default-src 'self';
    script-src 'self' https://pagead2.googlesyndication.com https://*.googleapis.com https://*.google.com https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com data:;
    img-src 'self' data: blob: https: http:;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://generativelanguage.googleapis.com https://rxnav.nlm.nih.gov https://api.fda.gov https://ipapi.co https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com https://*.googleapis.com https://api.resend.com;
    media-src 'self' data: blob:;
    frame-src 'self' https://googleads.g.doubleclick.net https://*.google.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

const securityHeaders = [
    {
        key: 'Content-Security-Policy',
        value: cspHeader
    },
    {
        key: 'X-DNS-Prefetch-Control',
        value: 'on'
    },
    {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload'
    },
    {
        key: 'X-Frame-Options',
        value: 'DENY'
    },
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
    },
    {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin'
    },
    {
        key: 'Permissions-Policy',
        value: 'camera=(self), microphone=(), geolocation=(), browsing-topics=()'
    },
    {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin'
    },
    {
        key: 'Cross-Origin-Resource-Policy',
        value: 'same-site'
    }
];

const nextConfig = {
    compress: true,
    reactStrictMode: true,
    poweredByHeader: false,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
        formats: ['image/avif', 'image/webp'],
    },
    experimental: {
        optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: securityHeaders,
            },
        ];
    },
};

export default nextConfig;