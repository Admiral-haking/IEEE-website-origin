import path from 'path';

/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const nextConfig = {
  // Disable React Strict Mode in development to avoid double-invoked effects
  // that cause axios-hooks AbortError spam. Keep it enabled in production builds.
  reactStrictMode: isProd,
  poweredByHeader: false,
  compress: true,
  // Avoid bundling heavy server packages that cause vendor-chunk resolution issues in dev
  serverExternalPackages: ['nodemailer', 'mime-types', 'mime-db'],
  experimental: process.env.NODE_ENV === 'production' ? {
    optimizePackageImports: ['@mui/material', '@mui/icons-material']
  } : {},
  // Disable Next DevTools to avoid RSC client-manifest issues in some environments
  env: {
    NEXT_DISABLE_DEVTOOLS: '1',
  },
  async headers() {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const isProd = process.env.NODE_ENV === 'production';
    const common = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'X-DNS-Prefetch-Control', value: 'off' },
      { key: 'Content-Security-Policy', value: csp({ dev: !isProd }) },
      ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
    ];
    return [
      {
        source: '/api/:path*',
        headers: [
          ...common,
          { key: 'Access-Control-Allow-Origin', value: origin },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,PUT,DELETE,OPTIONS' },
        ],
      },
      {
        source: '/:path*',
        headers: common,
      },
    ];
  },
  webpack(config, { dev }) {
    if (dev) {
      // Force webpack/watchpack to use polling to avoid inotify ENOSPC
      config.watchOptions = {
        ...(config.watchOptions || {}),
        poll: Number(process.env.WATCHPACK_POLL_INTERVAL || 1000),
        // reduce noisy watching (do not ignore .next; Next manages it)
        ignored: ["**/.git/**", "**/node_modules/**"],
      };
      // Mitigate pack file rename/cache errors in some filesystems
      config.cache = false;
    }
    return config;
  },
  // Ensure correct root when multiple lockfiles exist (monorepo-like)
  outputFileTracingRoot: path.join(process.cwd()),
};

export default nextConfig;

function csp({ dev } = { dev: false }) {
  const level = process.env.CSP_LEVEL || (dev ? 'dev' : 'standard');

  const connectOrigins = new Set();
  const addOrigin = (value) => {
    if (!value) return;
    try {
      const u = new URL(value);
      connectOrigins.add(u.origin);
    } catch {
      // Ignore invalid URLs
    }
  };

  addOrigin(process.env.NEXT_PUBLIC_API_BASE_URL);
  addOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  addOrigin(process.env.OPENAI_BASE_URL);
  addOrigin(process.env.DEEPSEEK_BASE_URL);

  const scriptSrc = ["'self'"];
  const allowInlineScripts = level !== 'strict';
  const allowEval = dev && level === 'dev';
  if (allowInlineScripts) scriptSrc.push("'unsafe-inline'");
  if (allowEval) scriptSrc.push("'unsafe-eval'");

  const styleSrc = ["'self'", "'unsafe-inline'"];

  const imgSrc = ["'self'", "data:", "blob:", "https:"];
  const fontSrc = ["'self'", "data:"];

  const connectSrc = new Set();
  connectSrc.add("'self'");
  if (dev) {
    connectSrc.add("http:");
    connectSrc.add("https:");
    connectSrc.add("ws:");
    connectSrc.add("wss:");
  } else {
    connectSrc.add("https:");
  }
  for (const origin of connectOrigins) connectSrc.add(origin);

  const directives = {
    'default-src': ["'self'"],
    'script-src': scriptSrc,
    'style-src': styleSrc,
    'img-src': imgSrc,
    'font-src': fontSrc,
    'connect-src': Array.from(connectSrc),
    'media-src': ["'self'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };

  return Object.entries(directives)
    .map(([name, values]) => `${name} ${Array.from(new Set(values.filter(Boolean))).join(' ')}`)
    .join('; ');
}
