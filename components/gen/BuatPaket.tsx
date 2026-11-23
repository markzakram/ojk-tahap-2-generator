'use client';

import { useState } from 'react';
import { seedBaru } from '@/lib/core/engine';
import { NAMA_TINGKAT } from '@/lib/core/pilihan-ganda';
import { FAMILIES } from '@/lib/core/registry';
import type { Subtes } from '@/lib/core/types';
import { CHAPTERS, chapterById, JUMLAH_LATSOL, JUMLAH_TRYOUT, NAMA_SUBTES, NAVIGASI, type ChapterMapping } from '@/lib/data/chapters';
import { kapasitasFamily } from '@/lib/data/kapasitas';
import { hasilResmi, RESMI, type Hasil } from '@/lib/paket/hasil';
import {
  DURASI_LATSOL, DURASI_TRYOUT, KELOMPOK_LATSOL_URUT, kelompokLatsol, komposisiBaku, langkahSusun, rencanaLatsol, rencanaSet, rencanaTryout,
  type BobotTingkat,
} from '@/lib/paket/susun';
import type { ModePaket, Pengaturan, PilihTingkat } from './Aplikasi';

const URUT: Subtes[] = ['induktif', 'deduktif', 'bahasa-inggris', 'sjk'];
const pendek = (st: Subtes) => NAMA_SUBTES[st].replace(/^Tes (Penalaran |Pengetahuan )?/, '');
const tanpaSoal = (k: string) => k.replace(/^Soal /, '');
const MAKS_PAKET = 20, MAKS_SOAL = 20;
const CHAPTER_ADA = CHAPTERS.filter((c) => FAMILIES.some((f) => f.chapter.id === c.id));
/** Struktur soal unik per chapter dari `npm run verify` terakhir (versi family saat ini). */
const struktur = (c: ChapterMapping) => FAMILIES.filter((f) => f.chapter.id === c.id).reduce((a, f) => a + (kapasitasFamily(f.id, f.versi)?.sidik ?? 0), 0);

function Stepper({ nilai, ubah, min, maks, label }: { nilai: number; ubah: (n: number) => void; min: number; maks: number; label: string }) {
  return (
    <div className="a-stepper">
      <button type="button" aria-label={`Kurangi ${label}`} onClick={() => ubah(Math.max(min, nilai - 1))}>−</button>
      <output aria-live="polite">{nilai}</output>
      <button type="button" aria-label={`Tambah ${label}`} onClick={() => ubah(Math.min(maks, nilai + 1))}>+</button>
    </div>
  );
}

/** Tabel chapter dikelompokkan Subtes › Category › Lesson seperti Mapping (dan SKD Generator). */
function TabelChapter({ daftar, nilai, ubah, jumlahPaket }: { daftar: ChapterMapping[]; nilai: (c: ChapterMapping) => number; ubah?: (c: ChapterMapping, n: number) => void; jumlahPaket: number }) {
  const grup: { kunci: string; judul: string; chapter: ChapterMapping[] }[] = [];
  for (const c of daftar) {
    const kunci = `${c.subtes}|${c.category}|${c.lesson}`;
    let g = grup.find((x) => x.kunci === kunci);
    if (!g) grup.push((g = { kunci, judul: `${NAMA_SUBTES[c.subtes]} › ${c.category} › ${c.lesson}`, chapter: [] }));
    g.chapter.push(c);
  }
  return (
    <div className="a-tbl-wrap">
      <table className="a-tbl">
        <thead><tr><th>Chapter</th><th>Bentuk soal</th><th className="r">Struktur unik</th><th className="r">Soal per paket</th><th className="r">Kebutuhan</th></tr></thead>
        {grup.map((g) => (
          <tbody key={g.kunci}>
            <tr className="a-grup"><th colSpan={5}>{g.judul}</th></tr>
            {g.chapter.map((c) => {
              const n = nilai(c), butuh = n * jumlahPaket, s = struktur(c);
              return (
                <tr key={c.id}>
                  <td>{c.chapter}{c.chapter !== c.nama && <span className="a-kecil"> ({c.nama})</span>}</td>
                  <td><span className="a-tag">{c.bentuk}</span></td>
                  <td className="r a-num">{s.toLocaleString('id-ID')}</td>
                  <td className="r">{ubah ? <input className="a-angka" type="number" min={0} max={MAKS_SOAL} value={n} aria-label={`Soal per paket ${c.chapter}`} onChange={(e) => ubah(c, Math.max(0, Math.min(MAKS_SOAL, Math.floor(Number(e.target.value) || 0))))} /> : <span className="a-num">{n}</span>}</td>
                  <td className={`r a-num${butuh > s ? ' a-merah' : ''}`}>{butuh}{butuh > s ? ' ⚠' : ''}</td>
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
}

export default function BuatPaket({ p, setP, jadi }: { p: Pengaturan; setP: (p: Pengaturan) => void; jadi: (h: Hasil) => void }) {
  const [berjalan, setBerjalan] = useState(false);
  const [kemajuan, setKemajuan] = useState<{ n: number; teks: string } | null>(null);
  const [galat, setGalat] = useState('');
  const [materiChapter, setMateriChapter] = useState(CHAPTER_ADA[0].id);
  const [materiN, setMateriN] = useState(5);
  const ubah = (x: Partial<Pengaturan>) => setP({ ...p, ...x });

  const mode = p.mode;
  const jumlah = mode === 'resmi' ? JUMLAH_TRYOUT : p.jumlah[mode];
  const kom = mode === 'set' ? Object.fromEntries(p.materi.map((m) => [m.chapterId, m.n])) : komposisiBaku('tryout');
  const komMode = mode === 'tryout' ? p.komposisi.tryout : mode === 'latsol' ? p.komposisi.latsol : kom;
  const daftar = mode === 'tryout' ? CHAPTERS.filter((c) => p.subtes.includes(c.subtes) && (c.perTryout > 0 || (komMode[c.id] ?? 0) > 0))
    : mode === 'latsol' ? CHAPTERS.filter((c) => kelompokLatsol(c) === p.kelompok)
      : mode === 'set' ? p.materi.map((m) => chapterById(m.chapterId)) : CHAPTERS;
  const nilai = (c: ChapterMapping) => (mode === 'resmi' ? c.perTryout : komMode[c.id] ?? 0);
  const soalPerPaket = daftar.reduce((a, c) => a + nilai(c), 0);
  const samaBaku = (mode === 'tryout' || mode === 'latsol') && daftar.every((c) => komMode[c.id] === komposisiBaku(mode)[c.id]);
  const bobot: BobotTingkat | undefined = p.tingkat === 'bank' ? undefined : p.tingkat === 'atur' ? p.proporsi : { [p.tingkat]: 1 };
  const bobotSah = !bobot || Object.values(bobot).some((v) => (v ?? 0) > 0);
  const sesuaiResmi = mode === 'resmi' || (p.tingkat === 'bank' && p.benih.trim() === RESMI.benih && samaBaku &&
    ((mode === 'tryout' && jumlah === JUMLAH_TRYOUT && p.subtes.length === 4) || (mode === 'latsol' && jumlah === JUMLAH_LATSOL)));
  const totalSoal = mode === 'resmi' ? RESMI.paket.reduce((a, x) => a + x.bagian.reduce((b, y) => b + y.slot.length, 0), 0) : soalPerPaket * jumlah;
  const nPaket = mode === 'resmi' ? RESMI.paket.length : jumlah;
  const kurang = mode === 'resmi' ? [] : daftar.filter((c) => nilai(c) * jumlah > struktur(c));

  const ubahKom = (c: ChapterMapping, n: number) => {
    if (mode === 'set') ubah({ materi: p.materi.map((m) => (m.chapterId === c.id ? { ...m, n } : m)) });
    else if (mode === 'tryout' || mode === 'latsol') ubah({ komposisi: { ...p.komposisi, [mode]: { ...p.komposisi[mode], [c.id]: n } } });
  };
  const togel = (st: Subtes) => ubah({ subtes: p.subtes.includes(st) ? (p.subtes.length > 1 ? p.subtes.filter((x) => x !== st) : p.subtes) : URUT.filter((x) => x === st || p.subtes.includes(x)) });

  const buat = async () => {
    if (berjalan || !bobotSah || (mode !== 'resmi' && !soalPerPaket)) return;
    setGalat('');
    const benih = p.benih.trim() || seedBaru();
    if (benih !== p.benih) ubah({ benih });
    if (mode === 'resmi') { jadi(hasilResmi()); return; }
    if (sesuaiResmi) {
      const paket = RESMI.paket.filter((x) => x.jenis === mode && (mode === 'tryout' || x.nama.endsWith(`· ${p.kelompok}`)));
      jadi({ data: { ...RESMI, paket }, resmi: true, judul: mode === 'tryout' ? `${paket.length} tryout resmi` : `${paket.length} latsol resmi ${tanpaSoal(p.kelompok)}` });
      return;
    }
    const rencana = mode === 'tryout' ? rencanaTryout(jumlah, komMode, p.subtes) : mode === 'latsol' ? rencanaLatsol(p.kelompok, jumlah, komMode) : rencanaSet(jumlah, p.materi);
    const g = langkahSusun(FAMILIES, rencana, [rencana.map((_, i) => i)], benih, bobot);
    setBerjalan(true); setKemajuan({ n: 0, teks: 'Menyiapkan…' });
    try {
      for (;;) {
        await new Promise((r) => setTimeout(r, 0));
        const r = g.next();
        if (r.done) {
          const judul = mode === 'tryout' ? `${jumlah} tryout${p.subtes.length < 4 ? ` (${p.subtes.map(pendek).join(', ')})` : ''}` : mode === 'latsol' ? `${jumlah} latsol ${tanpaSoal(p.kelompok)}` : `${jumlah} set per chapter`;
          jadi({ data: r.value, resmi: false, judul });
          break;
        }
        setKemajuan({ n: Math.round((r.value.selesai / r.value.total) * 100), teks: `Menyusun ${r.value.chapter} (${r.value.selesai}/${r.value.total})` });
      }
    } catch (e) {
      setGalat(`Gagal menyusun paket: ${String(e)}`);
    } finally {
      setBerjalan(false); setKemajuan(null);
    }
  };

  const JENIS: { id: ModePaket; judul: string; ket: string }[] = [
    { id: 'resmi', judul: 'Paket resmi Mapping', ket: `${JUMLAH_TRYOUT} tryout + ${RESMI.paket.length - JUMLAH_TRYOUT} latsol · 1.440 soal · benih ${RESMI.benih}` },
    { id: 'tryout', judul: 'Tryout', ket: 'Empat subtes, komposisi per chapter dapat diatur' },
    { id: 'latsol', judul: 'Latsol', ket: 'Satu kelompok latihan Mapping, 10 soal per latsol' },
    { id: 'set', judul: 'Per chapter', ket: 'Pilih chapter dan jumlah soal sendiri' },
  ];

  return (
    <>
      <div className="a-page-head">
        <div>
          <h1 className="a-page-title">Buat paket</h1>
          <p className="a-sub">Komposisi mengikuti Mapping Tahap 2 PCAM OJK 2026 (Category, Lesson, Chapter, dan Bentuk Soal). Setiap soal dibangkitkan dari family yang lolos verifikasi; satu struktur soal hanya dipakai sekali di seluruh hasil.</p>
        </div>
      </div>
      <div className="a-cols">
        <div className="a-grow a-stack">
          <section className="a-card">
            <h2>1 · Jenis paket</h2>
            <div className="a-row">
              {JENIS.map((j) => (
                <button key={j.id} type="button" className="a-choice" aria-pressed={mode === j.id} onClick={() => ubah({ mode: j.id })} disabled={berjalan}>
                  <b>{j.judul}</b><span>{j.ket}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="a-card">
            <h2>2 · Jumlah paket dan {mode === 'latsol' ? 'kelompok' : mode === 'set' ? 'materi' : 'subtes'}</h2>
            {mode === 'resmi' && <p className="a-sub">Paket resmi disusun dengan <code>npm run paket</code>: 10 tryout (89 soal: Induktif 15, Deduktif 12, Bahasa Inggris 12, Sektor Jasa Keuangan 50) dan 5 latsol untuk 11 kelompok latsol Mapping. Pilih jenis lain untuk mengatur jumlah dan komposisi sendiri.</p>}
            {mode !== 'resmi' && (
              <div className="a-row" style={{ gap: '14px 28px', marginBottom: 14 }}>
                <div>
                  <div className="a-kecil" style={{ marginBottom: 4 }}>{mode === 'tryout' ? 'Tryout' : mode === 'latsol' ? 'Latsol' : 'Set'} (1–{MAKS_PAKET})</div>
                  <Stepper nilai={jumlah} min={1} maks={MAKS_PAKET} label="jumlah paket" ubah={(n) => ubah({ jumlah: { ...p.jumlah, [mode]: n } })} />
                </div>
                {mode === 'latsol' && (
                  <label className="a-field">
                    <span>Kelompok latsol</span>
                    <select className="a-input" value={p.kelompok} onChange={(e) => ubah({ kelompok: e.target.value })}>
                      {KELOMPOK_LATSOL_URUT.map((k) => <option key={k} value={k}>{tanpaSoal(k)}</option>)}
                    </select>
                  </label>
                )}
              </div>
            )}
            {mode === 'tryout' && (
              <div className="a-row" style={{ gap: 8 }}>
                {URUT.map((st) => (
                  <button key={st} type="button" className="a-chip" aria-pressed={p.subtes.includes(st)} onClick={() => togel(st)}>
                    <strong>{pendek(st)}</strong> · {CHAPTERS.filter((c) => c.subtes === st).reduce((a, c) => a + c.perTryout, 0)} soal · {DURASI_TRYOUT[st]} menit
                  </button>
                ))}
              </div>
            )}
            {mode === 'set' && (
              <div className="a-row" style={{ alignItems: 'flex-end' }}>
                <label className="a-field" style={{ flex: '2 1 260px' }}>
                  <span>Chapter</span>
                  <select className="a-input" value={materiChapter} onChange={(e) => setMateriChapter(e.target.value)}>
                    {URUT.map((st) => (
                      <optgroup key={st} label={NAMA_SUBTES[st]}>
                        {CHAPTER_ADA.filter((c) => c.subtes === st).map((c) => <option key={c.id} value={c.id}>{c.chapter}{c.chapter !== c.nama ? ` (${c.lesson})` : ''}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <label className="a-field" style={{ flex: '0 0 110px' }}>
                  <span>Soal per set</span>
                  <input className="a-input" type="number" min={1} max={MAKS_SOAL} value={materiN} onChange={(e) => setMateriN(Math.max(1, Math.min(MAKS_SOAL, Number(e.target.value) || 1)))} />
                </label>
                <button type="button" className="a-btn" onClick={() => ubah({ materi: p.materi.some((m) => m.chapterId === materiChapter) ? p.materi.map((m) => (m.chapterId === materiChapter ? { ...m, n: materiN } : m)) : [...p.materi, { chapterId: materiChapter, n: materiN }] })}>Tambahkan</button>
              </div>
            )}
            {mode === 'latsol' && <p className="a-kecil" style={{ marginTop: 8 }}>Mapping: {JUMLAH_LATSOL} latsol per kelompok, 10 soal dan {DURASI_LATSOL} menit per latsol.</p>}
          </section>

          <section className="a-card">
            <div className="a-row" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}>3 · Soal per chapter</h2>
              {(mode === 'tryout' || mode === 'latsol') && <button type="button" className="a-btn a-btn-sm" disabled={samaBaku} onClick={() => ubah({ komposisi: { ...p.komposisi, [mode]: komposisiBaku(mode) } })}>Kembalikan Mapping</button>}
              {mode === 'set' && p.materi.length > 0 && <button type="button" className="a-btn a-btn-sm" onClick={() => ubah({ materi: [] })}>Kosongkan</button>}
            </div>
            <p className="a-kecil" style={{ margin: '4px 0 10px' }}>
              {mode === 'resmi' ? 'Jumlah soal per tryout menurut Mapping (latsol mengikuti kolom Distribusi Latsol).' : 'Angka berlaku untuk setiap paket. Kebutuhan = soal per paket × jumlah paket; tanda ⚠ berarti melebihi struktur unik yang tersedia sehingga sebagian slot akan kosong.'}
              {' '}{mode === 'tryout' ? p.subtes.map((st) => `${pendek(st)}: ${NAVIGASI[st].replace('Navigation: Disable · ', '')}`).join(' · ') : ''}
            </p>
            {mode === 'set' && !p.materi.length ? <div className="a-note a-note-info">Belum ada materi. Pilih chapter dan jumlah soal di langkah 2, lalu tekan <b>Tambahkan</b>.</div>
              : <TabelChapter daftar={daftar} nilai={nilai} ubah={mode === 'resmi' ? undefined : ubahKom} jumlahPaket={mode === 'resmi' ? JUMLAH_TRYOUT : jumlah} />}
          </section>

          <section className="a-card">
            <h2>4 · Tingkat kesulitan dan benih</h2>
            <div className="a-row" style={{ gap: '16px 24px', alignItems: 'flex-end' }}>
              <label className="a-field" style={{ flex: '1 1 220px' }}>
                <span>Tingkat kesulitan</span>
                <select className="a-input" value={p.tingkat} disabled={mode === 'resmi'} onChange={(e) => ubah({ tingkat: e.target.value as PilihTingkat })}>
                  <option value="bank">Campur (sebaran bank)</option>
                  <option value="atur">Campur (atur perbandingan)</option>
                  <option value="dasar">Dasar semua</option>
                  <option value="menengah">Menengah semua</option>
                  <option value="menantang">Menantang semua</option>
                </select>
              </label>
              {p.tingkat === 'atur' && mode !== 'resmi' && (['dasar', 'menengah', 'menantang'] as const).map((t) => (
                <label key={t} className="a-field" style={{ flex: '0 0 96px' }}>
                  <span>{NAMA_TINGKAT[t]}</span>
                  <input className="a-input" type="number" min={0} max={100} value={p.proporsi[t]} onChange={(e) => ubah({ proporsi: { ...p.proporsi, [t]: Math.max(0, Math.min(100, Math.floor(Number(e.target.value) || 0))) } })} />
                </label>
              ))}
              <label className="a-field" style={{ flex: '1 1 180px' }}>
                <span>Benih</span>
                <input className="a-input" value={p.benih} disabled={mode === 'resmi'} spellCheck={false} onChange={(e) => ubah({ benih: e.target.value })} />
              </label>
              <button type="button" className="a-btn" disabled={mode === 'resmi'} onClick={() => ubah({ benih: seedBaru() })}>Acak</button>
            </div>
            <p className="a-kecil" style={{ margin: '10px 0 0' }}>Tingkat berlaku untuk Badges, Bahasa Inggris selain Reading, dan Sektor Jasa Keuangan; soal Induktif dan Deduktif lain belum bertingkat. Benih dan pengaturan yang sama selalu menghasilkan paket yang sama.{!bobotSah && <b className="a-merah"> Isi sedikitnya satu angka perbandingan.</b>}</p>
          </section>
        </div>

        <aside className="a-card a-side a-stack a-lekat">
          <div>
            <div className="a-kecil">Ringkasan</div>
            <div className="a-num" style={{ fontSize: 30, fontWeight: 800 }}>{totalSoal.toLocaleString('id-ID')} soal</div>
            <div className="a-kecil">{nPaket} paket · {mode === 'resmi' ? '890 tryout + 550 latsol' : `${soalPerPaket} soal per paket`}{sesuaiResmi && mode !== 'resmi' ? ' · sama dengan paket resmi' : ''}</div>
          </div>
          <div className="a-stack" style={{ gap: 10 }}>
            {URUT.filter((st) => daftar.some((c) => c.subtes === st && nilai(c) > 0)).map((st) => {
              const ch = daftar.filter((c) => c.subtes === st);
              const butuh = ch.reduce((a, c) => a + nilai(c) * (mode === 'resmi' ? 1 : jumlah), 0);
              const siap = ch.reduce((a, c) => a + Math.min(nilai(c) * (mode === 'resmi' ? 1 : jumlah), struktur(c)), 0);
              return (
                <div key={st}>
                  <div className="a-row a-num" style={{ justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><strong>{pendek(st)}</strong><span className="a-muted">{siap} siap / {butuh}{mode === 'resmi' ? ' per tryout' : ''}</span></div>
                  <div className={`a-bar${siap >= butuh ? ' a-bar-penuh' : ''}`}><div style={{ width: `${butuh ? Math.round((siap / butuh) * 100) : 0}%` }} /></div>
                </div>
              );
            })}
          </div>
          {kurang.length > 0
            ? <div role="status" className="a-note a-note-warn"><strong>Struktur unik kurang di {kurang.length} chapter</strong> ({kurang.map((c) => c.chapter).join(', ')}). Slot yang tidak dapat diisi tetap kosong dan dilaporkan di Hasil paket.</div>
            : <div role="status" className="a-note a-note-ok"><strong>Stok cukup.</strong> Semua chapter punya struktur soal yang dibutuhkan{bobot ? '; pembatasan tingkat dapat mengurangi stok' : ''}.</div>}
          <button type="button" className="a-btn a-btn-primary" disabled={berjalan || !bobotSah || (mode !== 'resmi' && !soalPerPaket)} onClick={buat}>
            {berjalan ? 'Menyusun…' : mode === 'resmi' ? 'Buka paket resmi' : `Buat ${nPaket} paket`}
          </button>
          {kemajuan && (<><progress value={kemajuan.n} max={100} /><div className="a-kecil" role="status">{kemajuan.teks}…</div></>)}
          {galat && <div className="a-note a-note-warn">{galat}</div>}
          <p className="a-kecil" style={{ margin: 0 }}>Struktur unik = sidik soal berbeda per chapter menurut <code>npm run verify</code> terakhir. Hasil penyusunan, pemeriksaan, dan pembacaan soal tampil di <b>Hasil paket</b>; unduhan Word SiAdu, JSON, dan CSV di <b>Ekspor</b>.</p>
        </aside>
      </div>
    </>
  );
}
