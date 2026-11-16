'use client';

import { useEffect, useMemo, useState } from 'react';
import { bangkitkan, GagalBangun, seedBaru } from '@/lib/core/engine';
import { FAMILIES } from '@/lib/core/registry';
import type { Soal } from '@/lib/core/types';
import { CHAPTERS, NAMA_SUBTES } from '@/lib/data/chapters';
import { kapasitasFamily } from '@/lib/data/kapasitas';
import type { CalendarItem } from '@/lib/deduktif/calendar/model';
import type { Alokasi, RoomItem } from '@/lib/deduktif/room/model';
import type { TimelineItem } from '@/lib/deduktif/timeline/model';
import type { Susunan, TimeslotItem } from '@/lib/deduktif/timeslot/model';
import type { DragLineItem } from '@/lib/induktif/drag-line/pola';
import type { Frame } from '@/lib/induktif/fill-shape/geometri';
import type { PilihanGandaItem } from '@/lib/bahasa-inggris/model';
import type { FillShapeItem } from '@/lib/induktif/fill-shape/pola';
import CalendarSoal from './CalendarSoal';
import DragLineSoal from './DragLineSoal';
import FillShapeSoal from './FillShapeSoal';
import KepalaApp from './KepalaApp';
import PilihanGandaSoal from './PilihanGandaSoal';
import RoomSoal from './RoomSoal';
import TimelineSoal from './TimelineSoal';
import TimeslotSoal from './TimeslotSoal';

// Studio bergaya generator Tahap 1: satu layar tiga panel, family di kiri, seed dan soal di tengah, kunci dan kapasitas di kanan.
type Uji = { n: number; lolos: number; sidik: number; percobaan: number; ms: number };
const SUBTES_URUT = ['induktif', 'deduktif', 'bahasa-inggris', 'sjk'] as const;

export default function Studio() {
  const [familyId, setFamilyId] = useState(FAMILIES[0].id);
  const [seed, setSeed] = useState('contoh');
  const [draf, setDraf] = useState('contoh');
  const [tampilKunci, setTampilKunci] = useState(false);
  const [uji, setUji] = useState<Uji | null>(null);
  const [cari, setCari] = useState('');
  const [terbuka, setTerbuka] = useState<Set<string>>(() => new Set([FAMILIES[0].chapter.id]));

  // Seed dan family disimpan di URL (?f=…&s=…) supaya soal yang sama bisa dibuka ulang atau dibagikan.
  // URL baru ditulis setelah dibaca (`urlTerbaca`), agar efek ganda Strict Mode tidak menimpa URL sebelum terbaca.
  const [urlTerbaca, setUrlTerbaca] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const f = FAMILIES.find((x) => x.id === q.get('f'));
    const s = q.get('s');
    if (f) { setFamilyId(f.id); setTerbuka(new Set([f.chapter.id])); }
    if (s) { setSeed(s); setDraf(s); }
    setUrlTerbaca(true);
  }, []);
  useEffect(() => {
    if (!urlTerbaca) return;
    window.history.replaceState(null, '', `?f=${encodeURIComponent(familyId)}&s=${encodeURIComponent(seed)}`);
  }, [familyId, seed, urlTerbaca]);

  const family = FAMILIES.find((f) => f.id === familyId)!;
  const hasil = useMemo((): { soal: Soal } | { galat: string } => {
    try { return { soal: bangkitkan(family, seed) }; }
    catch (e) { return { galat: e instanceof GagalBangun ? `${e.message} Alasan penolakan: ${JSON.stringify(e.alasan)}` : String(e) }; }
  }, [family, seed]);

  const pakaiSeed = (s: string) => { const t = s.trim() || 'contoh'; setSeed(t); setDraf(t); };
  const pilihFamily = (id: string) => { setFamilyId(id); setUji(null); };
  const bukaTutup = (id: string) => setTerbuka((t) => { const n = new Set(t); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const ujiKapasitas = (n: number) => {
    const t0 = performance.now();
    const sidik = new Set<string>();
    let lolos = 0;
    let percobaan = 0;
    for (let i = 0; i < n; i++) {
      try { const s = bangkitkan(family, `uji-${i}`); lolos++; sidik.add(s.sidik); percobaan += s.percobaan + 1; } catch { /* dihitung sebagai gagal */ }
    }
    setUji({ n, lolos, sidik: sidik.size, percobaan: percobaan / Math.max(1, lolos), ms: Math.round(performance.now() - t0) });
  };

  const q = cari.trim().toLowerCase();
  const cocok = (f: (typeof FAMILIES)[number]) => !q || `${f.id} ${f.nama} ${f.chapter.nama}`.toLowerCase().includes(q);
  const tersimpan = kapasitasFamily(family.id, family.versi);
  const jenis = 'soal' in hasil ? (hasil.soal.item as { jenis: string }).jenis : null;

  return (
    <>
      <KepalaApp aktif="studio" kanan={`${FAMILIES.length} family`} />

      <main className="layout">
        {/* ============ KIRI: FAMILY ============ */}
        <section className="panel" aria-label="Daftar chapter dan family">
          <h2><span className="step">1</span> Pilih family</h2>
          <label className="field">
            <span>Cari family atau chapter</span>
            <input type="search" value={cari} onChange={(e) => setCari(e.target.value)} placeholder="mis. calendar, fill shape" />
          </label>
          <nav className="pohon">
            {SUBTES_URUT.map((st) => {
              const chapters = CHAPTERS.filter((c) => c.subtes === st);
              if (!chapters.length) return null;
              const ada = chapters.some((c) => FAMILIES.some((f) => f.chapter.id === c.id && cocok(f)));
              if (q && !ada) return null;
              return (
                <div key={st}>
                  <h3>{NAMA_SUBTES[st].replace(/^Tes /, '')}</h3>
                  {chapters.map((c) => {
                    const fams = FAMILIES.filter((f) => f.chapter.id === c.id && cocok(f));
                    if (q && !fams.length) return null;
                    if (!FAMILIES.some((f) => f.chapter.id === c.id)) {
                      return <div key={c.id} className="bab kosong"><span>{c.nama}</span><span className="jumlah">{c.catatan ?? 'belum dibuat'}</span></div>;
                    }
                    const buka = !!q || terbuka.has(c.id);
                    return (
                      <div key={c.id}>
                        <button type="button" className="bab" aria-expanded={buka} onClick={() => bukaTutup(c.id)}>
                          <span>{c.nama}</span><span className="jumlah">{fams.length}</span>
                        </button>
                        {buka && (
                          <div className="daftar-fam">
                            {fams.map((f) => (
                              <button key={f.id} type="button" className={`fam${f.id === familyId ? ' aktif' : ''}`} onClick={() => pilihFamily(f.id)} aria-current={f.id === familyId ? 'true' : undefined} title={f.id}>
                                <span className={`label ${f.label}`}>{f.label === 'SHL' ? 'SHL' : 'VAR'}</span>
                                <span className="nama">{f.nama}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {q && !FAMILIES.some(cocok) && <p className="hint">Tidak ada family yang cocok dengan “{cari}”.</p>}
          </nav>
        </section>

        {/* ============ TENGAH: SEED DAN SOAL ============ */}
        <section className="panel wide" aria-label="Soal">
          <div className="kepala-fam">
            <span className="remah">{NAMA_SUBTES[family.chapter.subtes].replace(/^Tes /, '')} / {family.chapter.nama}</span>
            <div className="judul-fam">
              <h2>{family.nama}</h2>
              <span className={`label ${family.label}`}>{family.label}</span>
            </div>
            <div className="meta">
              <span>{family.id} v{family.versi}</span>
              <span>Sumber: {family.sumber}</span>
              <span>Bentuk SIADU: {family.chapter.bentuk}</span>
            </div>
            <p className="ringkas">{family.ringkas}</p>
          </div>

          <h2><span className="step">2</span> Seed</h2>
          <form className="seedbar" onSubmit={(e) => { e.preventDefault(); pakaiSeed(draf); }}>
            <input id="seed" aria-label="Seed" value={draf} onChange={(e) => setDraf(e.target.value)} spellCheck={false} />
            <button type="submit">Bangkitkan</button>
            <button className="primary" type="button" onClick={() => pakaiSeed(seedBaru())}>Seed baru</button>
            <label className="check">
              <input type="checkbox" checked={tampilKunci} onChange={(e) => setTampilKunci(e.target.checked)} /> Tampilkan kunci
            </label>
            {'soal' in hasil && <span className="uid">{hasil.soal.uid}</span>}
          </form>

          <div className="isi-soal">
            {'galat' in hasil ? <div className="galat">{hasil.galat}</div> : (
              <div className="kartu-soal">
                {jenis === 'fill-shape' && <FillShapeSoal key={hasil.soal.uid} item={hasil.soal.item as FillShapeItem} kunci={hasil.soal.jawaban as Frame} tampilKunci={tampilKunci} />}
                {jenis === 'drag-line' && <DragLineSoal key={hasil.soal.uid} item={hasil.soal.item as DragLineItem} kunci={hasil.soal.jawaban as string[]} tampilKunci={tampilKunci} />}
                {jenis === 'calendar-date' && <CalendarSoal key={hasil.soal.uid} item={hasil.soal.item as CalendarItem} kunci={hasil.soal.jawaban as number[]} tampilKunci={tampilKunci} />}
                {jenis === 'timeline' && <TimelineSoal key={hasil.soal.uid} item={hasil.soal.item as TimelineItem} kunci={hasil.soal.jawaban as number[]} tampilKunci={tampilKunci} />}
                {jenis === 'timeslot' && <TimeslotSoal key={hasil.soal.uid} item={hasil.soal.item as TimeslotItem} kunci={hasil.soal.jawaban as Susunan} tampilKunci={tampilKunci} />}
                {jenis === 'room-allocation' && <RoomSoal key={hasil.soal.uid} item={hasil.soal.item as RoomItem} kunci={hasil.soal.jawaban as Alokasi} tampilKunci={tampilKunci} />}
                {jenis === 'pilihan-ganda' && <PilihanGandaSoal key={hasil.soal.uid} item={hasil.soal.item as PilihanGandaItem} kunci={hasil.soal.jawaban as string} tampilKunci={tampilKunci} />}
              </div>
            )}
          </div>
        </section>

        {/* ============ KANAN: KUNCI DAN KAPASITAS ============ */}
        <section className="panel" aria-label="Kunci dan kapasitas">
          <h2 id="judul-kunci"><span className="step">3</span> Kunci dan pembahasan</h2>
          {'galat' in hasil ? <p className="hint">Soal gagal dibangun untuk seed ini.</p> : tampilKunci ? (
            <div className="kunci-blok">
              <p className="kunci-teks">{hasil.soal.pembahasan.jawaban}</p>
              {hasil.soal.pembahasan.konsep && <div><b className="subjudul">Konsep</b>{hasil.soal.pembahasan.konsep}</div>}
              {hasil.soal.pembahasan.kataKunci && <div><b className="subjudul">Kata kunci</b>{hasil.soal.pembahasan.kataKunci}</div>}
              <ol>{hasil.soal.pembahasan.langkah.map((l, i) => <li key={i}>{l.teks}</li>)}</ol>
              {hasil.soal.pembahasan.opsiSalah && (
                <div><b className="subjudul">Alasan opsi salah</b><ul className="opsi-salah">{hasil.soal.pembahasan.opsiSalah.map((t) => <li key={t}>{t}</li>)}</ul></div>
              )}
              {hasil.soal.pembahasan.caraCepat && <div className="cepat"><b>Cara cepat:</b> {hasil.soal.pembahasan.caraCepat}</div>}
              <div className="sidik">Lolos pada percobaan ke-{hasil.soal.percobaan + 1} · sidik {hasil.soal.sidik}</div>
            </div>
          ) : (
            <p className="hint">Centang <i>Tampilkan kunci</i> untuk melihat kunci, pembahasan langkah demi langkah, dan sidik struktur soal ini.</p>
          )}

          <h2 id="judul-kapasitas"><span className="step">4</span> Kapasitas family</h2>
          {tersimpan ? (
            <dl className="ukur">
              <dt>Seed lolos</dt><dd>{tersimpan.lolos}/{tersimpan.seed}</dd>
              <dt>Struktur unik</dt><dd>{tersimpan.sidik.toLocaleString('id-ID')}</dd>
              <dt>Percobaan per soal</dt><dd>{tersimpan.percobaanRata.toLocaleString('id-ID')}</dd>
            </dl>
          ) : (
            <p className="hint">Belum ada hasil <code>npm run verify</code> untuk versi family ini.</p>
          )}
          {tersimpan && <p className="hint">Hasil verifikasi {tersimpan.diuji}. Seed tidak terbatas, tetapi struktur soal terbatas.</p>}
          <div className="row gap-s">
            <button className="wide-btn" type="button" onClick={() => ujiKapasitas(200)}>Uji 200 seed</button>
            <button className="wide-btn" type="button" onClick={() => ujiKapasitas(1000)}>Uji 1.000 seed</button>
          </div>
          {uji && (
            <dl className="ukur">
              <dt>Lolos di peramban</dt><dd>{uji.lolos}/{uji.n}</dd>
              <dt>Struktur unik</dt><dd>{uji.sidik}</dd>
              <dt>Waktu uji</dt><dd>{uji.ms} ms</dd>
            </dl>
          )}
        </section>
      </main>
    </>
  );
}
