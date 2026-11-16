'use strict';
var fs=require('fs'),path=require('path'),A=require('assert'),H=require('./qc-badges-003'),E=require('../js/ekspor'),V=require('../js/validator'),S=require('./siadu');
async function tulis(ringkas){
  var h=H.buatContoh(ringkas),p=h.paket[0],bs=p.subtes[0].butir,v=V.periksaHasil(h),dir=path.resolve('../hasil-badges-v21/'+(ringkas?'review-12-soal':'paket-003-50-soal'));
  console.log('Mulai '+bs.length+' soal: '+dir);
  var files=await E.berkasPaket(p,{docx:true,gambar:true,rumus:'equation',benih:20261028});
  files.forEach(function(f){if(f.jenis==='docx')f.nama='paket-003-badges-penalaran-numerik.docx';});
  var doc=files.find(function(f){return f.jenis==='docx';});A.deepStrictEqual(S.periksa(Buffer.from(doc.data),bs,'equation'),[]);
  files.push({nama:'paket-003-badges.xlsx',data:await E.xlsx(h)},{nama:'paket-003-badges.json',data:E.json(h,{},v)});
  files.push({nama:'manifest-aset-dan-sumber.json',data:JSON.stringify(require('../js/bank-aset-badges').SEMUA,null,2)});
  var counts={},ncounts={};bs.forEach(function(b){counts[b.keluarga]=(counts[b.keluarga]||0)+1;ncounts[b.isian.nama.length]=(ncounts[b.isian.nama.length]||0)+1;});
  files.push({nama:'baca-dulu.txt',data:'Revisi QC Badges Paket 003 — versi 21 — 28 Oktober 2026\n\n'+(ringkas?'12 soal contoh untuk pemeriksaan cepat, mencakup lima pola dan enam kategori aset.':'50 contoh baru, masing-masing 10 pada lima pola Badges.')+'\n\nPerubahan dari versi 20:\n- Tidak ada kode nama, simbol kolom, atau persamaan pada soal. Semua rujukan menyebut nama lengkap.\n- Empat pola menggunakan kalimat. Laba bulanan menggunakan dua angka langsung, misalnya 12.000, $1,95; urutan dan satuannya dijelaskan pada pengantar.\n- Semua soal memakai 6–8 variabel. Mudah 6, sedang 7, sulit 8; laba bulanan mudah 6 dan sedang 7/8.\n- Deskripsi boleh turun baris agar kalimat terbaca. Font tabel Word tetap 10 pt dan font deskripsi aplikasi 14 px.\n- Kunci dipecahkan ulang dari narasi yang benar-benar tampil; ambigu, bertentangan, nilai seri, dan rujukan melingkar ditolak.\n\nMapping: Category Numerik/ Kuantitatif; Lesson SHL Interaktif; Chapter Badges; Subchapter kosong; Bentuk Soal Logical Ranking.\n\nAset dari manifest pengguna, satu kategori per soal, identitas nama dan gambar tetap. Semua uang USD ($). Warna/jenis objek tidak menentukan jawaban.\n\nVisual bertahap tetap disertakan. Keuntungan mingguan tetap satu langkah per nama dengan seluruh kolom dihitung sekaligus. Persamaan hanya dipakai dalam pembahasan untuk menjelaskan hitungan.\n\nWord menggunakan tabel Nama | Deskripsi | Gambar | Posisi Urut, gambar tertanam dan Equation Word. PDF pendamping dicetak dari Word dan diberi bookmark tiap soal. Excel, JSON dan seluruh PNG rujukan disertakan.\n\nIni bank latihan. Impor ke layanan SiAdu eksternal belum dijalankan.\n'});
  files.push({nama:'komposisi.json',data:JSON.stringify({soal:bs.length,keluarga:counts,jumlahVariabel:ncounts,kartu:bs.reduce(function(s,b){return s+b.isian.nama.length;},0)},null,2)});
  for(var f of files){var file=path.join(dir,f.nama);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,f.data);}
  console.log('HASIL '+bs.length+' soal lulus, termasuk pembacaan ulang Word; '+files.length+' berkas; '+JSON.stringify(ncounts));
}
async function utama(){await tulis(true);await tulis(false);}
utama().catch(function(e){console.error(e.stack);process.exitCode=1;});
