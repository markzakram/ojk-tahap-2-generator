// TKU_PORTAL=1: ekspor statis untuk portal gabungan Tahap 1 + Tahap 2 (folder ../Portal). Hasilnya HTML/JS biasa
// di out/ yang dilayani portal di /tahap-2/, tanpa server Next. Tanpa variabel itu konfigurasinya tidak berubah.
const portal = process.env.TKU_PORTAL === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  ...(portal ? { output: 'export', basePath: '/tahap-2', trailingSlash: true, images: { unoptimized: true } } : {}),
};
export default nextConfig;
