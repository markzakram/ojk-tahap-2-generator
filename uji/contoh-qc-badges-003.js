'use strict';
var fs=require('fs'),path=require('path'),A=require('assert'),H=require('./qc-badges-003'),E=require('../js/ekspor'),V=require('../js/validator'),S=require('./siadu');
async function tulis(ringkas){
  var h=H.buatContoh(ringkas),p=h.paket[0],v=V.periksaHasil(h),dir=path.resolve('../hasil-badges-v20/'+(ringkas?'review-12-soal':'paket-003-50-soal'));
  console.log('Mulai '+p.subtes[0].butir.length+' soal: '+dir);
  var files=await E.berkasPaket(p,{docx:true,pdf:!ringkas,gambar:true,rumus:'equation',benih:20261028});
  files.forEach(function(f){if(f.jenis==='docx')f.nama='paket-003-badges-penalaran-numerik.docx';if(f.jenis==='pdf')f.nama='paket-003-badges-latihan.pdf';});
  var doc=files.find(function(f){return f.jenis==='docx';});A.deepStrictEqual(S.periksa(Buffer.from(doc.data),p.subtes[0].butir,'equation'),[]);
  files.push({nama:'paket-003-badges.xlsx',data:await E.xlsx(h)},{nama:'paket-003-badges.json',data:E.json(h,{},v)});
  var assets=require('../js/bank-aset-badges');files.push({nama:'manifest-aset-dan-sumber.json',data:JSON.stringify(assets.SEMUA,null,2)});
  files.push({nama:'baca-dulu.txt',data:'Revisi QC Badges Paket 003 — 28 Oktober 2026\n\n'+(ringkas?'12 contoh untuk pemeriksaan cepat, mencakup semua kategori dan lima pola, termasuk kasus 8 entitas bernama panjang.':'50 contoh baru, masing-masing 10 soal pada lima pola yang sudah ada. Keunikan setiap kunci diperiksa ulang dari teks kartu yang ditampilkan.')+'\n\nCategory: Numerik/ Kuantitatif; Lesson: SHL Interaktif; Chapter: Badges; Subchapter kosong; Bentuk Soal: Logical Ranking.\n\nDeskripsi ringkas satu baris. Simbol dan kode rujukan didefinisikan pada stem. Tanpa pengulangan petunjuk pada beberapa kartu. Setiap soal memakai satu kategori aset; seluruh nama dan gambar mengikuti manifest pengguna. Foto/ikon identitas tetap di kartu dan setiap diagram.\n\nKeuntungan mingguan tetap satu langkah per nama, menghitung seluruh kolom sekaligus. Semua uang USD ($). Konteks kendaraan, hewan, tanaman dan perusahaan dijelaskan tanpa memakai pengetahuan umum sebagai kunci.\n\nP003 konsisten pada judul, kaki halaman, ID soal, nama PNG, Excel dan JSON. Dokumen disebut bank latihan; variasi ini bukan klaim seluruhnya pernah ditemukan pada tes asli.\n\nWord: template Nama | Deskripsi | Gambar | Posisi Urut, gambar tertanam, Equation Word. PDF latihan memakai angka dan gambar yang sama.\n\nImpor ke layanan SiAdu eksternal belum dijalankan.\n'});
  for(var f of files){var file=path.join(dir,f.nama);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,f.data);}
  console.log('HASIL '+p.subtes[0].butir.length+' soal lulus; '+files.length+' berkas; '+dir);
}
async function utama(){await tulis(true);await tulis(false);}
utama().catch(function(e){console.error(e.stack);process.exitCode=1;});
