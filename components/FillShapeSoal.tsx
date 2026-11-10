'use client';

import { useState } from 'react';
import { NAMA_WARNA, geometri, samaFrame, type Frame, type Geometri, type Warna } from '@/lib/induktif/fill-shape/geometri';
import type { FillShapeItem } from '@/lib/induktif/fill-shape/pola';

// Fill Shape (Rancangan Fitur TKU): warna Putih, Hijau #4a8508, Ungu polkadot #827bde. G1–G4 hanya-baca; G5 diwarnai dengan
// klik bidang (putih → hijau → ungu → putih). Warna pilihan bukan umpan balik benar/salah.
const ISI = ['#ffffff', '#4a8508', 'url(#fs-polkadot)'];

function Bentuk({ geo, f, ukuran, label, onKlik, tandai }: {
  geo: Geometri; f: Frame; ukuran: number; label: string; onKlik?: (i: number) => void; tandai?: boolean[];
}) {
  return (
    <svg className={`fs-bentuk${onKlik ? ' aktif' : ''}`} width={ukuran} height={ukuran} viewBox="-1.12 -1.12 2.24 2.24" role="img" aria-label={label}>
      {geo.bidang.map((b, i) => (
        <polygon
          key={i}
          data-bidang={i}
          points={b.titik.map((p) => p.join(',')).join(' ')}
          fill={ISI[f[i]]}
          className={tandai?.[i] ? 'beda' : undefined}
          onClick={onKlik ? () => onKlik(i) : undefined}
        >
          <title>{`${b.nama}: ${NAMA_WARNA[f[i]]}`}</title>
        </polygon>
      ))}
    </svg>
  );
}

export default function FillShapeSoal({ item, kunci, tampilKunci }: { item: FillShapeItem; kunci: Frame; tampilKunci: boolean }) {
  const geo = geometri(item.geometri);
  const [isi, setIsi] = useState<Frame>(() => new Array(geo.bidang.length).fill(0) as Frame);
  const [hasil, setHasil] = useState<boolean | null>(null);
  const klik = (i: number) => { setHasil(null); setIsi(isi.map((w, j) => (j === i ? (((w + 1) % 3) as Warna) : w)) as Frame); };

  return (
    <div>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <defs>
          <pattern id="fs-polkadot" patternUnits="userSpaceOnUse" width="0.16" height="0.16">
            <rect width="0.16" height="0.16" fill="#827bde" />
            <circle cx="0.04" cy="0.04" r="0.022" fill="#ffffff" />
            <circle cx="0.12" cy="0.12" r="0.022" fill="#ffffff" />
          </pattern>
        </defs>
      </svg>
      <h2>Fill Shape · {geo.nama}</h2>
      <p className="instruksi">Amati perubahan warna dari gambar 1 sampai 4, lalu tentukan warna setiap bidang pada gambar 5.</p>
      <div className="fs-baris">
        {item.frame.map((f, t) => (
          <figure key={t} className="fs-frame">
            <Bentuk geo={geo} f={f} ukuran={132} label={`Gambar ${t + 1}`} />
            <figcaption>{t + 1}</figcaption>
          </figure>
        ))}
        <figure className="fs-frame jawab">
          <Bentuk geo={geo} f={isi} ukuran={228} label="Gambar 5 (jawaban)" onKlik={klik} tandai={tampilKunci ? isi.map((w, i) => w !== kunci[i]) : undefined} />
          <figcaption>5 — klik bidang untuk mewarnai</figcaption>
        </figure>
        {tampilKunci && (
          <figure className="fs-frame">
            <Bentuk geo={geo} f={kunci} ukuran={132} label="Kunci gambar 5" />
            <figcaption>Kunci</figcaption>
          </figure>
        )}
      </div>
      <div className="fs-legenda">
        <span><i style={{ background: '#ffffff' }} /> Putih</span>
        <span><i style={{ background: '#4a8508' }} /> Hijau</span>
        <span><i className="polkadot" /> Ungu</span>
        <span className="petunjuk-ui">Satu klik mengganti warna bidang: putih → hijau → ungu → putih.</span>
      </div>
      <div className="aksi">
        <button className="btn" onClick={() => { setIsi(new Array(geo.bidang.length).fill(0) as Frame); setHasil(null); }}>Reset</button>
        <button className="btn utama" onClick={() => setHasil(samaFrame(isi, kunci))}>Periksa jawaban</button>
        {hasil !== null && <span className={`hasil ${hasil ? 'ok' : 'bad'}`}>{hasil ? 'Jawaban tepat' : 'Jawaban belum tepat'}</span>}
      </div>
    </div>
  );
}
