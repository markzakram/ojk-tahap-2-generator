'use strict';
var assert=require('assert'),cp=require('child_process'),path=require('path');
var B=require('../js/bank'),P=require('../js/paket'),V=require('../js/validator'),K=require('../js/kerangka');
var E=require('../js/ekspor'),D=require('../js/dokumen'),G=require('../js/gambar'),F=require('../js/figural');
var Berkas=require('./berkas'),Siadu=require('./siadu'),Mapping=require('./mapping');
function semua(h){return h.paket.flatMap(function(p){return p.subtes.flatMap(function(s){return s.butir;});});}
async function jalankan(cek){
  async function uji(n,fn){try{await fn();cek(true,n);}catch(e){cek(false,n,e.stack||e.message);}}
  var katalog=B.katalogMateri();
  await uji('materi: katalog 17 Chapter / 25 jalur sesuai mapping akademik, semua keluarga tercakup',function(){
    assert.strictEqual(katalog.filter(function(m){return m.subchapter===null;}).length,17);
    var daun=katalog.filter(function(m){return !m.subchapterIds||!m.subchapterIds.length;});
    assert.strictEqual(daun.length,25);
    B.katalog().forEach(function(s){s.keluarga.forEach(function(k,i){
      var klas=K.dariKeluarga(s.subtes,B.ambil(s.subtes,s.kunci).submateri,k.id);
      assert.deepStrictEqual(klas,Mapping.acuan({subtes:s.subtes,keluarga:k.id}));
      assert.strictEqual(daun.filter(function(m){return m.subtes===s.subtes&&m.kunci===s.kunci&&m.keluarga.includes(i);}).length,1);
    });});
  });
  await uji('materi: setiap Chapter/Subchapter dan tingkat tersedia menghasilkan jumlah tepat, tanpa materi lain',function(){
    katalog.forEach(function(m){m.tingkat.concat(['campur']).forEach(function(lv){
      var r=P.buat({materi:[{id:m.id,jumlah:4}],tingkat:lv,benih:20261023});
      assert(r.validasi.lulus,m.id+'/'+lv+': '+JSON.stringify(r.validasi));assert.strictEqual(r.validasi.butir,4);
      semua(r.hasil).forEach(function(b){assert.strictEqual(b.klasifikasi.chapter,m.chapter);if(m.subchapter)assert.strictEqual(b.klasifikasi.subchapter,m.subchapter);if(lv!=='campur')assert.strictEqual(b.level,lv);});
      assert(r.hasil.paket[0].subtes.every(function(s){return s.menit===null;}));
    });});
  });
  await uji('materi: pilihan campuran, kuota per set, determinisme, dan batas tingkat dipatuhi',function(){
    var opt={materi:[{id:'ku-serial',jumlah:4},{id:'ku-tabel/aljabar-dasar',jumlah:5},{id:'pn-pie-kosong',jumlah:3}],jumlahPaket:3,benih:35};
    var a=P.buat(opt),b=P.buat(opt);assert(a.validasi.lulus);assert.deepStrictEqual(a.hasil,b.hasil);
    a.hasil.paket.forEach(function(p){var bs=p.subtes.flatMap(function(s){return s.butir;});assert.strictEqual(bs.length,12);
      assert.strictEqual(bs.filter(function(b){return b.keluarga==='serial';}).length,4);
      assert.strictEqual(bs.filter(function(b){return b.keluarga==='serial-ganda';}).length,0);
      var tabel=bs.filter(function(b){return b.keluarga==='tak-diketahui';});assert.strictEqual(tabel.length,5);assert(tabel.every(function(b){return b.level!=='mudah';}));
      assert.strictEqual(bs.filter(function(b){return b.keluarga==='pie-kosong';}).length,3);
    });
    var satu=P.buat(Object.assign({},opt,{jumlahPaket:1}));assert.deepStrictEqual(a.hasil.paket[0],satu.hasil.paket[0]);
    assert.deepStrictEqual(P.buat(Object.assign({},opt,{materi:opt.materi.slice().reverse()})).hasil,a.hasil);
  });
  await uji('materi: pilihan kosong, tumpang tindih, jumlah salah dan tingkat tidak tersedia ditolak',function(){
    [{mode:'materi',materi:[]},{materi:[{id:'tidak-ada',jumlah:1}]},
      {materi:[{id:'ku-serial',jumlah:0}]},{materi:[{id:'ku-serial',jumlah:61}]},{materi:[{id:'ku-serial',jumlah:1.5}]},
      {materi:[{id:'ku-serial',jumlah:2},{id:'ku-serial',jumlah:1}]},
      {materi:[{id:'ku-cerita',jumlah:2},{id:'ku-cerita/aljabar-dasar',jumlah:2}]},
      {materi:[{id:'ku-tabel/aljabar-dasar',jumlah:2}],tingkat:'mudah'},
      {materi:[{id:'ku-tabel/aljabar-dasar',jumlah:2}],proporsi:{mudah:1,sedang:0,sulit:0}}
    ].forEach(function(o){assert.throws(function(){P.mulai(o);});});
    var r=P.buat({materi:[{id:'ku-cerita/aljabar-dasar',jumlah:2}],benih:52});
    r.hasil.meta.materi[0].jumlah++;assert(!V.periksaHasil(r.hasil).lulus,'Kuota salah harus ditolak');
    r.hasil.meta.materi[0].jumlah--;r.hasil.meta.materi[0].subchapter='Laju dan Waktu';assert(!V.periksaHasil(r.hasil).lulus,'Subchapter lain harus ditolak');
  });
  await uji('figural: label titik di tengah bidang pada teks dan gambar, dengan maupun tanpa panah',function(){
    var ditemukan={};
    for(var n=1;n<=300&&Object.keys(ditemukan).length<2;n++){
      var b=F.buat('serial','sedang',n,{target:1});if(!b||!b.model.kanal.includes('titik'))continue;
      var adaPanah=b.model.kanal.includes('arah');
      assert(!/pangkal panah/i.test(b.pembahasan.join(' ')));
      assert(/titik di tengah bidang/i.test(b.pembahasan.join(' ')));
      var svg=G.daftarPembahasan(b).map(function(d){return G.svg(d).svg;}).join('');
      assert(/Titik di tengah bidang/.test(svg));assert(!/pangkal panah/i.test(svg));ditemukan[adaPanah]=true;
    }
    assert.deepStrictEqual(Object.keys(ditemukan).sort(),['false','true']);
  });
  await uji('materi: Word, Excel, JSON dan PDF memuat pilihan yang sama, tanpa durasi tryout',async function(){
    var r=P.buat({materi:[{id:'ku-serial',jumlah:2},{id:'ku-cerita/aljabar-dasar',jumlah:2},{id:'pn-target-2-opsi',jumlah:2}],benih:888});
    assert(r.validasi.lulus);
    var files=await E.berkasPaket(r.hasil.paket[0],{docx:true,pdf:true});
    var excel=await E.xlsx(r.hasil),json=E.json(r.hasil,{},r.validasi);
    assert.strictEqual(await Mapping.periksaEkspor(r.hasil,files,excel,json),6);
    var j=JSON.parse(json);assert.strictEqual(j.meta.mode,'materi');assert.strictEqual(j.meta.materi.length,3);assert.strictEqual(j.paket[0].mode,'materi');
    files.filter(function(f){return f.jenis==='docx';}).forEach(function(f){
      var txt=Siadu.bacaBadan(Buffer.from(f.data)).map(function(x){return x.p||'';}).join('\n');
      assert(txt.includes('Latihan per Materi'));assert(!/null menit|10 menit|18 menit/.test(txt));
    });
    Berkas.periksaPdf(Buffer.from(files.find(function(f){return f.jenis==='pdf';}).data));
    var model=D.dariPaket(r.hasil.paket[0],function(){return null;});assert(model.judul.includes('Latihan per Materi'));assert(!/null menit|10 menit|18 menit/.test(JSON.stringify(model)));
  });
  await uji('materi: CLI menampilkan katalog, menerima filter dan menolak opsi yang bertentangan',function(){
    function run(args){return cp.spawnSync(process.execPath,[path.resolve(__dirname,'../cli/generate.js')].concat(args),{encoding:'utf8'});}
    var a=run(['--daftar-materi']);assert.strictEqual(a.status,0);katalog.forEach(function(m){assert(a.stdout.includes(m.id+' | '));});
    var r=run(['--materi','ku-serial=3,ku-cerita/aljabar-dasar=2','--paket','2','--benih','33','--periksa-saja']);assert.strictEqual(r.status,0,r.stdout+r.stderr);assert(/10 butir/.test(r.stdout));
    [['--materi','ku-serial=3','--subtes','ku'],['--materi','ku-cerita/aljabar-dasar=0'],['--materi','ku-tabel/aljabar-dasar=3','--tingkat','mudah']].forEach(function(args){assert.strictEqual(run(args.concat(['--periksa-saja'])).status,1);});
  });
}
module.exports={jalankan:jalankan};
if(require.main===module){var gagal=0;jalankan(function(ok,n,d){console.log((ok?'ok ':'GAGAL ')+n+(d?'\n'+d:''));if(!ok)gagal++;}).then(function(){process.exitCode=gagal?1:0;});}
