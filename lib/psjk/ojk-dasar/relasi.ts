import { familyRelasi, type BarisRelasi, type FamilyPsjk, type TabelRelasi } from '../umum';

// Pembungkus familyRelasi (mesin bersama) untuk kelompok ini: kalimat alasan bawaan "nilai adalah subjek" sering janggal
// (mis. "31 Desember 2013 adalah pengawasan perbankan beralih ..."), jadi setiap tabel memberi kalimat pembahasan sendiri.
// Soal, opsi, solver, pemeriksaan, dan sidik tetap dari mesin bersama.

export interface TabelKalimat extends TabelRelasi {
  /** Kalimat pembahasan untuk baris yang benar (dipakai untuk kedua arah soal). */
  kalimat: (b: BarisRelasi) => string;
}

export const kapital = (t: string) => `${t[0].toUpperCase()}${t.slice(1)}`;

export function familyRelasiKalimat(info: Parameters<typeof familyRelasi>[0], tabel: TabelKalimat[]): FamilyPsjk {
  const f = familyRelasi(info, tabel);
  const peta = new Map(tabel.map((t) => [t.id, t]));
  return {
    ...f,
    bangun(r) {
      const k = f.bangun(r);
      if (!k) return k;
      // sidik familyRelasi = `${familyId}|${tabel}|${baris}|${arah}`
      const [, idTabel, idBaris] = k.item.data.sidik.split('|');
      const t = peta.get(idTabel);
      const b = t?.baris.find((x) => x.id === idBaris);
      if (t && b) k.item.data.alasan = [t.kalimat(b)];
      return k;
    },
  };
}
