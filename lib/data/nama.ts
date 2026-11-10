// Daftar nama latihan dari Blueprint Penalaran Deduktif. Setiap nama punya satu PNG di folder Asset Generator (Google Drive);
// sebelum aset diunduh, antarmuka menampilkan inisial sebagai pengganti foto. Nama bukan identitas asli orang pada foto.

/** Calendar Date Selection, bagian 8 (gambar: cuplikan sumber SHL). */
export const NAMA_KALENDER = [
  'Arman', 'Bella', 'Candra', 'Dinda', 'Evan', 'Farah', 'Gita', 'Hendra', 'Irfan', 'Jelita', 'Kevin', 'Laras', 'Malik',
  'Nadia', 'Omar', 'Putra', 'Qadir', 'Rani', 'Surya', 'Tegar', 'Ulfa', 'Vania', 'Wulan', 'Xenia', 'Yasmin', 'Zahra',
] as const;

/** Room Allocations, bagian 7 (foto: randomuser.me). Satu soal memakai lima nama dengan inisial berbeda. */
export const NAMA_RUANGAN = [
  'Aditya', 'Bianca', 'Cakra', 'Dewi', 'Erlangga', 'Felicia', 'Gilang', 'Hana', 'Ilham', 'Julia', 'Kenan', 'Livia', 'Mahesa',
  'Nabila', 'Oka', 'Prita', 'Qais', 'Ratih', 'Satria', 'Tania', 'Umar', 'Vera', 'Wahyu', 'Xaviera', 'Yuda', 'Ziva',
] as const;

export const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;

/** "Senin", "Senin dan Jumat", "Senin, Rabu, dan Jumat". */
export function daftarKata(kata: readonly string[]): string {
  if (kata.length <= 1) return kata.join('');
  if (kata.length === 2) return `${kata[0]} dan ${kata[1]}`;
  return `${kata.slice(0, -1).join(', ')}, dan ${kata[kata.length - 1]}`;
}
