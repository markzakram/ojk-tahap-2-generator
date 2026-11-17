// Model bersama Badges (Logical Ranking di SIADU), Penalaran Deduktif.
// Satu soal = 6 orang (pengurai dan solver mendukung 5–7), setiap orang mendapat tepat satu lencana 1..n (tidak ada nilai
// sama). Kartu orang memuat 0–2 petunjuk relasional satu kalimat. Arti lencana 1 dan lencana n dinyatakan di instruksi.
//
// Alur: pembangun menulis kendala terstruktur (`kendala`) → teks kartu dirender dari kendala → solver `pecahkan` MEMBACA
// ULANG TEKS KARTU dengan pengurai (`uraiPetunjuk`), lalu mengenumerasi seluruh n! urutan. Kendala terstruktur hanya dipakai
// untuk memeriksa bahwa teks dan model sama makna (dua arah), bukan untuk menentukan kunci.
import type { Tingkat } from '../../core/pilihan-ganda';

export type KendalaBadges =
  /** a berperingkat lebih kecil (lebih awal/tinggi) daripada b. */
  | { jenis: 'atas'; a: string; b: string }
  /** a di atas b dengan tepat k orang di antara keduanya (k = 0: langsung bersebelahan). */
  | { jenis: 'atas-tepat'; a: string; b: string; k: number }
  /** a di atas b dengan sedikitnya k orang di antara keduanya. */
  | { jenis: 'atas-min'; a: string; b: string; k: number }
  /** Tepat k orang di antara a dan b, arah tidak ditentukan (k = 0: bersebelahan). */
  | { jenis: 'jarak-tepat'; a: string; b: string; k: number }
  /** Sedikitnya k orang di antara a dan b, arah tidak ditentukan. */
  | { jenis: 'jarak-min'; a: string; b: string; k: number }
  /** a berada di antara b dan c (arah bebas, tidak harus bersebelahan). */
  | { jenis: 'di-antara'; a: string; b: string; c: string }
  | { jenis: 'tetap'; a: string; p: number }
  | { jenis: 'bukan'; a: string; p: number }
  /** a berada di k peringkat teratas (1..k). */
  | { jenis: 'atas-k'; a: string; k: number }
  /** a berada di k peringkat terbawah (n−k+1..n). */
  | { jenis: 'bawah-k'; a: string; k: number }
  | { jenis: 'paritas'; a: string; ganjil: boolean }
  /** Selisih peringkat a–b lebih besar daripada selisih a–c (SHL Gaji). */
  | { jenis: 'lebih-jauh'; a: string; b: string; c: string }
  /** Jika a di peringkat p, b di atas c (SHL Gaji). */
  | { jenis: 'jika'; a: string; p: number; b: string; c: string };

export type JenisKendala = KendalaBadges['jenis'];

/** Kendala + kartu tempat petunjuk ditulis. `varian` hanya memilih redaksi yang setara makna. */
export type Petunjuk = KendalaBadges & { kartu: string; varian?: 'negasi' | 'paruh' | 'ujung' };

/** Redaksi konteks. Semua frasa ini terlihat oleh peserta (di instruksi atau kartu). */
export interface BahasaBadges {
  /** Predikat "lebih atas" (nomor lencana lebih kecil), huruf kecil: "tiba lebih awal daripada". */
  atas: string;
  /** Predikat "lebih bawah": "tiba lebih lambat daripada". */
  bawah: string;
  /** Predikat "lebih atas" tanpa pembanding, untuk petunjuk "di antara": "tiba lebih awal". */
  lebih: string;
  /** Bersebelahan berarah; `%s` = nama pembanding: "tiba tepat sebelum %s", "tiba tepat sesudah %s". */
  sebelum: string;
  sesudah: string;
  /** Kata posisi: "urutan" atau "peringkat". */
  pos: 'urutan' | 'peringkat';
  /** "pertama"/"teratas" dan "terakhir"/"terbawah" untuk k posisi di ujung. */
  awal: string;
  ujung: string;
  /** Nama daftar: "urutan kedatangan", "peringkat gaji". */
  daftar: string;
  /** Predikat lencana 1 dan lencana n: "tiba paling awal", "tiba paling akhir". */
  satu: string;
  akhir: string;
  /** Paruh atas/bawah (SHL "setengah teratas"), hanya untuk n genap: "paruh pertama", "paruh kedua". */
  paruhAtas: string;
  paruhBawah: string;
}

export interface OrangBadges {
  id: string;
  nama: string;
  /** Berkas foto di bank aset Badges Tahap 1 (`bank_aset_badges/<foto>`), bila ada. */
  foto?: string;
  /** Teks kartu, satu kalimat per petunjuk (0–2). */
  petunjuk: string[];
}

export interface BadgesItem {
  jenis: 'logical-ranking';
  judul: string;
  konteks: string;
  tingkat: Tingkat;
  /** Pengantar, arti lencana, dan perintah. */
  instruksi: string[];
  /** Banyak lencana = banyak orang. */
  lencana: number;
  bahasa: BahasaBadges;
  orang: OrangBadges[];
  /** Kendala terstruktur (untuk render dan pemeriksaan dua arah); solver membaca teks kartu. */
  kendala: Petunjuk[];
}

/** orangId → nomor lencana. */
export type Peringkat = Record<string, number>;

export const kunciPeringkat = (a: Peringkat) => Object.keys(a).sort((x, y) => x.localeCompare(y, 'en', { numeric: true })).map((o) => `${o}=${a[o]}`).join(',');

export const KATA = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh'];
export const KATA_BESAR = KATA.map((k) => k[0].toUpperCase() + k.slice(1));

// ───────────────────────── Konteks ─────────────────────────

export interface KonteksBadges {
  id: string;
  judul: string;
  /** Kalimat pengantar; `N` = jumlah orang dalam kata berhuruf besar ("Enam"). */
  pengantar: (N: string) => string;
  bahasa: BahasaBadges;
}

const URUTAN = { pos: 'urutan' as const, awal: 'pertama', ujung: 'terakhir', paruhAtas: 'paruh pertama', paruhBawah: 'paruh kedua' };
const PERINGKAT = {
  pos: 'peringkat' as const, awal: 'teratas', ujung: 'terbawah', paruhAtas: 'paruh atas', paruhBawah: 'paruh bawah',
  sebelum: 'berada tepat satu peringkat di atas %s', sesudah: 'berada tepat satu peringkat di bawah %s',
};
const TIBA = {
  ...URUTAN, atas: 'tiba lebih awal daripada', bawah: 'tiba lebih lambat daripada', lebih: 'tiba lebih awal',
  sebelum: 'tiba tepat sebelum %s', sesudah: 'tiba tepat sesudah %s',
  daftar: 'urutan kedatangan', satu: 'tiba paling awal', akhir: 'tiba paling akhir',
};

export const KONTEKS: Record<string, KonteksBadges> = {
  'tiba-kantor': {
    id: 'tiba-kantor', judul: 'Urutan Kedatangan',
    pengantar: (N) => `${N} pegawai tiba di kantor satu per satu pada pagi yang sama. Tidak ada dua orang yang tiba bersamaan.`,
    bahasa: TIBA,
  },
  'tiba-rapat': {
    id: 'tiba-rapat', judul: 'Kedatangan Peserta Rapat',
    pengantar: (N) => `${N} peserta tiba di ruang rapat satu per satu. Tidak ada dua orang yang tiba bersamaan.`,
    bahasa: TIBA,
  },
  'tiba-pelatihan': {
    id: 'tiba-pelatihan', judul: 'Kedatangan Peserta Pelatihan',
    pengantar: (N) => `${N} peserta pelatihan tiba di lokasi pelatihan satu per satu. Tidak ada dua orang yang tiba bersamaan.`,
    bahasa: TIBA,
  },
  gaji: {
    id: 'gaji', judul: 'Peringkat Gaji',
    pengantar: (N) => `${N} pegawai menerima gaji bulanan yang berbeda-beda. Tidak ada dua orang yang gajinya sama.`,
    bahasa: { ...PERINGKAT, atas: 'bergaji lebih tinggi daripada', bawah: 'bergaji lebih rendah daripada', lebih: 'bergaji lebih tinggi', daftar: 'peringkat gaji', satu: 'bergaji paling tinggi', akhir: 'bergaji paling rendah' },
  },
  skor: {
    id: 'skor', judul: 'Peringkat Skor Tes',
    pengantar: (N) => `${N} peserta mengikuti tes keterampilan yang sama. Tidak ada dua orang yang skornya sama.`,
    bahasa: { ...PERINGKAT, atas: 'memperoleh skor lebih tinggi daripada', bawah: 'memperoleh skor lebih rendah daripada', lebih: 'memperoleh skor lebih tinggi', daftar: 'peringkat skor', satu: 'memperoleh skor paling tinggi', akhir: 'memperoleh skor paling rendah' },
  },
  selesai: {
    id: 'selesai', judul: 'Urutan Penyelesaian Tugas',
    pengantar: (N) => `${N} peserta pelatihan mulai mengerjakan tugas yang sama pada waktu yang sama. Tidak ada dua orang yang selesai bersamaan.`,
    bahasa: {
      ...URUTAN, atas: 'selesai lebih dahulu daripada', bawah: 'selesai lebih belakangan daripada', lebih: 'selesai lebih dahulu',
      sebelum: 'selesai tepat sebelum %s', sesudah: 'selesai tepat sesudah %s',
      daftar: 'urutan selesai', satu: 'selesai paling dahulu', akhir: 'selesai paling akhir',
    },
  },
  tinggi: {
    id: 'tinggi', judul: 'Urutan Tinggi Badan',
    pengantar: (N) => `${N} anggota tim akan berfoto bersama dan diurutkan menurut tinggi badan. Tidak ada dua orang yang tingginya sama.`,
    bahasa: {
      ...URUTAN, atas: 'lebih tinggi daripada', bawah: 'lebih pendek daripada', lebih: 'lebih tinggi',
      sebelum: 'berada tepat sebelum %s dalam urutan tinggi badan', sesudah: 'berada tepat sesudah %s dalam urutan tinggi badan',
      daftar: 'urutan tinggi badan', satu: 'paling tinggi', akhir: 'paling pendek',
    },
  },
  penjualan: {
    id: 'penjualan', judul: 'Peringkat Penjualan',
    pengantar: (N) => `${N} tenaga penjual mencatat jumlah penjualan bulan ini. Tidak ada dua orang yang jumlah penjualannya sama.`,
    bahasa: { ...PERINGKAT, atas: 'menjual lebih banyak daripada', bawah: 'menjual lebih sedikit daripada', lebih: 'menjual lebih banyak', daftar: 'peringkat penjualan', satu: 'menjual paling banyak', akhir: 'menjual paling sedikit' },
  },
  bergabung: {
    id: 'bergabung', judul: 'Urutan Bergabung',
    pengantar: (N) => `${N} pegawai bergabung dengan perusahaan pada tanggal yang berbeda-beda. Tidak ada dua orang yang bergabung pada hari yang sama.`,
    bahasa: {
      ...URUTAN, atas: 'bergabung lebih awal daripada', bawah: 'bergabung lebih belakangan daripada', lebih: 'bergabung lebih awal',
      sebelum: 'bergabung tepat sebelum %s', sesudah: 'bergabung tepat sesudah %s',
      daftar: 'urutan bergabung', satu: 'bergabung paling awal', akhir: 'bergabung paling belakangan',
    },
  },
};

/** Nama orang di bank aset Badges Tahap 1 (`bank_aset_badges/manifest.json`, kategori orang): inisial semuanya berbeda. */
export const NAMA_BADGES = [
  'Ali', 'Bagas', 'Cinta', 'Dika', 'Elvi', 'Farhan', 'Gilang', 'Haris', 'Intan', 'Joko', 'Kirana', 'Laras', 'Maya',
  'Nanda', 'Oki', 'Putri', 'Qori', 'Raka', 'Sinta', 'Tio', 'Umar', 'Vina', 'Wulan', 'Xena', 'Yusuf', 'Zahwa',
] as const;

export function instruksiBadges(k: KonteksBadges, n: number): string[] {
  const b = k.bahasa;
  return [
    k.pengantar(KATA_BESAR[n]),
    `Pasangkan lencana 1 sampai ${n} pada kartu setiap orang menurut ${b.daftar}: lencana 1 untuk orang yang ${b.satu}, lencana ${n} untuk orang yang ${b.akhir}. Setiap lencana dipakai tepat satu kali.`,
  ];
}

// ───────────────────────── Evaluasi ─────────────────────────

/** Apakah kendala terpenuhi oleh peringkat `r` (orangId → nomor). */
export function cocok(c: KendalaBadges, r: Record<string, number>, n: number): boolean {
  switch (c.jenis) {
    case 'atas': return r[c.a] < r[c.b];
    case 'atas-tepat': return r[c.b] - r[c.a] === c.k + 1;
    case 'atas-min': return r[c.b] - r[c.a] >= c.k + 1;
    case 'jarak-tepat': return Math.abs(r[c.a] - r[c.b]) === c.k + 1;
    case 'jarak-min': return Math.abs(r[c.a] - r[c.b]) >= c.k + 1;
    case 'di-antara': return (r[c.b] - r[c.a]) * (r[c.c] - r[c.a]) < 0;
    case 'tetap': return r[c.a] === c.p;
    case 'bukan': return r[c.a] !== c.p;
    case 'atas-k': return r[c.a] <= c.k;
    case 'bawah-k': return r[c.a] >= n - c.k + 1;
    case 'paritas': return r[c.a] % 2 === (c.ganjil ? 1 : 0);
    case 'lebih-jauh': return Math.abs(r[c.a] - r[c.b]) > Math.abs(r[c.a] - r[c.c]);
    case 'jika': return r[c.a] !== c.p || r[c.b] < r[c.c];
  }
}

/** Orang yang disebut kendala, subjek lebih dulu. */
export function pelaku(c: KendalaBadges): string[] {
  switch (c.jenis) {
    case 'atas': case 'atas-tepat': case 'atas-min': case 'jarak-tepat': case 'jarak-min': return [c.a, c.b];
    case 'di-antara': case 'lebih-jauh': return [c.a, c.b, c.c];
    case 'jika': return [c.a, c.b, c.c];
    default: return [c.a];
  }
}

const cacheUrutan = new Map<number, number[][]>();
/** Semua permutasi peringkat 1..n (n! ≤ 5.040). */
export function semuaUrutan(n: number): number[][] {
  const ada = cacheUrutan.get(n);
  if (ada) return ada;
  const hasil: number[][] = [];
  const p: number[] = [];
  const pakai = new Array<boolean>(n + 1).fill(false);
  const f = () => {
    if (p.length === n) { hasil.push(p.slice()); return; }
    for (let v = 1; v <= n; v++) if (!pakai[v]) { pakai[v] = true; p.push(v); f(); p.pop(); pakai[v] = false; }
  };
  f();
  cacheUrutan.set(n, hasil);
  return hasil;
}

/** Enumerasi penuh: seluruh peringkat lengkap yang memenuhi SEMUA kendala. */
export function semuaPeringkat(ids: string[], kendala: KendalaBadges[]): Peringkat[] {
  const n = ids.length;
  const hasil: Peringkat[] = [];
  for (const p of semuaUrutan(n)) {
    const r: Peringkat = {};
    ids.forEach((id, i) => (r[id] = p[i]));
    if (kendala.every((c) => cocok(c, r, n))) hasil.push(r);
  }
  return hasil;
}

/** Banyak solusi bila kendala ke-i dibuang, untuk setiap i (uji "setiap petunjuk punya fungsi"). */
export function solusiTanpaMasingMasing(ids: string[], kendala: KendalaBadges[]): number[] {
  const n = ids.length;
  const m = kendala.length;
  const hitung = new Array<number>(m).fill(0);
  for (const p of semuaUrutan(n)) {
    const r: Record<string, number> = {};
    ids.forEach((id, i) => (r[id] = p[i]));
    let gagal = -1;
    let ganda = false;
    for (let i = 0; i < m; i++) if (!cocok(kendala[i], r, n)) { if (gagal >= 0) { ganda = true; break; } gagal = i; }
    if (ganda) continue;
    if (gagal < 0) for (let i = 0; i < m; i++) hitung[i]++;
    else hitung[gagal]++;
  }
  return hitung;
}

// ───────────────────────── Redaksi ─────────────────────────

const besar = (s: string) => s[0].toUpperCase() + s.slice(1);
const posKe = (b: BahasaBadges, p: number) => `${b.pos} ke-${p}`;
const isi = (templat: string, x: string) => templat.replace('%s', x);
/** Penjelas petunjuk "berurutan langsung" (arah bebas). */
const kurungLangsung = (b: BahasaBadges) => (b.pos === 'urutan' ? 'tepat sebelum atau sesudahnya' : 'tepat satu peringkat di atas atau di bawahnya');

/**
 * Teks satu petunjuk pada kartu `kartu`. Subjek dihilangkan bila subjek = pemilik kartu (gaya kartu SHL), selain itu
 * ditulis lengkap. Pemilik kartu tidak pernah disebut dengan namanya sendiri ("ia"/"dirinya"/"-nya"). Satu petunjuk =
 * satu kalimat.
 */
export function teksPetunjuk(c: Petunjuk, nama: (id: string) => string, b: BahasaBadges, n: number): string {
  const sub = (id: string, predikat: string) => (id === c.kartu ? besar(predikat) : `${nama(id)} ${predikat}`);
  const diri = (id: string) => (id === c.kartu ? 'dirinya' : nama(id));
  const ia = (id: string) => (id === c.kartu ? 'ia' : nama(id));
  const jarak = (k: number) => `dengan tepat ${KATA[k]} orang`;
  switch (c.jenis) {
    case 'atas':
      return c.kartu === c.b ? sub(c.b, `${b.bawah} ${nama(c.a)}.`) : sub(c.a, `${b.atas} ${nama(c.b)}.`);
    case 'atas-tepat':
      if (c.k === 0) return c.kartu === c.b ? sub(c.b, `${isi(b.sesudah, nama(c.a))}.`) : sub(c.a, `${isi(b.sebelum, nama(c.b))}.`);
      return c.kartu === c.b ? sub(c.b, `${b.bawah} ${nama(c.a)}, ${jarak(c.k)} di antara mereka.`) : sub(c.a, `${b.atas} ${nama(c.b)}, ${jarak(c.k)} di antara mereka.`);
    case 'atas-min':
      return c.kartu === c.b
        ? sub(c.b, `${b.bawah} ${nama(c.a)}, dengan sedikitnya ${KATA[c.k]} orang di antara mereka.`)
        : sub(c.a, `${b.atas} ${nama(c.b)}, dengan sedikitnya ${KATA[c.k]} orang di antara mereka.`);
    case 'jarak-tepat': {
      const [x, y] = c.kartu === c.b ? [c.b, c.a] : [c.a, c.b];
      if (c.k === 0) return sub(x, `berurutan langsung dengan ${nama(y)} dalam ${b.daftar} (${kurungLangsung(b)}).`);
      return `Tepat ${KATA[c.k]} orang berada di antara ${diri(x)} dan ${nama(y)} dalam ${b.daftar}.`;
    }
    case 'jarak-min': {
      const [x, y] = c.kartu === c.b ? [c.b, c.a] : [c.a, c.b];
      return `Sedikitnya ${KATA[c.k]} orang berada di antara ${diri(x)} dan ${nama(y)} dalam ${b.daftar}.`;
    }
    case 'di-antara': {
      const kepala = c.a === c.kartu ? `${besar(b.pos)}nya` : `${besar(b.pos)} ${nama(c.a)}`;
      return `${kepala} berada di antara ${b.pos} ${nama(c.b)} dan ${b.pos} ${nama(c.c)} (boleh ${nama(c.b)} atau ${nama(c.c)} yang ${b.lebih}; tidak harus bersebelahan dengan keduanya).`;
    }
    case 'tetap': return sub(c.a, `berada di ${posKe(b, c.p)}.`);
    case 'bukan':
      if (c.varian === 'ujung' && (c.p === 1 || c.p === n)) return sub(c.a, `bukan orang yang ${c.p === 1 ? b.satu : b.akhir}.`);
      return sub(c.a, `tidak berada di ${posKe(b, c.p)}.`);
    case 'atas-k':
      if (c.varian === 'paruh' && n % 2 === 0 && c.k === n / 2) return sub(c.a, `berada di ${b.paruhAtas} ${b.daftar} (${b.pos} ke-1 sampai ke-${c.k}).`);
      return sub(c.a, `berada di ${KATA[c.k]} ${b.pos} ${b.awal}.`);
    case 'bawah-k':
      if (c.varian === 'paruh' && n % 2 === 0 && c.k === n / 2) return sub(c.a, `berada di ${b.paruhBawah} ${b.daftar} (${b.pos} ke-${n - c.k + 1} sampai ke-${n}).`);
      return sub(c.a, `berada di ${KATA[c.k]} ${b.pos} ${b.ujung}.`);
    case 'paritas':
      return c.varian === 'negasi' ? sub(c.a, `tidak berada di ${b.pos} bernomor ${c.ganjil ? 'genap' : 'ganjil'}.`) : sub(c.a, `berada di ${b.pos} bernomor ${c.ganjil ? 'ganjil' : 'genap'}.`);
    case 'lebih-jauh': {
      // Selisih simetris: pemilik kartu selalu ditulis di depan pasangannya ("selisih peringkatnya dengan X").
      const selisih = (x: string, y: string) => {
        const [p, q] = y === c.kartu ? [y, x] : [x, y];
        return p === c.kartu ? `selisih ${b.pos}nya dengan ${nama(q)}` : `selisih ${b.pos} ${nama(p)} dengan ${nama(q)}`;
      };
      return besar(`${selisih(c.a, c.b)} lebih besar daripada ${selisih(c.a, c.c)}.`);
    }
    case 'jika': {
      const syarat = `${nama(c.a)} berada di ${posKe(b, c.p)}`;
      // Pemilik kartu = subjek akibat/pembanding: kalimat bersubjek pemilik kartu agar "ia"/"dirinya" tidak ambigu.
      if (c.kartu === c.b) return `${besar(b.atas)} ${nama(c.c)} jika ${syarat}.`;
      if (c.kartu === c.c) return `${besar(b.bawah)} ${nama(c.b)} jika ${syarat}.`;
      return `Jika ${ia(c.a)} berada di ${posKe(b, c.p)}, ${nama(c.b)} ${b.atas} ${nama(c.c)}.`;
    }
  }
}

// ───────────────────────── Pengurai teks kartu (dipakai solver) ─────────────────────────

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ANGKA_KATA: Record<string, number> = Object.fromEntries(KATA.map((k, i) => [k, i]));

/**
 * Baca ulang seluruh teks kartu menjadi kendala. Hanya memakai nama, teks kartu, banyak lencana, dan frasa konteks
 * yang terlihat. Kalimat yang tidak dikenali → `null` (soal ditolak, bukan ditebak).
 */
export function uraiPetunjuk(item: Pick<BadgesItem, 'orang' | 'bahasa' | 'lencana'>): Petunjuk[] | null {
  const b = item.bahasa;
  const n = item.lencana;
  const idDari = new Map(item.orang.map((o) => [o.nama, o.id]));
  const NAMA = item.orang.map((o) => esc(o.nama)).join('|');
  const N = `(${NAMA})`;
  const K = `(${KATA.slice(1).join('|')})`;
  const atas = esc(b.atas);
  const bawah = esc(b.bawah);
  const pos = esc(b.pos);
  const Pos = esc(besar(b.pos));
  const daftar = esc(b.daftar);
  /** Templat bersebelahan → pola dengan satu grup nama. */
  const tpl = (t: string) => t.split('%s').map(esc).join(N);
  const hasil: Petunjuk[] = [];
  for (const o of item.orang) {
    for (const kalimat of o.petunjuk) {
      const c = uraiSatu(kalimat, o.id);
      if (!c) return null;
      hasil.push(c);
    }
  }
  return hasil;

  function uraiSatu(teks: string, kartu: string): Petunjuk | null {
    let m: RegExpMatchArray | null;
    const id = (nm: string) => idDari.get(nm)!;
    // "dirinya" / "ia" / akhiran "-nya" hanya merujuk pemilik kartu.
    const ganti = (s: string | undefined) => (s === undefined || s === 'dirinya' || s === 'ia' ? kartu : id(s));
    const cocokPenuh = (re: string) => teks.match(new RegExp(`^${re}$`));
    // Bentuk yang tidak diawali subjek.
    if ((m = cocokPenuh(`Tepat ${K} orang berada di antara (dirinya|${NAMA}) dan ${N} dalam ${daftar}\\.`)))
      return { jenis: 'jarak-tepat', a: ganti(m[2]), b: id(m[3]), k: ANGKA_KATA[m[1]], kartu };
    if ((m = cocokPenuh(`Sedikitnya ${K} orang berada di antara (dirinya|${NAMA}) dan ${N} dalam ${daftar}\\.`)))
      return { jenis: 'jarak-min', a: ganti(m[2]), b: id(m[3]), k: ANGKA_KATA[m[1]], kartu };
    if ((m = cocokPenuh(`${Pos}(?:nya| ${N}) berada di antara ${pos} ${N} dan ${pos} ${N} \\(boleh ${N} atau ${N} yang ${esc(b.lebih)}; tidak harus bersebelahan dengan keduanya\\)\\.`))) {
      if (m[2] !== m[4] || m[3] !== m[5]) return null;
      return { jenis: 'di-antara', a: ganti(m[1]), b: id(m[2]), c: id(m[3]), kartu };
    }
    if ((m = cocokPenuh(`Selisih ${pos}(?:nya| ${N}) dengan ${N} lebih besar daripada selisih ${pos}(?:nya| ${N}) dengan ${N}\\.`))) {
      // Setiap selisih = pasangan tak berarah; orang yang sama di kedua pasangan adalah pusat perbandingan.
      const satu = [ganti(m[1]), id(m[2])], dua = [ganti(m[3]), id(m[4])];
      const pusat = satu.filter((x) => dua.includes(x));
      if (pusat.length !== 1 || satu[0] === satu[1] || dua[0] === dua[1]) return null;
      const a = pusat[0];
      return { jenis: 'lebih-jauh', a, b: satu.find((x) => x !== a)!, c: dua.find((x) => x !== a)!, kartu };
    }
    if ((m = cocokPenuh(`Jika (ia|${NAMA}) berada di ${pos} ke-(\\d), ${N} ${atas} ${N}\\.`)))
      return { jenis: 'jika', a: ganti(m[1]), p: Number(m[2]), b: id(m[3]), c: id(m[4]), kartu };
    // Bentuk bersubjek: subjek eksplisit di depan, atau subjek = pemilik kartu (huruf pertama besar).
    let subjek = kartu;
    let sisa = teks;
    const depan = item.orang.find((x) => teks.startsWith(x.nama + ' '));
    if (depan) { subjek = depan.id; sisa = teks.slice(depan.nama.length + 1); }
    else sisa = teks[0].toLowerCase() + teks.slice(1);
    const s = subjek;
    const cek = (re: string) => sisa.match(new RegExp(`^${re}$`));
    if ((m = cek(`${atas} ${N}\\.`))) return { jenis: 'atas', a: s, b: id(m[1]), kartu };
    if ((m = cek(`${bawah} ${N}\\.`))) return { jenis: 'atas', a: id(m[1]), b: s, kartu };
    if ((m = cek(`${atas} ${N} jika ${N} berada di ${pos} ke-(\\d)\\.`))) return { jenis: 'jika', a: id(m[2]), p: Number(m[3]), b: s, c: id(m[1]), kartu };
    if ((m = cek(`${bawah} ${N} jika ${N} berada di ${pos} ke-(\\d)\\.`))) return { jenis: 'jika', a: id(m[2]), p: Number(m[3]), b: id(m[1]), c: s, kartu };
    if ((m = cek(`${tpl(b.sebelum)}\\.`))) return { jenis: 'atas-tepat', a: s, b: id(m[1]), k: 0, kartu };
    if ((m = cek(`${tpl(b.sesudah)}\\.`))) return { jenis: 'atas-tepat', a: id(m[1]), b: s, k: 0, kartu };
    if ((m = cek(`${atas} ${N}, dengan tepat ${K} orang di antara mereka\\.`))) return { jenis: 'atas-tepat', a: s, b: id(m[1]), k: ANGKA_KATA[m[2]], kartu };
    if ((m = cek(`${bawah} ${N}, dengan tepat ${K} orang di antara mereka\\.`))) return { jenis: 'atas-tepat', a: id(m[1]), b: s, k: ANGKA_KATA[m[2]], kartu };
    if ((m = cek(`${atas} ${N}, dengan sedikitnya ${K} orang di antara mereka\\.`))) return { jenis: 'atas-min', a: s, b: id(m[1]), k: ANGKA_KATA[m[2]], kartu };
    if ((m = cek(`${bawah} ${N}, dengan sedikitnya ${K} orang di antara mereka\\.`))) return { jenis: 'atas-min', a: id(m[1]), b: s, k: ANGKA_KATA[m[2]], kartu };
    if ((m = cek(`berurutan langsung dengan ${N} dalam ${daftar} \\(${esc(kurungLangsung(b))}\\)\\.`))) return { jenis: 'jarak-tepat', a: s, b: id(m[1]), k: 0, kartu };
    if ((m = cek(`berada di ${pos} ke-(\\d)\\.`))) return { jenis: 'tetap', a: s, p: Number(m[1]), kartu };
    if ((m = cek(`tidak berada di ${pos} ke-(\\d)\\.`))) return { jenis: 'bukan', a: s, p: Number(m[1]), kartu };
    if (cek(`bukan orang yang ${esc(b.satu)}\\.`)) return { jenis: 'bukan', a: s, p: 1, kartu, varian: 'ujung' };
    if (cek(`bukan orang yang ${esc(b.akhir)}\\.`)) return { jenis: 'bukan', a: s, p: n, kartu, varian: 'ujung' };
    if ((m = cek(`berada di ${K} ${pos} ${esc(b.awal)}\\.`))) return { jenis: 'atas-k', a: s, k: ANGKA_KATA[m[1]], kartu };
    if ((m = cek(`berada di ${K} ${pos} ${esc(b.ujung)}\\.`))) return { jenis: 'bawah-k', a: s, k: ANGKA_KATA[m[1]], kartu };
    if ((m = cek(`berada di ${esc(b.paruhAtas)} ${daftar} \\(${pos} ke-1 sampai ke-(\\d)\\)\\.`))) {
      const k = Number(m[1]);
      return n % 2 === 0 && k === n / 2 ? { jenis: 'atas-k', a: s, k, kartu, varian: 'paruh' } : null;
    }
    if ((m = cek(`berada di ${esc(b.paruhBawah)} ${daftar} \\(${pos} ke-(\\d) sampai ke-(\\d)\\)\\.`))) {
      const dari = Number(m[1]);
      return n % 2 === 0 && dari === n / 2 + 1 && Number(m[2]) === n ? { jenis: 'bawah-k', a: s, k: n / 2, kartu, varian: 'paruh' } : null;
    }
    if ((m = cek(`berada di ${pos} bernomor (ganjil|genap)\\.`))) return { jenis: 'paritas', a: s, ganjil: m[1] === 'ganjil', kartu };
    if ((m = cek(`tidak berada di ${pos} bernomor (ganjil|genap)\\.`))) return { jenis: 'paritas', a: s, ganjil: m[1] === 'genap', kartu, varian: 'negasi' };
    return null;
  }
}

/** Bentuk kanonik satu kendala (tanpa redaksi), untuk membandingkan model dengan hasil baca teks. */
export function kanonik(c: Petunjuk): string {
  const pasang = (x: string, y: string) => [x, y].sort().join('~');
  switch (c.jenis) {
    case 'jarak-tepat': case 'jarak-min': return `${c.kartu}|${c.jenis}|${pasang(c.a, c.b)}|${c.k}`;
    case 'di-antara': return `${c.kartu}|${c.jenis}|${c.a}|${pasang(c.b, c.c)}`;
    default: {
      const { kartu, varian: _, ...isi } = c;
      return `${kartu}|${JSON.stringify(isi, Object.keys(isi).sort())}`;
    }
  }
}

/**
 * Sidik struktur: setiap orang diganti nomor lencananya pada kunci, lalu daftar kendala diurutkan. Dua soal yang hanya
 * berbeda nama, konteks, letak kartu, atau redaksi setara mendapat sidik sama.
 */
export function sidikBadges(item: BadgesItem, jawaban: Peringkat): string {
  const r = (id: string) => jawaban[id];
  const kode = item.kendala.map((c) => {
    switch (c.jenis) {
      case 'atas': return `A${r(c.a)}<${r(c.b)}`;
      case 'atas-tepat': return `AT${r(c.a)}<${r(c.b)}`;
      case 'atas-min': return `AM${c.k}:${r(c.a)}<${r(c.b)}`;
      case 'jarak-tepat': return `JT${[r(c.a), r(c.b)].sort().join(',')}`;
      case 'jarak-min': return `JM${c.k}:${[r(c.a), r(c.b)].sort().join(',')}`;
      case 'di-antara': return `DA${r(c.a)}:${[r(c.b), r(c.c)].sort().join(',')}`;
      case 'tetap': return `T${r(c.a)}`;
      case 'bukan': return `B${r(c.a)}!${c.p}`;
      case 'atas-k': return `K${r(c.a)}<=${c.k}`;
      case 'bawah-k': return `L${r(c.a)}>=${item.lencana - c.k + 1}`;
      case 'paritas': return `P${r(c.a)}`;
      case 'lebih-jauh': return `LJ${r(c.a)}:${r(c.b)}>${r(c.c)}`;
      case 'jika': return `J${r(c.a)}@${c.p}:${r(c.b)}<${r(c.c)}`;
    }
  }).sort();
  return `badges:${item.lencana}:${kode.join(' ')}`;
}
