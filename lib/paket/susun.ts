import { bangkitkan } from '../core/engine';
import type { Family, Label, Soal, Subtes } from '../core/types';
import { CHAPTERS, JUMLAH_LATSOL, JUMLAH_TRYOUT, NAMA_SUBTES, type ChapterMapping } from '../data/chapters';

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
  jenis: 'tryout' | 'latsol';
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
function kumpulkanCalon(c: ChapterMapping, fams: Family<any, any>[], butuh: number, benih: string): Calon[] {
  // satu putaran: setiap family SHL dua kali dan setiap family VARIASI sekali, diselang-seling sebanding
  const shl = fams.filter((f) => f.label === 'SHL'), variasi = fams.filter((f) => f.label === 'VARIASI');
  const A = [...shl, ...shl], B = variasi;
  const urut: Family<any, any>[] = [];
  for (let ia = 0, ib = 0; ia + ib < A.length + B.length;) {
    if (ib < B.length && (ia >= A.length || (ib + 1) / B.length <= (ia + 1) / A.length)) urut.push(B[ib++]);
    else urut.push(A[ia++]);
  }
  const calon: Calon[] = [];
  const lihat = new Set<string>();
  // Reading: kumpulkan seluruh struktur supaya setiap paket dapat mengambil satu bacaan utuh
  let target = Math.ceil(butuh * 1.25) + 4;
  const batas = Math.max(200, butuh * 30);
  for (let i = 0; i < batas && calon.length < target; i++) {
    const f = urut[i % urut.length];
    let soal: Soal;
    try { soal = bangkitkan(f, `${benih}|${c.id}|${i}`); } catch { continue; }
    const k = `${f.id}|${soal.sidik}`;
    if (lihat.has(k)) continue;
    lihat.add(k);
    const bacaan = kunciBacaan(soal);
    if (bacaan) target = Infinity;
    calon.push({ family: f, soal, kunciStruktur: k, bacaan });
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

/** Susun seluruh tryout dan latsol. `families` biasanya FAMILIES dari registry. */
export function susunPaket(families: Family<any, any>[], benih = 'pcam-10'): HasilSusun {
  const tryout: Paket[] = Array.from({ length: JUMLAH_TRYOUT }, (_, i) => ({
    id: `TO-${String(i + 1).padStart(2, '0')}`, jenis: 'tryout' as const, nomor: i + 1, nama: `Tryout ${i + 1}`,
    bagian: URUT_SUBTES.map((st) => ({ subtes: st, nama: NAMA_SUBTES[st], menit: DURASI_TRYOUT[st], slot: [] as SlotPaket[] })),
  }));
  const kelompok = [...new Set(CHAPTERS.filter((c) => c.perLatsol > 0).map(kelompokLatsol))];
  const latsol: Paket[] = [];
  for (const k of kelompok) {
    const st = CHAPTERS.find((c) => kelompokLatsol(c) === k)!.subtes;
    for (let n = 1; n <= JUMLAH_LATSOL; n++) {
      latsol.push({
        id: `LS-${String(n).padStart(2, '0')}-${k.replace(/^Soal /, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, jenis: 'latsol', nomor: n, nama: `Latsol ${n} · ${k}`,
        bagian: [{ subtes: st, nama: NAMA_SUBTES[st], menit: DURASI_LATSOL, slot: [] }],
      });
    }
  }

  for (const c of CHAPTERS) {
    const fams = families.filter((f) => f.chapter.id === c.id);
    const butuh = c.perTryout * JUMLAH_TRYOUT + c.perLatsol * JUMLAH_LATSOL;
    const calon = fams.length ? kumpulkanCalon(c, fams, butuh, benih) : [];
    const sasaran = [
      ...tryout.map((p) => ({ p, n: c.perTryout })),
      ...latsol.filter((x) => kelompokLatsol(c) === x.nama.replace(/^Latsol \d+ · /, '')).map((p) => ({ p, n: c.perLatsol })),
    ].filter((s) => s.n > 0);
    const tulis = (p: Paket, n: number, pilih: Calon[]) => {
      const bag = p.bagian.find((b) => b.subtes === c.subtes)!;
      for (const x of pilih) bag.slot.push(slotDari(c, x));
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
  }
  seimbangkan(tryout);
  for (const k of kelompok) seimbangkan(latsol.filter((p) => p.nama.endsWith(`· ${k}`)));
  return { dibuat: new Date().toISOString().slice(0, 10), benih, paket: [...tryout, ...latsol] };
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
