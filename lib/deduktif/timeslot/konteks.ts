// Bank kegiatan Timeslot Scheduling (Blueprint Timeslot §6). Tiga set pertama menerjemahkan sumber SHL; sisanya adaptasi editorial.
// set1 = pola proyek [Presentasi/target, Pemeriksaan, Tinjauan bersama …, Rapat]
// set2 = pola pelatihan [60, 30, 90, 90 menit; opsi keempat selesai terakhir]
// set3 = pola sumber daya [bergantung, tidak bergantung, bergantung, tidak bergantung]
// tetap = [Pengarahan, Koordinasi (jangkar set1), Sumber daya (jangkar set3), Rapat, Konsultasi, Istirahat]

export interface KonteksSlot {
  judul: string;
  set1?: string[];
  set2?: string[];
  set3?: string[];
  tetap: string[];
}

export const KONTEKS_SLOT: KonteksSlot[] = [
  { judul: 'Proyek Aplikasi', set1: ['Demo Produk', 'Tinjauan Kualitas', 'Tinjauan bersama Jay', 'Rapat Scrum'], tetap: ['Pengarahan Proyek', 'Pertemuan Singkat dengan Peter', 'Pengambilan Laptop', 'Rapat Tim Teknologi', 'Konsultasi Arsitektur', 'Istirahat Siang'] },
  { judul: 'Pelatihan Pegawai', set2: ['Pelatihan Kepatuhan', 'Pelatihan Keberagaman', 'Pelatihan SDM', 'Pelatihan TI'], tetap: ['Pengarahan Pagi', 'Koordinasi dengan Instruktur', 'Pengambilan Laptop', 'Rapat Tim', 'Konsultasi Kurikulum', 'Istirahat Siang'] },
  { judul: 'Pekerjaan Kantor', set3: ['Entri Data', 'Rapat Penjualan', 'Menjalankan Laporan', 'Wawancara'], tetap: ['Pengarahan Pagi', 'Koordinasi dengan Atasan', 'Pengambilan Laptop', 'Rapat Internal', 'Konsultasi Anggaran', 'Istirahat Siang'] },
  { judul: 'Persiapan Audit', set1: ['Presentasi Temuan', 'Pemeriksaan Bukti', 'Tinjauan bersama Kepala Tim', 'Rapat Audit'], tetap: ['Pengarahan Penugasan Audit', 'Koordinasi dengan Ketua Audit', 'Penyerahan Berkas Audit', 'Rapat Pembukaan Audit', 'Konsultasi Prosedur', 'Istirahat Tim Audit'] },
  { judul: 'Pelatihan Layanan', set2: ['Pelatihan Layanan', 'Pengarahan Etika', 'Pelatihan Produk', 'Pelatihan Sistem'], tetap: ['Pengarahan Pagi', 'Koordinasi dengan Fasilitator', 'Pengambilan Laptop Pelatihan', 'Rapat Tim', 'Konsultasi Materi', 'Istirahat'] },
  { judul: 'Produksi Presentasi', set3: ['Mengolah Grafik', 'Rapat Materi', 'Menyusun Slide', 'Wawancara Narasumber'], tetap: ['Pengarahan Tim', 'Koordinasi dengan Desainer', 'Pengambilan Laptop', 'Rapat Internal', 'Konsultasi Isi', 'Istirahat'] },
  { judul: 'Pengembangan Aplikasi', set1: ['Demo Fitur', 'Pengujian Fungsi', 'Tinjauan bersama Manajer Produk', 'Rapat Pengembang'], set3: ['Pembaruan Aplikasi', 'Diskusi Pengguna', 'Analisis Galat', 'Wawancara Pengguna'], tetap: ['Pengarahan Proyek', 'Koordinasi dengan Manajer Produk', 'Pengambilan Laptop Pengembang', 'Rapat Tim Teknologi', 'Konsultasi Arsitektur', 'Istirahat Tim Pengembang'] },
  { judul: 'Pengolahan Data', set1: ['Presentasi Ringkasan', 'Pemeriksaan Data', 'Tinjauan bersama Analis Senior', 'Rapat Pelaporan'], set3: ['Entri Transaksi', 'Diskusi Kebutuhan Data', 'Pembuatan Dasbor', 'Wawancara Pemilik Data'], tetap: ['Pengarahan Analis', 'Koordinasi Sumber Data', 'Pengaktifan Akses Data', 'Rapat Evaluasi Angka', 'Konsultasi Metode Analisis', 'Istirahat Tim Data'] },
  { judul: 'Pelatihan Pegawai Baru', set2: ['Pelatihan Kepatuhan Internal', 'Pengarahan Etika Kerja', 'Pelatihan Layanan Pelanggan', 'Pelatihan Sistem Operasional'], set3: ['Pembaruan Modul Digital', 'Diskusi Kebutuhan Peserta', 'Penyusunan Kuis Daring', 'Wawancara Calon Fasilitator'], tetap: ['Pengarahan Panitia Pelatihan', 'Koordinasi dengan Instruktur', 'Pengambilan Laptop Pelatihan', 'Rapat Evaluasi Pembelajaran', 'Konsultasi Kurikulum', 'Istirahat Peserta Pelatihan'] },
  { judul: 'Rekrutmen Pegawai', set1: ['Presentasi Hasil Seleksi', 'Pemeriksaan Berkas Kandidat', 'Tinjauan bersama Perekrut', 'Rapat Keputusan Rekrutmen'], set2: ['Orientasi Perusahaan', 'Pengarahan Aturan Pegawai', 'Pelatihan Administrasi SDM', 'Pengenalan Sistem Kerja'], set3: ['Pembaruan Data Kandidat', 'Diskusi Kriteria Jabatan', 'Penyusunan Rekap Seleksi', 'Wawancara Kandidat'], tetap: ['Pengarahan Tim Rekrutmen', 'Koordinasi dengan Manajer SDM', 'Pengaktifan Akses Rekrutmen', 'Rapat Kebutuhan Tenaga Kerja', 'Konsultasi Deskripsi Jabatan', 'Istirahat Tim SDM'] },
  { judul: 'Penjualan dan Klien', set1: ['Presentasi Penawaran', 'Pemeriksaan Proposal', 'Tinjauan bersama Kepala Penjualan', 'Rapat Strategi Klien'], set2: ['Pelatihan Produk Penjualan', 'Pengarahan Etika Penawaran', 'Pelatihan Negosiasi', 'Pelatihan Sistem Penjualan'], set3: ['Pembaruan Data Prospek', 'Diskusi Kebutuhan Klien', 'Penyusunan Prakiraan Penjualan', 'Pertemuan dengan Calon Klien'], tetap: ['Pengarahan Target Penjualan', 'Koordinasi dengan Manajer Akun', 'Pengaktifan Akses Penjualan', 'Rapat Evaluasi Prospek', 'Konsultasi Harga Penawaran', 'Istirahat Tim Penjualan'] },
  { judul: 'Layanan Nasabah', set1: ['Presentasi Perbaikan Layanan', 'Pemeriksaan Berkas Keluhan', 'Tinjauan bersama Supervisor Layanan', 'Rapat Tindak Lanjut Keluhan'], set2: ['Pelatihan Layanan Nasabah', 'Pengarahan Kerahasiaan Data', 'Pelatihan Penanganan Keluhan', 'Pelatihan Aplikasi Layanan'], set3: ['Pencatatan Permintaan Nasabah', 'Diskusi Penanganan Kasus', 'Penyusunan Rekap Keluhan', 'Wawancara Kebutuhan Nasabah'], tetap: ['Pengarahan Petugas Layanan', 'Koordinasi dengan Kepala Layanan', 'Pengaktifan Akses Layanan', 'Rapat Evaluasi Waktu Tanggap', 'Konsultasi Kasus Nasabah', 'Istirahat Petugas Layanan'] },
  { judul: 'Administrasi Dokumen', set1: ['Presentasi Penataan Arsip', 'Pemeriksaan Kelengkapan Dokumen', 'Tinjauan bersama Kepala Administrasi', 'Rapat Pengelolaan Dokumen'], set2: ['Pelatihan Tata Naskah', 'Pengarahan Kerahasiaan Arsip', 'Pelatihan Pengarsipan', 'Pelatihan Sistem Dokumen'], tetap: ['Pengarahan Tim Administrasi', 'Koordinasi dengan Pengelola Arsip', 'Pengambilan Pemindai Dokumen', 'Rapat Evaluasi Arsip', 'Konsultasi Retensi Dokumen', 'Istirahat Tim Administrasi'] },
  { judul: 'Persiapan Acara', set1: ['Presentasi Rencana Acara', 'Pemeriksaan Susunan Acara', 'Tinjauan bersama Ketua Panitia', 'Rapat Kesiapan Acara'], set2: ['Pelatihan Petugas Registrasi', 'Pengarahan Tata Tertib Acara', 'Pelatihan Pemandu Acara', 'Pelatihan Perangkat Presentasi'], set3: ['Pembaruan Daftar Peserta', 'Diskusi Teknis Acara', 'Penyusunan Materi Tayangan', 'Wawancara Calon Pembicara'], tetap: ['Pengarahan Panitia Acara', 'Koordinasi dengan Pengelola Tempat', 'Pengambilan Laptop Acara', 'Rapat Koordinasi Pembicara', 'Konsultasi Kebutuhan Panggung', 'Istirahat Panitia Acara'] },
  { judul: 'Produksi Konten', set1: ['Presentasi Konsep Konten', 'Pemeriksaan Naskah', 'Tinjauan bersama Editor', 'Rapat Persiapan Publikasi'], set2: ['Pelatihan Gaya Penulisan', 'Pengarahan Etika Publikasi', 'Pelatihan Penyuntingan', 'Pelatihan Sistem Penerbitan'], set3: ['Penyuntingan Video', 'Diskusi Sudut Cerita', 'Penyusunan Tata Letak', 'Wawancara Narasumber Konten'], tetap: ['Pengarahan Tim Konten', 'Koordinasi dengan Redaktur', 'Pengambilan Laptop Penyuntingan', 'Rapat Kalender Publikasi', 'Konsultasi Materi Visual', 'Istirahat Tim Publikasi'] },
];

/** Set empat kegiatan untuk pola pengembangan (peran: A 60, B 30/60, C 90, D 90 menit). */
export const SET_PENGEMBANGAN = [
  { judul: 'Pelaporan Data', opsi: ['Pemeriksaan Data', 'Konfirmasi Data', 'Analisis Data', 'Penyusunan Laporan'] },
  { judul: 'Pemeriksaan Audit', opsi: ['Pemeriksaan Bukti Audit', 'Konfirmasi Temuan', 'Pengujian Sampel', 'Penyusunan Rekomendasi'] },
  { judul: 'Seleksi Kandidat', opsi: ['Pemeriksaan Berkas Kandidat', 'Konfirmasi Jadwal Wawancara', 'Penilaian Kandidat', 'Penyusunan Rekap Seleksi'] },
  { judul: 'Penawaran Klien', opsi: ['Pemeriksaan Proposal', 'Konfirmasi Harga', 'Analisis Kebutuhan Klien', 'Penyusunan Penawaran'] },
];

/** Rangkaian berantai untuk Pengembangan 5 (urutan waktu: opsi[3] → opsi[2] → opsi[1] → opsi[0]). */
export const SET_RANTAI = [
  { judul: 'Rangkaian Pelaporan', opsi: ['Pengiriman Laporan', 'Persetujuan Laporan', 'Analisis Data', 'Pengumpulan Data'] },
  { judul: 'Rangkaian Audit', opsi: ['Pengiriman Rekomendasi', 'Persetujuan Ketua Audit', 'Evaluasi Pengendalian', 'Pengujian Sampel'] },
  { judul: 'Rangkaian Publikasi', opsi: ['Publikasi Konten', 'Persetujuan Editor', 'Penyuntingan Naskah', 'Penulisan Naskah'] },
];

export const TETAP_UMUM = ['Pengarahan Tim', 'Rapat Koordinasi', 'Pemeriksaan Sistem', 'Istirahat', 'Rapat Unit', 'Rapat Data', 'Konsultasi Atasan', 'Rapat Mingguan', 'Panggilan Klien'];
