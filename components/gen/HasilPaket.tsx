'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { NAMA_TINGKAT } from '@/lib/core/pilihan-ganda';
import type { Subtes } from '@/lib/core/types';
import { chapterById, NAMA_SUBTES } from '@/lib/data/chapters';
import { bangunSlot, huruf, periksaHasil, type Hasil } from '@/lib/paket/hasil';
import type { Paket } from '@/lib/paket/susun';
import TampilSoal, { Pembahasan } from '../TampilSoal';
import type { Tampilan } from './Kerangka';

const URUT: Subtes[] = ['induktif', 'deduktif', 'bahasa-inggris', 'sjk'];
const pendek = (st: Subtes) => NAMA_SUBTES[st].replace(/^Tes (Penalaran |Pengetahuan )?/, '');
const kelompokNama = (p: Paket) => (p.jenis === 'tryout' ? 'Tryout' : p.jenis === 'set' ? 'Set per chapter' : p.nama.replace(/^Latsol \d+ · Soal /, 'Latsol · '));

export default function HasilPaket({ hasil, pilih, setPilih, buka }: {
  hasil: Hasil;
  pilih: { paket: string; subtes: Subtes | null };
  setPilih: (x: { paket: string; subtes: Subtes | null }) => void;
  buka: (t: Tampilan) => void;
}) {
  const [nomor, setNomor] = useState(0);
  const [kunci, setKunci] = useState(false);
  const [semua, setSemua] = useState(false);
  const cek = useMemo(() => periksaHasil(hasil.data), [hasil]);
  const paket = hasil.data.paket.find((x) => x.id === pilih.paket) ?? hasil.data.paket[0];
  const bagian = paket?.bagian.find((b) => b.subtes === pilih.subtes) ?? paket?.bagian[0];
  useEffect(() => { setNomor(0); }, [paket?.id, bagian?.subtes]);

  if (!paket || !bagian) {
    return (
      <section className="a-card">
        <h1 className="a-page-title">Hasil paket</h1>
        <p className="a-sub">Belum ada paket. Susun paket dari halaman Buat paket.</p>
        <button type="button" className="a-btn a-btn-primary" style={{ marginTop: 12 }} onClick={() => buka('buat')}>Buat paket</button>
      </section>
    );
  }

  // kelompok baris matriks: Tryout, lalu tiap kelompok latsol
  const grup: { judul: string; paket: Paket[] }[] = [];
  for (const x of hasil.data.paket) {
    const j = kelompokNama(x);
    const g = grup.find((y) => y.judul === j);
    if (g) g.paket.push(x); else grup.push({ judul: j, paket: [x] });
  }
  const subtesHasil = URUT.filter((st) => hasil.data.paket.some((x) => x.bagian.some((b) => b.subtes === st)));
  const slot = bagian.slot;
  const s = slot[Math.min(nomor, slot.length - 1)];
  const infoBagian = (() => {
    const isi = slot.filter((x) => x.uid);
    const tk = (['dasar', 'menengah', 'menantang'] as const).map((t) => [t, isi.filter((x) => x.tingkat === t).length] as const).filter(([, v]) => v);
    const k = (['A', 'B', 'C', 'D', 'E'] as const).map((h) => [h, isi.filter((x) => huruf(x) === h).length] as const).filter(([, v]) => v);
    return [`${slot.length} soal`, `${bagian.menit} menit`, `SHL ${isi.filter((x) => x.label === 'SHL').length} · VAR ${isi.filter((x) => x.label === 'VARIASI').length}`,
      tk.length ? tk.map(([t, v]) => `${t} ${v}`).join(' · ') : '', k.length ? `kunci ${k.map(([h, v]) => `${h} ${v}`).join(' ')}` : ''].filter(Boolean).join(' · ');
  })();

  const kartu = (x: typeof s, i: number) => {
    const c = chapterById(x.chapterId);
    const soal = bangunSlot(x);
    const awalBacaan = x.bacaan ? slot.findIndex((y) => y.bacaan === x.bacaan) : i;
    return (
      <article key={`${paket.id}-${bagian.subtes}-${i}`} className="a-soal">
        <div className="a-soal-kepala">
          <b>Soal {i + 1}</b>
          <span className="a-tag">{c.chapter}</span>
          <span className="a-tag a-tag-muda">{c.bentuk}</span>
          {x.label && <span className={`label ${x.label}`}>{x.label === 'SHL' ? 'SHL' : 'VAR'}</span>}
          {x.tingkat && <span className={`a-tag tingkat-${x.tingkat}`}>{NAMA_TINGKAT[x.tingkat as keyof typeof NAMA_TINGKAT] ?? x.tingkat}</span>}
          {kunci && huruf(x) && <span className="a-tag a-tag-kunci">Kunci {huruf(x)}</span>}
          <span className="a-spasi" />
          {x.familyId && <span className="a-kecil a-mono">{x.familyId}</span>}
          {x.uid && <Link className="a-kecil" href={`/studio?f=${encodeURIComponent(x.familyId!)}&s=${encodeURIComponent(x.seed!)}`}>Buka di Studio</Link>}
        </div>
        <div className="a-soal-badan">
          {soal ? (
            <>
              <TampilSoal soal={soal} tampilKunci={kunci} tanpaBacaan={awalBacaan < i ? `Bacaan sama dengan soal ${awalBacaan + 1}.` : undefined} />
              {kunci && <div className="pembahasan-soal"><Pembahasan soal={soal} sidik={false} /></div>}
            </>
          ) : <div className="galat">Slot kosong: {x.alasan ?? 'soal gagal dibangkitkan'}</div>}
        </div>
      </article>
    );
  };

  return (
    <>
      <div className="a-page-head">
        <div>
          <h1 className="a-page-title">Hasil paket</h1>
          <p className="a-sub">{hasil.judul} · benih {hasil.data.benih} · {hasil.resmi ? 'paket resmi (lib/data/paket.json)' : 'hasil generate di peramban — unduh di Ekspor untuk menyimpan'}</p>
        </div>
        <div className="a-row">
          <span className={`a-lencana ${cek.lolos ? 'ok' : 'bad'}`}>{cek.lolos ? 'Lolos pemeriksaan' : 'Perlu dicek'}</span>
          <button type="button" className="a-btn" onClick={() => buka('buat')}>Ubah pengaturan</button>
          <button type="button" className="a-btn a-btn-primary" onClick={() => buka('ekspor')}>Ekspor</button>
        </div>
      </div>

      <section className="a-card">
        <h2>Matriks paket</h2>
        <p className="a-kecil" style={{ margin: '0 0 8px' }}>Klik sel untuk membaca soal paket dan subtes itu. Angka = soal terisi; merah = ada slot kosong.</p>
        <div className="a-tbl-wrap a-matriks-wrap">
          <table className="a-matriks">
            <thead><tr><th />{subtesHasil.map((st) => <th key={st}>{pendek(st)}</th>)}</tr></thead>
            {grup.map((g) => (
              <tbody key={g.judul}>
                <tr className="a-grup"><th colSpan={subtesHasil.length + 1}>{g.judul}</th></tr>
                {g.paket.map((x) => (
                  <tr key={x.id}>
                    <th scope="row">{x.nama.replace(/ · .*/, '')}</th>
                    {subtesHasil.map((st) => {
                      const b = x.bagian.find((y) => y.subtes === st);
                      if (!b) return <td key={st} />;
                      const isi = b.slot.filter((y) => y.uid).length;
                      return (
                        <td key={st}>
                          <button type="button" className={`a-cell${isi < b.slot.length ? ' kurang' : ''}`} aria-pressed={x.id === paket.id && st === bagian.subtes} onClick={() => setPilih({ paket: x.id, subtes: st })}>
                            <b>{isi}/{b.slot.length}</b><span className="a-kecil">{b.menit} menit</span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </section>

      <div className="a-cols">
        <section className="a-card a-grow">
          <div className="a-row" style={{ justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0 }}>{paket.nama} · {bagian.nama}</h2>
              <div className="a-kecil">{infoBagian}</div>
            </div>
            <div className="a-row">
              <div className="a-seg" role="group" aria-label="Tampilan soal">
                <button type="button" aria-pressed={!semua} onClick={() => setSemua(false)}>Per soal</button>
                <button type="button" aria-pressed={semua} onClick={() => setSemua(true)}>Semua soal</button>
              </div>
              <label className="a-row" style={{ gap: 6 }}><input type="checkbox" checked={kunci} onChange={(e) => setKunci(e.target.checked)} /> Kunci &amp; pembahasan</label>
            </div>
          </div>
          {!semua && (
            <div className="a-nomor-grid" role="group" aria-label="Nomor soal">
              {slot.map((x, i) => (
                <button key={i} type="button" aria-pressed={i === nomor} className={x.uid ? (x.label === 'VARIASI' ? 'v' : '') : 'kosong'} onClick={() => setNomor(i)} title={chapterById(x.chapterId).chapter}>{i + 1}</button>
              ))}
            </div>
          )}
          <div className="a-stack" style={{ marginTop: 12 }}>
            {semua ? slot.map((x, i) => kartu(x, i)) : kartu(s, Math.min(nomor, slot.length - 1))}
          </div>
          {!semua && (
            <div className="a-row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
              <button type="button" className="a-btn" disabled={nomor === 0} onClick={() => setNomor(nomor - 1)}>‹ Sebelumnya</button>
              <span className="a-kecil">Soal {nomor + 1} dari {slot.length}</span>
              <button type="button" className="a-btn" disabled={nomor >= slot.length - 1} onClick={() => setNomor(nomor + 1)}>Berikutnya ›</button>
            </div>
          )}
        </section>

        <aside className="a-card a-side a-stack a-lekat">
          <h2 style={{ margin: 0 }}>Hasil pemeriksaan</h2>
          <dl className="a-ukur">
            <dt>Paket</dt><dd>{hasil.data.paket.length}</dd>
            <dt>Soal terisi</dt><dd>{cek.terisi.toLocaleString('id-ID')} / {cek.slot.toLocaleString('id-ID')}</dd>
            <dt>Struktur kembar</dt><dd>{cek.kembar}</dd>
            <dt>Soal saling membocorkan</dt><dd>{cek.bocor}</dd>
            {cek.adaBacaan && <><dt>Bacaan Reading</dt><dd>{cek.bacaanPecah ? `${cek.bacaanPecah} terpecah` : 'utuh'}</dd></>}
            <dt>3 kunci sama beruntun</dt><dd>{cek.deret3}</dd>
            <dt>Label</dt><dd>{cek.label.map(([k, v]) => `${k === 'SHL' ? 'SHL' : 'VAR'} ${v}`).join(' · ')}</dd>
            {cek.tingkat.some(([, v]) => v) && <><dt>Tingkat</dt><dd>{cek.tingkat.map(([k, v]) => `${k} ${v}`).join(' · ')}</dd></>}
            {cek.kunci.some(([, v]) => v) && <><dt>Kunci A–E</dt><dd>{cek.kunci.filter(([, v]) => v).map(([k, v]) => `${k} ${v}`).join(' · ')}</dd></>}
          </dl>
          {cek.versiLama > 0 && <div className="a-note a-note-warn">{cek.versiLama} soal berasal dari versi family lama{cek.tanpaFamily ? ` (${cek.tanpaFamily} dari family yang sudah dikeluarkan)` : ''}. Susun ulang paket resmi dengan <code>npm run paket</code>.</div>}
          {cek.kosong > 0 && <div className="a-note a-note-warn">{cek.kosong} slot kosong: {Object.entries(cek.kosongPerChapter).map(([id, v]) => `${chapterById(id).chapter} (${v})`).join(', ')}. Kurangi jumlah paket atau soal chapter itu, atau longgarkan tingkat.</div>}
          {cek.lolos && <div className="a-note a-note-ok">Semua slot terisi, tanpa struktur kembar, tanpa soal yang saling membocorkan, dan bacaan Reading utuh.</div>}
          <details>
            <summary className="a-kecil">Sebaran per chapter</summary>
            <table className="tabel-mini">
              <thead><tr><th>Chapter</th><th className="ang">SHL·VAR</th><th className="ang">D·M·Mn</th></tr></thead>
              <tbody>{cek.perChapter.map(({ c, shl, variasi, dasar, menengah, menantang }) => <tr key={c.id}><td>{c.chapter}</td><td className="ang">{shl}·{variasi}</td><td className="ang">{dasar + menengah + menantang ? `${dasar}·${menengah}·${menantang}` : '—'}</td></tr>)}</tbody>
            </table>
          </details>
        </aside>
      </div>
    </>
  );
}
