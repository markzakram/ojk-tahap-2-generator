'use strict';
var fs=require('fs'),path=require('path'),A=require('assert'),H=require('./badges-langkah');
var E=require('../js/ekspor'),V=require('../js/validator'),G=require('../js/gambar'),Z=require('../js/zip'),S=require('./siadu');
async function utama(){
  var dir=path.resolve(process.argv[2]||'../hasil-badges-v19/semua-fam-visual'),h=H.buatContoh(),p=h.paket[0],v=V.periksaHasil(h);
  var files=await E.berkasPaket(p,{docx:true,pdf:true,gambar:true,rumus:'equation',benih:20261027});
  files.forEach(function(f){if(f.jenis==='docx')f.nama='badges-semua-fam-siadu.docx';if(f.jenis==='pdf')f.nama='badges-semua-fam-latihan.pdf';});
  A.deepStrictEqual(S.periksa(Buffer.from(files.find(function(f){return f.jenis==='docx';}).data),p.subtes[0].butir,'equation'),[]);
  files.push({nama:'badges-semua-fam.xlsx',data:await E.xlsx(h)},{nama:'badges-semua-fam.json',data:E.json(h,{},v)});
  p.subtes[0].butir.forEach(function(b,i){b.gambarPembahasan.forEach(function(g,j){files.push({nama:'svg/soal-'+(i+1)+'/langkah-'+j+'.svg',data:G.svg(g).svg});});});
  files.push({nama:'baca-dulu.txt',data:'Badges — visual setiap langkah untuk semua keluarga, versi 19\n\nLima soal, satu per keluarga:\n1. Perbandingan penjualan: rangkai petunjuk; rantai yang terpisah tetap terpisah sampai tersambung.\n2. Selisih posisi: contoh delapan nama pengguna; posisi relatif sampai nomor peringkat.\n3. Waktu penyelesaian: konversi hari ke jam, hitung rujukan, bandingkan durasi.\n4. Keuntungan mingguan: satu langkah per orang menghitung jumlah, harga, biaya, dan keuntungan sekaligus (6 langkah untuk 6 orang).\n5. Laba produk: data contoh riset akademik; unit per bulan dikalikan laba per unit.\n\nSetiap langkah visual dimulai dari kondisi awal dan berakhir pada lencana peringkat. Nilai antara hanya memakai data yang sudah diketahui atau diturunkan.\n\nWord SiAdu: Nama | Deskripsi | Gambar | Posisi Urut; foto tertanam di kolom Gambar. Pembahasan memuat Equation Word dan diagram per langkah.\nPDF latihan: naskah dan pembahasan per langkah.\nExcel: teks pembahasan dan berkas PNG berurutan di berkas_gambar_pembahasan.\nJSON: model gambar, mulai (awal langkah jika ada), setelah (paragraf sebelum gambar), dan lokasi PNG.\nPNG dan SVG disertakan di ZIP.\n\nImpor ke layanan SiAdu eksternal belum dijalankan.\n'});
  for(var f of files){var target=path.join(dir,f.nama);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,f.data);}
  fs.writeFileSync(path.join(dir,'badges-semua-fam-lengkap.zip'),await Z.buat(files));
  console.log(JSON.stringify({direktori:dir,lulus:v.lulus,soal:5,keluarga:p.subtes[0].butir.map(function(b){return {id:b.keluarga,gambar:b.gambarPembahasan.length};}),berkas:files.length}));
}
utama().catch(function(e){console.error(e.stack);process.exitCode=1;});
