'use client';

import { useState } from 'react';
import { NAMA_TINGKAT, type JawabanPg, type PilihanGandaItem } from '@/lib/core/pilihan-ganda';

// Soal pilihan ganda teks (bentuk SIADU "Option New") untuk Tes Bahasa Inggris, Reading Comprehension, dan PSJK. Stimulus satu kalimat dengan bagian kosong
// (Completion) atau rentang miring (Improvement); Arrangement menampilkan fragmen A–E terpisah dari opsi urutan A–D,
// sesuai blueprint bagian 2 ("keduanya harus dibedakan secara visual").
// `tanpaBacaan`: di Paket, soal lanjutan satu bacaan menampilkan catatan ini alih-alih mengulang bacaannya.
export default function PilihanGandaSoal({ item, kunci, tampilKunci, tanpaBacaan }: { item: PilihanGandaItem; kunci: JawabanPg; tampilKunci: boolean; tanpaBacaan?: string }) {
  const [pilih, setPilih] = useState<string | null>(null);
  const [hasil, setHasil] = useState<boolean | null>(null);

  return (
    <div className="pg">
      <p className="pg-instruksi"><i>{item.instruksi}</i> <span className="pg-tingkat">{NAMA_TINGKAT[item.tingkat]}</span></p>
      {item.bacaan && tanpaBacaan && <p className="pg-bacaan-sama">{tanpaBacaan}</p>}
      {item.bacaan && !tanpaBacaan && (
        <div className="pg-bacaan">
          {item.bacaan.judul && <h3>{item.bacaan.judul}</h3>}
          {item.bacaan.paragraf.map((t, i) => <p key={i}>{t}</p>)}
        </div>
      )}
      {item.pertanyaan && <p className="pg-pertanyaan">{item.pertanyaan}</p>}
      {item.stimulus.length > 0 && (
        <p className="pg-kalimat">
          {item.stimulus.map((p, i) => p.gaya === 'kosong'
            ? <span key={i} className="pg-kosong" aria-label="bagian kosong">{' '.repeat(4)}</span>
            : p.gaya === 'miring' ? <em key={i} className="pg-miring">{p.teks}</em> : <span key={i}>{p.teks}</span>)}
        </p>
      )}
      {item.fragmen && (
        <div className="pg-fragmen" aria-label="Fragmen">
          {item.fragmen.map((f) => <span key={f.label} className="pg-fragmen-item"><b>{f.label}</b>{f.teks}</span>)}
        </div>
      )}
      <div className="opsi-daftar" role="radiogroup" aria-label="Pilihan jawaban">
        {item.opsi.map((o) => {
          const kelas = ['opsi'];
          if (pilih === o.label) kelas.push('dipilih');
          if (hasil !== null && pilih === o.label) kelas.push(hasil ? 'benar' : 'salah');
          if (tampilKunci && o.label === kunci) kelas.push('kunci-benar');
          return (
            <button key={o.label} type="button" role="radio" aria-checked={pilih === o.label} className={kelas.join(' ')} onClick={() => { setPilih(o.label); setHasil(null); }}>
              <span className="huruf">{o.label}</span><span className="opsi-teks">{o.teks}</span>
            </button>
          );
        })}
      </div>
      <div className="aksi">
        <button className="btn" onClick={() => { setPilih(null); setHasil(null); }}>Reset</button>
        <button className="btn utama" onClick={() => setHasil(pilih === kunci)} disabled={!pilih}>Periksa jawaban</button>
        <span className="status">{pilih ? `Pilihan: ${pilih}` : 'Belum memilih'}</span>
        {hasil !== null && <span className={`hasil ${hasil ? 'ok' : 'bad'}`}>{hasil ? 'Jawaban tepat' : 'Jawaban belum tepat'}</span>}
      </div>
    </div>
  );
}
