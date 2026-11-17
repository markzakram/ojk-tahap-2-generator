import FOTO from '@/lib/data/foto.json';

// Foto orang dari folder Asset Generator (dipasang dengan scripts/impor-foto.mjs; daftarnya di lib/data/foto.json).
// Nama yang belum punya foto tampil sebagai inisial dengan warna tetap per nama.
const WARNA = ['#3b6fb6', '#2f8f6f', '#b5543c', '#7a55b0', '#b08a1e', '#2a8a9a', '#b5476f', '#5a6f2f'];
const DASAR = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export default function Avatar({ nama }: { nama: string }) {
  const foto = (FOTO as Record<string, string>)[nama];
  if (foto) return <img className="avatar foto" src={DASAR + foto} alt="" aria-hidden width={40} height={40} />;
  let h = 0;
  for (const c of nama) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return <span className="avatar" style={{ background: WARNA[h % WARNA.length] }} aria-hidden>{nama[0]}</span>;
}
