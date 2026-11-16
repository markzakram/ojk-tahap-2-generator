import type { Metadata } from 'next';
import Studio from '@/components/Studio';

export const metadata: Metadata = { title: 'Studio — Generator Soal OJK PCAM Tahap 2' };

export default function Page() {
  return <Studio />;
}
