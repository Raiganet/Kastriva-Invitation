import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  poweredByHeader: false,
  distDir: process.env.KI_E2E_DEMO==='true'?'.next-test':'.next',
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: "base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'" },
    ] }, ...['/u/:path*','/api/:path*','/dashboard/:path*','/admin/:path*','/login','/daftar','/lupa-password','/reset-password','/kirim-konfirmasi'].map(source=>({source,headers:[{key:'Cache-Control',value:'private, no-store, max-age=0'},{key:'X-Robots-Tag',value:'noindex, nofollow, noarchive'},{key:'Referrer-Policy',value:'no-referrer'}]})), { source: '/auth/:path*', headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }, { key: 'Cache-Control', value: 'private, no-store' }] }];
  },
  async redirects() {
    return [
      { source: '/templates', destination: '/tema', permanent: true },
      { source: '/pricing', destination: '/harga', permanent: true },
      { source: '/admin/login', destination: '/login?next=/admin', permanent: false },
      { source: '/preview/:slug', destination: '/demo/:slug', permanent: true },
    ];
  },
};
export default nextConfig;
