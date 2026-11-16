/* Bahan tinjauan: empat pola / tiga tingkat (12 soal), atau --laba (6 soal). */
'use strict';
var fs=require('fs'),path=require('path'),A=require('assert');
var P=require('../js/paket'),B=require('../js/bank'),V=require('../js/validator'),E=require('../js/ekspor'),Z=require('../js/zip');
var Siadu=require('./siadu'),Berkas=require('./berkas');
async function utama(){
  var hanyaLaba=process.argv.includes('--laba'),jumlah=hanyaLaba?6:12,judul=hanyaLaba?'6 contoh keluarga keuntungan penjualan, dua variasi per tingkat':'12 contoh, empat pola pada setiap tingkat';
  var dir=path.resolve(process.argv.slice(2).find(function(x){return !x.startsWith('--');})||'../hasil-badges-v14/contoh-badges');fs.mkdirSync(dir,{recursive:true});
  var h=P.buat({materi:[{id:'pn-peringkat',jumlah:jumlah}],proporsi:{mudah:1,sedang:1,sulit:1},benih:20261026}).hasil;
  var st=h.paket[0].subtes[0],butir=[];
  ['mudah','sedang','sulit'].forEach(function(l,li){for(var i=0;i<(hanyaLaba?2:4);i++){
    var b=B.buat('pn','peringkat',hanyaLaba?3:i,l,20261026+li*1000+i*100),old=st.butir[butir.length];
    Object.assign(b,{no:old.no,id:old.id,paket:old.paket,tingkatNama:l.charAt(0).toUpperCase()+l.slice(1)});butir.push(b);
  }});
  st.butir=butir;var validasi=V.periksaHasil(h);A(validasi.lulus,JSON.stringify(validasi));
  var files=await E.berkasPaket(h.paket[0],{docx:true,pdf:true,benih:20261026});
  files.push({nama:'contoh-badges.xlsx',data:await E.xlsx(h)},{nama:'contoh-badges.json',data:E.json(h,{},validasi)});
  files.filter(function(f){return f.jenis==='docx';}).forEach(function(f){A.deepStrictEqual(Siadu.periksa(Buffer.from(f.data),butir,'latex'),[]);});
  Berkas.periksaXlsx(Buffer.from(files.find(function(f){return f.nama.endsWith('.xlsx');}).data));
  files.push({nama:'ringkasan.txt',data:'Badges / Logical Ranking — '+judul+'.\nCategory: Numerik/ Kuantitatif\nLesson: SHL Interaktif\nChapter: Badges\nSubchapter: kosong\n\n'+E.ringkasan(h,validasi).join('\n')+'\n\nDibuat ulang dengan: node uji/contoh-badges.js <folder>'+(hanyaLaba?' --laba':'')+'\n'});
  for(var f of files){var dest=path.join(dir,f.nama);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,f.data);}
  fs.writeFileSync(path.join(dir,'contoh-badges.zip'),await Z.buat(files));
  console.log('HASIL: '+validasi.butirLulus+'/'+jumlah+' lulus; '+dir);
}
utama().catch(function(e){console.error(e.stack);process.exitCode=1;});
