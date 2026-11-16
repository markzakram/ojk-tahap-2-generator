'use strict';
var fs=require('fs'),path=require('path'),A=require('assert');
var P=require('./badges-produk'),V=require('../js/validator'),E=require('../js/ekspor'),Z=require('../js/zip'),S=require('./siadu'),Berkas=require('./berkas');
async function utama(){
  var dir=path.resolve(process.argv[2]||'../hasil-badges-v15/laba-produk'),h=P.buatContoh(),validasi=V.periksaHasil(h);
  var files=await E.berkasPaket(h.paket[0],{docx:true,pdf:true,benih:20261026});
  files.push({nama:'badges-laba-produk.xlsx',data:await E.xlsx(h)},{nama:'badges-laba-produk.json',data:E.json(h,{},validasi)});
  files.filter(function(f){return f.jenis==='docx';}).forEach(function(f){A.deepStrictEqual(S.periksa(Buffer.from(f.data),h.paket[0].subtes[0].butir,'latex'),[]);});
  Berkas.periksaXlsx(Buffer.from(files.find(function(f){return f.nama.endsWith('.xlsx');}).data));
  files.push({nama:'baca-dulu.txt',data:'Badges — Laba Penjualan Produk (riset akademik)\n\nSoal 1 memakai angka persis dari contoh akademik. Soal 2–4 adalah variasi angka dalam pola yang sama. Enam produk A–F, data unit terjual per bulan dan laba per unit dalam USD. Laba bulanan = unit terjual × laba per unit. Urutkan 1 tertinggi sampai 6 terendah.\n\nKunci soal 1: Produk E, A, D, F, C, B.\nLaba A: $16.800,00; B: $15.000,00; C: $16.250,00; D: $16.625,00; E: $21.250,00; F: $16.500,00.\n\nCategory: Numerik/ Kuantitatif\nLesson: SHL Interaktif\nChapter: Badges\nSubchapter: kosong\nBentuk Soal: Logical Ranking\n\nTersedia tingkat mudah dan sedang. Empat keluarga Badges sebelumnya tetap tersedia. Di generator pilih mode Per Chapter/Subchapter → Numerik/ Kuantitatif → SHL Interaktif → Badges; lima soal pada tingkat sedang mencakup kelima keluarga.\n\n'+E.ringkasan(h,validasi).join('\n')+'\n'});
  for(var f of files){var dest=path.join(dir,f.nama);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,f.data);}
  fs.writeFileSync(path.join(dir,'badges-laba-produk.zip'),await Z.buat(files));
  console.log('HASIL: '+validasi.butirLulus+'/4 lulus; '+dir);
}
utama().catch(function(e){console.error(e.stack);process.exitCode=1;});
