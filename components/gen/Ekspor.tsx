'use client';

import { useState } from 'react';
import { CHAPTERS } from '@/lib/data/chapters';
import { BENTUK_SIADU_DIDUKUNG, docxSiadu, dokumenSiadu } from '@/lib/ekspor/siadu';
import { csvSlot, isiLengkap, unduhBerkas, type Hasil } from '@/lib/paket/hasil';
import type { Tampilan } from './Kerangka';

const DASAR = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
type Format = 'siadu' | 'usulan' | 'json' | 'csv';

async function muatGambar(src: string): Promise<Uint8Array | null> {
  try { const r = await fetch(src); return r.ok ? new Uint8Array(await r.arrayBuffer()) : null; } catch { return null; }
}

export default function Ekspor({ hasil, paketAktif, buka }: { hasil: Hasil; paketAktif: string; buka: (t: Tampilan) => void }) {
  const [cakupan, setCakupan] = useState<'aktif' | 'semua'>('aktif');
  const [pilih, setPilih] = useState<Record<Format, boolean>>({ siadu: true, usulan: true, json: false, csv: false });
  const [proses, setProses] = useState('');
  const aktif = hasil.data.paket.find((p) => p.id === paketAktif) ?? hasil.data.paket[0];
  const ids = cakupan === 'aktif' && aktif ? [aktif.id] : null;
  const dok = dokumenSiadu(hasil.data, ids, DASAR);
  const nSiadu = dok.filter((d) => !d.usulan), nUsulan = dok.filter((d) => d.usulan);
  const bentuk = [...new Set(CHAPTERS.map((c) => c.bentuk))];

  const jalankan = async () => {
    try {
      const berkas: Record<string, Uint8Array> = {};
      const enc = new TextEncoder();
      const pilihDok = dok.filter((d) => (d.usulan ? pilih.usulan : pilih.siadu));
      for (let i = 0; i < pilihDok.length; i++) {
        setProses(`Menyusun Word ${i + 1}/${pilihDok.length}: ${pilihDok[i].nama}…`);
        await new Promise((r) => setTimeout(r, 0));
        berkas[pilihDok[i].nama] = await docxSiadu(pilihDok[i], muatGambar);
      }
      const paket = hasil.data.paket.filter((p) => !ids || ids.includes(p.id));
      if (pilih.json) berkas[`paket-tku-${hasil.data.benih}${ids ? `-${ids[0]}` : ''}.json`] = enc.encode(JSON.stringify({ benih: hasil.data.benih, dibuat: hasil.data.dibuat, resmi: hasil.resmi, paket: paket.map(isiLengkap) }, null, 2));
      if (pilih.csv) berkas[`daftar-soal-${hasil.data.benih}${ids ? `-${ids[0]}` : ''}.csv`] = enc.encode(csvSlot({ ...hasil.data, paket }));
      const nama = Object.keys(berkas);
      if (!nama.length) { setProses('Pilih sedikitnya satu format.'); return; }
      if (nama.length === 1) {
        const jenis = nama[0].endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : nama[0].endsWith('.json') ? 'application/json' : 'text/csv;charset=utf-8';
        unduhBerkas(nama[0], berkas[nama[0]], jenis);
      } else {
        setProses('Membuat ZIP…');
        const { zipSync } = await import('fflate');
        unduhBerkas(`ekspor-tku-${hasil.data.benih}${ids ? `-${ids[0]}` : ''}.zip`, zipSync(berkas, { level: 6 }), 'application/zip');
      }
      setProses(`Selesai: ${nama.length} berkas diunduh.`);
    } catch (e) {
      setProses(`Ekspor gagal: ${String(e)}`);
    }
  };

  return (
    <>
      <div className="a-page-head">
        <div>
          <h1 className="a-page-title">Ekspor</h1>
          <p className="a-sub">{hasil.judul} · benih {hasil.data.benih}. Word SiAdu mengikuti template Auto Input (Soal N, Category, Lesson, Chapter, Tingkat Kesulitan, Bentuk Soal, pilihan, Jawaban, Pembahasan) dengan nama Mapping.</p>
        </div>
      </div>
      <div className="a-cols">
        <section className="a-card a-grow a-stack">
          <div>
            <h2>1 · Cakupan</h2>
            <div className="a-row">
              <button type="button" className="a-choice" aria-pressed={cakupan === 'aktif'} onClick={() => setCakupan('aktif')}>
                <b>Paket yang dibuka</b><span>{aktif?.nama ?? '-'} (pilih di Hasil paket)</span>
              </button>
              <button type="button" className="a-choice" aria-pressed={cakupan === 'semua'} onClick={() => setCakupan('semua')}>
                <b>Semua paket</b><span>{hasil.data.paket.length} paket dalam hasil ini</span>
              </button>
            </div>
          </div>
          <div>
            <h2>2 · Format</h2>
            {([
              ['siadu', `Word SiAdu siap impor — ${nSiadu.length} berkas, ${nSiadu.reduce((a, d) => a + d.jumlahSoal, 0)} soal (${BENTUK_SIADU_DIDUKUNG.join(', ')})`],
              ['usulan', `Word usulan bentuk interaktif — ${nUsulan.length} berkas, ${nUsulan.reduce((a, d) => a + d.jumlahSoal, 0)} soal (Fill Shape, Node Arrow Navigation, Calendar, Room, Timeline, Timeslot)`],
              ['json', 'JSON lengkap (soal, kunci, pembahasan, Mapping)'],
              ['csv', 'CSV daftar soal (Category, Lesson, Chapter, Bentuk Soal, kode SIADU, seed, kunci)'],
            ] as const).map(([k, label]) => (
              <label key={k} className="a-row a-opsi-cek">
                <input type="checkbox" checked={pilih[k]} onChange={(e) => setPilih({ ...pilih, [k]: e.target.checked })} /> {label}
              </label>
            ))}
          </div>
          <div className="a-row">
            <button type="button" className="a-btn a-btn-primary" disabled={!!proses && !proses.startsWith('Selesai') && !proses.startsWith('Ekspor gagal') && !proses.startsWith('Pilih')} onClick={jalankan}>Unduh</button>
            <button type="button" className="a-btn" onClick={() => buka('hasil')}>Kembali ke Hasil paket</button>
            {proses && <span className="a-kecil" role="status">{proses}</span>}
          </div>
          <div>
            <h2>Berkas yang dibuat</h2>
            <div className="a-tbl-wrap">
              <table className="a-tbl">
                <thead><tr><th>Berkas</th><th>Paket · subtes</th><th className="r">Soal</th><th>Status</th></tr></thead>
                <tbody>
                  {dok.slice(0, 60).map((d) => (
                    <tr key={d.nama}><td className="a-mono">{d.nama}</td><td>{d.paket} · {d.subtes}</td><td className="r a-num">{d.jumlahSoal}</td><td>{d.usulan ? <span className="a-tag a-tag-amber">Usulan format</span> : <span className="a-tag a-tag-hijau">Siap impor</span>}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            {dok.length > 60 && <p className="a-kecil">… dan {dok.length - 60} berkas lain.</p>}
          </div>
        </section>

        <aside className="a-card a-side a-stack">
          <h2 style={{ margin: 0 }}>Catatan SiAdu</h2>
          <p className="a-kecil" style={{ margin: 0 }}>Satu berkas = satu paket × satu subtes, karena importir membaca semua teks setelah “Pembahasan:” sampai “Soal N” berikutnya. Unggah ke halaman input SiAdu → <b>Parse File</b> → <b>Otomatis per soal</b>; periksa dulu dengan <b>Isi 1 Soal Tanpa Simpan</b>.</p>
          <table className="tabel-mini">
            <thead><tr><th>Bentuk Soal (Mapping)</th><th>Status ekspor</th></tr></thead>
            <tbody>
              {bentuk.map((b) => <tr key={b}><td>{b}</td><td>{BENTUK_SIADU_DIDUKUNG.includes(b) ? 'Template Auto Input' : 'Usulan tabel data + kunci'}</td></tr>)}
            </tbody>
          </table>
          <div className="a-note a-note-amber">Enam bentuk interaktif belum punya template importir SiAdu. Berkas usulan memuat teks soal, tabel data, dan kunci untuk input manual. Kirim tangkapan layar formulir SiAdu untuk bentuk tersebut agar ekspornya disesuaikan dengan kolom resminya.</div>
          <p className="a-kecil" style={{ margin: 0 }}>Logical Ranking menulis tabel Nama | Deskripsi | Gambar | Posisi Urut dengan foto tersemat. Sumber penyusunan soal tidak dicetak di pembahasan; datanya tetap ada di JSON.</p>
        </aside>
      </div>
    </>
  );
}
