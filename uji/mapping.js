/* Kontrak klasifikasi dari gambar terakhir pengguna (22 Oktober 2026).
 * Acuan ditulis terpisah dari kerangka.js; ekspor dibaca balik dari berkas.
 */
'use strict';
var assert = require('assert');
var Bank = require('../js/bank'), Paket = require('../js/paket'), V = require('../js/validator');
var K = require('../js/kerangka'), E = require('../js/ekspor'), Berkas = require('./berkas'), Siadu = require('./siadu');
var ACUAN = [];
function baris(subtes, category, lesson, chapter, subchapter, keluarga) {
  ACUAN.push({subtes:subtes, keluarga:keluarga.split(','), klasifikasi:{category:category,lesson:lesson,chapter:chapter,subchapter:subchapter}});
}
baris('ku','Penalaran Verbal','Analitis','SHL_Verbal Reasoning',null,'bacaan-pernyataan');
[
  ['Bilangan dan Perbandingan','pecahan-sisa,persen-naik,campuran,ukur-wadah,rata-gabungan'],
  ['Aljabar Dasar','aljabar-berat'],
  ['Laju dan Waktu','laju-mesin,banding-waktu,kerja-bersama,kecepatan-rata'],
  ['Aritmatika Keuangan','laba-majemuk,pendapatan,diskon,harga-semula,bunga-tunggal']
].forEach(function (r) {baris('ku','Numerik/ Kuantitatif','Soal Cerita [BS]','SHL_Soal Cerita',r[0],r[1]);});
[
  ['Bilangan dan Perbandingan','rasio-baris,tabel-produktivitas'],
  ['Persentase dan Pertumbuhan','persen-gabungan,pertumbuhan-tahun,perubahan-persen,tabel-tumbuh-majemuk,tabel-target'],
  ['Rata-rata','rata-per-mesin,tabel-rata-gabungan,tabel-rata-tertimbang'],
  ['Aritmatika Keuangan','laba-persen'],['Aljabar Dasar','tak-diketahui'],['Pengukuran dan Konversi Satuan','harga-satuan']
].forEach(function (r) {baris('ku','Numerik/ Kuantitatif','Tabel dan Grafik [BS]','SHL_Analisis Tabel',r[0],r[1]);});
baris('ku','Numerik/ Kuantitatif','Tabel dan Grafik [BS]','SHL_Interpretasi Grafik','Persentase dan Pertumbuhan',
  'tanpa-cacat,naik-total,persen-sumbangan,rasio-batang,grafik-laba,grafik-target-rata');
[
  ['serial','Figural Serial - The Next Box'],['serial-ganda','Figural Serial - The Next Double Box'],
  ['matriks-3','Figural Matriks - Kotak 3x3'],['matriks-sekat','Figural Matriks - Kotak 2x2 Bersekat'],
  ['matriks-latin','Figural Matriks - Kotak 5x5'],['matriks-isi','Figural Matriks - Kotak 5x6']
].forEach(function (r) {baris('ku','Penalaran Spasial','Bangun Datar',r[1],null,r[0]);});
[
  ['peringkat-perbandingan,peringkat-posisi,peringkat-waktu,peringkat-laba,peringkat-produk','Badges'],
  ['bar-tumpuk','Bar Chart'],['target-2-opsi','Table Decision - 2 Opsi'],
  ['komisi-3-opsi','Table Decision - 3-4 Opsi'],
  ['garis-tetap,garis-persen-awal,garis-stok,garis-bergantian,garis-majemuk','Line Graph'],
  ['pie-penuh','Pie Chart - Informasi Penuh'],['pie-kosong','Pie Chart - 1 Informasi Kosong']
].forEach(function (r) {baris('pn','Numerik/ Kuantitatif','SHL Interaktif',r[1],null,r[0]);});

function acuan(b) {
  var rows=ACUAN.filter(function(r){return r.subtes===b.subtes && r.keluarga.indexOf(b.keluarga)>=0;});
  assert.strictEqual(rows.length,1,'Keluarga harus tepat satu kali dalam mapping: '+b.keluarga);
  return rows[0].klasifikasi;
}
function buatButir(st,sub,i,level,seed,terima) {
  for(var n=0;n<1000;n++) {
    var b=Bank.buat(st,sub,i,level,seed+n,{target:i%5});
    if(b && (!terima || terima(b)))return b;
  }
  throw new Error('Tidak dapat membuat contoh '+st+'/'+sub+'/'+i+'/'+level);
}

// Paket audit 57 soal: seluruh 56 keluarga, dengan komisi 3 dan 4 opsi masing-masing satu.
function buatContoh() {
  var komposisi={ku:{},pn:{}};
  Bank.katalog().forEach(function(s){komposisi[s.subtes][s.kunci]=s.keluarga.length+(s.subtes==='pn'&&s.kunci==='tabel'?1:0);});
  var hasil=Paket.buat({jumlahPaket:1,benih:20261022,tingkat:'sedang',komposisi:komposisi}).hasil;
  var paket=hasil.paket[0], terpilih=[];
  paket.subtes.forEach(function(st){
    var butir=[];
    Bank.URUTAN[st.kode].forEach(function(sub){
      Bank.ambil(st.kode,sub).keluarga.forEach(function(k,i){
        var ns=k.id==='komisi-3-opsi'?[3,4]:[null];
        ns.forEach(function(nops){
          var b=buatButir(st.kode,sub,i,'sedang',20261022+terpilih.length*10000,function(x){
            return (!nops || x.isian.pilihan.length===nops) && V.periksaButir(x).lulus && !V.cariKembar(terpilih.concat([x])).length;
          });
          b.no=butir.length+1;b.id='P001-'+st.kode.toUpperCase()+'-'+String(b.no).padStart(2,'0');b.paket=1;b.tingkatNama='Sedang';
          butir.push(b);terpilih.push(b);
        });
      });
    });
    st.butir=butir;
  });
  var validasi=V.periksaHasil(hasil);
  assert(validasi.lulus,JSON.stringify(validasi));
  return {hasil:hasil,validasi:validasi};
}

async function periksaEkspor(hasil,files,xlsx,json) {
  var data=JSON.parse(json), semua=[];
  hasil.paket.forEach(function(p){p.subtes.forEach(function(st){semua=semua.concat(st.butir);});});
  var ekspor=[];
  data.paket.forEach(function(p){p.subtes.forEach(function(st){ekspor=ekspor.concat(st.butir);});});
  assert.strictEqual(ekspor.length,semua.length);
  var sheet=Berkas.periksaXlsx(Buffer.from(xlsx)).Soal, head=sheet[0];
  assert.strictEqual(sheet.length-1,semua.length);
  semua.forEach(function(b,i){
    var expected=acuan(b);
    assert.deepStrictEqual(ekspor[i].klasifikasi,expected,'JSON '+b.id);
    Object.keys(expected).forEach(function(field){assert.strictEqual(sheet[i+1][head.indexOf(field)],expected[field]||'','Excel '+b.id+'/'+field);});
    if(b.isian && ['bar-tumpuk','pie'].indexOf(b.isian.jenis)>=0){
      assert.strictEqual(ekspor[i].isian.kontrol.find(function(k){return k.nama==='persen';}).langkah,1,'JSON kelipatan persen');
      assert(/kelipatan 1%/.test(sheet[i+1][head.indexOf('bentuk_isian')]),'Excel kelipatan persen 1%');
      assert(!/kelipatan 5%/.test(sheet[i+1][head.indexOf('pembahasan')]),'Pembahasan kelipatan lama');
    }
    if(b.riset){
      var mapping=JSON.parse(sheet[i+1][head.indexOf('mapping_figural')]);
      Object.keys(expected).forEach(function(field){assert.strictEqual(mapping[field],expected[field]);assert.strictEqual(ekspor[i].riset.pemetaan[field],expected[field]);});
    }
  });
  var jumlahWord=0;
  files.filter(function(f){return /\.docx$/.test(f.nama);}).forEach(function(f){
    var st=hasil.paket[0].subtes.find(function(s){return s.kode===f.subtes;});
    assert(st,'Subtes Word hilang');
    assert.deepStrictEqual(Siadu.periksa(Buffer.from(f.data),st.butir,'latex'),[],f.nama);
    // Tolak Subchapter tambahan pada baris yang seharusnya kosong.
    Siadu.pecahSoal(Siadu.bacaBadan(Buffer.from(f.data))).forEach(function(s,i){
      var sc=s.isi.filter(function(x){return x.p && /^Subchapter:/.test(x.p);});
      assert.strictEqual(sc.length,acuan(st.butir[i]).subchapter?1:0);
    });
    jumlahWord+=st.butir.length;
  });
  assert.strictEqual(jumlahWord,semua.length);
  return semua.length;
}

async function jalankan(cek) {
  async function uji(nama,fn){try{await fn();cek(true,nama);}catch(e){cek(false,nama,e.stack||e.message);}}
  await uji('mapping: seluruh 56 keluarga pada setiap tingkat sesuai gambar terbaru',function(){
    var seen=new Set(), jumlah=0;
    Bank.katalog().forEach(function(s){s.keluarga.forEach(function(k,i){
      ['mudah','sedang','sulit'].forEach(function(level){
        if(!Bank.tingkatBoleh(s.subtes,s.kunci,i,level))return;
        var b=buatButir(s.subtes,s.kunci,i,level,20261022+i*1000);
        assert.deepStrictEqual(b.klasifikasi,acuan(b),k.id+'/'+level);seen.add(JSON.stringify(b.klasifikasi));jumlah++;
        if(b.isian && b.isian.kontrol)b.isian.kontrol.filter(function(c){return c.nama==='persen';}).forEach(function(c){assert.strictEqual(c.langkah,1,'Kelipatan persen '+k.id+'/'+level);});
      });
    });});
    assert.strictEqual(seen.size,25);assert(jumlah>=150);
  });
  await uji('mapping: nilai lama, klasifikasi hilang, dan cabang interaktif salah ditolak',function(){
    var hasil=Paket.buat({jumlahPaket:1,benih:20261022}).hasil,b=hasil.paket[0].subtes[0].butir[0];
    var asli=b.klasifikasi;
    ['category','lesson','chapter','subchapter'].forEach(function(field){b.klasifikasi=Object.assign({},asli);b.klasifikasi[field]='label lama';assert(!V.periksaHasil(hasil,{tanpaKembar:true}).lulus,field);});
    delete b.klasifikasi;assert(!V.periksaHasil(hasil,{tanpaKembar:true}).lulus);b.klasifikasi=asli;
    var pn=buatButir('pn','tabel',0,'sedang',3);pn.isian.pilihan.push('Tambahan');assert(K.periksa(pn).length>0);
    pn=buatButir('pn','pie',0,'sedang',3);pn.model.bentuk='kosong';assert(K.periksa(pn).length>0);
    assert.throws(function(){K.klasifikasi({subtes:'asing'});});
  });
  await uji('mapping: baca balik Word, Excel, JSON untuk 57 soal / 25 jalur, termasuk tabel 2/3/4 opsi dan dua jenis pie',async function(){
    var c=buatContoh(),files=await E.berkasPaket(c.hasil.paket[0],{docx:true,benih:20261022});
    assert.strictEqual(await periksaEkspor(c.hasil,files,await E.xlsx(c.hasil),E.json(c.hasil,{},c.validasi)),57);
  });
}
module.exports={ACUAN:ACUAN,acuan:acuan,buatContoh:buatContoh,periksaEkspor:periksaEkspor,jalankan:jalankan};
if(require.main===module){var gagal=0;jalankan(function(ok,n,d){console.log((ok?'ok ':'GAGAL ')+n+(d?'\n'+d:''));if(!ok)gagal++;}).then(function(){process.exitCode=gagal?1:0;});}
