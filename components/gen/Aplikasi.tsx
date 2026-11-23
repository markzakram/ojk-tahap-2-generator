'use client';

import { useEffect, useState } from 'react';
import type { Subtes } from '@/lib/core/types';
import { JUMLAH_LATSOL, JUMLAH_TRYOUT } from '@/lib/data/chapters';
import { hasilResmi, RESMI, type Hasil } from '@/lib/paket/hasil';
import { KELOMPOK_LATSOL_URUT, komposisiBaku } from '@/lib/paket/susun';
import BuatPaket from './BuatPaket';
import Dasbor from './Dasbor';
import Ekspor from './Ekspor';
import HasilPaket from './HasilPaket';
import Kerangka, { type Tampilan } from './Kerangka';

// Generator Tahap 2 bergaya UTBK/SKD Generator: Dasbor → Buat paket → Hasil paket → Ekspor (Word SiAdu, JSON, CSV).
// Pengaturan dan hasil disimpan di memori selama halaman terbuka; tampilan aktif tersimpan di alamat (?v=…).

export type ModePaket = 'resmi' | 'tryout' | 'latsol' | 'set';
export type PilihTingkat = 'bank' | 'atur' | 'dasar' | 'menengah' | 'menantang';
export interface Pengaturan {
  mode: ModePaket;
  subtes: Subtes[];
  kelompok: string;
  komposisi: { tryout: Record<string, number>; latsol: Record<string, number> };
  materi: { chapterId: string; n: number }[];
  jumlah: { tryout: number; latsol: number; set: number };
  tingkat: PilihTingkat;
  proporsi: { dasar: number; menengah: number; menantang: number };
  benih: string;
}

export const PENGATURAN_AWAL: Pengaturan = {
  mode: 'resmi',
  subtes: ['induktif', 'deduktif', 'bahasa-inggris', 'sjk'],
  kelompok: KELOMPOK_LATSOL_URUT[0],
  komposisi: { tryout: komposisiBaku('tryout'), latsol: komposisiBaku('latsol') },
  materi: [],
  jumlah: { tryout: JUMLAH_TRYOUT, latsol: JUMLAH_LATSOL, set: 3 },
  tingkat: 'bank',
  proporsi: { dasar: 3, menengah: 5, menantang: 2 },
  benih: RESMI.benih,
};

const TAMPILAN: Tampilan[] = ['dasbor', 'buat', 'hasil', 'ekspor'];

export default function Aplikasi({ awal = 'buat' }: { awal?: Tampilan }) {
  const [tampil, setTampil] = useState<Tampilan>(awal);
  const [p, setP] = useState<Pengaturan>(PENGATURAN_AWAL);
  const [hasil, setHasil] = useState<Hasil>(hasilResmi);
  const [pilih, setPilih] = useState<{ paket: string; subtes: Subtes | null }>({ paket: RESMI.paket[0]?.id ?? '', subtes: null });

  // ?v=… menentukan tampilan awal (tautan dari Studio dan alamat lama /paket, /ringkasan)
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('v') as Tampilan | null;
    if (v && TAMPILAN.includes(v)) setTampil(v);
  }, []);
  const buka = (t: Tampilan) => {
    setTampil(t);
    window.history.replaceState(null, '', t === 'buat' ? window.location.pathname : `?v=${t}`);
    window.scrollTo({ top: 0 });
  };
  const pakai = (h: Hasil) => { setHasil(h); setPilih({ paket: h.data.paket[0]?.id ?? '', subtes: null }); buka('hasil'); };

  const nTryout = hasil.data.paket.filter((x) => x.jenis === 'tryout').length;
  const info = (
    <>
      <div className="a-kecil">Hasil aktif</div>
      <div className="a-profil-judul">{hasil.data.paket.length} paket{nTryout ? ` · ${nTryout} tryout` : ''}</div>
      <div className="a-kecil">{hasil.resmi ? 'Paket resmi' : 'Hasil generate'} · benih {hasil.data.benih}</div>
    </>
  );

  return (
    <Kerangka aktif={tampil} pilih={buka} info={info}>
      {tampil === 'dasbor' && <Dasbor buka={buka} />}
      {tampil === 'buat' && <BuatPaket p={p} setP={setP} jadi={pakai} />}
      {tampil === 'hasil' && <HasilPaket hasil={hasil} pilih={pilih} setPilih={setPilih} buka={buka} />}
      {tampil === 'ekspor' && <Ekspor hasil={hasil} paketAktif={pilih.paket} buka={buka} />}
    </Kerangka>
  );
}
