import type { Metadata } from 'next';
import Aplikasi from '@/components/gen/Aplikasi';

// Alamat lama /ringkasan membuka Dasbor generator.
export const metadata: Metadata = { title: 'Dasbor — Generator Soal OJK PCAM Tahap 2' };

export default function Page() {
  return <Aplikasi awal="dasbor" />;
}
