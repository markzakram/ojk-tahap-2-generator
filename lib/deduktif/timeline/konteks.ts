// Bank label Timeline Scheduling (Blueprint Timeline §7–§8). Pilih satu kelompok per soal; nama tidak menambah ketentuan.

export const NAMA_ORANG_TL = [
  ['Naomi', 'Oscar', 'Patsy'], ['Alya', 'Bayu', 'Citra'], ['Eko', 'Fitri', 'Gani'], ['Intan', 'Joko', 'Kirana'],
  ['Lukman', 'Maya', 'Naufal'], ['Olivia', 'Pandu', 'Queena'], ['Reza', 'Salsa', 'Tomi'], ['Uli', 'Vino', 'Winda'],
];

export const NAMA_RUANG_TL = [
  { diketahui: ['Ruang 1', 'Ruang 2', 'Ruang 3'], jawaban: 'Ruang 4' },
  { diketahui: ['Ruang Cendana', 'Ruang Mahoni', 'Ruang Meranti'], jawaban: 'Ruang Jati' },
];

export const NAMA_TIM_TL = [
  { diketahui: ['Tim A', 'Tim B', 'Tim C'], jawaban: 'Tim D' },
  { diketahui: ['Tim Registrasi', 'Tim Logistik', 'Tim Layanan'], jawaban: 'Tim Cadangan' },
  { diketahui: ['Tim Utara', 'Tim Tengah', 'Tim Selatan'], jawaban: 'Tim Bantuan' },
];

/** Kelompok 1–3: pola pemajuan rapat. `target` = rapat yang dijadwalkan ulang; `demo` = kegiatan klien yang tidak boleh dipindah. */
export const KELOMPOK_RAPAT = [
  {
    judul: 'Proyek Aplikasi Klien', target: 'Rapat Tim Proyek', demo: 'Demo Aplikasi Klien',
    kegiatan: ['Rapat Harian Proyek', 'Tinjauan Data Proyek', 'Rapat Proyek', 'Tinjauan Spesifikasi', 'Koordinasi Tim Pengembang', 'Pembahasan Anggaran Proyek', 'Koordinasi Implementasi', 'Analisis Hasil Uji', 'Rapat Kebutuhan Klien', 'Peninjauan Rencana Rilis', 'Uji Penerimaan Pengguna', 'Evaluasi Risiko Proyek'],
  },
  {
    judul: 'Tim Penjualan', target: 'Rapat Tim Penjualan', demo: 'Demo Produk Klien',
    kegiatan: ['Rapat Target Penjualan', 'Tinjauan Prospek Klien', 'Diskusi Kebutuhan Pelanggan', 'Presentasi Proposal Klien', 'Penyusunan Penawaran', 'Koordinasi Akun Pelanggan', 'Pembahasan Kontrak Penjualan', 'Tinjauan Kinerja Penjualan', 'Koordinasi Layanan Pelanggan', 'Tindak Lanjut Penawaran', 'Rapat Strategi Pemasaran', 'Evaluasi Kepuasan Pelanggan'],
  },
  {
    judul: 'Administrasi dan Keuangan', target: 'Rapat Tim Administrasi', demo: null,
    kegiatan: ['Verifikasi Dokumen', 'Rekonsiliasi Transaksi', 'Pemeriksaan Tagihan', 'Pembahasan Anggaran Operasional', 'Tinjauan Laporan Keuangan', 'Koordinasi Penggajian', 'Pemeriksaan Dokumen Pajak', 'Persiapan Laporan Bulanan', 'Koordinasi Pembayaran Vendor', 'Audit Dokumen Internal', 'Konfirmasi Dokumen Pendukung', 'Rapat Penutupan Buku', 'Peninjauan Prosedur Administrasi'],
  },
];

/** Janji pribadi pada Kalender Anda (tetap). */
export const JANJI_ANDA = ['Janji Dokter Gigi', 'Wawancara Kandidat', 'Panggilan dengan Atasan', 'Tinjauan Kinerja Pribadi', 'Pelatihan Daring', 'Rapat Lintas Divisi', 'Konsultasi Hukum', 'Makan Siang dengan Mitra', 'Penyusunan Laporan Pribadi'];

/** Kelompok 4: pola ketergantungan ruangan. `Rapat Penjualan` adalah pembatas antar-ruang sesuai sumber. */
export const KEGIATAN_RUANG = ['Koordinasi Divisi TI', 'Orientasi Sistem Baru', 'Peninjauan Keamanan Aplikasi', 'Uji Koneksi Peralatan', 'Sesi Tanya Jawab Pelatihan', 'Rapat Implementasi Sistem', 'Koordinasi Fasilitas Ruang', 'Demo Internal Produk', 'Rapat Anggaran Unit', 'Pemeliharaan Perangkat'];
export const RAPAT_PENJUALAN = 'Rapat Penjualan';

/** Kelompok 5–6: pola petugas. Semua kegiatan = tugas aktif acara. */
export const KELOMPOK_PETUGAS = [
  { judul: 'Bakti Sosial', acara: 'acara bakti sosial dan penyaluran bantuan', kegiatan: ['Registrasi Penerima Bantuan', 'Pemeriksaan Data Penerima', 'Penerimaan Donasi', 'Pemilahan Donasi', 'Penyiapan Paket Bantuan', 'Distribusi Paket Bantuan', 'Pendampingan Penerima Bantuan', 'Pengaturan Antrean', 'Pelayanan Meja Informasi', 'Koordinasi Pos Layanan', 'Pencatatan Penyaluran Bantuan', 'Pengelolaan Logistik Bantuan', 'Pengarahan Relawan', 'Penataan Area Layanan'] },
  { judul: 'Lokakarya Literasi Keuangan', acara: 'lokakarya literasi keuangan', kegiatan: ['Registrasi Peserta Lokakarya', 'Verifikasi Kehadiran Peserta', 'Distribusi Bahan Edukasi', 'Pendampingan Sesi Tabungan', 'Pendampingan Sesi Anggaran Pribadi', 'Pendampingan Sesi Keamanan Digital', 'Pelayanan Informasi Lokakarya', 'Koordinasi Fasilitator', 'Pendampingan Konsultasi Dasar', 'Pengaturan Ruang Kelas', 'Pendampingan Latihan Perencanaan', 'Pencatatan Evaluasi Peserta', 'Distribusi Sertifikat', 'Pengelolaan Perangkat Presentasi'] },
];
