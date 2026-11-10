import type { Metadata } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

// Tipografi desain C + A: Plus Jakarta Sans untuk antarmuka, JetBrains Mono untuk seed, uid, dan kode.
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-jakarta', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono-app', display: 'swap' });

export const metadata: Metadata = {
  title: 'TKU Studio — Generator Soal JadiOJK',
  description: 'Bangkitkan soal TKU Tahap 2 PCAM OJK dari family + seed, uji coba interaktif, dan periksa kunci serta pembahasannya.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" className={`${jakarta.variable} ${mono.variable}`}><body>{children}</body></html>;
}
