// TKU_PORTAL=1: ekspor statis untuk portal gabungan Tahap 1 + Tahap 2 (folder ../Portal). Hasilnya HTML/JS biasa
// di out/ yang dilayani portal di /tahap-2/, tanpa server Next. Tanpa variabel itu konfigurasinya tidak berubah.
const portal = process.env.TKU_PORTAL === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  // alamat dasar untuk aset statis yang dirujuk langsung (foto orang di components/Avatar.tsx)
  env: { NEXT_PUBLIC_BASE_PATH: portal ? '/tahap-2' : '' },
  ...(portal ? { output: 'export', basePath: '/tahap-2', trailingSlash: true, images: { unoptimized: true } } : {
    // halaman Tahap 1 (public/tahap-1, disalin scripts/salin-tahap-1.mjs) memakai alamat relatif, jadi dibuka lewat index.html-nya
    async redirects() { return [{ source: '/tahap-1', destination: '/tahap-1/index.html', permanent: false }]; },
  }),
};
export default nextConfig;
