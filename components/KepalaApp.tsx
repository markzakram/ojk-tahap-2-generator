'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

// Bilah atas bergaya generator Tahap 1: judul, tab antartahap, menu halaman Tahap 2, dan "Cara pakai".
// Tab Tahap 1 menuju salinan halamannya (public/tahap-1, dibuat scripts/salin-tahap-1.mjs). Di dalam bingkai
// Portal (../Portal) tab disembunyikan karena portal sudah punya tabnya sendiri.

const CARA_PAKAI = [
  <><b>Pilih family.</b> Panel kiri berisi chapter per subtes. Klik chapter untuk membuka family-nya, atau ketik di kotak cari.</>,
  <><b>Atur seed.</b> Family + seed yang sama selalu menghasilkan soal yang sama. <i>Seed baru</i> mengacak soal; seed tersimpan di alamat halaman sehingga soal bisa dibagikan.</>,
  <><b>Kerjakan soal.</b> Soal di panel tengah interaktif seperti di SHL: pilih tanggal, geser blok, seret garis, warnai bidang, pasang lencana, atau pilih opsi A–E, lalu tekan <i>Periksa</i>.</>,
  <><b>Kunci dan pembahasan.</b> Centang <i>Tampilkan kunci</i> untuk melihat jawaban, langkah penyelesaian, dan sidik struktur di panel kanan.</>,
  <><b>Kapasitas.</b> Panel kanan juga menampilkan hasil verifikasi family (seed lolos, struktur unik). Tombol uji menjalankan pemeriksaan singkat di peramban.</>,
  <><b>Paket</b> berisi 10 tryout dan 5 latsol per kelompok yang disusun dari bank tanpa soal kembar; buka soal di Studio atau unduh JSON lengkapnya.</>,
  <><b>Ringkasan</b> menghitung target soal, kebutuhan per subtes, dan kapasitas per chapter dari Mapping.</>,
];

export default function KepalaApp({ aktif, kanan }: { aktif: 'ringkasan' | 'studio' | 'paket'; kanan?: React.ReactNode }) {
  const [bantuan, setBantuan] = useState(false);
  const [dalamBingkai, setDalamBingkai] = useState(true);
  useEffect(() => {
    try { setDalamBingkai(window.self !== window.top); } catch { setDalamBingkai(true); }
  }, []);

  return (
    <>
      <header className="topbar">
        <div className="topbar-judul">
          <h1>Generator Soal OJK PCAM Tahap 2</h1>
          <p className="sub">Tes Kemampuan Umum &mdash; Penalaran Induktif &amp; Deduktif, Bahasa Inggris, Pengetahuan Sektor Jasa Keuangan &middot; soal, kunci, dan pembahasan dari family + seed</p>
        </div>
        {!dalamBingkai && (
          <nav className="tab-tahap" aria-label="Pilih tahap">
            <a className="tab-tahap-item" href="/tahap-1/index.html"><b>Tahap 1</b><span>Tes Potensi Dasar</span></a>
            <Link className="tab-tahap-item aktif" href="/studio" aria-current="page"><b>Tahap 2</b><span>Tes Kemampuan Umum</span></Link>
          </nav>
        )}
        <div className="topbar-actions">
          {kanan && <span className="topbar-info">{kanan}</span>}
          <nav className="nav-app" aria-label="Halaman Tahap 2">
            <Link href="/studio" className={aktif === 'studio' ? 'active' : undefined} aria-current={aktif === 'studio' ? 'page' : undefined}>Studio</Link>
            <Link href="/paket" className={aktif === 'paket' ? 'active' : undefined} aria-current={aktif === 'paket' ? 'page' : undefined}>Paket</Link>
            <Link href="/" className={aktif === 'ringkasan' ? 'active' : undefined} aria-current={aktif === 'ringkasan' ? 'page' : undefined}>Ringkasan</Link>
          </nav>
          <button type="button" className="ghost" aria-expanded={bantuan} onClick={() => setBantuan((b) => !b)}>Cara pakai</button>
        </div>
      </header>
      {bantuan && (
        <div className="help">
          <ol>{CARA_PAKAI.map((isi, i) => <li key={i}>{isi}</li>)}</ol>
        </div>
      )}
    </>
  );
}
