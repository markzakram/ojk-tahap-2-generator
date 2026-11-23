'use client';

import Link from 'next/link';
import { chapterById } from '@/lib/data/chapters';
import { hitungRingkasan } from '@/lib/data/ringkasan';
import { RESMI } from '@/lib/paket/hasil';
import type { Tampilan } from './Kerangka';

const angka = (n: number) => n.toLocaleString('id-ID');
const STATUS: Record<string, { teks: string; kelas: string }> = {
  cukup: { teks: 'Cukup', kelas: 'a-tag-hijau' },
  tipis: { teks: 'Kapasitas tipis', kelas: 'a-tag-merah' },
  'tanpa-variasi': { teks: 'Tanpa VARIASI', kelas: 'a-tag-amber' },
  'belum-diuji': { teks: 'Belum diuji', kelas: 'a-tag-amber' },
  belum: { teks: 'Belum ada family', kelas: 'a-tag-merah' },
};

export default function Dasbor({ buka }: { buka: (t: Tampilan) => void }) {
  const r = hitungRingkasan();
  const struktur = r.chapter.reduce((a, c) => a + (c.strukturShl ?? 0) + (c.strukturVariasi ?? 0), 0);
  return (
    <>
      <div className="a-page-head">
        <div>
          <h1 className="a-page-title">Produksi TKU Tahap 2</h1>
          <p className="a-sub">Mapping Tahap 2 PCAM OJK 2026: 10 tryout dan 5 latsol per kelompok. Kapasitas dihitung dari <code>npm run verify</code> terakhir{r.diujiTerakhir ? ` (${r.diujiTerakhir})` : ''}.</p>
        </div>
        <button type="button" className="a-btn a-btn-primary" onClick={() => buka('buat')}>Buat paket</button>
      </div>

      <div className="a-row a-stat-baris">
        <div className="a-stat"><div className="a-lbl">Target soal</div><div className="a-val">{angka(r.target)}</div><div className="a-kecil">{angka(r.targetTryout)} tryout · {angka(r.targetLatsol)} latsol</div></div>
        <div className="a-stat"><div className="a-lbl">Sudah punya generator</div><div className="a-val">{angka(r.tertangani)}</div><div className="a-kecil">{Math.round((r.tertangani / r.target) * 100)}% dari target</div></div>
        <div className="a-stat"><div className="a-lbl">Family aktif</div><div className="a-val">{r.family.total}</div><div className="a-kecil">{r.family.perSubtes.map((x) => `${x.jumlah} ${x.nama}`).join(' · ')}</div></div>
        <div className="a-stat"><div className="a-lbl">Struktur soal unik</div><div className="a-val">{angka(struktur)}</div><div className="a-kecil">jumlah sidik berbeda semua chapter</div></div>
        <div className="a-stat"><div className="a-lbl">Paket resmi</div><div className="a-val">{RESMI.paket.length}</div><div className="a-kecil">disusun {RESMI.dibuat} · benih {RESMI.benih}</div></div>
      </div>

      <section className="a-card">
        <h2>Kesiapan per subtes</h2>
        <div className="a-stack" style={{ gap: 12 }}>
          {r.subtes.map((s) => (
            <div key={s.subtes}>
              <div className="a-row a-num" style={{ justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><strong>{s.nama}</strong><span className="a-muted">{angka(s.tertangani)} / {angka(s.kebutuhan)} soal</span></div>
              <div className={`a-bar${s.tertangani >= s.kebutuhan ? ' a-bar-penuh' : ''}`}><div style={{ width: `${s.kebutuhan ? Math.round((s.tertangani / s.kebutuhan) * 100) : 0}%` }} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="a-card">
        <h2>Kapasitas per chapter</h2>
        <div className="a-tbl-wrap">
          <table className="a-tbl">
            <thead><tr><th>Category › Lesson › Chapter</th><th>Bentuk soal</th><th className="r">Kebutuhan</th><th className="r">Family SHL · VAR</th><th className="r">Struktur SHL · VAR</th><th>Status</th></tr></thead>
            <tbody>
              {r.chapter.map((c) => {
                const m = chapterById(c.id);
                const st = STATUS[c.status];
                return (
                  <tr key={c.id}>
                    <td><span className="a-kecil">{m.category} › {m.lesson} › </span>{c.familyPertama ? <Link href={`/studio?f=${encodeURIComponent(c.familyPertama)}&s=contoh`}>{m.chapter}</Link> : m.chapter}</td>
                    <td><span className="a-tag">{m.bentuk}</span></td>
                    <td className="r a-num">{c.kebutuhan}</td>
                    <td className="r a-num">{c.jumlahShl} · {c.jumlahVariasi}</td>
                    <td className="r a-num">{c.strukturShl === null ? '—' : angka(c.strukturShl)} · {c.strukturVariasi === null ? '—' : angka(c.strukturVariasi)}</td>
                    <td><span className={`a-tag ${st.kelas}`}>{st.teks}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="a-cols">
        <section className="a-card a-grow">
          <h2>Perlu diputuskan</h2>
          <ul className="a-daftar">
            {r.keputusan.map((k) => <li key={k.teks}><span>{k.teks}</span><span className="a-kecil">{k.jumlah}</span></li>)}
          </ul>
        </section>
        <section className="a-card a-side">
          <h2>QC 1 PCAM Tahap 2</h2>
          <p className="a-kecil" style={{ margin: 0 }}>Temuan QC TO-01 (19 November 2026) sudah diterapkan pada family: pembahasan SJK tanpa atribusi e-book/buku, butir SMART/LSPI/duplikasi diganti, asumsi hitungan dinyatakan, rujukan demo Timeline dibersihkan, batas hunian Room menjadi kendali internal, jalur Drag the Line bebas dari simpul lain, dan pola deret Drag the Line dihapus. Butir yang menunggu keputusan editor dicatat di <code>bahan/Catatan Telaah Editor.md</code>.</p>
        </section>
      </div>
    </>
  );
}
