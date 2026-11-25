import { JARI_JARI, kelasUtama, type DragLineItem, type Simpul } from '../induktif/drag-line/pola';
import { LUBANG, geserBerikut, hasilOperasi, hitungLubang, nilaiArah, karakterSama } from '../induktif/drag-line/aturan';
import { C, dokumen, garis, kotak, n2, teks, type GambarPembahasan } from './alat';

// Visual pembahasan Drag the Line (QC 2 R02, QC 1 T04): papan dengan awalan terkunci dan jalur akhir bernomor, lalu tabel
// sambungan yang menyorot karakter penentu. Simpul berkode sama dibedakan dengan label bantu dan letaknya.

const SAT = 62, TEPI = 14, KEPALA = 26;

const letak = (s: Simpul, it: DragLineItem) => {
  const h = s.x < it.lebar / 3 ? 'kiri' : s.x > (2 * it.lebar) / 3 ? 'kanan' : 'tengah';
  const v = s.y < it.tinggi / 3 ? 'atas' : s.y > (2 * it.tinggi) / 3 ? 'bawah' : 'tengah';
  return h === 'tengah' && v === 'tengah' ? 'tengah' : h === 'tengah' ? `${v} tengah` : v === 'tengah' ? `tengah ${h}` : `${h} ${v}`;
};

/** Label bantu simpul berkode kembar: OOO (a), OOO (b), … menurut urutan jalur. */
function labelBantu(item: DragLineItem, jawaban: string[]): Map<string, string> {
  const per = new Map<string, string[]>();
  for (const id of jawaban) { const k = item.simpul.find((s) => s.id === id)!.kode; per.set(k, [...(per.get(k) ?? []), id]); }
  const m = new Map<string, string>();
  for (const ids of per.values()) if (ids.length > 1) ids.forEach((id, i) => m.set(id, 'abcdefgh'[i]));
  return m;
}

function jarakRuas(x: number, y: number, a: Simpul, b: Simpul, px: (n: number) => number, py: (n: number) => number): number {
  const ax = px(a.x), ay = py(a.y), dx = px(b.x) - ax, dy = py(b.y) - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - ax - t * dx, y - ay - t * dy);
}

function papan(item: DragLineItem, jawaban: string[]): GambarPembahasan {
  const S = new Map(item.simpul.map((s) => [s.id, s]));
  const bantu = labelBantu(item, jawaban);
  const px = (x: number) => TEPI + x * SAT, py = (y: number) => KEPALA + y * SAT;
  const W = 2 * TEPI + item.lebar * SAT, T = KEPALA + item.tinggi * SAT + 34;
  let s = teks(TEPI, 18, 'Garis hitam putus-putus = awalan yang dikunci; garis biru = jalur yang dilanjutkan; angka = urutan simpul.', { ukuran: 11 });
  s += kotak(TEPI, KEPALA, item.lebar * SAT, item.tinggi * SAT, { isi: '#fafbfe', garis: C.garis, sudut: 8 });
  for (let i = 0; i + 1 < jawaban.length; i++) {
    const a = S.get(jawaban[i])!, b = S.get(jawaban[i + 1])!;
    const d = Math.hypot(b.x - a.x, b.y - a.y), ux = (b.x - a.x) / d, uy = (b.y - a.y) / d;
    const kunci = i < item.awalan.length - 1;
    s += garis(px(a.x + ux * JARI_JARI), py(a.y + uy * JARI_JARI), px(b.x - ux * (JARI_JARI + 0.04)), py(b.y - uy * (JARI_JARI + 0.04)), kunci ? C.tinta : C.biru, kunci ? 3 : 2.6, { panah: true, ...(kunci ? { putus: '7 4' } : {}) });
  }
  item.simpul.forEach((q) => {
    const no = jawaban.indexOf(q.id) + 1;
    const kunci = item.awalan.includes(q.id);
    const x = px(q.x), y = py(q.y), r = JARI_JARI * SAT;
    s += `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r)}" fill="${kunci ? '#e5e7eb' : '#ffffff'}" stroke="${kunci ? C.tinta : C.biru}" stroke-width="${kunci ? 2.6 : 2}"/>`;
    s += teks(x, y + 5, q.kode, { ukuran: q.kode.length > 4 ? 13 : 16, tebal: true, rata: 'middle', warna: C.tinta });
    s += `<circle cx="${n2(x + r * 0.82)}" cy="${n2(y - r * 0.82)}" r="10" fill="${kunci ? C.tinta : C.biru}"/>${teks(x + r * 0.82, y - r * 0.82 + 4, String(no), { ukuran: 11, tebal: true, rata: 'middle', warna: '#ffffff' })}`;
    if (bantu.has(q.id)) {
      // label bantu di bawah atau di atas simpul, pilih sisi yang lebih jauh dari garis jalur
      const jarakGaris = (yy: number) => Math.min(...jawaban.slice(1).map((id, i) => jarakRuas(x, yy, S.get(jawaban[i])!, S.get(id)!, px, py)));
      const yy = jarakGaris(y + r + 10) >= jarakGaris(y - r - 10) ? y + r + 14 : y - r - 7;
      s += teks(x, yy, `${q.kode} (${bantu.get(q.id)}) · ${letak(q, item)}`, { ukuran: 10, rata: 'middle', tebal: true, warna: C.oranye, halo: true });
    }
  });
  const urut = jawaban.map((id) => { const q = S.get(id)!; return bantu.has(id) ? `${q.kode} (${bantu.get(id)})` : q.kode; });
  s += teks(TEPI, KEPALA + item.tinggi * SAT + 22, `Urutan: ${urut.join(' → ')}`, { ukuran: 12, tebal: true });
  return { id: 'jalur', judul: 'Jalur jawaban pada papan', alt: `Jalur jawaban: ${urut.join(' → ')}. Awalan yang dikunci: ${urut.slice(0, item.awalan.length).join(' → ')}.`, lebar: Math.ceil(W), tinggi: Math.ceil(T), svg: dokumen(W, T, s, 'Jalur jawaban pada papan') };
}

type Sorot = { huruf: number[]; warna: string };
const PETAK = 22;

/** Kode sebagai petak karakter; petak yang disorot diberi latar, garis tebal, dan garis bawah (bukan warna saja). */
function petak(x: number, y: number, kode: string, sorot: Sorot[]): string {
  let s = '';
  [...kode].forEach((c, i) => {
    const k = sorot.find((q) => q.huruf.includes(i));
    s += kotak(x + i * PETAK, y, PETAK, 26, { isi: k ? k.warna : '#ffffff', garis: k ? C.tinta : C.garis, tebal: k ? 2 : 1 });
    s += teks(x + i * PETAK + PETAK / 2, y + 18, c, { ukuran: 15, tebal: true, rata: 'middle', mono: true, warna: C.tinta });
    if (k) s += garis(x + i * PETAK + 4, y + 30, x + i * PETAK + PETAK - 4, y + 30, C.tinta, 2);
  });
  return s;
}

const POSISI = (L: number, i: number) => (L === 3 ? ['kiri', 'tengah', 'kanan'][i] : `ke-${i + 1}`);

/** Sorotan dan keterangan satu sambungan menurut aturan utama. */
function sambungan(kelas: string, a: string, b: string, semua: string[]): { sa: Sorot[]; sb: Sorot[]; ket: string } {
  const kuning = C.oranyeMuda, biru = C.biruMuda;
  const semuaIdx = (k: string) => [...k].map((_, i) => i);
  switch (kelas) {
    case 'berbagi': {
      const c = karakterSama(a, b)[0];
      return { sa: [{ huruf: [a.indexOf(c)], warna: kuning }], sb: [{ huruf: [b.indexOf(c)], warna: kuning }], ket: `karakter yang sama: ${c}` };
    }
    case 'akhir-awal':
      return { sa: [{ huruf: [a.length - 1], warna: kuning }], sb: [{ huruf: [0], warna: kuning }], ket: `akhir ${a[a.length - 1]} = awal ${b[0]}` };
    case 'simbol': {
      const i = [...a].findIndex((c, k) => c !== b[k]);
      return { sa: [{ huruf: [i], warna: kuning }], sb: [{ huruf: [i], warna: kuning }], ket: `posisi ${POSISI(a.length, i)} berganti: ${a[i]} menjadi ${b[i]}` };
    }
    case 'rotasi': {
      const L = a.length;
      let n = 1;
      while (n < L && a.slice(n) + a.slice(0, n) !== b) n++;
      return { sa: [{ huruf: semuaIdx(a).slice(0, n), warna: kuning }], sb: [{ huruf: semuaIdx(b).slice(L - n), warna: kuning }], ket: `${a.slice(0, n)} pindah dari kiri ke ujung kanan` };
    }
    case 'geser': {
      const d = Number(a[2]) - Number(a[0]);
      return { sa: [{ huruf: [0, 2], warna: biru }, { huruf: [1], warna: kuning }], sb: [{ huruf: [1], warna: kuning }], ket: `${a[2]} − ${a[0]} = ${d > 0 ? `+${d}` : d < 0 ? `−${-d}` : '0'}; ${a[1]} menjadi ${geserBerikut(a)}` };
    }
    case 'hitung': {
      const h = hasilOperasi(a);
      const p = /^\d+/.exec(b)?.[0].length ?? 0;
      return { sa: [{ huruf: semuaIdx(a), warna: biru }], sb: [{ huruf: semuaIdx(b).slice(0, p), warna: kuning }], ket: `${a} = ${h}, menjadi angka awal berikutnya` };
    }
    case 'arah': {
      const m = /^(\d+)([<>]+)$/.exec(a)!;
      const v = nilaiArah(m[2]);
      const p = /^\d+/.exec(b)?.[0].length ?? 0;
      return { sa: [{ huruf: semuaIdx(a).slice(m[1].length), warna: biru }], sb: [{ huruf: semuaIdx(b).slice(0, p), warna: kuning }], ket: `${m[2]} = ${v > 0 ? 'tambah' : 'kurang'} ${Math.abs(v)}; ${m[1]} ${v > 0 ? '+' : '−'} ${Math.abs(v)} = ${Number(m[1]) + v}` };
    }
    case 'lubang': {
      const t = (k: string) => [...k].flatMap((c, i) => (LUBANG[c] ? [i] : []));
      return { sa: [{ huruf: t(a), warna: kuning }], sb: [{ huruf: t(b), warna: kuning }], ket: `ruang tertutup ${hitungLubang(a)} → ${hitungLubang(b)} (${[...b].filter((c) => LUBANG[c]).map((c) => `${c} ${LUBANG[c]}`).join(', ') || 'tidak ada'})` };
    }
    case 'biner': {
      const [x, y] = [...new Set(semua.join(''))].sort();
      for (const [nol, satu] of [[x, y], [y, x]]) {
        const v = (k: string) => parseInt([...k].map((c) => (c === satu ? '1' : '0')).join(''), 2);
        const d = v(semua[1]) - v(semua[0]);
        if (d && semua.slice(1).every((k, i) => v(k) - v(semua[i]) === d)) return { sa: [], sb: [], ket: `${satu} = 1, ${nol} = 0: nilai ${v(a)} → ${v(b)}` };
      }
      return { sa: [], sb: [], ket: '' };
    }
    default: return { sa: [], sb: [], ket: '' };
  }
}

function tabelSambungan(kelas: string, item: DragLineItem, jawaban: string[]): GambarPembahasan {
  const kode = jawaban.map((id) => item.simpul.find((q) => q.id === id)!.kode);
  const bantu = labelBantu(item, jawaban);
  const L = Math.max(...kode.map((k) => k.length));
  const lebarKode = L * PETAK + (bantu.size ? 34 : 8);
  const xA = 96, xB = xA + lebarKode + 46, xK = xB + lebarKode + 22;
  const W = Math.max(600, xK + 270), H = 34 + (kode.length - 1) * 44 + 12;
  let s = teks(12, 20, 'Sambungan', { tebal: true }) + teks(xA, 20, 'Dari', { tebal: true }) + teks(xB, 20, 'Ke', { tebal: true }) + teks(xK, 20, 'Penghubung', { tebal: true });
  const alt: string[] = [];
  for (let i = 0; i + 1 < kode.length; i++) {
    const y = 34 + i * 44;
    const q = sambungan(kelas, kode[i], kode[i + 1], kode);
    const kunci = i < item.awalan.length - 1;
    if (i % 2 === 0) s += kotak(6, y - 4, W - 12, 42, { isi: C.redup, sudut: 6 });
    s += teks(12, y + 18, `${i + 1} → ${i + 2}`, { tebal: true }) + (kunci ? teks(50, y + 18, 'terkunci', { ukuran: 10, warna: C.abu }) : '');
    const sebut = (j: number) => (bantu.has(jawaban[j]) ? `(${bantu.get(jawaban[j])})` : '');
    s += petak(xA, y, kode[i], q.sa) + (sebut(i) ? teks(xA + kode[i].length * PETAK + 5, y + 18, sebut(i), { ukuran: 11, tebal: true, warna: C.oranye }) : '');
    s += garis(xA + lebarKode + 8, y + 13, xB - 10, y + 13, kunci ? C.tinta : C.biru, 2, { panah: true });
    s += petak(xB, y, kode[i + 1], q.sb) + (sebut(i + 1) ? teks(xB + kode[i + 1].length * PETAK + 5, y + 18, sebut(i + 1), { ukuran: 11, tebal: true, warna: C.oranye }) : '');
    s += teks(xK, y + 18, q.ket, { ukuran: 12 });
    alt.push(`${kode[i]}${sebut(i)} ke ${kode[i + 1]}${sebut(i + 1)}: ${q.ket}`);
  }
  return { id: 'sambungan', judul: 'Penghubung setiap sambungan', alt: `${alt.join('; ')}.`, lebar: Math.ceil(W), tinggi: Math.ceil(H), svg: dokumen(W, H, s, 'Penghubung setiap sambungan') };
}

export function visualDragLine(familyId: string, item: DragLineItem, jawaban: string[]): GambarPembahasan[] {
  const kelas = kelasUtama(familyId);
  return [papan(item, jawaban), ...(kelas ? [tabelSambungan(kelas, item, jawaban)] : [])];
}
