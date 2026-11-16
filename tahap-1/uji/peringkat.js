'use strict';
var A=require('assert'),B=require('../js/bank'),P=require('../js/paket'),V=require('../js/validator');
var C=require('../js/cek-peringkat'),D=require('../js/peringkat-data'),L=require('../js/coba').logika;
var E=require('../js/ekspor'),Berkas=require('./berkas'),Siadu=require('./siadu');
function cp(x){return JSON.parse(JSON.stringify(x));}
function semua(h){return h.paket.flatMap(function(p){return p.subtes.flatMap(function(s){return s.butir;});});}
async function jalankan(cek){
  async function uji(n,fn){try{await fn();cek(true,n);}catch(e){cek(false,n,e.stack||e.message);}}
  await uji('Badges: 480 variasi, seluruh pola dan tingkat; petunjuk tunggal, kunci, awal kosong, duplikasi ditolak',function(){
    for(var i=0;i<4;i++)for(var lv of ['mudah','sedang','sulit'])for(var seed=0;seed<40;seed++){
      var b=B.buat('pn','peringkat',i,lv,seed+26000);A(b,'Gagal menyusun '+i+'/'+lv+'/'+seed);
      A.deepStrictEqual(V.periksaButir(b).masalah,[]);A(L.periksa(b.isian,b.isian.kunci).benar);
      A(!L.periksa(b.isian,b.isian.awal).lengkap);
      var wrong=cp(b.isian.kunci);wrong.peringkat[0]=wrong.peringkat[1];A(!L.periksa(b.isian,wrong).lengkap);A(!L.periksa(b.isian,wrong).benar);
      wrong=cp(b);wrong.isian.kunci.peringkat.reverse();A(!V.periksaButir(wrong).lulus);
      wrong=cp(b);wrong.isian.kartu[0].petunjuk.push('Petunjuk yang tidak ada.');A(!V.periksaButir(wrong).lulus);
      A.strictEqual(b.klasifikasi.chapter,'Badges');A.strictEqual(b.klasifikasi.subchapter,null);
    }
  });
  await uji('Badges: relasi bertentangan, petunjuk kurang, nilai seri, rujukan melingkar ditolak',function(){
    var b=B.buat('pn','peringkat',0,'sedang',25),m=cp(b.model),c=m.petunjuk[0];
    m.petunjuk.push({jenis:'banding',orang:c.lain,lain:c.orang});A.throws(function(){C.pecahkan(m);},/bertentangan/);
    m=cp(b.model);m.petunjuk=m.petunjuk.filter(function(c){return c.jenis==='banding';});m.petunjuk.pop();A.throws(function(){C.pecahkan(m);},/lebih dari satu/);
    m={tipe:'waktu',nama:['A','B','C','D'],jamPerHari:8,petunjuk:[0,1,2,3].map(function(i){return {jenis:'nilai',bidang:'t',orang:i,nilai:i<2?20:30+i};})};
    A.throws(function(){C.pecahkan(m);},/seri/);
    m.petunjuk[0]={jenis:'turunan',bidang:'t',orang:0,ref:'t_1',num:1,den:1,tambah:1};
    m.petunjuk[1]={jenis:'turunan',bidang:'t',orang:1,ref:'t_0',num:1,den:1,tambah:1};A.throws(function(){C.pecahkan(m);},/melingkar/);
    b=B.buat('pn','peringkat',2,'sulit',9);b.pembahasan=b.pembahasan.map(function(t){return t.startsWith('Hasil ')?t+' salah':t;});A(!V.periksaButir(b).lulus);
  });
  await uji('Badges: waktu contoh 24/32/33/34/36/40 dan profit contoh dihitung ulang independen',function(){
    var nama=['Catharina','Hestu','Lili','Rey','Tiara','Marcell'];
    var pet=[{jenis:'nilai',bidang:'t',orang:5,nilai:40},{jenis:'nilai',bidang:'t',orang:2,nilai:3,hari:true}];
    [[3,'t_2',1,1,12],[4,'t_5',3,5,8],[1,'t_4',7,8,5],[0,'t_5',1,1,-6]].forEach(function(r){pet.push({jenis:'turunan',bidang:'t',orang:r[0],ref:r[1],num:r[2],den:r[3],tambah:r[4]});});
    var s=C.pecahkan({tipe:'waktu',nama:nama,jamPerHari:8,petunjuk:pet});A.deepStrictEqual(s.nilai,[34,33,24,36,32,40]);A.deepStrictEqual(s.peringkat,[4,3,1,5,2,6]);
    var rows=[[90,32,18],[120,35,28],[120,24,22],[90,30,18],[150,30,20],[150,40,25]];
    pet=rows.flatMap(function(r,i){return ['q','p','c'].map(function(f,j){return {jenis:'nilai',bidang:f,orang:i,nilai:r[j]};});});
    s=C.pecahkan({tipe:'laba',nama:nama,petunjuk:pet});A.deepStrictEqual(s.nilai,[1260,840,240,1080,1500,2250]);A.deepStrictEqual(s.peringkat,[3,5,6,4,2,1]);
  });
  await uji('Badges laba: enam narasi acuan lengkap, pecahan antarorang dan biaya 62,5% memberi urutan yang benar',function(){
    var m={tipe:'laba',nama:['Catharina','Hestu','Lili','Rey','Tiara','Marcell'],petunjuk:[]};
    function nilai(i,f,v){m.petunjuk.push({jenis:'nilai',orang:i,bidang:f,nilai:v});}
    function rel(i,f,ref,num,den,persen){m.petunjuk.push({jenis:'turunan',orang:i,bidang:f,ref:ref,num:num,den:den,tambah:0,persen:!!persen});}
    rel(0,'q','q_5',3,5);rel(0,'p','p_5',4,5);nilai(0,'c',18);
    nilai(1,'q',120);nilai(1,'p',35);rel(1,'c','p_1',80,100,true);
    rel(2,'q','q_4',4,5);rel(2,'p','p_4',80,100,true);nilai(2,'c',22);
    nilai(3,'q',90);nilai(3,'p',30);rel(3,'c','p_3',3,5);
    nilai(4,'q',150);nilai(4,'p',30);nilai(4,'c',20);
    rel(5,'q','q_1',5,4);nilai(5,'p',40);rel(5,'c','p_5',5,8,true);
    var expected=[
      'Menjual 3/5 dari jumlah produk yang dijual Marcell. Harga jual per produk 4/5 dari harga jual per produk Marcell. Biaya produksi $18 per produk.',
      'Menjual 120 produk. Harga jual $35 per produk. Biaya produksi per produk 80% dari harga jual per produk.',
      'Menjual 4/5 dari jumlah produk yang dijual Tiara. Harga jual per produk 80% dari harga jual per produk Tiara. Biaya produksi $22 per produk.',
      'Menjual 90 produk. Harga jual $30 per produk. Biaya produksi per produk 3/5 dari harga jual per produk.',
      'Menjual 150 produk. Harga jual $30 per produk. Biaya produksi $20 per produk.',
      'Menjual 5/4 dari jumlah produk yang dijual Hestu. Harga jual $40 per produk. Biaya produksi per produk 62,5% dari harga jual per produk.'
    ];
    var kartu=D.kartu(m);A.deepStrictEqual(kartu.map(function(k){return k.petunjuk;}),expected.map(function(t){return [t];}));
    A.deepStrictEqual(D.stimulus(m).slice(1),expected.map(function(t,i){return m.nama[i]+': '+t;}));
    var sol=C.pecahkan(m);A.deepStrictEqual(sol.nilai,[1260,840,240,1080,1500,2250]);A.deepStrictEqual(sol.peringkat,[3,5,6,4,2,1]);
  });
  await uji('Badges laba: narasi generatif satu paragraf, tiga data per orang, biaya persen dan pecahan, tanpa membocorkan keuntungan',function(){
    for(var level of ['mudah','sedang','sulit'])for(var seed=0;seed<50;seed++){
      var b=B.buat('pn','peringkat',3,level,seed+1000);A(b);A(V.periksaButir(b).lulus);
      A.strictEqual(b.stimulus.teks.length,b.isian.nama.length+b.isian.pengantar.length);
      b.isian.kartu.forEach(function(k,i){A.strictEqual(k.petunjuk.length,1);var t=k.petunjuk[0];A(/^Menjual /.test(t));A(t.includes('; harga '));A(t.includes(', biaya '));A(!/[=]|keuntungan|Hasil|Peringkat/.test(t));A(b.stimulus.teks.includes(k.nama+': '+t));});
      if(level!=='mudah'){
        A(b.isian.kartu.some(function(k){return k.petunjuk[0].includes('62,5%');}));
        A(b.isian.kartu.some(function(k){return k.petunjuk[0].includes('60% harga jual');}));
        A(b.pembahasan.some(function(t){return t.includes('62{,}5\\%');}));
      }
      var salah=cp(b);salah.isian.kartu[0].petunjuk[0]+=' Tambahan informasi.';A(!V.periksaButir(salah).lulus);
    }
  });
  await uji('mapping 26 Oktober: kuota baku 12 KU / 10 PN, Badges 2, tiap chapter tabel/pie satu, kelompok matriks terpenuhi',function(){
    for(var seed=0;seed<15;seed++){
      var h=P.buat({benih:seed}).hasil;A(V.periksaHasil(h).lulus);
      var ku=h.paket[0].subtes[0],pn=h.paket[0].subtes[1];A.strictEqual(ku.jumlah,12);A.strictEqual(pn.jumlah,10);
      A.strictEqual(ku.butir.filter(function(b){return b.submateri==='verbal';}).length,3);
      var chapters={};pn.butir.forEach(function(b){chapters[b.klasifikasi.chapter]=(chapters[b.klasifikasi.chapter]||0)+1;});
      A.deepStrictEqual(chapters,{'Bar Chart':2,'Table Decision - 2 Opsi':1,'Table Decision - 3-4 Opsi':1,'Badges':2,'Line Graph':2,'Pie Chart - Informasi Penuh':1,'Pie Chart - 1 Informasi Kosong':1});
      A.strictEqual(ku.butir.filter(function(b){return ['matriks-3','matriks-sekat'].includes(b.keluarga);}).length,1);
      A.strictEqual(ku.butir.filter(function(b){return ['matriks-latin','matriks-isi'].includes(b.keluarga);}).length,1);
    }
    A.strictEqual(P.normalisasi({komposisi:{pn:{bar:1,tabel:0,garis:0,pie:0}}}).komposisi.pn.peringkat,0);
  });
  await uji('Badges: pilih Chapter saja, kelima pola tersedia; Word/Excel/JSON mempertahankan petunjuk, mapping dan kunci',async function(){
    var h=P.buat({materi:[{id:'pn-peringkat',jumlah:12}],benih:20261026}).hasil,bs=semua(h);
    A.strictEqual(new Set(bs.map(function(b){return b.keluarga;})).size,5);A(bs.every(function(b){return b.submateri==='peringkat';}));
    var files=await E.berkasPaket(h.paket[0],{docx:true});
    for(var f of files)A.deepStrictEqual(Siadu.periksa(Buffer.from(f.data),bs,'latex'),[]);
    var sheet=Berkas.periksaXlsx(Buffer.from(await E.xlsx(h))).Soal,head=sheet[0],json=JSON.parse(E.json(h)).paket[0].subtes[0].butir;
    bs.forEach(function(b,i){var row=sheet[i+1];A.strictEqual(row[head.indexOf('chapter')],'Badges');A.strictEqual(row[head.indexOf('subchapter')],'');A.strictEqual(row[head.indexOf('bentuk_soal')],'Logical Ranking');
      A.deepStrictEqual(json[i].isian,b.isian);A.strictEqual(json[i].bentukSoal,'Logical Ranking');
      D.stimulus(b.model).forEach(function(t){A(row[head.indexOf('soal')].includes(t));A(json[i].soal.includes(t));});
    });
  });
}
module.exports={jalankan:jalankan};
if(require.main===module){var gagal=0;jalankan(function(ok,n,d){console.log((ok?'ok ':'GAGAL ')+n+(d?'\n'+d:''));if(!ok)gagal++;}).then(function(){process.exitCode=gagal?1:0;});}
