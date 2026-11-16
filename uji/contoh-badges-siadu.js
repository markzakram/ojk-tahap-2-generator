'use strict';
var fs=require('fs'),path=require('path'),A=require('assert');
var P=require('./siadu-badges'),V=require('../js/validator'),E=require('../js/ekspor'),D=require('../js/dokumen'),Pdf=require('../js/pdf'),Z=require('../js/zip'),S=require('./siadu');
async function utama(){
  var dir=path.resolve(process.argv[2]||'../hasil-badges-v16/contoh-siadu'),h=P.buatContoh(),p=h.paket[0],v=V.periksaHasil(h);
  var files=await E.berkasPaket(p,{docx:true,pdf:true,gambar:true,benih:20261027});
  var word=files.find(function(f){return f.jenis==='docx';});word.nama='badges-template-siadu.docx';A.deepStrictEqual(S.periksa(Buffer.from(word.data),p.subtes[0].butir,'latex'),[]);
  // Pratinjau tabel SiAdu dari model yang sama; berkas Word tetap keluaran untuk impor.
  var images=await E.siapkanGambarPaket(p,2,new Map()),img=function(b,d){return images.get(b.id+'|'+d.id);};
  var model=D.siaduPaket(p,img,{benih:20261027,rumus:'equation'})[0];
  files.push({nama:'pratinjau-tabel-siadu.pdf',data:await Pdf.buat(model),jenis:'pdf'});
  files.push({nama:'badges-siadu.xlsx',data:await E.xlsx(h)},{nama:'badges-siadu.json',data:E.json(h,{},v)});
  var sumber=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../assets/foto-badges/sumber.json'),'utf8'));
  sumber.forEach(function(p){files.push({nama:'foto/'+p.id+'.png',data:fs.readFileSync(path.resolve(__dirname,'../assets/foto-badges/'+p.id+'.png'))});});
  files.push({nama:'foto/profil-dan-prompt.json',data:JSON.stringify(sumber.map(function(p){return {id:p.id,nama:p.nama,gender:p.gender,buatanAI:true,metode:p.metode,berkas:p.id+'.png',prompt:p.prompt};}),null,2)});
  files.push({nama:'baca-dulu.txt',data:'Badges / Logical Ranking — template SiAdu 27 Oktober 2026\n\nBerkas utama untuk impor: badges-template-siadu.docx\nKolom: Nama | Deskripsi | Gambar | Posisi Urut. Foto tertanam langsung di sel Gambar; kunci di Posisi Urut; Jawaban kosong sesuai template. Deskripsi setiap baris terisi.\n\nEnam contoh mencakup kelima keluarga Badges (relasi penjualan, posisi, waktu, keuntungan mingguan, produk), termasuk delapan tokoh pada soal pertama. Andi, Budi, Eko, Farhan: laki-laki. Citra, Dewi, Lili, Tiara: perempuan. Semua foto dibuat dengan image_gen bawaan, seluruh tokoh fiktif, pasangan nama/gender/foto tetap. Keluarga produk memakai ilustrasi produk.\n\nMapping: Numerik/ Kuantitatif → SHL Interaktif → Badges; Subchapter kosong.\n\npratinjau-tabel-siadu.pdf adalah pratinjau dari model tabel yang sama (bukan hasil render Microsoft Word). PDF paket biasa tetap naskah latihan.\n\nStruktur Word, isi tabel, gambar tertanam dan kunci diperiksa dengan pembacaan ulang. Impor ke layanan SiAdu eksternal belum dijalankan.\n\n'+E.ringkasan(h,v).join('\n')+'\n'});
  for(var f of files){var target=path.join(dir,f.nama);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,f.data);}
  fs.writeFileSync(path.join(dir,'badges-siadu-lengkap.zip'),await Z.buat(files));
  console.log('HASIL: '+v.butirLulus+'/6 lulus; '+dir);
}
utama().catch(function(e){console.error(e.stack);process.exitCode=1;});
