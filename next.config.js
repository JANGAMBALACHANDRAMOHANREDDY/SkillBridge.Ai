/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pexels.com' },
    ],
  },
  webpack: (config) => {
    // Suppress the harmless "Critical dependency: the request of an expression"
    // warning from @supabase/realtime-js which uses dynamic requires internally.
    config.module = config.module || {};
    config.module.exprContextCritical = false;
    return config;
  },
};

module.exports = nextConfig;
