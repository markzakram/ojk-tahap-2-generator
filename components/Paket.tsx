'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { bangkitkan, seedBaru } from '@/lib/core/engine';
import { NAMA_TINGKAT } from '@/lib/core/pilihan-ganda';
import { familyById, FAMILIES } from '@/lib/core/registry';
import type { Soal, Subtes } from '@/lib/core/types';
import { CHAPTERS, chapterById, JUMLAH_LATSOL, JUMLAH_TRYOUT, NAMA_SUBTES } from '@/lib/data/chapters';
import DATA from '@/lib/data/paket.json';
import {
  DURASI_LATSOL, DURASI_TRYOUT, KELOMPOK_LATSOL_URUT, kelompokLatsol, komposisiBaku, langkahSusun, rencanaLatsol, rencanaTryout,
  ringkasPaket, type HasilSusun, type Paket as TPaket, type SlotPaket,
} from '@/lib/paket/susun';
import KepalaApp from './KepalaApp';
import TampilSoal, { Pembahasan } from './TampilSoal';

// Halaman Paket dengan alur generator Tahap 1: pengaturan di kiri (jenis, komposisi, jumlah, benih, Generate), pratinjau
// soal di tengah (pilih paket dan subtes, soal dapat dikerjakan, kunci dan pembahasan), hasil pemeriksaan dan unduhan di kanan.
// Pengaturan baku dengan benih paket resmi menampilkan paket resmi (lib/data/paket.json, `npm run paket`); pengaturan lain
// disusun di peramban dengan perakit yang sama (lib/paket/susun.ts).

const RESMI = DATA as unknown as HasilSusun;
const URUT_SUBTES: Subtes[] = ['induktif', 'deduktif', 'bahasa-inggris', 'sjk'];
const MAKS_PAKET = 20;
const MAKS_SOAL_CHAPTER = 20;
const pendek = (st: Subtes) => NAMA_SUBTES[st].replace(/^Tes (Penalaran |Pengetahuan )?/, '');
const tanpaSoal = (k: string) => k.replace(/^Soal /, '');
const huruf = (s: SlotPaket) => (s.kunci && /^[A-E]$/.test(s.kunci) ? s.kunci : undefined);

type Jenis = 'tryout' | 'latsol';
interface Hasil { data: HasilSusun; resmi: boolean; judul: string }

const BANTUAN = [
  <><b>Pilih jenis paket.</b> <i>Tryout</i> berisi empat subtes dengan komposisi Mapping; <i>Latsol</i> berisi satu kelompok latihan, 10 soal per latsol.</>,
  <><b>Atur komposisi.</b> Pilih subtes (tryout) atau kelompok (latsol), lalu jumlah soal tiap chapter. Tombol <i>Baku</i> mengembalikan angka Mapping.</>,
  <><b>Jumlah paket dan benih.</b> Benih dan pengaturan yang sama selalu menghasilkan paket yang sama. Pengaturan baku dengan benih <code>{RESMI.benih}</code> menampilkan paket resmi.</>,
  <><b>Generate.</b> Soal diambil dari family yang lolos verifikasi. Satu struktur soal hanya dipakai sekali di seluruh hasil; label SHL/VARIASI dan tingkat dibagi rata, dan huruf kunci diseimbangkan.</>,
  <><b>Lihat paket.</b> Pilih paket dan subtes di tengah. Soal dapat langsung dikerjakan; centang <i>Tampilkan kunci &amp; pembahasan</i> untuk melihat jawaban dan langkahnya.</>,
  <><b>Periksa dan unduh.</b> Panel kanan menampilkan hasil pemeriksaan (soal terisi, soal kembar, sebaran label, tingkat, dan kunci). Unduh JSON lengkap atau daftar soal CSV.</>,
];

function unduhBerkas(nama: string, isi: string, jenis: string) {
  const url = URL.createObjectURL(new Blob([isi], { type: jenis }));
  const a = document.createElement('a');
  a.href = url; a.download = nama; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function bangun(s: SlotPaket): Soal | null {
  if (!s.uid || !s.familyId || !s.seed) return null;
  try { return bangkitkan(familyById(s.familyId), s.seed); } catch { return null; }
}

/** Isi lengkap paket (soal, kunci, pembahasan) dibangkitkan ulang dari uid setiap slot. */
function isiLengkap(p: TPaket) {
  return {
    id: p.id, nama: p.nama, jenis: p.jenis,
    bagian: p.bagian.map((b) => ({
      subtes: b.subtes, nama: b.nama, menit: b.menit,
      soal: b.slot.map((s, i) => {
        const c = chapterById(s.chapterId);
        const soal = bangun(s);
        return soal ? { nomor: i + 1, chapter: c.nama, siadu: c.siadu, ...soal } : { nomor: i + 1, chapter: c.nama, kosong: s.alasan ?? 'gagal dibangkitkan' };
      }),
    })),
  };
}

function csvSlot(h: HasilSusun): string {
  const sel = (v: unknown) => { const t = String(v ?? ''); return /[",\n;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  const baris = [['paket', 'jenis', 'subtes', 'nomor', 'chapter', 'kode_siadu', 'label', 'family', 'versi', 'seed', 'uid', 'tingkat', 'kunci']];
  for (const p of h.paket) for (const b of p.bagian) b.slot.forEach((s, i) => {
    const c = chapterById(s.chapterId);
    baris.push([p.nama, p.jenis, NAMA_SUBTES[b.subtes], String(i + 1), c.nama, c.siadu ?? '', s.label ?? '', s.familyId ?? '', String(s.versi ?? ''), s.seed ?? '', s.uid ?? '', s.tingkat ?? '', huruf(s) ?? (s.uid ? 'interaktif' : '')]);
  });
  return '﻿' + baris.map((r) => r.map(sel).join(',')).join('\n') + '\n';
}

/** Pemeriksaan seluruh hasil: slot terisi, kembar, sebaran label/tingkat/kunci, bacaan utuh, deret tiga kunci sama. */
function periksa(h: HasilSusun) {
  const r = ringkasPaket(h);
  const isi = h.paket.flatMap((p) => p.bagian.flatMap((b) => b.slot)).filter((s) => s.uid);
  const hitung = <T extends string>(daftar: readonly T[], f: (s: SlotPaket) => string | undefined) =>
    daftar.map((k) => [k, isi.filter((s) => f(s) === k).length] as const);
  let deret3 = 0, bacaanPecah = 0, adaBacaan = false;
  for (const p of h.paket) for (const b of p.bagian) {
    const rc = b.slot.map((s, i) => ({ s, i })).filter((x) => x.s.bacaan);
    if (rc.length) {
      adaBacaan = true;
      if (new Set(rc.map((x) => x.s.bacaan)).size !== 1 || rc[rc.length - 1].i - rc[0].i !== rc.length - 1) bacaanPecah++;
    }
    for (let i = 2; i < b.slot.length; i++) { const k = huruf(b.slot[i]); if (k && k === huruf(b.slot[i - 1]) && k === huruf(b.slot[i - 2])) deret3++; }
  }
  const perChapter = CHAPTERS.map((c) => {
    const s = isi.filter((x) => x.chapterId === c.id);
    return { c, shl: s.filter((x) => x.label === 'SHL').length, variasi: s.filter((x) => x.label === 'VARIASI').length };
  }).filter((x) => x.shl + x.variasi > 0);
  const versiLama = isi.filter((s) => FAMILIES.find((f) => f.id === s.familyId)?.versi !== s.versi).length;
  return {
    ...r, deret3, bacaanPecah, adaBacaan, perChapter, versiLama,
    label: hitung(['SHL', 'VARIASI'] as const, (s) => s.label),
    tingkat: hitung(['dasar', 'menengah', 'menantang'] as const, (s) => s.tingkat),
    kunci: hitung(['A', 'B', 'C', 'D', 'E'] as const, huruf),
    lolos: r.kosong === 0 && r.kembar === 0 && bacaanPecah === 0 && versiLama === 0,
  };
}

const resmiUntuk = (jenis: Jenis, kelompok: string): Hasil => {
  const paket = RESMI.paket.filter((p) => p.jenis === jenis && (jenis === 'tryout' || p.nama.endsWith(`· ${kelompok}`)));
  return { data: { ...RESMI, paket }, resmi: true, judul: jenis === 'tryout' ? `${paket.length} tryout resmi` : `${paket.length} latsol resmi ${tanpaSoal(kelompok)}` };
};

export default function Paket() {
  // ---- pengaturan (kiri) ----
  const [jenis, setJenis] = useState<Jenis>('tryout');
  const [subtes, setSubtes] = useState<Subtes[]>(URUT_SUBTES);
  const [kelompok, setKelompok] = useState(KELOMPOK_LATSOL_URUT[0]);
  const [komposisi, setKomposisi] = useState({ tryout: komposisiBaku('tryout'), latsol: komposisiBaku('latsol') });
  const [jumlah, setJumlah] = useState({ tryout: JUMLAH_TRYOUT, latsol: JUMLAH_LATSOL });
  const [benih, setBenih] = useState(RESMI.benih);
  const [berjalan, setBerjalan] = useState(false);
  const [kemajuan, setKemajuan] = useState(0);
  const [status, setStatus] = useState<{ teks: string; jenis?: 'ok' | 'error' }>({ teks: `Menampilkan paket resmi (disusun ${RESMI.dibuat}). Ubah pengaturan, lalu tekan Generate paket untuk menyusun paket lain.` });

  // ---- hasil dan pratinjau (tengah) ----
  const [hasil, setHasil] = useState<Hasil>(() => resmiUntuk('tryout', KELOMPOK_LATSOL_URUT[0]));
  const [pilih, setPilih] = useState(hasil.data.paket[0]?.id ?? '');
  const [tab, setTab] = useState<Subtes>('induktif');
  const [tampilKunci, setTampilKunci] = useState(false);
  const [statusUnduh, setStatusUnduh] = useState('');
  const daftarRef = useRef<HTMLDivElement>(null);

  const kom = komposisi[jenis];
  const chapterAtur = jenis === 'tryout'
    ? CHAPTERS.filter((c) => subtes.includes(c.subtes) && c.perTryout + kom[c.id] > 0)
    : CHAPTERS.filter((c) => kelompokLatsol(c) === kelompok);
  const totalSoal = chapterAtur.reduce((a, c) => a + (kom[c.id] ?? 0), 0);
  const bakuSemua = komposisiBaku(jenis);
  const samaBaku = chapterAtur.every((c) => kom[c.id] === bakuSemua[c.id]);
  const n = jumlah[jenis];
  const sesuaiResmi = benih.trim() === RESMI.benih && samaBaku && n === (jenis === 'tryout' ? JUMLAH_TRYOUT : JUMLAH_LATSOL) && (jenis === 'latsol' || subtes.length === URUT_SUBTES.length);

  const ubahKomposisi = (id: string, v: string) => {
    const x = Math.max(0, Math.min(MAKS_SOAL_CHAPTER, Math.floor(Number(v) || 0)));
    setKomposisi((k) => ({ ...k, [jenis]: { ...k[jenis], [id]: x } }));
  };
  const baku = () => setKomposisi((k) => ({ ...k, [jenis]: komposisiBaku(jenis) }));
  const togelSubtes = (st: Subtes) => setSubtes((s) => s.includes(st) ? (s.length > 1 ? s.filter((x) => x !== st) : s) : URUT_SUBTES.filter((x) => x === st || s.includes(x)));

  const tampilkan = (h: Hasil) => {
    setHasil(h);
    setPilih(h.data.paket[0]?.id ?? '');
    setTab(h.data.paket[0]?.bagian[0]?.subtes ?? 'induktif');
  };

  const generate = async () => {
    if (berjalan || !totalSoal) return;
    const b = benih.trim() || seedBaru();
    if (b !== benih) setBenih(b);
    if (sesuaiResmi) {
      tampilkan(resmiUntuk(jenis, kelompok));
      setStatus({ teks: `Pengaturan sama dengan paket resmi; menampilkan paket resmi (disusun ${RESMI.dibuat}).`, jenis: 'ok' });
      return;
    }
    const rencana = jenis === 'tryout' ? rencanaTryout(n, kom, subtes) : rencanaLatsol(kelompok, n, kom);
    const g = langkahSusun(FAMILIES, rencana, [rencana.map((_, i) => i)], b);
    setBerjalan(true); setKemajuan(0);
    const t0 = performance.now();
    try {
      for (;;) {
        await new Promise((r) => setTimeout(r, 0));
        const r = g.next();
        if (r.done) {
          const cek = periksa(r.value);
          tampilkan({ data: r.value, resmi: false, judul: jenis === 'tryout' ? `${n} tryout` : `${n} latsol ${tanpaSoal(kelompok)}` });
          setStatus({
            teks: `${r.value.paket.length} paket, ${cek.terisi} dari ${cek.slot} soal terisi, ${cek.kembar} struktur kembar (${((performance.now() - t0) / 1000).toFixed(1).replace('.', ',')} dtk).`,
            jenis: cek.kosong || cek.kembar ? 'error' : 'ok',
          });
          break;
        }
        setKemajuan(Math.round((r.value.selesai / r.value.total) * 100));
        setStatus({ teks: `Menyusun ${r.value.chapter} (${r.value.selesai}/${r.value.total})…` });
      }
    } catch (e) {
      setStatus({ teks: `Gagal menyusun paket: ${String(e)}`, jenis: 'error' });
    } finally {
      setBerjalan(false);
    }
  };

  // ---- pratinjau ----
  const paketDaftar = hasil.data.paket;
  const idx = Math.max(0, paketDaftar.findIndex((p) => p.id === pilih));
  const paket = paketDaftar[idx];
  const bagian = paket?.bagian.find((b) => b.subtes === tab) ?? paket?.bagian[0];
  const soalBagian = useMemo(() => (bagian ? bagian.slot.map((s) => ({ s, soal: bangun(s) })) : []), [bagian]);
  useEffect(() => { daftarRef.current?.scrollTo({ top: 0 }); }, [bagian]);
  const cek = useMemo(() => periksa(hasil.data), [hasil]);

  const infoBagian = useMemo(() => {
    if (!paket || !bagian) return '';
    const isi = bagian.slot.filter((s) => s.uid);
    const label = `SHL ${isi.filter((s) => s.label === 'SHL').length}, VAR ${isi.filter((s) => s.label === 'VARIASI').length}`;
    const tk = (['dasar', 'menengah', 'menantang'] as const).map((t) => [t, isi.filter((s) => s.tingkat === t).length] as const).filter(([, v]) => v);
    const kunci = (['A', 'B', 'C', 'D', 'E'] as const).map((h) => [h, isi.filter((s) => huruf(s) === h).length] as const).filter(([, v]) => v);
    return [
      paket.nama, bagian.nama, `${bagian.slot.length} soal`, `${bagian.menit} menit`, label,
      tk.length ? tk.map(([t, v]) => `${t} ${v}`).join(', ') : '',
      kunci.length ? `kunci ${kunci.map(([h, v]) => `${h} ${v}`).join(' ')}` : '',
    ].filter(Boolean).join(' · ');
  }, [paket, bagian]);

  const unduhPaket = () => {
    if (!paket) return;
    setStatusUnduh(`Menyiapkan ${paket.nama}…`);
    setTimeout(() => { unduhBerkas(`${paket.id}.json`, JSON.stringify(isiLengkap(paket), null, 2), 'application/json'); setStatusUnduh(`${paket.nama} diunduh.`); }, 20);
  };
  const unduhSemua = () => {
    setStatusUnduh('Menyiapkan seluruh paket (beberapa detik)…');
    setTimeout(() => {
      const h = hasil.data;
      unduhBerkas(`paket-tku-${h.benih}.json`, JSON.stringify({ benih: h.benih, dibuat: h.dibuat, resmi: hasil.resmi, paket: h.paket.map(isiLengkap) }, null, 2), 'application/json');
      setStatusUnduh('Seluruh paket diunduh.');
    }, 20);
  };
  const unduhCsv = () => { unduhBerkas(`daftar-soal-${hasil.data.benih}.csv`, csvSlot(hasil.data), 'text/csv;charset=utf-8'); setStatusUnduh('Daftar soal CSV diunduh.'); };

  return (
    <>
      <KepalaApp aktif="paket" kanan={`${FAMILIES.length} family`} langkah={BANTUAN} />
      <main className="layout">
        {/* ============ KIRI: PENGATURAN ============ */}
        <section className="panel" aria-label="Pengaturan paket">
          <label className="field"><span>Jenis paket</span>
            <select value={jenis} onChange={(e) => setJenis(e.target.value as Jenis)} disabled={berjalan}>
              <option value="tryout">Tryout (empat subtes)</option>
              <option value="latsol">Latsol (satu kelompok)</option>
            </select>
          </label>

          {jenis === 'tryout' ? (
            <>
              <h2><span className="step">1</span> Subtes</h2>
              <div className="row wrap gap-s">
                {URUT_SUBTES.map((st) => (
                  <button key={st} type="button" className={`ghost${subtes.includes(st) ? ' active' : ''}`} aria-pressed={subtes.includes(st)} onClick={() => togelSubtes(st)} disabled={berjalan}>{pendek(st)}</button>
                ))}
              </div>
              <p className="hint">Klik untuk memasukkan atau mengeluarkan subtes. Tryout Mapping memuat keempatnya ({JUMLAH_TRYOUT} tryout).</p>
            </>
          ) : (
            <>
              <h2><span className="step">1</span> Kelompok latsol</h2>
              <label className="field"><span>Kelompok</span>
                <select value={kelompok} onChange={(e) => setKelompok(e.target.value)} disabled={berjalan}>
                  {KELOMPOK_LATSOL_URUT.map((k) => <option key={k} value={k}>{tanpaSoal(k)}</option>)}
                </select>
              </label>
              <p className="hint">Mapping: {JUMLAH_LATSOL} latsol per kelompok, {DURASI_LATSOL} menit per latsol.</p>
            </>
          )}

          <h2>
            <span className="step">2</span> Soal tiap chapter
            <button type="button" className="ghost mini-btn" onClick={baku} disabled={berjalan || samaBaku} title="Kembalikan komposisi Mapping">Baku</button>
          </h2>
          {(jenis === 'tryout' ? URUT_SUBTES.filter((st) => subtes.includes(st)) : [CHAPTERS.find((c) => kelompokLatsol(c) === kelompok)!.subtes]).map((st) => {
            const daftar = chapterAtur.filter((c) => c.subtes === st);
            const jml = daftar.reduce((a, c) => a + (kom[c.id] ?? 0), 0);
            return (
              // dilipat secara bawaan supaya langkah 3 dan tombol Generate tetap terlihat; latsol hanya satu grup, jadi terbuka
              <details key={`${jenis}-${st}-${kelompok}`} className="komposisi-grup" open={jenis === 'latsol' || undefined}>
                <summary>{jenis === 'tryout' ? pendek(st) : tanpaSoal(kelompok)}<span className="total">{jml} soal / {jenis === 'tryout' ? DURASI_TRYOUT[st] : DURASI_LATSOL} menit</span></summary>
                <fieldset className="komposisi-isi" disabled={berjalan}>
                  {daftar.map((c) => (
                    <label key={c.id} className="komposisi-baris">
                      <span>{c.nama}</span>
                      <input type="number" min={0} max={MAKS_SOAL_CHAPTER} step={1} value={kom[c.id] ?? 0} onChange={(e) => ubahKomposisi(c.id, e.target.value)} />
                    </label>
                  ))}
                </fieldset>
              </details>
            );
          })}
          <p className="hint">{totalSoal} soal per {jenis === 'tryout' ? 'tryout' : 'latsol'}{samaBaku ? ' (komposisi Mapping)' : ' (komposisi diubah)'}.{jenis === 'tryout' ? ' Klik nama subtes untuk mengubah jumlah soal tiap chapter.' : ''}</p>

          <h2><span className="step">3</span> Jumlah paket &amp; benih</h2>
          <div className="row gap-s wrap">
            <label className="num-field" title={`Jumlah paket yang dibuat sekaligus (1 sampai ${MAKS_PAKET})`}>
              <span>{jenis === 'tryout' ? 'Tryout' : 'Latsol'}</span>
              <input type="number" min={1} max={MAKS_PAKET} step={1} value={n} disabled={berjalan}
                onChange={(e) => setJumlah((j) => ({ ...j, [jenis]: Math.max(1, Math.min(MAKS_PAKET, Math.floor(Number(e.target.value) || 1))) }))} />
            </label>
            <label className="num-field num-field-lebar" title="Teks bebas. Benih dan pengaturan yang sama menghasilkan paket yang sama.">
              <span>Benih</span>
              <input type="text" value={benih} onChange={(e) => setBenih(e.target.value)} spellCheck={false} disabled={berjalan} placeholder="acak" />
            </label>
            <button type="button" className="ghost" onClick={() => setBenih(seedBaru())} disabled={berjalan}>Acak</button>
          </div>
          <p className="hint">{sesuaiResmi ? 'Pengaturan ini sama dengan paket resmi, jadi hasilnya paket resmi.' : `Benih ${RESMI.benih} dengan pengaturan baku menghasilkan paket resmi.`}</p>

          <div className="aksi-generate">
            <div className="row gap-s">
              <button type="button" className="primary wide-btn" onClick={generate} disabled={berjalan || !totalSoal}>{berjalan ? 'Menyusun…' : 'Generate paket'}</button>
            </div>
            <progress value={kemajuan} max={100} hidden={!berjalan} />
            <div className={`status-line${status.jenis ? ` ${status.jenis}` : ''}`} role="status">{status.teks}</div>
          </div>
        </section>

        {/* ============ TENGAH: PRATINJAU ============ */}
        <section className="panel wide" aria-label="Pratinjau soal">
          <h2>
            <span className="step">4</span> Pratinjau soal
            <span className={`pil ${hasil.resmi ? 'cukup' : 'tanpa-variasi'}`}>{hasil.resmi ? 'Paket resmi' : 'Hasil generate'}</span>
            <span className="redup judul-hasil">{hasil.judul} · benih {hasil.data.benih}</span>
          </h2>
          {!paket ? (
            <div className="pratinjau-kosong"><p>Belum ada paket. Atur pengaturan di kiri, lalu tekan <b>Generate paket</b>.</p></div>
          ) : (
            <>
              <div className="row gap-s wrap bar-alat">
                <button type="button" className="ghost" aria-label="Paket sebelumnya" disabled={idx === 0} onClick={() => setPilih(paketDaftar[idx - 1].id)}>&lsaquo;</button>
                <select className="sempit" aria-label="Pilih paket" value={paket.id} onChange={(e) => setPilih(e.target.value)}>
                  {paketDaftar.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
                <button type="button" className="ghost" aria-label="Paket berikutnya" disabled={idx === paketDaftar.length - 1} onClick={() => setPilih(paketDaftar[idx + 1].id)}>&rsaquo;</button>
                <span className="spasi" />
                {paket.bagian.length > 1 && (
                  <div className="row gap-s wrap" role="tablist" aria-label="Subtes">
                    {paket.bagian.map((b) => (
                      <button key={b.subtes} type="button" role="tab" aria-selected={b === bagian} className={`ghost${b === bagian ? ' active' : ''}`} onClick={() => setTab(b.subtes)}>
                        {pendek(b.subtes)} ({b.slot.length})
                      </button>
                    ))}
                  </div>
                )}
                <label className="check"><input type="checkbox" checked={tampilKunci} onChange={(e) => setTampilKunci(e.target.checked)} /> Tampilkan kunci &amp; pembahasan</label>
              </div>
              <p className="hint">{infoBagian}</p>
              <div className="daftar-soal" ref={daftarRef}>
                {soalBagian.map(({ s, soal }, i) => {
                  const c = chapterById(s.chapterId);
                  const awalBacaan = s.bacaan ? soalBagian.findIndex((x) => x.s.bacaan === s.bacaan) : i;
                  return (
                    <article key={`${paket.id}-${i}`} className="soal">
                      <div className="soal-kepala">
                        <b>Soal {i + 1}</b>
                        <span className="tanda">{c.nama}</span>
                        {s.label && <span className={`label ${s.label}`}>{s.label === 'SHL' ? 'SHL' : 'VAR'}</span>}
                        {s.tingkat && <span className={`tanda tingkat-${s.tingkat}`}>{NAMA_TINGKAT[s.tingkat as keyof typeof NAMA_TINGKAT] ?? s.tingkat}</span>}
                        {tampilKunci && huruf(s) && <span className="tanda kunci">Kunci: {huruf(s)}</span>}
                        {s.familyId && <span className="tanda id">{s.familyId}</span>}
                        {s.uid && <Link href={`/studio?f=${encodeURIComponent(s.familyId!)}&s=${encodeURIComponent(s.seed!)}`}>Buka di Studio</Link>}
                      </div>
                      <div className="soal-badan">
                        {soal ? (
                          <>
                            <TampilSoal soal={soal} tampilKunci={tampilKunci} tanpaBacaan={awalBacaan < i ? `Bacaan sama dengan soal ${awalBacaan + 1}.` : undefined} />
                            {tampilKunci && <div className="pembahasan-soal"><Pembahasan soal={soal} sidik={false} /></div>}
                          </>
                        ) : (
                          <div className="galat">Slot kosong: {s.alasan ?? 'soal gagal dibangkitkan'}</div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* ============ KANAN: HASIL DAN UNDUHAN ============ */}
        <section className="panel" aria-label="Hasil pemeriksaan dan unduhan">
          <h2><span className="step">5</span> Hasil pemeriksaan</h2>
          <div className={`lencana ${cek.lolos ? 'ok' : 'bad'}`}>{cek.lolos ? 'Lolos pemeriksaan' : 'Perlu dicek'}</div>
          <dl className="ukur">
            <dt>Paket</dt><dd>{paketDaftar.length}</dd>
            <dt>Soal terisi</dt><dd>{cek.terisi.toLocaleString('id-ID')} dari {cek.slot.toLocaleString('id-ID')}</dd>
            <dt>Struktur kembar</dt><dd>{cek.kembar}</dd>
            <dt>Benih</dt><dd>{hasil.data.benih}</dd>
            <dt>Label</dt><dd>{cek.label.map(([k, v]) => `${k === 'SHL' ? 'SHL' : 'VAR'} ${v}`).join(' · ')}</dd>
            {cek.tingkat.some(([, v]) => v) && <><dt>Tingkat</dt><dd>{cek.tingkat.map(([k, v]) => `${k} ${v}`).join(' · ')}</dd></>}
            {cek.kunci.some(([, v]) => v) && <><dt>Kunci A–E</dt><dd>{cek.kunci.filter(([, v]) => v).map(([k, v]) => `${k} ${v}`).join(' · ')}</dd></>}
            {cek.adaBacaan && <><dt>Bacaan Reading</dt><dd>{cek.bacaanPecah ? `${cek.bacaanPecah} terpecah` : 'utuh'}</dd></>}
            <dt>3 kunci sama beruntun</dt><dd>{cek.deret3}</dd>
          </dl>
          {cek.versiLama > 0 && <p className="galat">{cek.versiLama} soal berasal dari versi family lama. Susun ulang paket resmi dengan <code>npm run paket</code>.</p>}
          {cek.kosong > 0 && (
            <p className="galat">{cek.kosong} slot kosong karena kapasitas struktur chapter habis: {Object.entries(cek.kosongPerChapter).map(([id, v]) => `${chapterById(id).nama} (${v})`).join(', ')}. Kurangi jumlah paket atau soal chapter itu.</p>
          )}
          <table className="tabel-mini">
            <thead><tr><th>Chapter</th><th className="ang">SHL</th><th className="ang">VAR</th><th className="ang">Jumlah</th></tr></thead>
            <tbody>
              {cek.perChapter.map(({ c, shl, variasi }) => (
                <tr key={c.id}><td>{c.nama}</td><td className="ang">{shl}</td><td className="ang">{variasi}</td><td className="ang">{shl + variasi}</td></tr>
              ))}
            </tbody>
          </table>

          <h2><span className="step">6</span> Unduh</h2>
          <p className="hint">Paket yang sedang dilihat:</p>
          <div className="row wrap gap-s">
            <button type="button" className="ghost" onClick={unduhPaket} disabled={!paket}>JSON {paket?.nama.replace(/ · .*/, '') ?? 'paket'}</button>
          </div>
          <p className="hint">Semua hasil:</p>
          <div className="row wrap gap-s">
            <button type="button" className="ghost" onClick={unduhCsv}>Daftar soal (.csv)</button>
            <button type="button" className="primary" onClick={unduhSemua}>JSON semua paket</button>
          </div>
          {statusUnduh && <div className="status-line" role="status">{statusUnduh}</div>}
          <p className="hint">JSON berisi soal lengkap (isi, kunci, pembahasan, sidik, tingkat). CSV berisi daftar slot: paket, chapter, kode SIADU, family, seed, uid, tingkat, dan kunci.</p>
          <h3>Paket resmi</h3>
          <p className="hint">{JUMLAH_TRYOUT} tryout dan {RESMI.paket.length - JUMLAH_TRYOUT} latsol Mapping disusun dengan <code>npm run paket</code> (benih {RESMI.benih}) dan disimpan di <code>lib/data/paket.json</code>. Paket hasil Generate lain hanya ada di peramban sampai diunduh.</p>
        </section>
      </main>
    </>
  );
}
