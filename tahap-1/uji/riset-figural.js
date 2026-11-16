'use strict';
var assert=require('assert'),Bank=require('../js/bank'),R=require('../js/riset-figural'),V=require('../js/validator'),G=require('../js/gambar'),P=require('../js/paket'),E=require('../js/ekspor');
function cp(x){return JSON.parse(JSON.stringify(x));}
function jalankan(cek,ops){
  ops=ops||{};var n=ops.n||35,total=0,mutasi=0,modes={};
  var ids=['serial','serial-ganda','matriks-3','matriks-sekat','matriks-latin','matriks-isi'];
  function test(name,fn){try{fn();cek(true,name);}catch(e){cek(false,name,e.message);}}
  test('Bank hanya memuat enam bentuk persis sesuai mapping',function(){
    var all=['serial','matriks'].flatMap(function(k){return Bank.ambil('ku',k).keluarga.map(function(f){return f.id;});});
    assert.deepStrictEqual(all,ids);assert.strictEqual(R.buat('lipat-lubang','mudah',1),null);
    assert.throws(function(){R.buat('serial','mudah',1,{varianRiset:'analogi'});},/luar batas riset/);
  });
  R.KELUARGA.forEach(function(k){['mudah','sedang','sulit'].forEach(function(level){R.varian(k.id,level).forEach(function(variant){
    test(k.nama+' / '+level+' / '+variant+': kunci diturunkan ulang, opsi unik, sumber dan gambar cocok',function(){
      var made=0;
      for(var i=0;i<n;i++){
        var b=R.buat(k.id,level,20261022+i*7919,{target:i%5,varianRiset:variant});
        if(!b)continue;made++;total++;
        var v=V.periksaButir(b);assert(v.lulus,JSON.stringify(v.masalah));assert.strictEqual(b.kunci,i%5);
        assert.deepStrictEqual(R.periksa(b),[]);assert.strictEqual(b.riset.pemetaan.category,'Penalaran Spasial');
        modes[b.pola]=true;
        var wrong=cp(b);wrong.kunci=(wrong.kunci+1)%5;assert(!V.periksaButir(wrong).lulus,'kunci salah lolos');mutasi++;
        var twice=cp(b);twice.opsi[(b.kunci+1)%5].gambar=cp(twice.opsi[b.kunci].gambar);assert(!V.periksaButir(twice).lulus,'dua opsi sama-benar lolos');mutasi++;
        var scope=cp(b);scope.keluarga='lipat-lubang';assert(!V.periksaButir(scope).lulus,'bentuk di luar mapping lolos');mutasi++;
        if(b.model.tipe==='pola-riset'){
          if(level==='sulit'){
            var key=b.model.pilihan[b.kunci][0],fields=[];
            if(key.mode==='atribut')key.unsur.forEach(function(_,j){['b','i'].forEach(function(f){fields.push(function(x){return x.unsur[j][f];});});});
            if(key.mode==='ukuran')['ukuran','arah','isi'].forEach(function(f){fields.push(function(x){return x[f];});});
            if(key.mode==='jumlah'){key.jumlah.forEach(function(_,j){fields.push(function(x){return x.jumlah[j];});});fields.push(function(x){return x.arah;});}
            fields.forEach(function(get){assert(b.model.pilihan.some(function(p){return get(p[0])!==get(key);}), 'Unsur yang dilabeli sulit tidak ikut diuji oleh pengecoh');});
          }
          var bad=cp(b),gm=bad.stimulus.gambar[0].model;
          if(gm.kotak)gm.kotak[1]=cp(gm.kotak[0]);else {var cells=gm.grid.flat().filter(Boolean);cells[0].mode='tidak-ada';}
          assert(!V.periksaButir(bad).lulus,'gambar yang dirusak lolos');mutasi++;
        }
        if(i===0){
          assert.deepStrictEqual(b,R.buat(k.id,level,20261022,{target:0,varianRiset:variant}));
          G.daftarSoal(b).concat(G.daftarPembahasan(b)).forEach(function(g){var image=G.svg(g);assert(image.lebar>0&&image.tinggi>0);assert(!/NaN|undefined/.test(image.svg));});
        }
      }
      assert(made>=n*.9,'Terlalu banyak soal gagal dirakit: '+made+'/'+n);
    });
  });});});
  test('Paket tiap tingkat: hanya enam bentuk, sumber wajib, komposisi dan anti-kembar lulus',function(){
    ['mudah','sedang','sulit','campur'].forEach(function(level){
      var x=P.buat({jumlahPaket:4,subtes:'ku',tingkat:level,benih:1022,komposisi:{ku:{verbal:0,cerita:0,tabel:0,grafik:0,serial:6,matriks:8}}});
      assert(x.validasi.lulus,JSON.stringify(x.validasi));
      var bs=x.hasil.paket.flatMap(function(p){return p.subtes[0].butir;});
      assert.deepStrictEqual(Array.from(new Set(bs.map(function(b){return b.keluarga;}))).sort(),ids.slice().sort());
      bs.forEach(function(b){assert(b.riset);assert.deepStrictEqual(R.periksa(b),[]);});
      delete x.hasil.paket[0].subtes[0].butir[0].riset;
      assert(!V.periksaHasil(x.hasil).lulus,'paket tanpa catatan pembatas riset lolos');
    });
  });
  test('Variasi riset mencakup distribusi, gerak, isian, hitungan, ukuran, gabung dan kurang',function(){
    ['distribusi-bentuk-warna','posisi-dan-isian','penggabungan-unsur','pengurangan-unsur','geser-catur-dua-posisi','geser-kolom','jumlah-objek','ukuran-putaran'].forEach(function(p){assert(Object.keys(modes).some(function(k){return k.endsWith(':'+p);}),p+' belum teruji');});
  });
  return {butir:total,mutasi:mutasi,pola:Object.keys(modes).length};
}
module.exports={jalankan:jalankan};
if(require.main===module){var fail=0;var r=jalankan(function(ok,name,info){console.log((ok?'ok ':'GAGAL ')+name+(info?': '+info:''));if(!ok)fail++;});console.log(JSON.stringify(r)+'; gagal='+fail);process.exitCode=fail?1:0;}
