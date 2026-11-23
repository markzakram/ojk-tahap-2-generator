import type { Metadata } from 'next';
import Kerangka from '@/components/gen/Kerangka';
import Studio from '@/components/Studio';

export const metadata: Metadata = { title: 'Pustaka soal (Studio) — Generator Soal OJK PCAM Tahap 2' };

export default function Page() {
  return (
    <Kerangka aktif="pustaka">
      <Studio />
    </Kerangka>
  );
}
