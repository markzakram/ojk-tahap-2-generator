'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { bangkitkan } from '@/lib/core/engine';
import { familyById, FAMILIES } from '@/lib/core/registry';
import { chapterById } from '@/lib/data/chapters';
import DATA from '@/lib/data/paket.json';
import { ringkasPaket, type HasilSusun, type Paket as TPaket } from '@/lib/paket/susun';
import KepalaApp from './KepalaApp';

// Halaman Paket bergaya generator Tahap 1: daftar tryout/latsol di kiri, isi paket di tengah, ringkasan dan unduhan di kanan.
// Paket disusun `npm run paket` (scripts/susun-paket.ts) dan disimpan sebagai uid soal di lib/data/paket.json.

const HASIL = DATA as unknown as HasilSusun;

function unduh(nama: string, isi: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(isi, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = nama; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Bangkitkan ulang isi lengkap paket (soal, kunci, pembahasan) dari uid setiap slot. */
function isiLengkap(p: TPaket) {
  return {
    id: p.id, nama: p.nama, jenis: p.jenis,
    bagian: p.bagian.map((b) => ({
      subtes: b.subtes, nama: b.nama, menit: b.menit,
      soal: b.slot.map((s, i) => {
        if (!s.uid || !s.familyId || !s.seed) return { nomor: i + 1, chapter: chapterById(s.chapterId).nama, kosong: s.alasan };
        const soal = bangkitkan(familyById(s.familyId), s.seed);
        return { nomor: i + 1, chapter: chapterById(s.chapterId).nama, siadu: chapterById(s.chapterId).siadu, ...soal };
      }),
    })),
  };
}

export default function Paket() {
  const [pilih, setPilih] = useState(HASIL.paket[0]?.id ?? '');
  const [status, setStatus] = useState('');
  const r = useMemo(() => ringkasPaket(HASIL), []);
  const paket = HASIL.paket.find((p) => p.id === pilih) ?? HASIL.paket[0];
  const versiLama = useMemo(() => HASIL.paket.flatMap((p) => p.bagian.flatMap((b) => b.slot)).filter((s) => s.familyId && FAMILIES.find((f) => f.id === s.familyId)?.versi !== s.versi).length, []);
  const tryout = HASIL.paket.filter((p) => p.jenis === 'tryout');
  const kelompok = [...new Set(HASIL.paket.filter((p) => p.jenis === 'latsol').map((p) => p.nama.replace(/^Latsol \d+ · /, '')))];
  const jumlah = (p: TPaket) => { const s = p.bagian.flatMap((b) => b.slot); return `${s.filter((x) => x.uid).length}/${s.length}`; };

  const unduhPaket = (p: TPaket) => { setStatus(`Menyiapkan ${p.nama}…`); setTimeout(() => { unduh(`${p.id}.json`, isiLengkap(p)); setStatus(`${p.nama} diunduh.`); }, 20); };
  const unduhSemua = () => {
    setStatus('Menyiapkan seluruh paket (beberapa detik)…');
    setTimeout(() => { unduh(`paket-tku-${HASIL.benih}.json`, { benih: HASIL.benih, dibuat: HASIL.dibuat, paket: HASIL.paket.map(isiLengkap) }); setStatus('Seluruh paket diunduh.'); }, 20);
  };

  return (
    <>
      <KepalaApp aktif="paket" kanan={`Disusun ${HASIL.dibuat}`} />
      <main className="layout">
        <section className="panel daftar-paket" aria-label="Daftar paket">
          <h2><span className="step">1</span> Pilih paket</h2>
          <h3>Tryout</h3>
          {tryout.map((p) => (
            <button key={p.id} type="button" className={`fam${p.id === paket?.id ? ' aktif' : ''}`} onClick={() => setPilih(p.id)}>
              <span className="nama">{p.nama}</span><span className="jumlah redup">{jumlah(p)}</span>
            </button>
          ))}
          {kelompok.map((k) => (
            <div key={k}>
              <h3>{k}</h3>
              {HASIL.paket.filter((p) => p.jenis === 'latsol' && p.nama.endsWith(k)).map((p) => (
                <button key={p.id} type="button" className={`fam${p.id === paket?.id ? ' aktif' : ''}`} onClick={() => setPilih(p.id)}>
                  <span className="nama">Latsol {p.nomor}</span><span className="jumlah redup">{jumlah(p)}</span>
                </button>
              ))}
            </div>
          ))}
        </section>

        <section className="panel wide" aria-label="Isi paket">
          {paket && (
            <>
              <h2><span className="step">2</span> {paket.nama}</h2>
              <div className="isi-soal">
                {paket.bagian.map((b) => (
                  <div key={b.subtes} className="paket-bagian">
                    <h3>{b.nama} · {b.slot.length} soal · {b.menit} menit</h3>
                    <table className="tabel">
                      <thead><tr><th>No</th><th>Chapter</th><th>Family</th><th>Tingkat</th><th>Kunci</th><th>Soal</th></tr></thead>
                      <tbody>
                        {b.slot.map((s, i) => (
                          <tr key={i}>
                            <td className="angka">{i + 1}</td>
                            <td>{chapterById(s.chapterId).nama}</td>
                            <td>{s.familyId ? <><span className={`label ${s.label}`}>{s.label === 'SHL' ? 'SHL' : 'VAR'}</span> {s.familyId}</> : <span className="redup">—</span>}</td>
                            <td>{s.tingkat ?? <span className="redup">—</span>}</td>
                            <td>{s.kunci && /^[A-E]$/.test(s.kunci) ? s.kunci : <span className="redup">{s.uid ? 'interaktif' : '—'}</span>}</td>
                            <td>{s.uid ? <Link href={`/studio?f=${encodeURIComponent(s.familyId!)}&s=${encodeURIComponent(s.seed!)}`}>Buka</Link> : <span className="pil belum">{s.alasan}</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="panel" aria-label="Ringkasan dan unduhan">
          <h2><span className="step">3</span> Ringkasan</h2>
          <dl className="ukur">
            <dt>Tryout</dt><dd>{tryout.length}</dd>
            <dt>Latsol</dt><dd>{HASIL.paket.length - tryout.length}</dd>
            <dt>Slot terisi</dt><dd>{r.terisi}/{r.slot}</dd>
            <dt>Struktur kembar</dt><dd>{r.kembar}</dd>
          </dl>
          {versiLama > 0 && <p className="galat">{versiLama} soal berasal dari versi family lama. Susun ulang paket dengan <code>npm run paket</code>.</p>}
          {r.kosong > 0 && (
            <>
              <h3>Slot kosong</h3>
              <ul className="daftar-keputusan">
                {Object.entries(r.kosongPerChapter).map(([id, n]) => <li key={id}><span>{chapterById(id).nama}</span><span>{n}</span></li>)}
              </ul>
            </>
          )}
          <h2><span className="step">4</span> Unduh</h2>
          <p className="hint">JSON berisi soal lengkap: isi, kunci, pembahasan, sidik, dan tingkat, dibangkitkan ulang dari uid setiap slot.</p>
          <div className="row gap-s">
            {paket && <button className="wide-btn" type="button" onClick={() => unduhPaket(paket)}>Paket ini</button>}
            <button className="wide-btn primary" type="button" onClick={unduhSemua}>Semua paket</button>
          </div>
          {status && <p className="hint">{status}</p>}
          <p className="hint">Paket disusun ulang dengan <code>npm run paket</code> setelah family bertambah atau berubah versi.</p>
        </section>
      </main>
    </>
  );
}
