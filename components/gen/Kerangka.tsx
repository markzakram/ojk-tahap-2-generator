'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

// Kerangka aplikasi bergaya UTBK/SKD Generator: menu samping (Dasbor, Buat paket, Hasil paket, Ekspor, Pustaka soal),
// isi halaman di kanan. Tautan Tahap 1 disembunyikan di dalam bingkai Portal karena portal sudah punya tab sendiri.

export type Tampilan = 'dasbor' | 'buat' | 'hasil' | 'ekspor' | 'pustaka';

const MENU: { id: Tampilan; label: string; ikon: string }[] = [
  { id: 'dasbor', label: 'Dasbor', ikon: 'M4 13h6V4H4zm0 7h6v-5H4zm10 0h6v-9h-6zm0-16v5h6V4z' },
  { id: 'buat', label: 'Buat paket', ikon: 'M12 5v14M5 12h14' },
  { id: 'hasil', label: 'Hasil paket', ikon: 'M5 4h14v16H5zM9 8h6M9 12h6M9 16h4' },
  { id: 'ekspor', label: 'Ekspor', ikon: 'M12 4v11m0 0-4-4m4 4 4-4M5 20h14' },
  { id: 'pustaka', label: 'Pustaka soal', ikon: 'M4 5h7v15H4zm9 0h7v15h-7z' },
];

function Ikon({ d }: { d: string }) {
  return <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

/**
 * `pilih`: bila ada, menu Dasbor–Ekspor berganti tampilan di halaman yang sama; tanpa `pilih` (halaman Studio) menu menjadi
 * tautan ke halaman utama dengan `?v=`. Pustaka soal selalu membuka Studio (/studio).
 */
export default function Kerangka({ aktif, pilih, info, children }: { aktif: Tampilan; pilih?: (t: Tampilan) => void; info?: React.ReactNode; children: React.ReactNode }) {
  const [dalamBingkai, setDalamBingkai] = useState(true);
  useEffect(() => { try { setDalamBingkai(window.self !== window.top); } catch { setDalamBingkai(true); } }, []);
  return (
    <div className="a-app">
      <aside className="a-sidebar">
        <div className="a-brand">
          <div className="a-brand-mark">2</div>
          <div><div className="a-brand-name">Generator Tahap 2</div><div className="a-kecil">PCAM OJK 2026 · Tes Kemampuan Umum</div></div>
        </div>
        <nav aria-label="Navigasi utama" className="a-nav">
          {MENU.map((m) => {
            const isi = <><Ikon d={m.ikon} /><span>{m.label}</span></>;
            if (m.id === 'pustaka') return <Link key={m.id} href="/studio" aria-current={aktif === m.id ? 'page' : undefined}>{isi}</Link>;
            if (pilih) return <button key={m.id} type="button" aria-current={aktif === m.id ? 'page' : undefined} onClick={() => pilih(m.id)}>{isi}</button>;
            return <Link key={m.id} href={`/?v=${m.id}`} aria-current={aktif === m.id ? 'page' : undefined}>{isi}</Link>;
          })}
        </nav>
        {info && <div className="a-profil">{info}</div>}
        {!dalamBingkai && (
          <div className="a-tahap">
            <div className="a-kecil">Pindah tahap</div>
            <a href="/tahap-1/index.html">Tahap 1 · Tes Potensi Dasar</a>
          </div>
        )}
      </aside>
      <main className="a-main">{children}</main>
    </div>
  );
}
