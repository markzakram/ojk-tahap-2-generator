'use client';

import { useState } from 'react';
import type { Alokasi, RoomItem } from '@/lib/deduktif/room/model';
import Avatar from './Avatar';

// Interaksi sesuai blueprint: lima orang mulai di "Daftar Peserta", diseret (atau klik orang lalu klik ruangan) ke ruangan bernama.
// Sistem hanya mencegah orang keempat dalam satu ruangan dan penempatan ke fasilitas; salah ruangan/divisi/durasi TIDAK ditolak
// saat menempatkan (itu memberi umpan balik jawaban). Jawaban baru dapat diperiksa setelah kelima orang ditempatkan.
export default function RoomSoal({ item, kunci, tampilKunci }: { item: RoomItem; kunci: Alokasi; tampilKunci: boolean }) {
  const kosong = () => Object.fromEntries(item.orang.map((o) => [o.id, null])) as Record<string, string | null>;
  const [posisi, setPosisi] = useState<Record<string, string | null>>(kosong);
  const [aktif, setAktif] = useState<string | null>(null);
  const [pesan, setPesan] = useState('');
  const [hasil, setHasil] = useState<boolean | null>(null);

  const isi = (rid: string | null) => item.orang.filter((o) => posisi[o.id] === rid);
  const taruh = (oid: string, rid: string | null) => {
    setHasil(null);
    if (rid && posisi[oid] !== rid && isi(rid).length >= item.kapasitas) { setPesan(`Ruangan sudah berisi ${item.kapasitas} orang.`); return; }
    setPosisi({ ...posisi, [oid]: rid }); setAktif(null); setPesan('');
  };
  const semuaTerisi = item.orang.every((o) => posisi[o.id]);
  const periksa = () => setHasil(item.orang.every((o) => posisi[o.id] === kunci[o.id]));

  const chip = (oid: string) => {
    const o = item.orang.find((x) => x.id === oid)!;
    return (
      <button key={oid} className={`chip${aktif === oid ? ' aktif' : ''}`} draggable
        onDragStart={(e) => e.dataTransfer.setData('text/plain', oid)}
        onClick={(e) => { e.stopPropagation(); setAktif(aktif === oid ? null : oid); }}>
        <Avatar nama={o.nama} />{o.nama}
      </button>
    );
  };
  const zona = (rid: string | null) => ({
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); const oid = e.dataTransfer.getData('text/plain'); if (oid) taruh(oid, rid); },
    onClick: () => { if (aktif) taruh(aktif, rid); },
  });
  const kotakRuang = (rid: string, gaya?: React.CSSProperties) => {
    const r = item.ruang.find((x) => x.id === rid)!;
    const n = isi(rid).length;
    return (
      <div key={rid} style={gaya} className={`ruangan${aktif && n < item.kapasitas ? ' siap' : ''}${n >= item.kapasitas ? ' penuh' : ''}`} {...zona(rid)}>
        <div className="area-judul"><span>{r.nama}</span><span>{n}/{item.kapasitas}</span></div>
        <div className="chips">{isi(rid).map((o) => chip(o.id))}</div>
        {tampilKunci && <div className="catatan">Kunci: {item.orang.filter((o) => kunci[o.id] === rid).map((o) => o.nama).join(', ') || '—'}</div>}
      </div>
    );
  };

  return (
    <div>
      <h2>{item.judul}</h2>
      {item.instruksi.map((s) => <p className="instruksi" key={s}>{s}</p>)}
      <div className="orang-grid">
        {item.orang.map((o) => (
          <div className="orang" key={o.id}>
            <Avatar nama={o.nama} />
            <div><b>{o.nama}{o.tag && <span className="tag">{o.tag}</span>}</b><span>{o.petunjuk.join(' ')}</span></div>
          </div>
        ))}
      </div>
      <p className="petunjuk-ui">Seret orang ke ruangan, atau klik orang lalu klik ruangan. Klik orang di ruangan lalu klik Daftar Peserta untuk mengembalikan.</p>
      <div className="room-area">
        <div className={`daftar${aktif ? ' siap' : ''}`} {...zona(null)}>
          <div className="area-judul"><span>Daftar Peserta</span></div>
          <div className="chips">{isi(null).map((o) => chip(o.id))}</div>
        </div>
        {item.denah ? (
          <div className="denah" style={{ gridTemplateColumns: `repeat(${Math.max(...item.denah.map((p) => p.x + p.w))}, minmax(0, 1fr))` }}>
            {item.denah.map((p) => {
              const gaya = { gridColumn: `${p.x + 1} / span ${p.w}`, gridRow: `${p.y + 1} / span ${p.h}` };
              const f = item.fasilitas?.find((x) => x.id === p.id);
              return f ? <div key={p.id} className="fasilitas" style={gaya}>{f.nama}</div> : kotakRuang(p.id, gaya);
            })}
          </div>
        ) : (
          <div className="ruangan-grid">{item.ruang.map((r) => kotakRuang(r.id))}</div>
        )}
      </div>
      <div className="aksi">
        <button className="btn" onClick={() => { setPosisi(kosong()); setHasil(null); setPesan(''); setAktif(null); }}>Reset</button>
        <button className="btn utama" onClick={periksa} disabled={!semuaTerisi}>Periksa jawaban</button>
        <span className="status">{pesan || (semuaTerisi ? 'Semua orang sudah ditempatkan' : `${isi(null).length} orang belum ditempatkan`)}</span>
        {hasil !== null && <span className={`hasil ${hasil ? 'ok' : 'bad'}`}>{hasil ? 'Jawaban tepat' : 'Jawaban belum tepat'}</span>}
      </div>
    </div>
  );
}
