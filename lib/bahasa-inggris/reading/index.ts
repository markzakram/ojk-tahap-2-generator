import type { Family } from '../../core/types';
import { BANK_OJK } from './bank-ojk';
import { BANK_SHL } from './bank-shl';
import { BANK_VAR } from './bank-var';
import { familyReading } from './family';
import { periksaPolaBank } from './model';

// Reading Comprehension (4 opsi A–D). Tidak ada blueprint resmi tim akademik; aturan yang dipakai dicatat di
// bahan/Blueprint Reading Comprehension (usulan).md. Sidik = family|bacaan|soal; setiap soal membawa bacaannya, dan
// item.data.urutan menyimpan nomor soal di bacaannya agar soal satu bacaan dapat ditampilkan berurutan.

export const rcOjk = familyReading({
  id: 'RC-OJK',
  versi: 5, // v5: QC 1 F08, alasan opsi salah soal buku terbuka dibatasi pada isi bacaan
  nama: 'Bacaan panjang, empat soal format riset',
  label: 'SHL',
  format: 'panjang',
  sumber: 'Riset PCAM/MLE OJK 2026 §5.2.3 (contoh Biosphere 2: tujuan, inferensi sikap, makna kalimat, judul) · arsip Soal TKU PCS & PCT 2025 (fakta eksplisit, hubungan antaride, detail tersirat, solusi) · usulan blueprint Reading',
  ringkas: 'Satu bacaan 3–4 paragraf (180–320 kata) dengan empat soal berurutan: paling banyak satu soal global (judul, gagasan utama, atau tujuan) dan tiga soal detail, hubungan antaride, inferensi, makna kalimat, atau penerapan. Pengecoh soal global berupa tesis wajar tentang topik yang sama. Setiap opsi beranotasi kalimat bukti dan jenis ketidaksesuaian; solver memverifikasinya terhadap bacaan yang tampil.',
  bank: BANK_OJK,
});

export const rcShl = familyReading({
  id: 'RC-SHL',
  versi: 4,
  nama: 'Bacaan pendek gaya SHL',
  label: 'SHL',
  format: 'pendek',
  sumber: 'Gambaran Tes OJK SHL/Tes Bahasa Inggris (Reading Comprehension): bacaan satu paragraf ±100 kata, satu pertanyaan detail/urutan/sebab, empat opsi frasa pendek · usulan blueprint Reading',
  ringkas: 'Satu paragraf 80–130 kata dengan satu atau dua pertanyaan detail, sebab-akibat, atau urutan langkah. Opsi berupa frasa pendek tanpa titik; pengecoh mengambil detail lain dari bacaan, mengubah detail, atau menambahkan hal yang tidak disebut.',
  bank: BANK_SHL,
});

export const rcVar = familyReading({
  id: 'RC-VAR',
  versi: 5,
  nama: 'Bacaan panjang, tipe tambahan (NOT, sikap penulis, kosakata)',
  label: 'VARIASI',
  format: 'panjang',
  sumber: 'Perluasan usulan blueprint Reading: tipe NOT/EXCEPT, sikap/nada penulis, dan kosakata dalam konteks (belum teramati pada contoh riset OJK)',
  ringkas: 'Bacaan 3–4 paragraf dengan empat soal yang memadukan tipe teramati dan tipe tambahan: NOT/EXCEPT (tiga opsi terbukti disebut), sikap penulis (sedikitnya dua kalimat bukti; pengecoh berupa sikap wajar lain yang berbeda arah atau objek), dan kosakata dalam konteks (pengecoh berupa arti lain kata yang sama). Paling banyak satu soal global per bacaan.',
  bank: BANK_VAR,
});

// Pola bentuk opsi tingkat bank (QC P1–P3, uji buta putaran 2–3) diperiksa pada seluruh bacaan sekaligus: satu soal global
// per bacaan, sebaran kunci berpagar 25–60%, simulasi tebak tanpa membaca ≤ 40%, pasangan cermin, dan tanda titik akhir
// seragam per bacaan. Pelanggaran adalah kesalahan bank.
const POLA = periksaPolaBank([...BANK_OJK, ...BANK_SHL, ...BANK_VAR]);
if (POLA.length) throw new Error(`Reading: pola bentuk opsi dapat ditebak:\n${POLA.join('\n')}`);

export const FAMILIES_READING: Family<any, any>[] = [rcOjk, rcShl, rcVar];
