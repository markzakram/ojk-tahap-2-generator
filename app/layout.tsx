import type { Metadata } from 'next';
import './globals.css';

// Tampilan mengikuti generator Tahap 1: huruf sistem (Segoe UI), latar terang, panel putih.
export const metadata: Metadata = {
  title: 'Generator Soal OJK PCAM Tahap 2 — Tes Kemampuan Umum',
  description: 'Bangkitkan soal TKU Tahap 2 PCAM OJK dari family + seed, uji coba interaktif, dan periksa kunci serta pembahasannya.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
