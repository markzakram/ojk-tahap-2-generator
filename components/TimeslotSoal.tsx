'use client';

import { useState } from 'react';
import { JUMLAH_KOTAK, WARNA_OPSI, jam, menit, rentang, type Susunan, type TimeslotItem } from '@/lib/deduktif/timeslot/model';

// Interaksi sesuai Blueprint Timeslot §7: seret (atau klik opsi lalu klik kotak mulai) dengan pratinjau sepanjang durasi,
// snap ke kotak 30 menit, tidak boleh menumpuk/menimpa abu-abu/melewati 18.00, kegiatan dapat dipindah utuh, opsi yang sudah
// ditempatkan dipudarkan, ada reset. Warna mengikuti posisi opsi dan bukan tanda benar/salah.
export default function TimeslotSoal({ item, kunci, tampilKunci }: { item: TimeslotItem; kunci: Susunan; tampilKunci: boolean }) {
  const [posisi, setPosisi] = useState<Record<string, number | null>>(() => Object.fromEntries(item.opsi.map((o) => [o.id, null])));
  const [aktif, setAktif] = useState<string | null>(null);
  const [arah, setArah] = useState<number | null>(null);
  const [pesan, setPesan] = useState('');
  const [hasil, setHasil] = useState<boolean | null>(null);

  const warna = (id: string) => WARNA_OPSI[item.opsi.findIndex((o) => o.id === id)];
  const dur = (id: string) => item.opsi.find((o) => o.id === id)!.durasi;
  const pemilik = (i: number, kecuali?: string): string | null => {
    const t = item.tetap.find((x) => i >= x.mulai && i < x.mulai + x.durasi);
    if (t) return 'tetap';
    for (const o of item.opsi) if (o.id !== kecuali && posisi[o.id] !== null && i >= posisi[o.id]! && i < posisi[o.id]! + o.durasi) return o.id;
    return null;
  };
  const muat = (id: string, m: number) => {
    if (m + dur(id) > JUMLAH_KOTAK) return 'Kegiatan tidak boleh melewati pukul 18.00.';
    for (let i = m; i < m + dur(id); i++) if (pemilik(i, id)) return 'Kegiatan tidak boleh menumpuk dengan kegiatan lain.';
    return null;
  };
  const taruh = (id: string, m: number) => {
    setHasil(null);
    const salah = muat(id, m);
    if (salah) { setPesan(salah); return; }
    setPosisi({ ...posisi, [id]: m }); setAktif(null); setPesan('');
  };
  const kembalikan = (id: string) => { setPosisi({ ...posisi, [id]: null }); setAktif(null); setHasil(null); };
  const semua = item.opsi.every((o) => posisi[o.id] !== null);
  const periksa = () => setHasil(item.opsi.every((o) => posisi[o.id] === kunci[o.id]));

  // Pratinjau: kotak yang akan diisi opsi aktif bila dilepas di kotak `arah`.
  const pratinjau = aktif !== null && arah !== null ? { dari: arah, sampai: arah + dur(aktif), sah: !muat(aktif, arah) } : null;

  const sel: React.ReactNode[] = [];
  for (let i = 0; i < JUMLAH_KOTAK;) {
    const t = item.tetap.find((x) => x.mulai === i);
    const o = item.opsi.find((x) => posisi[x.id] === i);
    if (t) {
      sel.push(<div key={'t' + i} className="ts-tetap" style={{ gridColumn: `span ${t.durasi}` }} title={`${t.nama} ${rentang(t.mulai, t.durasi)}`}><span>{t.nama}</span></div>);
      i += t.durasi;
    } else if (o) {
      sel.push(
        <button key={'o' + i} className={`ts-blok${aktif === o.id ? ' aktif' : ''}`} style={{ gridColumn: `span ${o.durasi}`, background: warna(o.id) }}
          title={`${o.nama} ${rentang(i, o.durasi)}`} draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', o.id); setAktif(o.id); }}
          onClick={(e) => { e.stopPropagation(); setAktif(aktif === o.id ? null : o.id); }}>
          {o.nama}
        </button>,
      );
      i += o.durasi;
    } else {
      const m = i;
      const dalam = pratinjau && m >= pratinjau.dari && m < pratinjau.sampai;
      sel.push(
        <div key={'k' + i} data-kotak={m} title={`${jam(m)}–${jam(m + 1)}`} className={`ts-kotak${dalam ? (pratinjau!.sah ? ' pratinjau' : ' tolak') : ''}${tampilKunci && item.opsi.some((x) => m >= kunci[x.id] && m < kunci[x.id] + x.durasi) ? ' kunci' : ''}`}
          onMouseEnter={() => setArah(m)} onMouseLeave={() => setArah(null)}
          onDragOver={(e) => { e.preventDefault(); setArah(m); }} onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) taruh(id, m); setArah(null); }}
          onClick={() => { if (aktif) taruh(aktif, m); }} />,
      );
      i++;
    }
  }

  return (
    <div>
      <h2>{item.judul}</h2>
      {item.paragraf.map((s) => <p className="instruksi" key={s}>{s}</p>)}
      <div className="ts-opsi" onClick={() => aktif && posisi[aktif] !== null && kembalikan(aktif)}>
        {item.opsi.map((o) => (
          <button key={o.id} className={`ts-pilihan${posisi[o.id] !== null ? ' terpakai' : ''}${aktif === o.id ? ' aktif' : ''}`}
            style={{ borderLeftColor: warna(o.id) }} draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/plain', o.id); setAktif(o.id); }}
            onClick={(e) => { e.stopPropagation(); setAktif(aktif === o.id ? null : o.id); setPesan(''); }}>
            <span className="ts-warna" style={{ background: warna(o.id) }} />
            <b>{o.nama}</b><span>{menit(o.durasi)}</span>
          </button>
        ))}
      </div>
      <p className="petunjuk-ui">Seret kegiatan ke papan, atau klik kegiatan lalu klik kotak mulainya. Klik kegiatan di papan untuk memindahkannya; klik area daftar kegiatan untuk mengembalikannya. Arahkan kursor ke kotak abu-abu untuk melihat kegiatan tetap.</p>
      <div className="ts-papan">
        <div className="ts-jam">{Array.from({ length: JUMLAH_KOTAK / 2 + 1 }, (_, h) => <span key={h} style={{ left: `${(h * 2 * 100) / JUMLAH_KOTAK}%` }}>{jam(h * 2)}</span>)}</div>
        <div className="ts-baris" style={{ gridTemplateColumns: `repeat(${JUMLAH_KOTAK}, minmax(0, 1fr))` }}>{sel}</div>
      </div>
      <div className="aksi">
        <button className="btn" onClick={() => { setPosisi(Object.fromEntries(item.opsi.map((o) => [o.id, null]))); setAktif(null); setPesan(''); setHasil(null); }}>Reset</button>
        <button className="btn utama" onClick={periksa} disabled={!semua}>Periksa jawaban</button>
        <span className="status">{pesan || (semua ? 'Keempat kegiatan sudah ditempatkan' : `${item.opsi.filter((o) => posisi[o.id] === null).length} kegiatan belum ditempatkan`)}</span>
        {hasil !== null && <span className={`hasil ${hasil ? 'ok' : 'bad'}`}>{hasil ? 'Jawaban tepat' : 'Jawaban belum tepat'}</span>}
      </div>
    </div>
  );
}
