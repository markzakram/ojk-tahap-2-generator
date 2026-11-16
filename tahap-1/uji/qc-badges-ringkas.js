'use strict';
var A=require('assert'),B=require('../js/bank'),V=require('../js/validator'),C=require('../js/cek-peringkat'),K=require('../js/cek-kartu-badges'),M=require('../js/metrik');
async function jalankan(cek){
  async function uji(n,fn){try{await fn();cek(true,n);}catch(e){cek(false,n,e.stack||e.message);}}
  await uji('QC v23: waktu/keuntungan mempertahankan hasil eksak saat relasi panjang dinyatakan lebih langsung',function(){
    var w=B.buat('pn','peringkat',2,'sedang',123,{kategoriEntitas:'perusahaan'}),l=B.buat('pn','peringkat',3,'sedang',123,{kategoriEntitas:'perusahaan'});
    A.deepStrictEqual(C.pecahkan(K.modelDari(w)).nilai,[40,16,25,39,43,30,35]);
    A.deepStrictEqual(C.pecahkan(K.modelDari(l)).nilai,[1400,5250,3080,3500,2400,840,2520]);
    A(V.periksaButir(w).lulus);A(V.periksaButir(l).lulus);
  });
  await uji('QC v23: satu kalimat/satu baris, tanpa pecahan angka atau petunjuk metode, termasuk nama perusahaan panjang',function(){
    for(var category of ['orang','perusahaan','kendaraan'])for(var f=0;f<5;f++)for(var lv of ['mudah','sedang','sulit'])if(f!==4||lv!=='sulit')for(var seed=0;seed<3;seed++){
      var b=B.buat('pn','peringkat',f,lv,20261030+seed,{kategoriEntitas:category});A.deepStrictEqual(V.periksaButir(b).masalah,[]);
      b.isian.kartu.forEach(function(c){var t=c.petunjuk[0];A(M.lebar(t,10.5,false)<=260);A(!/\b\d+\s*\/\s*\d+\b/.test(t));if(t)A.strictEqual((t.match(/\.(?:\s|$)/g)||[]).length,1);});
      A(!/Jika suatu petunjuk|Di atas berarti|Tidak ada nilai yang sama|Deskripsi kosong tidak berarti|Dua angka pada setiap|Kalikan|kerjakan|hitung bagian|Petunjuk tambahan:/.test(b.isian.pengantar.join(' ')+b.pertanyaan+b.perintah));
      A.deepStrictEqual(C.pecahkan(K.modelDari(b)).peringkat,b.isian.kunci.peringkat);
    }
  });
  await uji('QC v23: relasi pada pertanyaan tetap diperlukan; menghapusnya tidak boleh menyisakan kunci semu',function(){
    var b=B.buat('pn','peringkat',0,'sedang',20261030,{kategoriEntitas:'orang',deskripsiKosong:2});A(b.pertanyaan.indexOf('Pasangkan lencana ')>0);
    var x=JSON.parse(JSON.stringify(b));x.pertanyaan=x.pertanyaan.slice(x.pertanyaan.indexOf('Pasangkan lencana '));A.throws(function(){C.pecahkan(K.modelDari(x));},/lebih dari satu/);A(!V.periksaButir(x).lulus);
    x=JSON.parse(JSON.stringify(b));x.isian.pengantar.push('Kalikan kedua nilai untuk mendapatkan jawabannya.');A(!V.periksaButir(x).lulus);
    x=JSON.parse(JSON.stringify(b));var card=x.isian.kartu.find(function(c){return c.petunjuk[0];});card.petunjuk[0]+=' Gunakan semua petunjuk.';A(!V.periksaButir(x).lulus);
  });
}
module.exports={jalankan:jalankan};
if(require.main===module){var gagal=0;jalankan(function(ok,n,d){console.log((ok?'ok ':'GAGAL ')+n+(d?'\n'+d:''));if(!ok)gagal++;}).then(function(){process.exitCode=gagal?1:0;});}
