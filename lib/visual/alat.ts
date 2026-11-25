// Alat gambar visual pembahasan (QC 2 R02). Semua gambar berupa SVG mandiri: gaya inline, latar putih, tanpa CSS luar, sehingga
// tampil sama di aplikasi, di JSON, dan setelah diubah ke PNG untuk Word. Warna tidak pernah menjadi satu-satunya penanda:
// selalu ada label, pola, garis tebal, atau nomor.

export interface GambarPembahasan {
  /** Id unik dalam satu soal, mis. "lintasan". */
  id: string;
  judul: string;
  /** Uraian teks gambar (aksesibilitas dan cadangan bila gambar gagal dimuat). */
  alt: string;
  lebar: number;
  tinggi: number;
  svg: string;
}

export const C = {
  tinta: '#111827', teks: '#1f2937', abu: '#6b7280', garis: '#cbd5e1', redup: '#f1f5f9',
  biru: '#1d4ed8', biruMuda: '#dbeafe', hijau: '#166534', hijauMuda: '#dcfce7', merah: '#b91c1c', merahMuda: '#fee2e2',
  oranye: '#b45309', oranyeMuda: '#fef3c7', putih: '#ffffff',
};

export const n2 = (x: number) => String(+x.toFixed(2));
export const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface GayaTeks { ukuran?: number; tebal?: boolean; warna?: string; rata?: 'start' | 'middle' | 'end'; halo?: boolean; miring?: boolean; mono?: boolean }
export function teks(x: number, y: number, t: string, g: GayaTeks = {}): string {
  const u = g.ukuran ?? 12;
  const halo = g.halo ? ' stroke="#ffffff" stroke-width="3" paint-order="stroke" stroke-linejoin="round"' : '';
  const font = g.mono ? 'Consolas, Courier New, monospace' : 'Arial, Helvetica, sans-serif';
  return `<text x="${n2(x)}" y="${n2(y)}" font-family="${font}" font-size="${u}" fill="${g.warna ?? C.teks}" text-anchor="${g.rata ?? 'start'}"${g.tebal ? ' font-weight="700"' : ''}${g.miring ? ' font-style="italic"' : ''}${halo}>${esc(t)}</text>`;
}

/** Pecah teks menjadi baris paling banyak `maks` huruf (kata utuh). */
export function bungkus(t: string, maks: number, maksBaris = 99): string[] {
  const baris: string[] = [];
  let b = '';
  for (const k of t.split(/\s+/)) {
    if (b && `${b} ${k}`.length > maks) { baris.push(b); b = k; } else b = b ? `${b} ${k}` : k;
  }
  if (b) baris.push(b);
  return baris.length > maksBaris ? [...baris.slice(0, maksBaris - 1), `${baris.slice(maksBaris - 1).join(' ').slice(0, maks - 1)}…`] : baris;
}
/** Seperti `bungkus`, tetapi kata yang lebih panjang dari `maks` dipenggal dengan tanda hubung. */
export function penggal(t: string, maks: number, maksBaris: number): string[] {
  const kata = t.split(/\s+/).flatMap((k) => {
    const p: string[] = [];
    let s = k;
    while (s.length > maks + 1) { p.push(`${s.slice(0, maks - 1)}-`); s = s.slice(maks - 1); }
    return [...p, s];
  });
  return bungkus(kata.join(' '), maks, maksBaris);
}
export function teksBaris(x: number, y: number, baris: string[], tinggi: number, g: GayaTeks = {}): string {
  return baris.map((t, i) => teks(x, y + i * tinggi, t, g)).join('');
}

export interface GayaKotak { isi?: string; garis?: string; tebal?: number; putus?: string; sudut?: number; alpha?: number }
export function kotak(x: number, y: number, w: number, h: number, g: GayaKotak = {}): string {
  return `<rect x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="${n2(h)}"${g.sudut ? ` rx="${g.sudut}"` : ''} fill="${g.isi ?? 'none'}"${g.alpha !== undefined ? ` fill-opacity="${g.alpha}"` : ''}${g.garis ? ` stroke="${g.garis}" stroke-width="${g.tebal ?? 1}"` : ''}${g.putus ? ` stroke-dasharray="${g.putus}"` : ''}/>`;
}
export function garis(x1: number, y1: number, x2: number, y2: number, w = C.abu, tebal = 1.2, o: { putus?: string; panah?: boolean; halo?: boolean } = {}): string {
  const dasar = (warna: string, t: number) => `<line x1="${n2(x1)}" y1="${n2(y1)}" x2="${n2(x2)}" y2="${n2(y2)}" stroke="${warna}" stroke-width="${t}" stroke-linecap="round"${o.putus ? ` stroke-dasharray="${o.putus}"` : ''}/>`;
  let s = (o.halo ? dasar('#ffffff', tebal + 2.4) : '') + dasar(w, tebal);
  if (o.panah) {
    const d = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / d, uy = (y2 - y1) / d, p = 5 + tebal * 1.6;
    const bx = x2 - ux * p, by = y2 - uy * p;
    s += `<polygon points="${n2(x2)},${n2(y2)} ${n2(bx - uy * p * 0.55)},${n2(by + ux * p * 0.55)} ${n2(bx + uy * p * 0.55)},${n2(by - ux * p * 0.55)}" fill="${w}"/>`;
  }
  return s;
}

export function dokumen(lebar: number, tinggi: number, isi: string, judul: string): string {
  const w = Math.ceil(lebar), h = Math.ceil(tinggi);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(judul)}"><rect width="${w}" height="${h}" fill="#ffffff"/>${isi}</svg>`;
}

/** Hash pendek untuk id pola SVG yang unik per soal. */
export function hash(t: string): string {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}
export const kapital = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
