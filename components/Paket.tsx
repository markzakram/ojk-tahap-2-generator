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
  DURASI_LATSOL, DURASI_TRYOUT, KELOMPOK_LATSOL_URUT, kelompokLatsol, komposisiBaku, langkahSusun, rencanaLatsol, rencanaSet,
  rencanaTryout, ringkasPaket, type BobotTingkat, type HasilSusun, type Paket as TPaket, type SlotPaket,
} from '@/lib/paket/susun';
import KepalaApp from './KepalaApp';
import TampilSoal, { Pembahasan } from './TampilSoal';

// Generator Tahap 2 (halaman utama), alur dan langkah 1–7 sama dengan generator Tahap 1:
//   kiri   — mode generate; 1 subtes/kelompok/materi; 2 soal tiap chapter (terbuka, dapat diubah); 3 tingkat kesulitan;
//            4 jumlah paket & benih; tombol Generate paket
//   tengah — 5 pratinjau soal (pilih paket dan subtes, soal dapat dikerjakan, kunci dan pembahasan)
//   kanan  — 6 hasil pemeriksaan; 7 unduh
// Pengaturan baku dengan benih paket resmi menampilkan paket resmi (lib/data/paket.json, `npm run paket`); pengaturan lain
// disusun di peramban dengan perakit yang sama (lib/paket/susun.ts).

const RESMI = DATA as unknown as HasilSusun;
const URUT_SUBTES: Subtes[] = ['induktif', 'deduktif', 'bahasa-inggris', 'sjk'];
const MAKS_PAKET = 20;
const MAKS_SOAL_CHAPTER = 20;
const pendek = (st: Subtes) => NAMA_SUBTES[st].replace(/^Tes (Penalaran |Pengetahuan )?/, '');
const tanpaSoal = (k: string) => k.replace(/^Soal /, '');
const huruf = (s: SlotPaket) => (s.kunci && /^[A-E]$/.test(s.kunci) ? s.kunci : undefined);
const CHAPTER_ADA = CHAPTERS.filter((c) => FAMILIES.some((f) => f.chapter.id === c.id));

type Mode = 'tryout' | 'latsol' | 'set';
type PilihTingkat = 'bank' | 'atur' | 'dasar' | 'menengah' | 'menantang';
interface Hasil { data: HasilSusun; resmi: boolean; judul: string }
interface Materi { chapterId: string; n: number }

const NAMA_MODE: Record<Mode, string> = { tryout: 'Tryout', latsol: 'Latsol', set: 'Per Chapter' };
const JUMLAH_BAKU: Record<Mode, number> = { tryout: JUMLAH_TRYOUT, latsol: JUMLAH_LATSOL, set: 3 };

const BANTUAN = [
  <><b>Pilih mode.</b> <i>Tryout</i> berisi subtes dengan komposisi Mapping per chapter, <i>Latsol</i> berisi satu kelompok latihan Mapping, dan <i>Per Chapter</i> untuk menambahkan chapter dan jumlah soal masing-masing.</>,
  <><b>Atur jumlah.</b> Jumlah soal pada daftar chapter berlaku untuk setiap paket. Tombol <i>Baku</i> mengembalikan angka Mapping.</>,
  <><b>Tingkat kesulitan.</b> <i>Campur (sebaran bank)</i> mengikuti bank soal; pilih perbandingan dasar : menengah : menantang atau satu tingkat saja. Tingkat berlaku untuk Badges, Bahasa Inggris selain Reading, dan Sektor Jasa Keuangan.</>,
  <><b>Jumlah paket dan benih.</b> Benih dan pengaturan yang sama selalu menghasilkan paket yang sama. Pengaturan baku dengan benih <code>{RESMI.benih}</code> menampilkan paket resmi. Lalu tekan <i>Generate paket</i>.</>,
  <><b>Lihat paket.</b> Pilih paket dan subtes di tengah. Soal dapat langsung dikerjakan; centang <i>Tampilkan kunci &amp; pembahasan</i> untuk melihat jawaban dan langkahnya.</>,
  <><b>Hasil pemeriksaan.</b> Panel kanan menghitung soal terisi, struktur kembar (harus 0), sebaran label SHL/VARIASI, tingkat, huruf kunci, dan bacaan Reading utuh.</>,
  <><b>Unduh.</b> JSON berisi soal lengkap (isi, kunci, pembahasan) per paket atau semua paket; CSV berisi daftar soal dengan kode SIADU, seed, tingkat, dan kunci.</>,
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
    const t = (n: string) => s.filter((x) => x.tingkat === n).length;
    return { c, shl: s.filter((x) => x.label === 'SHL').length, variasi: s.filter((x) => x.label === 'VARIASI').length, dasar: t('dasar'), menengah: t('menengah'), menantang: t('menantang') };
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

const resmiUntuk = (mode: 'tryout' | 'latsol', kelompok: string): Hasil => {
  const paket = RESMI.paket.filter((p) => p.jenis === mode && (mode === 'tryout' || p.nama.endsWith(`· ${kelompok}`)));
  return { data: { ...RESMI, paket }, resmi: true, judul: mode === 'tryout' ? `${paket.length} tryout resmi` : `${paket.length} latsol resmi ${tanpaSoal(kelompok)}` };
};

export default function Paket() {
  // ---- pengaturan (kiri) ----
  const [mode, setMode] = useState<Mode>('tryout');
  const [subtes, setSubtes] = useState<Subtes | 'semua'>('semua');
  const [kelompok, setKelompok] = useState(KELOMPOK_LATSOL_URUT[0]);
  const [komposisi, setKomposisi] = useState({ tryout: komposisiBaku('tryout'), latsol: komposisiBaku('latsol') });
  const [materi, setMateri] = useState<Materi[]>([]);
  const [materiSubtes, setMateriSubtes] = useState<Subtes>('induktif');
  const [materiChapter, setMateriChapter] = useState(CHAPTER_ADA.find((c) => c.subtes === 'induktif')!.id);
  const [materiJumlah, setMateriJumlah] = useState(5);
  const [tingkat, setTingkat] = useState<PilihTingkat>('bank');
  const [proporsi, setProporsi] = useState({ dasar: 3, menengah: 5, menantang: 2 });
  const [jumlah, setJumlah] = useState<Record<Mode, number>>(JUMLAH_BAKU);
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

  // ---- komposisi aktif ----
  const subtesTryout = subtes === 'semua' ? URUT_SUBTES : [subtes];
  const kom = mode === 'set' ? Object.fromEntries(materi.map((m) => [m.chapterId, m.n])) : komposisi[mode];
  const chapterAtur = mode === 'tryout'
    ? CHAPTERS.filter((c) => subtesTryout.includes(c.subtes) && (c.perTryout > 0 || (kom[c.id] ?? 0) > 0))
    : mode === 'latsol' ? CHAPTERS.filter((c) => kelompokLatsol(c) === kelompok)
      : materi.map((m) => chapterById(m.chapterId));
  const totalSoal = chapterAtur.reduce((a, c) => a + (kom[c.id] ?? 0), 0);
  const samaBaku = mode !== 'set' && chapterAtur.every((c) => kom[c.id] === komposisiBaku(mode)[c.id]);
  const n = jumlah[mode];
  const bobot: BobotTingkat | undefined = tingkat === 'bank' ? undefined : tingkat === 'atur' ? proporsi : { [tingkat]: 1 };
  const bobotValid = !bobot || Object.values(bobot).some((v) => (v ?? 0) > 0);
  const sesuaiResmi = mode !== 'set' && tingkat === 'bank' && benih.trim() === RESMI.benih && samaBaku && n === JUMLAH_BAKU[mode] && (mode === 'latsol' || subtes === 'semua');

  const ubahKomposisi = (id: string, v: string) => {
    const x = Math.max(0, Math.min(MAKS_SOAL_CHAPTER, Math.floor(Number(v) || 0)));
    if (mode === 'set') setMateri((m) => m.map((y) => (y.chapterId === id ? { ...y, n: x } : y)));
    else setKomposisi((k) => ({ ...k, [mode]: { ...k[mode as 'tryout' | 'latsol'], [id]: x } }));
  };
  const baku = () => { if (mode !== 'set') setKomposisi((k) => ({ ...k, [mode]: komposisiBaku(mode) })); };
  const pilihMateriSubtes = (st: Subtes) => { setMateriSubtes(st); setMateriChapter(CHAPTER_ADA.find((c) => c.subtes === st)!.id); };
  const tambahMateri = () => {
    const x = Math.max(1, Math.min(MAKS_SOAL_CHAPTER, Math.floor(materiJumlah) || 1));
    setMateri((m) => (m.some((y) => y.chapterId === materiChapter) ? m.map((y) => (y.chapterId === materiChapter ? { ...y, n: x } : y)) : [...m, { chapterId: materiChapter, n: x }]));
  };

  const tampilkan = (h: Hasil) => {
    setHasil(h);
    setPilih(h.data.paket[0]?.id ?? '');
    setTab(h.data.paket[0]?.bagian[0]?.subtes ?? 'induktif');
  };

  const generate = async () => {
    if (berjalan || !totalSoal || !bobotValid) return;
    const b = benih.trim() || seedBaru();
    if (b !== benih) setBenih(b);
    if (sesuaiResmi) {
      tampilkan(resmiUntuk(mode as 'tryout' | 'latsol', kelompok));
      setStatus({ teks: `Pengaturan sama dengan paket resmi; menampilkan paket resmi (disusun ${RESMI.dibuat}).`, jenis: 'ok' });
      return;
    }
    const rencana = mode === 'tryout' ? rencanaTryout(n, kom, subtesTryout) : mode === 'latsol' ? rencanaLatsol(kelompok, n, kom) : rencanaSet(n, materi);
    const g = langkahSusun(FAMILIES, rencana, [rencana.map((_, i) => i)], b, bobot);
    setBerjalan(true); setKemajuan(0);
    const t0 = performance.now();
    try {
      for (;;) {
        await new Promise((r) => setTimeout(r, 0));
        const r = g.next();
        if (r.done) {
          const cek = periksa(r.value);
          const judul = mode === 'tryout' ? `${n} tryout${subtes === 'semua' ? '' : ` ${pendek(subtes)}`}` : mode === 'latsol' ? `${n} latsol ${tanpaSoal(kelompok)}` : `${n} set per chapter`;
          tampilkan({ data: r.value, resmi: false, judul });
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

  // grup komposisi (langkah 2): satu fieldset per subtes, terbuka seperti Tahap 1
  const grupKomposisi = mode === 'tryout'
    ? subtesTryout.map((st) => ({ kunci: st, judul: pendek(st), menit: DURASI_TRYOUT[st], daftar: chapterAtur.filter((c) => c.subtes === st) }))
    : mode === 'latsol' ? [{ kunci: kelompok, judul: tanpaSoal(kelompok), menit: DURASI_LATSOL, daftar: chapterAtur }]
      : [];

  return (
    <>
      <KepalaApp aktif="generator" kanan={`${FAMILIES.length} family`} langkah={BANTUAN} />
      <main className="layout">
        {/* ============ KIRI: PENGATURAN ============ */}
        <section className="panel panel-atur" aria-label="Pengaturan generate">
          <label className="field"><span>Mode generate</span>
            <select value={mode} onChange={(e) => setMode(e.target.value as Mode)} disabled={berjalan}>
              <option value="tryout">Tryout</option>
              <option value="latsol">Latsol</option>
              <option value="set">Per Chapter</option>
            </select>
          </label>

          {mode === 'tryout' && (
            <>
              <h2><span className="step">1</span> Subtes</h2>
              <div className="row wrap gap-s">
                {URUT_SUBTES.map((st) => (
                  <button key={st} type="button" className={`ghost${subtes === st ? ' active' : ''}`} aria-pressed={subtes === st} onClick={() => setSubtes(st)} disabled={berjalan}>{pendek(st)}</button>
                ))}
                <button type="button" className={`ghost${subtes === 'semua' ? ' active' : ''}`} aria-pressed={subtes === 'semua'} onClick={() => setSubtes('semua')} disabled={berjalan}>Semua</button>
              </div>
              <p className="hint">Tryout Mapping memuat keempat subtes: Induktif 15 soal, Deduktif 12, Bahasa Inggris 12, dan Sektor Jasa Keuangan 50.</p>
            </>
          )}
          {mode === 'latsol' && (
            <>
              <h2><span className="step">1</span> Kelompok latsol</h2>
              <label className="field"><span>Kelompok</span>
                <select value={kelompok} onChange={(e) => setKelompok(e.target.value)} disabled={berjalan}>
                  {KELOMPOK_LATSOL_URUT.map((k) => <option key={k} value={k}>{tanpaSoal(k)}</option>)}
                </select>
              </label>
              <p className="hint">Mapping: {JUMLAH_LATSOL} latsol per kelompok, 10 soal dan {DURASI_LATSOL} menit per latsol.</p>
            </>
          )}
          {mode === 'set' && (
            <>
              <h2><span className="step">1</span> Pilih materi</h2>
              <label className="field"><span>Subtes</span>
                <select value={materiSubtes} onChange={(e) => pilihMateriSubtes(e.target.value as Subtes)} disabled={berjalan}>
                  {URUT_SUBTES.map((st) => <option key={st} value={st}>{pendek(st)}</option>)}
                </select>
              </label>
              <label className="field"><span>Chapter</span>
                <select value={materiChapter} onChange={(e) => setMateriChapter(e.target.value)} disabled={berjalan}>
                  {CHAPTER_ADA.filter((c) => c.subtes === materiSubtes).map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
                </select>
              </label>
              <div className="row gap-s">
                <label className="num-field"><span>Soal per set</span>
                  <input type="number" min={1} max={MAKS_SOAL_CHAPTER} step={1} value={materiJumlah} onChange={(e) => setMateriJumlah(Number(e.target.value) || 1)} disabled={berjalan} />
                </label>
                <button type="button" className="ghost tombol-tambah" onClick={tambahMateri} disabled={berjalan}>Tambahkan</button>
              </div>
            </>
          )}

          <h2>
            <span className="step">2</span> {mode === 'set' ? 'Materi yang dipilih' : 'Soal tiap chapter'}
            {mode !== 'set' && <button type="button" className="ghost mini-btn" onClick={baku} disabled={berjalan || samaBaku} title="Kembalikan komposisi Mapping">Baku</button>}
          </h2>
          {grupKomposisi.map((g) => (
            <fieldset key={g.kunci} className="komposisi-grup" disabled={berjalan}>
              <legend>{g.judul}<span className="total">{g.daftar.reduce((a, c) => a + (kom[c.id] ?? 0), 0)} soal / {g.menit} menit</span></legend>
              {g.daftar.map((c) => (
                <label key={c.id} className="komposisi-baris">
                  <span>{c.nama}</span>
                  <input type="number" min={0} max={MAKS_SOAL_CHAPTER} step={1} value={kom[c.id] ?? 0} onChange={(e) => ubahKomposisi(c.id, e.target.value)} />
                </label>
              ))}
            </fieldset>
          ))}
          {mode === 'set' && (
            materi.length ? (
              <fieldset className="komposisi-grup" disabled={berjalan}>
                <legend>Per set<span className="total">{totalSoal} soal</span></legend>
                {materi.map((m) => (
                  <div key={m.chapterId} className="komposisi-baris">
                    <span>{chapterById(m.chapterId).nama} <span className="redup">· {pendek(chapterById(m.chapterId).subtes)}</span></span>
                    <span className="row gap-s">
                      <input type="number" aria-label={`Jumlah soal ${chapterById(m.chapterId).nama}`} min={0} max={MAKS_SOAL_CHAPTER} step={1} value={m.n} onChange={(e) => ubahKomposisi(m.chapterId, e.target.value)} />
                      <button type="button" className="ghost mini-hapus" aria-label={`Hapus ${chapterById(m.chapterId).nama}`} onClick={() => setMateri((x) => x.filter((y) => y.chapterId !== m.chapterId))}>×</button>
                    </span>
                  </div>
                ))}
              </fieldset>
            ) : <p className="hint">Belum ada materi. Pilih subtes dan chapter di langkah 1, lalu tekan <i>Tambahkan</i>.</p>
          )}
          {mode !== 'set' && <p className="hint">{totalSoal} soal per {mode === 'tryout' ? 'tryout' : 'latsol'}{samaBaku ? ' (komposisi Mapping)' : ' (komposisi diubah)'}.</p>}

          <h2><span className="step">3</span> Tingkat kesulitan</h2>
          <label className="field"><span>Tingkat</span>
            <select value={tingkat} onChange={(e) => setTingkat(e.target.value as PilihTingkat)} disabled={berjalan}>
              <option value="bank">Campur (sebaran bank)</option>
              <option value="atur">Campur (atur perbandingan)</option>
              <option value="dasar">Dasar semua</option>
              <option value="menengah">Menengah semua</option>
              <option value="menantang">Menantang semua</option>
            </select>
          </label>
          {tingkat === 'atur' && (
            <div className="row gap-s" title="Perbandingan banyak soal dasar : menengah : menantang">
              {(['dasar', 'menengah', 'menantang'] as const).map((t) => (
                <label key={t} className="num-field num-field-kecil"><span>{NAMA_TINGKAT[t]}</span>
                  <input type="number" min={0} max={100} step={1} value={proporsi[t]} disabled={berjalan} onChange={(e) => setProporsi((p) => ({ ...p, [t]: Math.max(0, Math.min(100, Math.floor(Number(e.target.value) || 0))) }))} />
                </label>
              ))}
            </div>
          )}
          <p className="hint">Berlaku untuk Badges, Bahasa Inggris selain Reading, dan Sektor Jasa Keuangan; soal Induktif dan Deduktif lainnya belum bertingkat.{!bobotValid && <b className="teks-galat"> Isi sedikitnya satu angka perbandingan.</b>}</p>

          <h2><span className="step">4</span> Jumlah paket &amp; benih</h2>
          <div className="row gap-s wrap">
            <label className="num-field" title={`Jumlah paket yang dibuat sekaligus (1 sampai ${MAKS_PAKET})`}>
              <span>{mode === 'set' ? 'Set' : NAMA_MODE[mode]}</span>
              <input type="number" min={1} max={MAKS_PAKET} step={1} value={n} disabled={berjalan}
                onChange={(e) => setJumlah((j) => ({ ...j, [mode]: Math.max(1, Math.min(MAKS_PAKET, Math.floor(Number(e.target.value) || 1))) }))} />
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
              <button type="button" className="primary wide-btn" onClick={generate} disabled={berjalan || !totalSoal || !bobotValid}>{berjalan ? 'Menyusun…' : 'Generate paket'}</button>
            </div>
            <progress value={kemajuan} max={100} hidden={!berjalan} />
            <div className={`status-line${status.jenis ? ` ${status.jenis}` : ''}`} role="status">{status.teks}</div>
          </div>
        </section>

        {/* ============ TENGAH: PRATINJAU ============ */}
        <section className="panel wide" aria-label="Pratinjau soal">
          <h2>
            <span className="step">5</span> Pratinjau soal
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
          <h2><span className="step">6</span> Hasil pemeriksaan</h2>
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
            <p className="galat">{cek.kosong} slot kosong karena struktur chapter habis untuk pengaturan ini: {Object.entries(cek.kosongPerChapter).map(([id, v]) => `${chapterById(id).nama} (${v})`).join(', ')}. Kurangi jumlah paket atau soal chapter itu, atau longgarkan tingkat.</p>
          )}
          <table className="tabel-mini">
            <thead><tr><th>Chapter</th><th className="ang" title="SHL / VARIASI">SHL·VAR</th><th className="ang" title="Dasar / menengah / menantang">D·M·Mn</th><th className="ang">Jumlah</th></tr></thead>
            <tbody>
              {cek.perChapter.map(({ c, shl, variasi, dasar, menengah, menantang }) => (
                <tr key={c.id}>
                  <td>{c.nama}</td>
                  <td className="ang">{shl}·{variasi}</td>
                  <td className="ang">{dasar + menengah + menantang ? `${dasar}·${menengah}·${menantang}` : '—'}</td>
                  <td className="ang">{shl + variasi}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2><span className="step">7</span> Unduh</h2>
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
