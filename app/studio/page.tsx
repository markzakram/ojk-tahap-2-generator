import type { Metadata } from 'next';
import Studio from '@/components/Studio';

export const metadata: Metadata = { title: 'Studio — TKU Studio' };

export default function Page() {
  return <Studio />;
}
