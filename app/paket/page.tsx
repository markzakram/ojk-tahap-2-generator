import type { Metadata } from 'next';
import Aplikasi from '@/components/gen/Aplikasi';

// Alamat lama /paket membuka Hasil paket pada generator.
export const metadata: Metadata = { title: 'Hasil paket — Generator Soal OJK PCAM Tahap 2' };

export default function Page() {
  return <Aplikasi awal="hasil" />;
}
