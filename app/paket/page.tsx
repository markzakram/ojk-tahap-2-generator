import type { Metadata } from 'next';
import Paket from '@/components/Paket';

// Alamat lama /paket tetap membuka generator (halaman utama kini /).
export const metadata: Metadata = { title: 'Generator — Generator Soal OJK PCAM Tahap 2' };

export default function Page() {
  return <Paket />;
}
