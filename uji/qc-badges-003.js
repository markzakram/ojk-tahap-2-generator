'use strict';
var A=require('assert'),fs=require('fs'),path=require('path'),crypto=require('crypto');
var B=require('../js/bank'),P=require('../js/paket'),V=require('../js/validator'),C=require('../js/cek-peringkat'),K=require('../js/cek-kartu-badges');
var Bank=require('../js/bank-aset-badges'),S=require('../js/svg'),Raster=require('../js/svgraster'),Met=require('../js/metrik');
function buatContoh(ringkas){
  var indices=ringkas?[0,1,2,3,4,5,6,7,8,9,20,21]:Array.from({length:50},function(_,i){return i;}),plan=indices.map(function(i){var fam=i%5,round=Math.floor(i/5),level=['mudah','sedang','mudah','sedang','sulit','sedang','mudah','sedang','sulit','sedang'][round];if(fam===4&&level==='sulit')level='sedang';return {fam:fam,level:level,kategori:Bank.KATEGORI[(round+fam)%6],seed:20261028+i*1009};});
  var counts={mudah:0,sedang:0,sulit:0};plan.forEach(function(x){counts[x.level]++;});
  var h=P.buat({materi:[{id:'pn-peringkat',jumlah:indices.length}],proporsi:counts,benih:20261028}).hasil,p=h.paket[0],st=p.subtes[0];p.no=3;p.id='P003';
  st.butir=plan.map(function(x,j){var b=B.buat('pn','peringkat',x.fam,x.level,x.seed,{kategoriEntitas:x.kategori});A(b);b.no=j+1;b.id='P003-PN-'+String(j+1).padStart(2,'0');b.paket=3;b.tingkatNama=x.level[0].toUpperCase()+x.level.slice(1);return b;});
  A(V.periksaHasil(h).lulus,JSON.stringify(V.periksaHasil(h)));return h;
}
async function jalankan(cek){
  async function uji(n,fn){try{await fn();cek(true,n);}catch(e){cek(false,n,e.stack||e.message);}}
  await uji('QC Badges 003: 75 pasangan manifest utuh, enam kategori, SHA sumber dan gambar offline cocok',function(){
    var root=path.resolve(__dirname,'../bank_aset_badges'),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8')),ids=new Set();A.strictEqual(manifest.length,75);A.strictEqual(Bank.SEMUA.length,75);
    manifest.forEach(function(r){var p=Bank.cari(r.nama,r.kategori);A(p);A.strictEqual(p.id,r.asset_id);A.strictEqual(p.berkas,'bank_aset_badges/'+r.file);A.strictEqual(p.sha256,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,r.file))).digest('hex'));ids.add(p.id);var im=Bank.gambar(p.id);A.strictEqual(im.raw.length,im.lebar*im.tinggi*3);A(Bank.url(p.id).startsWith('data:image/png;base64,'));});A.strictEqual(ids.size,75);
  });
  await uji('QC Badges 003 v21: 420 variasi; 6–8 variabel, kalimat tanpa kode, satu solusi dari teks kartu',function(){
    var total=0;
    for(var category of Bank.KATEGORI)for(var f=0;f<5;f++)for(var lv of ['mudah','sedang','sulit'])if(f!==4||lv!=='sulit')for(var seed=0;seed<5;seed++){
      var b=B.buat('pn','peringkat',f,lv,20261028+seed,{kategoriEntitas:category});A.deepStrictEqual(V.periksaButir(b).masalah,[]);A.deepStrictEqual(C.pecahkan(K.modelDari(b)).peringkat,b.isian.kunci.peringkat);total++;
      A(b.isian.nama.length>=6&&b.isian.nama.length<=8);
      A(b.isian.pengantar.concat(b.isian.kartu.map(function(k){return k.petunjuk[0];})).every(function(t){return !/[=]|Kode nama|\b[JHBWUL]\([A-Z]\)/.test(t);}));
      A(b.isian.kartu.filter(function(k){return !k.petunjuk[0];}).length<=2);
      b.isian.kartu.forEach(function(k,i){A.strictEqual(k.petunjuk.length,1);if(f!==4&&k.petunjuk[0])A(/[a-z]/.test(k.petunjuk[0]));A.strictEqual(b.isian.profil[i].nama,k.nama);A.strictEqual(b.isian.profil[i].kategori,category);});
    }A.strictEqual(total,420);
  });
  await uji('QC v21: kalimat pecahan, persen, tambahan, hari kerja dan nama lengkap dihitung dari narasi',function(){
    var nama=['Motor','Truk','Ambulans','Buldozer','Ekskavator','Helikopter'],text=['Waktunya 40 jam.','Waktunya 1/4 dari waktu Motor, kemudian ditambah 13 jam.','Waktunya 2 hari kerja.','Waktunya 80% dari waktu Motor.','Waktunya 1/2 dari waktu Ambulans, kemudian ditambah 1 jam.','Waktunya sama dengan waktu Truk, kemudian ditambah 5 jam.'];
    var b={model:{tipe:'waktu',kategoriEntitas:'kendaraan'},isian:{nama:nama,pengantar:['Satu hari kerja terdiri atas 8 jam.'],kartu:nama.map(function(n,i){return {nama:n,petunjuk:[text[i]]};})}};
    A.deepStrictEqual(C.pecahkan(K.modelDari(b)),{peringkat:[6,3,2,5,1,4],nilai:[40,23,16,32,9,28]});
    var x=JSON.parse(JSON.stringify(b));x.isian.kartu[1].petunjuk=['W=1/4 W(M) +13.'];A.throws(function(){K.modelDari(x);});
    x=JSON.parse(JSON.stringify(b));x.isian.kartu[1].petunjuk=['Waktunya 1/4 dari waktu Mobil, kemudian ditambah 13 jam.'];A.throws(function(){K.modelDari(x);},/rujukan/);
    x=JSON.parse(JSON.stringify(b));x.isian.kartu[1].petunjuk=['Waktunya 40 jam.'];A.throws(function(){C.pecahkan(K.modelDari(x));},/seri/);
    x=JSON.parse(JSON.stringify(b));x.isian.kartu[0].petunjuk=['Waktunya sama dengan waktu Truk, kemudian ditambah 1 jam.'];x.isian.kartu[1].petunjuk=['Waktunya sama dengan waktu Motor, kemudian ditambah 1 jam.'];A.throws(function(){C.pecahkan(K.modelDari(x));},/melingkar/);
    x=JSON.parse(JSON.stringify(b));x.isian.pengantar=[];A.throws(function(){K.modelDari(x);},/Konversi/);
  });
  await uji('QC v21: narasi ambigu/bertentangan dan jumlah entitas di luar 6–8 ditolak',function(){
    var nama=['Ali','Bagas','Cinta','Dika','Elvi','Farhan'];
    function fixture(tipe,text){return {model:{tipe:tipe,kategoriEntitas:'orang'},isian:{nama:nama,pengantar:[],kartu:nama.map(function(n,i){return {nama:n,petunjuk:[text[i]]};})}};}
    var b=fixture('perbandingan',['Berada di atas Bagas.','Berada di atas Cinta.','Berada di atas Dika.','Berada di bawah Cinta.','Berada di bawah Cinta.','Berada pada peringkat terakhir.']);A.throws(function(){C.pecahkan(K.modelDari(b));},/lebih dari satu/);
    b.isian.kartu[2].petunjuk=['Berada di atas Elvi.'];b.isian.kartu[4].petunjuk=['Berada di atas Ali.'];A.throws(function(){C.pecahkan(K.modelDari(b));},/bertentangan/);
    var m={tipe:'waktu',kategoriEntitas:'orang',nama:nama.slice(0,5),petunjuk:[]};A.throws(function(){C.pecahkan(m);},/6–8/);m.nama=nama.concat(['Gilang','Haris','Intan']);A.throws(function(){C.pecahkan(m);},/6–8/);
  });
  await uji('QC Badges 003: pemadatan contoh Soal 2 tetap menghasilkan Citra/Lili/Farhan/Eko/Budi/Andi/Dewi/Tiara',function(){
    var names=['Farhan','Dewi','Citra','Lili','Eko','Tiara','Andi','Budi'],text=['3 peringkat di atas Andi.','3 peringkat di bawah Eko.','5 peringkat di atas Andi.','4 peringkat di atas Andi.','3 peringkat di bawah Citra.','7 peringkat di bawah Citra.','2 peringkat di atas Tiara.','Tepat di atas Andi.'];
    var b={model:{tipe:'posisi',kategoriEntitas:'orang'},isian:{nama:names,pengantar:[],kartu:names.map(function(n,i){return {nama:n,petunjuk:[text[i]]};})}};A.deepStrictEqual(C.pecahkan(K.modelDari(b)).peringkat,[3,7,1,2,4,8,6,5]);
    A.throws(function(){C.pecahkan({tipe:'perbandingan',nama:['Ali','Bagas','Cinta','Dika'],petunjuk:[{jenis:'banding',orang:0,lain:1},{jenis:'banding',orang:0,lain:2},{jenis:'tetap',orang:3,posisi:4}]});},/lebih dari satu/);
  });
  await uji('QC Badges 003: aset pada SVG tidak hilang di renderer Node; warna piksel sesuai gambar bank',function(){
    Bank.SEMUA.forEach(function(p){var im=Bank.gambar(p.id),pic=Raster.gambar(S.doc(Bank.svg(p.id,5,5,32,32),42,42),1);A.strictEqual(pic.kanal,3);
      [[0,0],[8,8],[16,16],[24,24]].forEach(function(q){var sx=Math.floor((q[0]+.5)*4),sy=Math.floor((q[1]+.5)*4),a=(sy*128+sx)*3,b=((q[1]+5)*42+q[0]+5)*3;A.deepStrictEqual(Array.from(pic.data.slice(b,b+3)),Array.from(im.raw.slice(a,a+3)));});
    });
  });
  await uji('QC Badges 003: P003 berisi 50 soal, 10 per keluarga; enam kategori, satu gambar tetap per identitas',function(){
    var h=buatContoh(false),p=h.paket[0],counts={},cats=new Set();A.strictEqual(p.id,'P003');A.strictEqual(p.no,3);A.strictEqual(p.subtes[0].butir.length,50);
    p.subtes[0].butir.forEach(function(b){counts[b.keluarga]=(counts[b.keluarga]||0)+1;cats.add(b.model.kategoriEntitas);A(b.id.startsWith('P003-'));var bad=JSON.parse(JSON.stringify(b));bad.isian.gambar[0].model.id=bad.isian.gambar[1].model.id;A(!V.periksaButir(bad).lulus);});A.strictEqual(cats.size,6);A.deepStrictEqual(Object.values(counts),[10,10,10,10,10]);
  });
}
module.exports={jalankan:jalankan,buatContoh:buatContoh};
if(require.main===module){var gagal=0;jalankan(function(ok,n,d){console.log((ok?'ok ':'GAGAL ')+n+(d?'\n'+d:''));if(!ok)gagal++;}).then(function(){process.exitCode=gagal?1:0;});}
