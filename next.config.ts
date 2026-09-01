import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/booking', destination: '/', permanent: true },
      { source: '/booking/:path*', destination: '/', permanent: true },
      { source: '/confirmation', destination: '/', permanent: true },
      { source: '/confirmation/:path*', destination: '/', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent site from being embedded in iframes (clickjacking)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Don't leak referrer URL to third-party sites
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Block camera, mic, location access
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          // Force HTTPS for 2 years
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Basic XSS protection for older browsers
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Hide server technology info
          { key: 'X-Powered-By', value: '' },
        ],
      },
    ]
  },
};

export default nextConfig;
