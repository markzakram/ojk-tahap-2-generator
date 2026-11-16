'use strict';
var fs=require('fs'),path=require('path'),A=require('assert'),H=require('./peringkat-langkah');
var E=require('../js/ekspor'),V=require('../js/validator'),G=require('../js/gambar'),Z=require('../js/zip'),S=require('./siadu');
async function utama(){
  var dir=path.resolve(process.argv[2]||'../hasil-badges-v17/visual-posisi'),h=H.buatContoh(),p=h.paket[0],v=V.periksaHasil(h);
  var files=await E.berkasPaket(p,{docx:true,pdf:true,gambar:true,benih:20261027});
  files.forEach(function(f){if(f.jenis==='docx')f.nama='badges-langkah-siadu.docx';if(f.jenis==='pdf')f.nama='badges-langkah.pdf';});
  A.deepStrictEqual(S.periksa(Buffer.from(files.find(function(f){return f.jenis==='docx';}).data),p.subtes[0].butir,'latex'),[]);
  files.push({nama:'badges-langkah.xlsx',data:await E.xlsx(h)},{nama:'badges-langkah.json',data:E.json(h,{},v)});
  p.subtes[0].butir.forEach(function(b,i){b.gambarPembahasan.forEach(function(g,j){files.push({nama:'svg/soal-'+(i+1)+'/langkah-'+j+'.svg',data:G.svg(g).svg});});});
  files.push({nama:'baca-dulu.txt',data:'Badges — visual selisih posisi, versi 17\n\nSoal 1 memakai persis nama, relasi, dan urutan contoh pengguna: Citra, Lili, Dewi, Farhan, Budi, Tiara, Andi, Eko. Soal 2 menguji posisi relatif negatif. Masing-masing memuat 10 gambar: kondisi awal, titik acuan, 7 penempatan, dan peringkat final.\n\nSetiap gambar muncul setelah petunjuk dan penjelasan langkahnya. Rujukan ditandai biru; orang baru ditandai jingga dan label BARU; peringkat akhir memakai lencana hijau. Gambar antara hanya menampilkan informasi yang sudah diturunkan.\n\nPDF: naskah latihan dan pembahasan bertahap.\nWord: template SiAdu dengan foto tertanam di sel Gambar dan visual di Pembahasan.\nExcel: teks pembahasan dan daftar berkas PNG berurutan di berkas_gambar_pembahasan.\nJSON: model setiap gambar dan properti setelah untuk menempatkan gambar setelah paragraf yang sesuai.\nPNG dan SVG ikut dalam ZIP.\n\nImpor ke layanan SiAdu eksternal belum dijalankan.\n'});
  for(var f of files){var target=path.join(dir,f.nama);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,f.data);}
  fs.writeFileSync(path.join(dir,'badges-langkah-lengkap.zip'),await Z.buat(files));
  console.log(JSON.stringify({direktori:dir,lulus:v.lulus,soal:2,gambarLangkah:20,berkas:files.length}));
}
utama().catch(function(e){console.error(e.stack);process.exitCode=1;});
