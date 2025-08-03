/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Enable static exports for better performance
  output: 'standalone',
  
  // Image optimization settings
  images: {
    domains: ['via.placeholder.com'],
    unoptimized: false,
  },

  // Custom headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Environment variable configuration
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Exotic Arbitrage Bot',
    NEXT_PUBLIC_MIN_PROFIT_THRESHOLD: process.env.NEXT_PUBLIC_MIN_PROFIT_THRESHOLD || '0.08',
    NEXT_PUBLIC_MIN_LIQUIDITY: process.env.NEXT_PUBLIC_MIN_LIQUIDITY || '1500',
  },

  // Experimental features
  experimental: {
    // Enable app directory if needed in future
    appDir: false,
  },

  // Build-time optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // API routes configuration
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },

  // Performance optimizations
  poweredByHeader: false,
  generateEtags: false,
};

module.exports = nextConfig;