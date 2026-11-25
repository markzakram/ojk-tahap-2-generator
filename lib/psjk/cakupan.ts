// QC 2 PCAM Tahap 2 (24 November 2026, R01): soal SJK hanya menguji konsep yang diajarkan eksplisit di 16 materi folder
// (e-book tim). Bahan OJK lain (Buku Saku, Seri Literasi, Booklet, MPSJKI) dipakai saat bank disusun, tetapi butir yang
// bersandar HANYA pada bahan itu di luar cakupan peserta. Penyaring ini bekerja saat family dibangun:
//   - butir/baris/template tanpa sumber "E-book" tidak dibangkitkan;
//   - butir bersumber campuran yang ternyata tidak ada di teks materi didaftar di DIKELUARKAN (beserta alasannya).
// Butir yang disaring tetap tersimpan di bank supaya dapat dipakai lagi bila materi folder ditambah.

const E_BOOK = /E-book/i;

/** Chapter yang butir bersumber campuran (e-book + bahan OJK lain) belum dicocokkan dengan teks materi: hanya butir yang seluruh sumbernya e-book yang dipakai. */
const HANYA_E_BOOK = new Set(['asuransi', 'dana-pensiun', 'fintech']);

/** Butir yang menyebut e-book tetapi konsepnya tidak diajarkan eksplisit. Kunci: `familyId|id` atau `familyId|tabel|baris`. */
export const DIKELUARKAN: Record<string, string> = {
  // Pengenalan OJK
  'PSJK-OJK-LEMBAGA|wewenang-epk-kecuali': 'pilihan preventif/represif dan pembelaan hukum tidak diuraikan',
  'PSJK-OJK-KONSUMEN|prinsip-lama': 'isi POJK 1/2013 hanya disebut sebagai materi historis',
  'PSJK-OJK-KONSUMEN|prinsip-bukan': 'kunci "keandalan" berasal dari POJK 1/2013 yang tidak diuraikan',
  'PSJK-OJK-KASUS|majemuk-peralihan': 'tanggal peralihan pasar modal/IKNB, perbankan, dan LKM tidak ada di materi',
  // Perbankan
  'PSJK-BANK-ISTILAH|akad-bank-syariah|qardh': 'qardh tidak diajarkan di materi Perbankan',
  'PSJK-BANK-ISTILAH|rasio-bank|ldr': 'LDR tidak diajarkan di materi Perbankan',
  'PSJK-BANK-HITUNG|ldr': 'LDR tidak diajarkan di materi Perbankan',
  'PSJK-BANK-KASUS|deposito-pernyataan': 'perpanjangan otomatis dan deposito sebagai jaminan kredit tidak diajarkan',
  // Pergadaian
  'PSJK-GADAI-KASUS|swasta': 'pembagian pemerintah/swasta dan nama perusahaan tidak diajarkan',
  // Pasar Modal
  'PSJK-PM-HITUNG|dividend-yield': 'dividend yield tidak diajarkan',
  'PSJK-PM-HITUNG|imbal-hasil-total': 'persentase imbal hasil total tidak diajarkan',
  // Dana Pensiun
  'PSJK-DAPEN-RELASI|manfaat|ditunda': 'pensiun ditunda hanya muncul sebagai pengecoh di materi',
  'PSJK-DAPEN-KASUS|berhenti-kerja': 'kunci bertumpu pada ketentuan pensiun ditunda yang tidak diuraikan',
};

/** Benar bila butir boleh dibangkitkan. `kunci` = `familyId|id` (lihat DIKELUARKAN). */
export function dalamCakupan(chapter: string, kunci: string, sumber: string): boolean {
  if (DIKELUARKAN[kunci]) return false;
  const bagian = sumber.split(';').map((s) => s.trim()).filter(Boolean);
  const eb = bagian.filter((s) => E_BOOK.test(s)).length;
  return HANYA_E_BOOK.has(chapter) ? eb > 0 && eb === bagian.length : eb > 0;
}
