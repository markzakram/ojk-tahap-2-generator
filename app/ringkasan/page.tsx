import type { Metadata } from 'next';
import Ringkasan from '@/components/Ringkasan';

export const metadata: Metadata = { title: 'Ringkasan — Generator Soal OJK PCAM Tahap 2' };

export default function Page() {
  return <Ringkasan />;
}
