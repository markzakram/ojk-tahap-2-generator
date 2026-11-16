'use strict';
var fs=require('fs'),path=require('path'),A=require('assert'),H=require('./qc-badges-kosong'),E=require('../js/ekspor'),V=require('../js/validator'),S=require('./siadu');
async function tulis(ringkas){
  var h=H.buatContoh(ringkas),p=h.paket[0],bs=p.subtes[0].butir,v=V.periksaHasil(h),dir=path.resolve('../hasil-badges-v23/'+(ringkas?'review-12-soal':'paket-003-50-soal'));
  console.log('Mulai '+bs.length+' soal: '+dir);
  var files=await E.berkasPaket(p,{docx:true,gambar:true,rumus:'equation',benih:20261029});
  files.forEach(function(f){if(f.jenis==='docx')f.nama='paket-003-badges-penalaran-numerik.docx';});
  A.deepStrictEqual(S.periksa(Buffer.from(files.find(function(f){return f.jenis==='docx';}).data),bs,'equation'),[]);
  var counts={},ncounts={},empty={0:0,1:0,2:0},acuan={},kartu=0,kosong=0;
  bs.forEach(function(b){counts[b.keluarga]=(counts[b.keluarga]||0)+1;ncounts[b.isian.nama.length]=(ncounts[b.isian.nama.length]||0)+1;var k=b.isian.kartu.filter(function(c){return !c.petunjuk[0];}).length;empty[k]++;kosong+=k;kartu+=b.isian.nama.length;if(b.model.ragam==='shl')acuan[b.model.acuanShl]=(acuan[b.model.acuanShl]||0)+1;});
  var stats={soal:bs.length,keluarga:counts,jumlahVariabel:ncounts,soalMenurutDeskripsiKosong:empty,kartu:kartu,deskripsiKosong:kosong,acuanShl:acuan};
  files.push({nama:'paket-003-badges.xlsx',data:await E.xlsx(h)},{nama:'paket-003-badges.json',data:E.json(h,{},v)},
    {nama:'manifest-aset-dan-sumber.json',data:JSON.stringify(require('../js/bank-aset-badges').SEMUA,null,2)},
    {nama:'komposisi.json',data:JSON.stringify(stats,null,2)},
    {nama:'baca-dulu.txt',data:'Revisi QC Badges OJK — versi 23\n\n'+bs.length+' contoh baru dalam bahasa Indonesia; 6–8 variabel per soal.\n\nPerubahan terbaru: petunjuk yang mengajari cara menyelesaikan soal dihapus dari naskah soal. Konteks, satuan, arah pengurutan dan fakta relasi tetap dicantumkan. Penjelasan cara menghitung/menalar hanya ada pada pembahasan.\n\nSetiap deskripsi terisi adalah satu kalimat dalam satu baris dengan font yang sama. Bentuk pecahan angka seperti 3/4 dari tidak dipakai pada deskripsi. Hubungan panjang dinyatakan dengan persentase, selisih waktu, atau nilai langsung yang setara. Setiap angka dan jawaban dihitung ulang.\n\nAda variasi 0, 1, dan 2 deskripsi kosong. Nama, foto, dan lencana tetap ditampilkan. Sel kosong benar-benar kosong. Fakta yang tidak ditempatkan pada kartu tetap tertulis pada pertanyaan; fakta tersebut bukan petunjuk cara menyelesaikan soal.\n\nKunci dipecahkan ulang dari narasi kartu dan fakta pada pertanyaan dan harus tunggal. Tidak ada kode nama atau persamaan pada soal.\n\nPembahasan visual tetap lengkap: rantai, posisi relatif, tabel kemungkinan peringkat, hitungan dan urutan akhir. Keuntungan mingguan tetap satu langkah per nama untuk seluruh kolom.\n\nMapping tetap Category Numerik/ Kuantitatif; Lesson SHL Interaktif; Chapter Badges; Subchapter kosong; Bentuk Soal Logical Ranking. Pasangan nama–gambar mengikuti manifest pengguna.\n\nWord mengikuti tabel Nama | Deskripsi | Gambar | Posisi Urut, font tabel 10 pt. PDF dicetak dari Word dengan bookmark tiap soal. Excel, JSON dan seluruh PNG rujukan disertakan.\n\nIni bank latihan. Impor ke layanan SiAdu eksternal belum dijalankan.\n'});
  for(var f of files){var file=path.join(dir,f.nama);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,f.data);}
  console.log('HASIL lulus pembacaan ulang Word; '+JSON.stringify(stats));
}
async function utama(){await tulis(true);await tulis(false);}
utama().catch(function(e){console.error(e.stack);process.exitCode=1;});
