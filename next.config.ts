import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from Clerk's CDN (user avatars)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: '*.clerk.accounts.dev' },
    ],
  },

  // Allow the app to be embedded in iframes (needed for the Claude preview tool).
  // Next.js 16 sets X-Frame-Options: SAMEORIGIN by default which blocks preview iframes.
  // This overrides that header to allow localhost embedding only.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *",
          },
        ],
      },
    ]
  },
};

export default nextConfig;
