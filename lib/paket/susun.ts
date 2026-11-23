import { bangkitkan } from '../core/engine';
import type { Family, Label, Soal, Subtes } from '../core/types';
import { CHAPTERS, chapterById, JUMLAH_LATSOL, JUMLAH_TRYOUT, NAMA_SUBTES, type ChapterMapping } from '../data/chapters';

// Perakit tryout dan latsol (Mapping PCAM 10 OJK): 10 tryout berisi keempat subtes dan 5 latsol untuk setiap kelompok
// latsol (11 kelompok × 10 soal). Setiap slot diisi soal dari family chapter-nya; satu struktur soal (family + sidik) hanya
// dipakai SEKALI di seluruh paket, jadi tidak ada soal kembar antarpaket maupun di dalam paket.
//
// Soal satu chapter dibagi merata ke semua paket (lihat `bagiRata`): setiap paket mendapat campuran label SHL/VARIASI dan
// tingkat yang sebanding, huruf kunci di setiap bagian seimbang, dan tidak ada tiga kunci sama berturut-turut bila dapat
// dihindari. Soal Reading diambil satu bacaan utuh per paket.
//
// Paket hanya menyimpan uid soal (family@versi:seed); isi soal dibangkitkan ulang dari uid kapan saja.

/** Nama latsol per chapter (kolom "NAMA LATSOL" Mapping); PSJK memakai `kelompok` di chapters.ts. */
export const KELOMPOK_LATSOL: Record<string, string> = {
  'fill-shape-six-pointed-star': 'Soal Induktif - Fill Shape', 'fill-shape-square': 'Soal Induktif - Fill Shape',
  'fill-shape-inverted-pentagram': 'Soal Induktif - Fill Shape', 'fill-shape-triangle': 'Soal Induktif - Fill Shape',
  'drag-the-line-2': 'Soal Induktif - Drag the Line', 'drag-the-line-3': 'Soal Induktif - Drag the Line',
  'drag-the-line-4': 'Soal Induktif - Drag the Line', 'drag-the-line-special': 'Soal Induktif - Drag the Line',
  'calendar-date-selection': 'Soal Deduktif - Calendar Date Selection', 'room-allocations': 'Soal Deduktif - Room Allocations',
  'timeline-scheduling': 'Soal Deduktif - Timeline Scheduling', badges: 'Soal Deduktif - Badges', 'timeslot-scheduling': 'Soal Deduktif - Timeslot Scheduling',
  'sentence-completion': 'Soal Bahasa Inggris', 'sentence-improvement': 'Soal Bahasa Inggris', 'grammatically-correct-sentence': 'Soal Bahasa Inggris',
  'sentence-arrangement': 'Soal Bahasa Inggris', 'reading-comprehension': 'Soal Bahasa Inggris',
};

export const kelompokLatsol = (c: ChapterMapping) => KELOMPOK_LATSOL[c.id] ?? (c.kelompok ? `Soal Ke-OJK-an - ${c.kelompok}` : c.nama);

/** Durasi tryout per subtes (Mapping); latsol selalu 10 menit per kelompok. */
export const DURASI_TRYOUT: Record<Subtes, number> = { induktif: 18, deduktif: 18, 'bahasa-inggris': 15, sjk: 60 };
export const DURASI_LATSOL = 10;
const URUT_SUBTES: Subtes[] = ['induktif', 'deduktif', 'bahasa-inggris', 'sjk'];

export interface SlotPaket {
  chapterId: string;
  /** null = slot belum dapat diisi (chapter tanpa family atau kapasitas habis). */
  uid: string | null;
  familyId?: string;
  versi?: number;
  seed?: string;
  label?: Label;
  tingkat?: string;
  kunci?: string;
  /** Sidik struktur soal; pasangan family + sidik unik di seluruh paket. */
  sidik?: string;
  /** Kelompok bacaan (Reading): soal satu bacaan diletakkan berurutan. */
  bacaan?: string;
  alasan?: string;
}

export interface BagianPaket {
  subtes: Subtes;
  nama: string;
  menit: number;
  slot: SlotPaket[];
}

export interface Paket {
  id: string;
  jenis: 'tryout' | 'latsol' | 'set';
  nomor: number;
  nama: string;
  bagian: BagianPaket[];
}

export interface HasilSusun {
  dibuat: string;
  benih: string;
  paket: Paket[];
}

interface Calon {
  family: Family<any, any>;
  soal: Soal;
  kunciStruktur: string;
  bacaan?: string;
}

/** Kunci bacaan untuk soal Reading: judul + kalimat awal bacaan. */
function kunciBacaan(soal: Soal): string | undefined {
  const b = (soal.item as { bacaan?: { judul?: string; paragraf: string[] } }).bacaan;
  if (!b) return undefined;
  return `${b.judul ?? ''}|${(b.paragraf[0] ?? '').slice(0, 60)}`;
}

function tingkatSoal(soal: Soal): string | undefined {
  return (soal.item as { tingkat?: string }).tingkat;
}

/**
 * Kumpulkan calon soal berstruktur berbeda untuk satu chapter: family dirotasi (SHL dua kali lebih sering bila ada),
 * seed `${benih}|${chapter}|${i}`, berhenti setelah cukup struktur unik atau batas percobaan.
 */
/** Bobot tingkat yang diminta (mis. { dasar: 3, menengah: 5, menantang: 2 }); tanpa bobot = sebaran alami bank. */
export type BobotTingkat = Partial<Record<'dasar' | 'menengah' | 'menantang', number>>;

function kumpulkanCalon(c: ChapterMapping, fams: Family<any, any>[], butuh: number, benih: string, bobot?: BobotTingkat): Calon[] {
  // satu putaran: setiap family SHL dua kali dan setiap family VARIASI sekali, diselang-seling sebanding
  const shl = fams.filter((f) => f.label === 'SHL'), variasi = fams.filter((f) => f.label === 'VARIASI');
  const A = [...shl, ...shl], B = variasi;
  const urut: Family<any, any>[] = [];
  for (let ia = 0, ib = 0; ia + ib < A.length + B.length;) {
    if (ib < B.length && (ia >= A.length || (ib + 1) / B.length <= (ia + 1) / A.length)) urut.push(B[ib++]);
    else urut.push(A[ia++]);
  }
  let calon: Calon[] = [];
  const lihat = new Set<string>();
  // Reading: kumpulkan seluruh struktur supaya setiap paket dapat mengambil satu bacaan utuh
  let target = Math.ceil(butuh * 1.25) + 4;
  let batas = Math.max(200, butuh * 30);
  // Bobot tingkat hanya berlaku untuk chapter yang soalnya bertingkat (Badges, Bahasa Inggris, PSJK) dan bukan Reading
  // (satu bacaan harus diambil utuh). Kuota per tingkat = bagian kebutuhan + cadangan 25%; tingkat berbobot 0 dilewati.
  const W = bobot ? Object.values(bobot).reduce((a, b) => a + (b ?? 0), 0) : 0;
  let kuota: Map<string, number> | null = null;
  let periksaBobot = W > 0;
  const punya = new Map<string, number>();
  const kurang = () => !!kuota && [...kuota].some(([t, q]) => (punya.get(t) ?? 0) < q);
  for (let i = 0; i < batas && (kuota ? kurang() : calon.length < target); i++) {
    const f = urut[i % urut.length];
    let soal: Soal;
    try { soal = bangkitkan(f, `${benih}|${c.id}|${i}`); } catch { continue; }
    const k = `${f.id}|${soal.sidik}`;
    if (lihat.has(k)) continue;
    lihat.add(k);
    const bacaan = kunciBacaan(soal);
    if (bacaan) { target = Infinity; periksaBobot = false; }
    const t = tingkatSoal(soal);
    if (periksaBobot && !kuota && t) {
      kuota = new Map(Object.entries(bobot!).filter(([, w]) => (w ?? 0) > 0).map(([tk, w]) => [tk, Math.ceil((butuh * 1.25 * w!) / W) + 1]));
      batas = Math.max(batas, butuh * 80);
    }
    if (kuota && t) {
      if (!kuota.has(t) || (punya.get(t) ?? 0) >= kuota.get(t)!) continue;
      punya.set(t, (punya.get(t) ?? 0) + 1);
    }
    calon.push({ family: f, soal, kunciStruktur: k, bacaan });
  }
  if (kuota) {
    // urutkan supaya setiap awalan daftar mengikuti bobot (bagiRata membaca proporsi strata dari awal daftar)
    const ke = new Map<string, number>();
    const kunciUrut = calon.map((x) => {
      const t = tingkatSoal(x.soal) ?? '';
      const j = ke.get(t) ?? 0;
      ke.set(t, j + 1);
      return (j + 0.5) / ((bobot as Record<string, number>)[t] ?? 1);
    });
    calon = calon.map((x, i) => ({ x, k: kunciUrut[i], i })).sort((a, b) => a.k - b.k || a.i - b.i).map((y) => y.x);
  }
  return calon;
}

function slotDari(c: ChapterMapping, x: Calon): SlotPaket {
  return {
    chapterId: c.id, uid: x.soal.uid, familyId: x.family.id, versi: x.family.versi, seed: x.soal.seed, label: x.family.label,
    tingkat: tingkatSoal(x.soal), kunci: x.soal.kunci, sidik: x.soal.sidik, bacaan: x.bacaan,
  };
}

/** Ambil `n` calon untuk satu paket; soal Reading diambil satu bacaan utuh (berurutan) bila tersedia. */
function ambil(calon: Calon[], n: number): Calon[] {
  if (!n) return [];
  if (calon.some((x) => x.bacaan)) {
    const grup = new Map<string, Calon[]>();
    for (const x of calon) if (x.bacaan) grup.set(x.bacaan, [...(grup.get(x.bacaan) ?? []), x]);
    const cocok = [...grup.values()].filter((g) => g.length >= n).sort((a, b) => a.length - b.length)[0];
    if (cocok) {
      // soal satu bacaan berurutan sesuai `data.urutan` (mis. gagasan utama dulu, judul terakhir)
      const urutan = (x: Calon) => (x.soal.item as { data?: { urutan?: number } }).data?.urutan ?? 0;
      const pilih = [...cocok].sort((a, b) => urutan(a) - urutan(b)).slice(0, n);
      for (const x of pilih) calon.splice(calon.indexOf(x), 1);
      return pilih;
    }
  }
  // selang-seling label dan tingkat: ambil calon pertama yang labelnya berbeda dari pilihan sebelumnya bila ada
  const pilih: Calon[] = [];
  while (pilih.length < n && calon.length) {
    const terakhir = pilih[pilih.length - 1];
    let i = terakhir ? calon.findIndex((x) => x.family.id !== terakhir.family.id) : 0;
    if (i < 0) i = 0;
    pilih.push(calon.splice(i, 1)[0]);
  }
  return pilih;
}

/**
 * Bagi `pool` ke beberapa paket berukuran `ukuran` secara merata: slot diisi bergiliran antarpaket (putaran demi putaran),
 * dan setiap slot mengambil strata (label SHL/VARIASI + tingkat) yang paling kurang terwakili di paket itu dibanding
 * proporsinya di pool. Hasilnya setiap tryout/latsol mendapat campuran label dan tingkat yang sebanding, tidak menumpuk
 * di paket awal. Di dalam strata, dipilih family yang berbeda dari soal sebelumnya di paket yang sama bila ada.
 */
function bagiRata(calon: Calon[], ukuran: number[], riwayat: string[][], geser: number): Calon[][] {
  const total = ukuran.reduce((a, b) => a + b, 0);
  const strataDari = (x: Calon) => `${x.family.label}|${tingkatSoal(x.soal) ?? ''}`;
  // proporsi strata dari `total` calon pertama; sisa calon (cadangan ±25%) dipakai untuk menyeimbangkan huruf kunci
  const awal = new Map<string, number>();
  for (const x of calon.slice(0, total)) awal.set(strataDari(x), (awal.get(strataDari(x)) ?? 0) + 1);
  const strata = new Map<string, Calon[]>();
  for (const x of calon) if (awal.has(strataDari(x))) strata.set(strataDari(x), [...(strata.get(strataDari(x)) ?? []), x]);
  const hasil: Calon[][] = ukuran.map(() => []);
  const punya = ukuran.map(() => new Map<string, number>());
  const dipakai = new Map<string, number>();
  const N = Math.min(total, calon.length);
  let terisi = 0;
  const P = ukuran.length;
  for (let r = 0; r < Math.max(0, ...ukuran); r++) {
    // urutan paket digeser per chapter supaya paket pertama tidak selalu mendapat pilihan pertama
    for (let q = 0; q < P; q++) {
      const p = (q + geser) % P;
      if (r >= ukuran[p]) continue;
      let pilihan: string | null = null, defisit = -Infinity;
      for (const [k, sisa] of strata) {
        if (!sisa.length) continue;
        // kekurangan strata di paket ini + kekurangan strata di seluruh chapter (paket ber-slot satu tetap bergiliran)
        const dPaket = ((hasil[p].length + 1) * awal.get(k)!) / N - (punya[p].get(k) ?? 0);
        const dGlobal = ((terisi + 1) * awal.get(k)!) / N - (dipakai.get(k) ?? 0);
        const d = dPaket + dGlobal;
        if (d > defisit + 1e-9) { defisit = d; pilihan = k; }
      }
      if (!pilihan) continue;
      const daftar = strata.get(pilihan)!;
      const huruf = [...riwayat[p], ...hasil[p].map((x) => x.soal.kunci)];
      const akhir = hasil[p][hasil[p].length - 1];
      const hitung = (h: string) => huruf.filter((y) => y === h).length;
      // skor kecil = lebih baik: family berbeda dari soal sebelumnya, tidak membuat tiga kunci sama beruntun, huruf yang jarang
      const skor = (x: Calon) => {
        const h = x.soal.kunci;
        const huruf1 = /^[A-E]$/.test(h);
        return (akhir && x.family.id === akhir.family.id ? 100 : 0)
          + (huruf1 && huruf.length >= 2 && huruf[huruf.length - 1] === h && huruf[huruf.length - 2] === h ? 50 : 0)
          + (huruf1 ? hitung(h) : 0);
      };
      let i = 0;
      for (let j = 1; j < daftar.length; j++) if (skor(daftar[j]) < skor(daftar[i])) i = j;
      hasil[p].push(daftar.splice(i, 1)[0]);
      punya[p].set(pilihan, (punya[p].get(pilihan) ?? 0) + 1);
      dipakai.set(pilihan, (dipakai.get(pilihan) ?? 0) + 1);
      terisi++;
    }
  }
  return hasil;
}

const hurufKunci = (s?: SlotPaket) => (s?.kunci && /^[A-E]$/.test(s.kunci) ? s.kunci : undefined);

/** Apakah slot ke-i berada dalam deret tiga kunci sama bila kuncinya `h`. */
function membuatDeret(slot: SlotPaket[], i: number, h: string | undefined): boolean {
  if (!h) return false;
  const k = (j: number) => (j === i ? h : hurufKunci(slot[j]));
  for (let a = i - 2; a <= i; a++) if (a >= 0 && a + 2 < slot.length && k(a) === h && k(a + 1) === h && k(a + 2) === h) return true;
  return false;
}

const normal = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim();
/** Kunci dan batang soal pilihan ganda (dinormalkan); null untuk soal interaktif dan soal Reading. */
function teksPg(s: Soal | undefined): { kunci: string; batang: string } | null {
  const it = s?.item as { jenis?: string; bacaan?: unknown; pertanyaan?: string; stimulus?: { teks?: string }[]; opsi?: { label: string; teks: string }[] } | undefined;
  if (!s || it?.jenis !== 'pilihan-ganda' || it.bacaan) return null;
  return { kunci: normal(it.opsi?.find((o) => o.label === s.jawaban)?.teks ?? ''), batang: normal([it.pertanyaan ?? '', ...(it.stimulus ?? []).map((x) => x.teks ?? '')].join(' ')) };
}
/**
 * QC F03: dua soal satu paket saling membocorkan bila kunci yang satu (sedikitnya dua kata) muncul di batang soal yang lain,
 * mis. "Risiko operasional adalah ...." dan "Risiko akibat kegagalan proses internal ... disebut ...." (kunci: risiko operasional).
 */
export function salingBocor(a: Soal | undefined, b: Soal | undefined): boolean {
  const x = teksPg(a), y = teksPg(b);
  if (!x || !y) return false;
  const muat = (k: string, t: string) => k.split(' ').length >= 2 && k.length >= 10 && t.includes(k);
  return muat(x.kunci, y.batang) || muat(y.kunci, x.batang);
}

/**
 * Pisahkan pasangan soal yang saling membocorkan di dalam satu paket: tukar salah satunya dengan slot chapter, label, dan
 * tingkat yang sama di paket lain sekelompok, tanpa menimbulkan kebocoran atau deret tiga kunci baru.
 */
function pisahkanBocor(kelompok: Paket[], soal: Map<string, Soal>, cadangan: Map<string, Calon[]>) {
  const ambil = (x: SlotPaket) => (x.uid ? soal.get(x.uid) : undefined);
  const bocorDi = (p: Paket, s: SlotPaket, kecuali?: SlotPaket) =>
    p.bagian.some((b) => b.slot.some((t) => t !== s && t !== kecuali && salingBocor(ambil(s), ambil(t))));
  for (const p of kelompok) {
    for (const b of p.bagian) {
      for (let i = 0; i < b.slot.length; i++) {
        const a = b.slot[i];
        if (!a.uid || a.bacaan || !bocorDi(p, a)) continue;
        // coba dulu pasangan bertingkat sama (keseimbangan tetap), lalu boleh beda tingkat bila itu satu-satunya jalan
        let beres = false;
        cari: for (const tingkatSama of [true, false]) {
          for (const q of kelompok) {
            if (q === p) continue;
            const bq = q.bagian.find((x) => x.subtes === b.subtes);
            if (!bq) continue;
            for (let j = 0; j < bq.slot.length; j++) {
              const c = bq.slot[j];
              if (!c.uid || c.bacaan || c.chapterId !== a.chapterId || c.label !== a.label || (tingkatSama && c.tingkat !== a.tingkat)) continue;
              if (membuatDeret(b.slot, i, hurufKunci(c)) || membuatDeret(bq.slot, j, hurufKunci(a))) continue;
              if (bocorDi(p, c, a) || bocorDi(q, a, c)) continue;
              [b.slot[i], bq.slot[j]] = [c, a];
              beres = true;
              break cari;
            }
          }
        }
        if (beres) continue;
        // tanpa pasangan tukar (mis. hanya satu atau dua paket): ganti dengan calon cadangan chapter yang sama yang belum terpakai
        const sisa = cadangan.get(a.chapterId) ?? [];
        const urut = [...sisa].sort((x, y) => Number(x.family.label !== a.label) - Number(y.family.label !== a.label) || Number(tingkatSoal(x.soal) !== a.tingkat) - Number(tingkatSoal(y.soal) !== a.tingkat));
        for (const x of urut) {
          if (x.bacaan) continue;
          const baru = slotDari(chapterById(a.chapterId), x);
          soal.set(x.soal.uid, x.soal);
          if (membuatDeret(b.slot, i, hurufKunci(baru)) || bocorDi(p, baru, a)) continue;
          b.slot[i] = baru;
          sisa.splice(sisa.indexOf(x), 1);
          break;
        }
      }
    }
  }
}

/** Jumlah pasangan soal yang saling membocorkan di dalam paket (untuk laporan pemeriksaan; harus 0 bila dapat dihindari). */
export function hitungBocor(h: HasilSusun, soal: (s: SlotPaket) => Soal | undefined): number {
  let n = 0;
  for (const p of h.paket) {
    const isi = p.bagian.flatMap((b) => b.slot).filter((x) => x.uid && !x.bacaan);
    for (let i = 0; i < isi.length; i++) for (let j = i + 1; j < isi.length; j++) if (salingBocor(soal(isi[i]), soal(isi[j]))) n++;
  }
  return n;
}

/**
 * Penyeimbangan akhir antarpaket sekelompok (mis. 10 tryout): tukar dua slot dari chapter yang sama di dua paket supaya
 * jumlah soal SHL, soal menantang, dan soal dasar per bagian berselisih paling banyak satu, lalu pecah deret tiga kunci
 * sama. Penukaran menjaga sifat lain tetap (label atau tingkat sama) dan tidak membuat deret kunci baru. Jumlah soal per
 * chapter dan keunikan struktur tidak berubah karena hanya posisi slot yang berpindah paket. Soal Reading tidak ditukar.
 */
function seimbangkan(kelompok: Paket[]) {
  if (kelompok.length < 2) return;
  for (const st of URUT_SUBTES) {
    const bag = kelompok.map((p) => p.bagian.find((b) => b.subtes === st)).filter((b): b is BagianPaket => !!b);
    if (bag.length < 2) continue;
    const dapat = (a: SlotPaket) => !!a.uid && !a.bacaan;
    const tukarAman = (x: BagianPaket, i: number, y: BagianPaket, j: number) =>
      !membuatDeret(x.slot, i, hurufKunci(y.slot[j])) && !membuatDeret(y.slot, j, hurufKunci(x.slot[i]));
    const tukar = (x: BagianPaket, i: number, y: BagianPaket, j: number) => { [x.slot[i], y.slot[j]] = [y.slot[j], x.slot[i]]; };
    const ciri: { punya: (s: SlotPaket) => boolean; pasangan: (a: SlotPaket, b: SlotPaket) => boolean }[] = [
      { punya: (s) => s.label === 'SHL', pasangan: (a, b) => b.label !== 'SHL' && a.tingkat === b.tingkat },
      { punya: (s) => s.tingkat === 'menantang', pasangan: (a, b) => b.tingkat === 'menengah' && a.label === b.label },
      { punya: (s) => s.tingkat === 'dasar', pasangan: (a, b) => b.tingkat === 'menengah' && a.label === b.label },
    ];
    for (const { punya, pasangan } of ciri) {
      for (let langkah = 0; langkah < 300; langkah++) {
        // hitungan mencakup soal Reading (tidak dapat ditukar) supaya bagian lain mengimbanginya
        const n = bag.map((b) => b.slot.filter((s) => !!s.uid && punya(s)).length);
        const urut = n.map((v, i) => i).sort((a, b) => n[b] - n[a]);
        let berhasil = false;
        // coba pasangan paket dari yang paling timpang: banyak → sedikit
        for (let u = 0; u < urut.length && !berhasil; u++) {
          for (let w = urut.length - 1; w > u && !berhasil; w--) {
            const hi = bag[urut[u]], lo = bag[urut[w]];
            if (n[urut[u]] - n[urut[w]] <= 1) break;
            for (let i = 0; i < hi.slot.length && !berhasil; i++) {
              const a = hi.slot[i];
              if (!dapat(a) || !punya(a)) continue;
              for (let j = 0; j < lo.slot.length; j++) {
                const b = lo.slot[j];
                if (!dapat(b) || b.chapterId !== a.chapterId || punya(b) || !pasangan(a, b) || !tukarAman(hi, i, lo, j)) continue;
                tukar(hi, i, lo, j); berhasil = true; break;
              }
            }
          }
        }
        if (!berhasil) break;
      }
    }
    // pecah deret tiga kunci sama: tukar slot tengah dengan slot chapter yang sama (label dan tingkat sama) di paket lain
    for (const x of bag) {
      for (let i = 1; i + 1 < x.slot.length; i++) {
        const h = hurufKunci(x.slot[i]);
        if (!h || !dapat(x.slot[i]) || !membuatDeret(x.slot, i, h)) continue;
        cari: for (const y of bag) {
          if (y === x) continue;
          for (let j = 0; j < y.slot.length; j++) {
            const a = x.slot[i], b = y.slot[j];
            if (!dapat(b) || b.chapterId !== a.chapterId || b.label !== a.label || b.tingkat !== a.tingkat || hurufKunci(b) === h) continue;
            if (!tukarAman(x, i, y, j)) continue;
            tukar(x, i, y, j); break cari;
          }
        }
      }
    }
  }
}

/** Rencana satu paket: bagian per subtes dan jumlah soal setiap chapter di bagian itu. */
export interface RencanaPaket {
  id: string;
  jenis: 'tryout' | 'latsol' | 'set';
  nomor: number;
  nama: string;
  bagian: { subtes: Subtes; nama: string; menit: number; isi: Record<string, number> }[];
}

/** Kemajuan penyusunan, dilaporkan setelah setiap chapter selesai dibagi. */
export interface KemajuanSusun { selesai: number; total: number; chapter: string }

/**
 * Susun paket dari rencana: setiap chapter dibagi ke paket yang memintanya (urutan rencana), lalu setiap kelompok di
 * `seimbang` (indeks paket) diseimbangkan. Satu struktur soal tidak dipakai dua kali di seluruh rencana. Berupa generator
 * supaya halaman Paket dapat memperbarui bilah kemajuan di antara chapter; `susunDariRencana` menjalankannya sekaligus.
 */
export function* langkahSusun(families: Family<any, any>[], rencana: RencanaPaket[], seimbang: number[][], benih: string, bobot?: BobotTingkat): Generator<KemajuanSusun, HasilSusun> {
  const paket: Paket[] = rencana.map((r) => ({
    id: r.id, jenis: r.jenis, nomor: r.nomor, nama: r.nama,
    bagian: r.bagian.map((b) => ({ subtes: b.subtes, nama: b.nama, menit: b.menit, slot: [] as SlotPaket[] })),
  }));
  const dipakai = CHAPTERS.filter((c) => rencana.some((r) => r.bagian.some((b) => b.subtes === c.subtes && (b.isi[c.id] ?? 0) > 0)));
  const terpilih = new Map<string, Soal>();
  /** Calon yang tidak terpakai per chapter: cadangan pengganti soal yang saling membocorkan. */
  const cadangan = new Map<string, Calon[]>();
  let selesai = 0;
  for (const c of dipakai) {
    const fams = families.filter((f) => f.chapter.id === c.id);
    const sasaran = rencana
      .map((r, i) => ({ p: paket[i], n: r.bagian.find((b) => b.subtes === c.subtes)?.isi[c.id] ?? 0 }))
      .filter((s) => s.n > 0);
    const butuh = sasaran.reduce((a, s) => a + s.n, 0);
    const calon = fams.length ? kumpulkanCalon(c, fams, butuh, benih, bobot) : [];
    const tulis = (p: Paket, n: number, pilih: Calon[]) => {
      const bag = p.bagian.find((b) => b.subtes === c.subtes)!;
      for (const x of pilih) { bag.slot.push(slotDari(c, x)); terpilih.set(x.soal.uid, x.soal); }
      for (let i = pilih.length; i < n; i++) bag.slot.push({ chapterId: c.id, uid: null, alasan: fams.length ? 'kapasitas struktur habis' : c.catatan ?? 'belum ada family' });
    };
    if (calon.some((x) => x.bacaan)) {
      // Reading: setiap paket mengambil satu bacaan utuh
      for (const { p, n } of sasaran) tulis(p, n, ambil(calon, n));
    } else {
      const riwayat = sasaran.map(({ p }) => p.bagian.find((b) => b.subtes === c.subtes)!.slot.map((s) => s.kunci ?? ''));
      const bagian = bagiRata(calon, sasaran.map((s) => s.n), riwayat, CHAPTERS.indexOf(c) * 7);
      sasaran.forEach(({ p, n }, k) => tulis(p, n, bagian[k]));
    }
    cadangan.set(c.id, calon.filter((x) => !terpilih.has(x.soal.uid)));
    yield { selesai: ++selesai, total: dipakai.length, chapter: c.nama };
  }
  for (const k of seimbang) { seimbangkan(k.map((i) => paket[i])); pisahkanBocor(k.map((i) => paket[i]), terpilih, cadangan); }
  return { dibuat: new Date().toISOString().slice(0, 10), benih, paket };
}

export function susunDariRencana(families: Family<any, any>[], rencana: RencanaPaket[], seimbang: number[][], benih: string): HasilSusun {
  const g = langkahSusun(families, rencana, seimbang, benih);
  for (;;) {
    const r = g.next();
    if (r.done) return r.value;
  }
}

/** Komposisi baku Mapping: soal per chapter untuk satu tryout (`perTryout`) atau satu latsol (`perLatsol`). */
export function komposisiBaku(jenis: 'tryout' | 'latsol'): Record<string, number> {
  return Object.fromEntries(CHAPTERS.map((c) => [c.id, jenis === 'tryout' ? c.perTryout : c.perLatsol]));
}

/** Rencana `jumlah` tryout dengan subtes dan komposisi tertentu. */
export function rencanaTryout(jumlah: number, komposisi: Record<string, number>, subtes: Subtes[] = URUT_SUBTES): RencanaPaket[] {
  return Array.from({ length: jumlah }, (_, i) => ({
    id: `TO-${String(i + 1).padStart(2, '0')}`, jenis: 'tryout' as const, nomor: i + 1, nama: `Tryout ${i + 1}`,
    bagian: URUT_SUBTES.filter((st) => subtes.includes(st)).map((st) => ({
      subtes: st, nama: NAMA_SUBTES[st], menit: DURASI_TRYOUT[st],
      isi: Object.fromEntries(CHAPTERS.filter((c) => c.subtes === st).map((c) => [c.id, komposisi[c.id] ?? 0])),
    })),
  }));
}

/** Kelompok latsol dalam urutan Mapping. */
export const KELOMPOK_LATSOL_URUT = [...new Set(CHAPTERS.filter((c) => c.perLatsol > 0).map(kelompokLatsol))];

/** Rencana `jumlah` latsol untuk satu kelompok. */
export function rencanaLatsol(kelompok: string, jumlah: number, komposisi: Record<string, number>): RencanaPaket[] {
  const chapters = CHAPTERS.filter((c) => kelompokLatsol(c) === kelompok);
  const st = chapters[0].subtes;
  const slug = kelompok.replace(/^Soal /, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return Array.from({ length: jumlah }, (_, i) => ({
    id: `LS-${String(i + 1).padStart(2, '0')}-${slug}`, jenis: 'latsol' as const, nomor: i + 1, nama: `Latsol ${i + 1} · ${kelompok}`,
    bagian: [{ subtes: st, nama: NAMA_SUBTES[st], menit: DURASI_LATSOL, isi: Object.fromEntries(chapters.map((c) => [c.id, komposisi[c.id] ?? 0])) }],
  }));
}

/** Rencana `jumlah` set bebas (mode Per Chapter): materi = chapter dan jumlah soal per set; durasi sebanding tryout. */
export function rencanaSet(jumlah: number, materi: { chapterId: string; n: number }[]): RencanaPaket[] {
  const soalTryout = (st: Subtes) => CHAPTERS.filter((c) => c.subtes === st).reduce((a, c) => a + c.perTryout, 0);
  const subtes = URUT_SUBTES.filter((st) => materi.some((m) => m.n > 0 && CHAPTERS.find((c) => c.id === m.chapterId)?.subtes === st));
  return Array.from({ length: jumlah }, (_, i) => ({
    id: `SET-${String(i + 1).padStart(2, '0')}`, jenis: 'set' as const, nomor: i + 1, nama: `Set ${i + 1}`,
    bagian: subtes.map((st) => {
      const isi: Record<string, number> = {};
      for (const m of materi) if (m.n > 0 && CHAPTERS.find((c) => c.id === m.chapterId)?.subtes === st) isi[m.chapterId] = (isi[m.chapterId] ?? 0) + m.n;
      const n = Object.values(isi).reduce((a, b) => a + b, 0);
      return { subtes: st, nama: NAMA_SUBTES[st], menit: Math.max(1, Math.round((n * DURASI_TRYOUT[st]) / Math.max(1, soalTryout(st)))), isi };
    }),
  }));
}

/** Susun seluruh tryout dan latsol resmi (Mapping). `families` biasanya FAMILIES dari registry. */
export function susunPaket(families: Family<any, any>[], benih = 'pcam-10'): HasilSusun {
  const tryout = rencanaTryout(JUMLAH_TRYOUT, komposisiBaku('tryout'));
  const latsol = KELOMPOK_LATSOL_URUT.flatMap((k) => rencanaLatsol(k, JUMLAH_LATSOL, komposisiBaku('latsol')));
  const urutan = (dari: number, n: number) => Array.from({ length: n }, (_, i) => dari + i);
  const seimbang = [urutan(0, tryout.length), ...KELOMPOK_LATSOL_URUT.map((_, k) => urutan(tryout.length + k * JUMLAH_LATSOL, JUMLAH_LATSOL))];
  return susunDariRencana(families, [...tryout, ...latsol], seimbang, benih);
}

/** Ringkasan untuk laporan: jumlah slot terisi, kosong per chapter, dan struktur yang terpakai lebih dari sekali (harus 0). */
export function ringkasPaket(h: HasilSusun) {
  const semua = h.paket.flatMap((p) => p.bagian.flatMap((b) => b.slot));
  const terisi = semua.filter((s) => s.uid);
  const pakai = new Map<string, number>();
  for (const s of terisi) pakai.set(`${s.familyId}|${s.sidik}`, (pakai.get(`${s.familyId}|${s.sidik}`) ?? 0) + 1);
  const kosongPerChapter: Record<string, number> = {};
  for (const s of semua) if (!s.uid) kosongPerChapter[s.chapterId] = (kosongPerChapter[s.chapterId] ?? 0) + 1;
  return { slot: semua.length, terisi: terisi.length, kosong: semua.length - terisi.length, kosongPerChapter, kembar: [...pakai.values()].filter((n) => n > 1).length };
}
