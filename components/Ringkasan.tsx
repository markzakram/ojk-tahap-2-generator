import Link from 'next/link';
import { JUMLAH_LATSOL, JUMLAH_TRYOUT, NAMA_SUBTES } from '@/lib/data/chapters';
import { hitungRingkasan, type BarisChapter, type StatusChapter } from '@/lib/data/ringkasan';
import KepalaApp from './KepalaApp';

// Desain C · Dashboard bank soal. Semua angka dihitung dari Mapping (lib/data/chapters.ts), daftar family (registry),
// dan hasil `npm run verify` terakhir (lib/data/kapasitas.json).

const angka = (n: number) => n.toLocaleString('id-ID');
const persen = (a: number, b: number) => (b ? `${(Math.round((a / b) * 1000) / 10).toLocaleString('id-ID')}%` : '0%');
const NAMA_STATUS: Record<StatusChapter, string> = {
  cukup: 'Cukup', tipis: 'Kapasitas kurang', 'tanpa-variasi': 'Tanpa variasi', 'belum-diuji': 'Belum diuji', belum: 'Belum dibuat',
};

function BarisTabel({ c }: { c: BarisChapter }) {
  const struktur = c.strukturShl === null ? '—' : angka(c.strukturShl);
  const strukturVar = c.strukturVariasi === null ? '—' : angka(c.strukturVariasi);
  return (
    <tr>
      <td>{c.familyPertama ? <Link href={`/studio?f=${encodeURIComponent(c.familyPertama)}&s=contoh`}>{c.nama}</Link> : <span className="redup">{c.nama}</span>}</td>
      <td className="angka">{angka(c.kebutuhan)}</td>
      <td>{c.jumlahShl + c.jumlahVariasi ? `${c.jumlahShl} · ${c.jumlahVariasi}` : <span className="redup">—</span>}</td>
      <td className="angka">{c.jumlahShl ? struktur : <span className="redup">—</span>}</td>
      <td className="angka">{c.jumlahVariasi ? strukturVar : <span className="redup">—</span>}</td>
      <td><span className={`pil ${c.status}`}>{c.status === 'belum' && c.catatan ? c.catatan : NAMA_STATUS[c.status]}</span></td>
    </tr>
  );
}

export default function Ringkasan() {
  const r = hitungRingkasan();
  const grup = (['induktif', 'deduktif', 'bahasa-inggris'] as const).map((st) => ({ st, baris: r.chapter.filter((c) => c.subtes === st) }));
  const slot = [...Array.from({ length: JUMLAH_TRYOUT }, (_, i) => `TO ${i + 1}`), ...Array.from({ length: JUMLAH_LATSOL }, (_, i) => `LS ${i + 1}`)];

  return (
    <>
      <KepalaApp aktif="ringkasan" kanan={<span>{r.diujiTerakhir ? `Kapasitas diuji ${r.diujiTerakhir}` : 'Kapasitas belum diuji'}</span>} />
      <main className="dasbor">
        <div className="dasbor-kepala">
          <div>
            <h1>Bank soal TKU</h1>
            <p>{JUMLAH_TRYOUT} tryout dan {JUMLAH_LATSOL} latsol untuk empat subtes, disusun dari family yang lolos verifikasi.</p>
          </div>
          <Link className="btn utama" href="/studio">Buka studio</Link>
        </div>

        <div className="metrik-grid">
          <div className="metrik"><span>Target soal</span><b>{angka(r.target)}</b><span>{angka(r.targetTryout)} tryout · {angka(r.targetLatsol)} latsol</span></div>
          <div className="metrik"><span>Sudah punya generator</span><b>{angka(r.tertangani)}</b><span>{persen(r.tertangani, r.target)} dari target</span></div>
          <div className="metrik"><span>Family aktif</span><b>{r.family.total}</b><span>{r.family.perSubtes.map((x) => `${x.jumlah} ${x.nama}`).join(' · ')}</span></div>
          <div className="metrik"><span>Sudah di SIADU</span><b>0</b><span>Format tipe interaktif belum diketahui</span></div>
        </div>

        <div className="dua-kolom">
          <div className="kolom-utama">
            <section className="kartu" aria-labelledby="judul-subtes">
              <div className="kartu-kepala">
                <h2 id="judul-subtes">Kebutuhan per subtes</h2>
                <span className="legenda"><span><i style={{ background: 'var(--primer)' }} />Ada generator</span><span><i style={{ background: 'var(--line)' }} />Belum</span></span>
              </div>
              {r.subtes.map((s) => (
                <div className="bar-baris" key={s.subtes}>
                  <div className="bar-judul">
                    <b>{s.nama.replace(/^Tes /, '')}</b>
                    <span>{angka(s.tertangani)} dari {angka(s.kebutuhan)} soal{s.catatan ? ` · ${s.catatan}` : ''}</span>
                  </div>
                  <div className="bar" role="img" aria-label={`${persen(s.tertangani, s.kebutuhan)} sudah punya generator`}><i style={{ width: persen(s.tertangani, s.kebutuhan).replace(',', '.') }} /></div>
                </div>
              ))}
            </section>

            <section className="kartu" aria-labelledby="judul-chapter">
              <h2 id="judul-chapter">Kapasitas per chapter</h2>
              <div className="tabel-bungkus">
                <table className="tabel">
                  <thead>
                    <tr>
                      <th scope="col">Chapter</th>
                      <th scope="col" className="angka">Kebutuhan</th>
                      <th scope="col">Family SHL · VAR</th>
                      <th scope="col" className="angka">Struktur SHL</th>
                      <th scope="col" className="angka">Struktur VAR</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grup.map((g) => [
                      <tr className="grup" key={g.st}><td colSpan={6}>{NAMA_SUBTES[g.st].replace(/^Tes /, '')}</td></tr>,
                      ...g.baris.map((c) => <BarisTabel key={c.id} c={c} />),
                    ])}
                  </tbody>
                </table>
              </div>
              <p className="catatan-kecil">Struktur = sidik unik dari <code>npm run verify</code> terakhir untuk versi family saat ini; angka sebenarnya bisa lebih besar. Klik nama chapter untuk membuka studionya.</p>
            </section>
          </div>

          <aside className="kolom-samping">
            <section className="kartu" aria-labelledby="judul-paket">
              <h2 id="judul-paket">Paket</h2>
              <p className="catatan">Belum ada paket yang disusun. Penyusun paket akan mengambil soal sesuai kuota Mapping dan memakai sidik struktur agar tidak ada soal kembar antarpaket.</p>
              <div className="slot-grid">{slot.map((s) => <span className="slot" key={s}>{s}</span>)}</div>
            </section>
            <section className="kartu" aria-labelledby="judul-keputusan">
              <h2 id="judul-keputusan">Perlu keputusan</h2>
              <ul className="daftar-keputusan">
                {r.keputusan.map((k) => <li key={k.teks}><span>{k.teks}</span><span>{k.jumlah}</span></li>)}
              </ul>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
