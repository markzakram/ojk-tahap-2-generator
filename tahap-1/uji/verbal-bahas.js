'use strict';
var assert=require('assert'),V=require('../js/verbal'),C=require('../js/validator'),K=require('../js/kerangka');
var D=require('../js/dokumen'),E=require('../js/ekspor'),P=require('../js/paket'),B=require('./berkas'),S=require('./siadu');
function satu(j,seed){
  for(var n=0;n<200;n++){
    var b=V.buat('bacaan-pernyataan',j.level,seed+n,{jenis:j.id,target:{B:0,S:1,TD:2}[j.truth]});
    if(b)return b;
  }
  throw new Error('Jenis tidak terbentuk: '+j.id);
}
async function jalankan(cek){
  async function uji(n,fn){try{await fn();cek(true,n);}catch(e){cek(false,n,e.stack||e.message);}}
  var contoh=[];
  await uji('verbal: 704 soal / 57 jenis / 20 topik, salinan bacaan lengkap, nomor bukti sah, dan kunci diturunkan ulang',function(){
    var jumlah=0,tema=new Set();
    V.JENIS.forEach(function(j){
      for(var seed=1;seed<=12;seed++){
        var b=satu(j,seed),v=b.pembahasanVerbal,r=C.periksaButir(b);
        assert(r.lulus,j.id+': '+r.masalah.join('; '));
        assert.strictEqual(v.kalimat.map(function(k){return k.teks;}).join(' '),b.stimulus.teks[0]);
        assert.strictEqual(v.kalimat.filter(function(k){return k.warna;}).length,v.bukti.length);
        D.pembahasanBadan(b).forEach(function(t){assert.strictEqual(D.runsPembahasan(b,t).map(function(r){return r.teks;}).join(''),t,'Teks hilang saat diberi warna');});
        tema.add(b.model.tema);jumlah++;if(seed===1)contoh.push(b);
      }
    });
    assert.strictEqual(jumlah,684);
    V.TOPIK.forEach(function(tp){
      var b=null;
      for(var seed=1;seed<=100&&!b;seed++)b=V.buat('bacaan-pernyataan','mudah',seed,{tema:tp.id,target:0});
      assert(b,tp.id);assert(C.periksaButir(b).lulus,tp.id);tema.add(b.model.tema);jumlah++;
    });
    assert.strictEqual(jumlah,704);assert.strictEqual(tema.size,20);
  });
  await uji('verbal: 513 mutasi kutipan, nomor, warna, rujukan, kesimpulan, dan cara cepat ditolak',function(){
    var ubah=[
      function(b){delete b.pembahasanVerbal;},
      function(b){b.pembahasanVerbal.kalimat[0].teks+=' Informasi tambahan.';},
      function(b){b.pembahasanVerbal.kalimat[0].nomor=99;},
      function(b){b.pembahasanVerbal.bukti=[999];},
      function(b){b.pembahasanVerbal.kalimat[b.pembahasanVerbal.bukti[0]-1].warna='FF0000';},
      function(b){b.pembahasanVerbal.penjelasan=b.pembahasanVerbal.penjelasan.replace(/\(\d+\)/g,'(999)');},
      function(b){b.pembahasanVerbal.penjelasan=b.pembahasanVerbal.penjelasan.replace(/Jadi, jawabannya .*\.$/,'Jadi, jawabannya '+(b.kunci===0?'Salah':'Benar')+'.');},
      function(b){b.pembahasanVerbal.caraCepat='';},
      function(b){b.pembahasan[1]='(1) Kalimat pengganti.';}
    ];
    contoh.forEach(function(b){ubah.forEach(function(fn){var x=JSON.parse(JSON.stringify(b));fn(x);assert(!C.periksaButir(x).lulus,b.model.tipeKlaim);});});
    assert.strictEqual(contoh.length*ubah.length,513);
  });
  await uji('verbal: Word berwarna, Excel rich text, JSON, dan model PDF memuat pembahasan yang sama',async function(){
    var hasil=P.buat({jumlahPaket:1,subtes:'ku',benih:20261022,komposisi:{ku:{verbal:1,cerita:0,tabel:0,grafik:0,serial:0,matriks:0}}}).hasil;
    var p=hasil.paket[0],st=p.subtes[0];st.butir=contoh;st.jumlah=contoh.length;st.komposisi.verbal=contoh.length;
    contoh.forEach(function(b,i){b.id='P001-KU-'+(i+1);b.no=i+1;b.paket=1;b.submateriKomposisi='verbal';b.klasifikasi=K.klasifikasi(b);});
    var files=await E.berkasPaket(p,{docx:true}),word=Buffer.from(files[0].data);
    assert.deepStrictEqual(S.periksa(word,contoh,'latex'),[]);
    var xml=B.bacaZip(word).find(function(f){return f.nama==='word/document.xml';}).data.toString();
    ['0057B8','007B56'].forEach(function(c){assert(xml.includes('w:color w:val="'+c+'"'));});
    var body=S.pecahSoal(S.bacaBadan(word));
    var excel=Buffer.from(await E.xlsx(hasil)),sheet=B.periksaXlsx(excel).Soal;
    var sheetXml=B.bacaZip(excel).find(function(f){return f.nama==='xl/worksheets/sheet1.xml';}).data.toString();
    ['0057B8','007B56'].forEach(function(c){assert(sheetXml.includes('<color rgb="FF'+c+'"/>'));});
    var json=JSON.parse(E.json(hasil)).paket[0].subtes[0].butir;
    contoh.forEach(function(b,i){
      assert.strictEqual(sheet[i+1][sheet[0].indexOf('pembahasan')],b.pembahasan.join('\n'));
      assert.deepStrictEqual(json[i].pembahasanVerbal,b.pembahasanVerbal);
      D.pembahasanBadan(b).filter(function(t){return !/^Jenis soal: /.test(t);}).forEach(function(t){assert(body[i].isi.some(function(x){return x.p===t;}),'Word kehilangan baris');});
    });
    var pdf=D.dariPaket(p,function(){return null;},{});
    var flat=[];function baca(blok){blok.forEach(function(x){if(x.anak)baca(x.anak);if(x.runs)flat.push(x);});}baca(pdf.blok);
    contoh.forEach(function(b){b.pembahasanVerbal.kalimat.filter(function(k){return k.warna;}).forEach(function(k){
      assert(flat.some(function(x){return x.runs.map(function(r){return r.teks;}).join('')==='('+k.nomor+') '+k.teks && x.runs.some(function(r){return r.warna===k.warna;});}),'PDF kehilangan warna bukti');
    });});
  });
}
module.exports={jalankan:jalankan};
if(require.main===module){var gagal=0;jalankan(function(ok,n,info){console.log((ok?'ok ':'GAGAL ')+n+(info?'\n'+info:''));if(!ok)gagal++;}).then(function(){process.exitCode=gagal?1:0;});}
