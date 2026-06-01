/** @type {import('next').NextConfig} */
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
    typescript: {
        ignoreBuildErrors: true,
    },
    experimental: {
        optimizePackageImports: ['lucide-react', 'framer-motion'],
    },
};

export default nextConfig;