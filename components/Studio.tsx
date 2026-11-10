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
import type { FillShapeItem } from '@/lib/induktif/fill-shape/pola';
import CalendarSoal from './CalendarSoal';
import DragLineSoal from './DragLineSoal';
import FillShapeSoal from './FillShapeSoal';
import KepalaApp from './KepalaApp';
import RoomSoal from './RoomSoal';
import TimelineSoal from './TimelineSoal';
import TimeslotSoal from './TimeslotSoal';

// Desain A · Studio ringkas: daftar chapter di kiri, soal di tengah, kunci dan kapasitas di samping.
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
      <KepalaApp aktif="studio" kanan={<span>{FAMILIES.length} family</span>}>
        <label className="cari">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input type="search" value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari family atau chapter" aria-label="Cari family atau chapter" />
        </label>
      </KepalaApp>

      <div className="studio-badan">
        <nav className="sidebar" aria-label="Daftar chapter dan family">
          {SUBTES_URUT.map((st) => {
            const chapters = CHAPTERS.filter((c) => c.subtes === st);
            if (!chapters.length) return null;
            const ada = chapters.some((c) => FAMILIES.some((f) => f.chapter.id === c.id && cocok(f)));
            if (q && !ada) return null;
            return (
              <div key={st}>
                <div className="subtes">{NAMA_SUBTES[st].replace(/^Tes /, '')}</div>
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
          {q && !FAMILIES.some(cocok) && <p className="catatan" style={{ padding: '8px 10px' }}>Tidak ada family yang cocok dengan “{cari}”.</p>}
        </nav>

        <main className="halaman">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="remah">{NAMA_SUBTES[family.chapter.subtes].replace(/^Tes /, '')} / {family.chapter.nama}</span>
            <div className="judul-fam">
              <h1>{family.nama}</h1>
              <span className={`label ${family.label}`}>{family.label}</span>
            </div>
            <div className="meta">
              <span>{family.id} v{family.versi}</span>
              <span>Sumber: {family.sumber}</span>
              <span>Bentuk SIADU: {family.chapter.bentuk}</span>
            </div>
            <p className="ringkas">{family.ringkas}</p>
          </div>

          <form className="seedbar" onSubmit={(e) => { e.preventDefault(); pakaiSeed(draf); }}>
            <label htmlFor="seed">Seed</label>
            <input id="seed" value={draf} onChange={(e) => setDraf(e.target.value)} spellCheck={false} />
            <button className="btn" type="submit">Bangkitkan</button>
            <button className="btn utama" type="button" onClick={() => pakaiSeed(seedBaru())}>Seed baru</button>
            <label className="centang">
              <input type="checkbox" checked={tampilKunci} onChange={(e) => setTampilKunci(e.target.checked)} /> Tampilkan kunci
            </label>
            {'soal' in hasil && <span className="uid">{hasil.soal.uid}</span>}
          </form>

          {'galat' in hasil ? <div className="galat">{hasil.galat}</div> : (
            <div className="tata-soal">
              <section className="kartu-soal" aria-label="Soal">
                {jenis === 'fill-shape' && <FillShapeSoal key={hasil.soal.uid} item={hasil.soal.item as FillShapeItem} kunci={hasil.soal.jawaban as Frame} tampilKunci={tampilKunci} />}
                {jenis === 'drag-line' && <DragLineSoal key={hasil.soal.uid} item={hasil.soal.item as DragLineItem} kunci={hasil.soal.jawaban as string[]} tampilKunci={tampilKunci} />}
                {jenis === 'calendar-date' && <CalendarSoal key={hasil.soal.uid} item={hasil.soal.item as CalendarItem} kunci={hasil.soal.jawaban as number[]} tampilKunci={tampilKunci} />}
                {jenis === 'timeline' && <TimelineSoal key={hasil.soal.uid} item={hasil.soal.item as TimelineItem} kunci={hasil.soal.jawaban as number[]} tampilKunci={tampilKunci} />}
                {jenis === 'timeslot' && <TimeslotSoal key={hasil.soal.uid} item={hasil.soal.item as TimeslotItem} kunci={hasil.soal.jawaban as Susunan} tampilKunci={tampilKunci} />}
                {jenis === 'room-allocation' && <RoomSoal key={hasil.soal.uid} item={hasil.soal.item as RoomItem} kunci={hasil.soal.jawaban as Alokasi} tampilKunci={tampilKunci} />}
              </section>

              <aside className="samping">
                <section className="panel" aria-labelledby="judul-kunci">
                  <h3 id="judul-kunci">Kunci dan pembahasan</h3>
                  {tampilKunci ? (
                    <>
                      <p className="kunci-teks">{hasil.soal.pembahasan.jawaban}</p>
                      <ol>{hasil.soal.pembahasan.langkah.map((l, i) => <li key={i}>{l.teks}</li>)}</ol>
                      {hasil.soal.pembahasan.caraCepat && <div className="cepat"><b>Cara cepat:</b> {hasil.soal.pembahasan.caraCepat}</div>}
                      <div className="sidik">Lolos pada percobaan ke-{hasil.soal.percobaan + 1} · sidik {hasil.soal.sidik}</div>
                    </>
                  ) : (
                    <p className="catatan">Centang “Tampilkan kunci” untuk melihat kunci, pembahasan langkah demi langkah, dan sidik struktur soal ini.</p>
                  )}
                </section>

                <section className="panel" aria-labelledby="judul-kapasitas">
                  <h3 id="judul-kapasitas">Kapasitas family</h3>
                  {tersimpan ? (
                    <div className="statistik">
                      <div className="stat"><b>{tersimpan.lolos}/{tersimpan.seed}</b><span>seed lolos</span></div>
                      <div className="stat"><b>{tersimpan.sidik.toLocaleString('id-ID')}</b><span>struktur unik</span></div>
                      <div className="stat"><b>{tersimpan.percobaanRata.toLocaleString('id-ID')}</b><span>percobaan/soal</span></div>
                    </div>
                  ) : (
                    <p className="catatan">Belum ada hasil <code>npm run verify</code> untuk versi family ini.</p>
                  )}
                  {tersimpan && <p className="catatan">Hasil verifikasi {tersimpan.diuji}. Seed tidak terbatas, tetapi struktur soal terbatas.</p>}
                  <div className="aksi" style={{ marginTop: 0 }}>
                    <button className="btn kecil" type="button" onClick={() => ujiKapasitas(200)}>Uji 200 seed</button>
                    <button className="btn kecil" type="button" onClick={() => ujiKapasitas(1000)}>Uji 1.000 seed</button>
                  </div>
                  {uji && (
                    <div className="statistik">
                      <div className="stat"><b>{uji.lolos}/{uji.n}</b><span>lolos di browser</span></div>
                      <div className="stat"><b>{uji.sidik}</b><span>struktur unik</span></div>
                      <div className="stat"><b>{uji.ms} ms</b><span>waktu uji</span></div>
                    </div>
                  )}
                </section>
              </aside>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
