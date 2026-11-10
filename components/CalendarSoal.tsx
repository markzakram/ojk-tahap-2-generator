'use client';

import { useState } from 'react';
import type { CalendarTampilan } from '@/lib/deduktif/calendar/model';
import { HARI } from '@/lib/data/nama';
import Avatar from './Avatar';

// Interaksi sesuai blueprint: klik memilih, klik ulang membatalkan, reset, maksimal lima tanggal dengan umpan balik netral,
// akhir pekan tidak dinonaktifkan, dan jawaban kosong tidak dapat dikirim. Penilaian: himpunan tanggal sama persis.
export default function CalendarSoal({ item, kunci, tampilKunci }: { item: CalendarTampilan; kunci: number[]; tampilKunci: boolean }) {
  const [pilih, setPilih] = useState<number[]>([]);
  const [pesan, setPesan] = useState('');
  const [hasil, setHasil] = useState<boolean | null>(null);
  const { jumlahHari, hariPertama } = item.kalender;
  const sel = [...Array(hariPertama).fill(0), ...Array.from({ length: jumlahHari }, (_, i) => i + 1)];
  while (sel.length % 7) sel.push(0);

  const klik = (t: number) => {
    setHasil(null);
    if (pilih.includes(t)) { setPilih(pilih.filter((x) => x !== t)); setPesan(''); return; }
    if (pilih.length >= item.maksPilihan) { setPesan(`Maksimal ${item.maksPilihan} tanggal dapat dipilih.`); return; }
    setPilih([...pilih, t]); setPesan('');
  };
  const periksa = () => {
    const a = [...pilih].sort((x, y) => x - y).join(',');
    setHasil(a === [...kunci].sort((x, y) => x - y).join(','));
  };

  return (
    <div>
      <h2>{item.judul}</h2>
      <div className="orang-grid">
        {item.orang.map((o) => (
          <div className="orang" key={o.id}>
            <Avatar nama={o.nama} />
            <div><b>{o.nama}</b><span>{o.petunjuk.join(' ')}</span></div>
          </div>
        ))}
      </div>
      {item.paragraf.map((s) => <p className="instruksi" key={s}>{s}</p>)}
      <p className="instruksi"><b>{item.pertanyaan}</b></p>
      <p className="petunjuk-ui">Hari kerja: Senin–Jumat. Klik tanggal untuk memilih, klik lagi untuk membatalkan (maksimal {item.maksPilihan} tanggal).</p>
      <div className="kalender" role="grid" aria-label="Kalender">
        {HARI.map((h) => <div key={h} className="hdr">{h.slice(0, 3)}</div>)}
        {sel.map((t, i) => t === 0
          ? <div key={'x' + i} className="sel luar" />
          : <button key={t} className={`sel${pilih.includes(t) ? ' dipilih' : ''}${tampilKunci && kunci.includes(t) ? ' kunci' : ''}`} onClick={() => klik(t)} aria-pressed={pilih.includes(t)}>{t}</button>)}
      </div>
      <div className="aksi">
        <button className="btn" onClick={() => { setPilih([]); setPesan(''); setHasil(null); }}>Reset</button>
        <button className="btn utama" onClick={periksa} disabled={!pilih.length}>Periksa jawaban</button>
        <span className="status">{pesan || `${pilih.length} tanggal dipilih`}</span>
        {hasil !== null && <span className={`hasil ${hasil ? 'ok' : 'bad'}`}>{hasil ? 'Jawaban tepat' : 'Jawaban belum tepat'}</span>}
      </div>
    </div>
  );
}
