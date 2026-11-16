'use strict';
var A=require('assert'),fs=require('fs'),path=require('path'),url=require('url'),Peramban=require('./peramban');
async function utama(){
  var dir=path.resolve('../hasil-badges-v15/laba-produk/pratinjau');fs.mkdirSync(dir,{recursive:true});
  var p=await Peramban.buka(url.pathToFileURL(path.resolve('index.html')).href,{lebar:1280,tinggi:1050});A(p,'Browser diperlukan untuk uji produk');
  try{
    var hasil=await p.evaluasi('('+async function(){
      function isi(id,v){var e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('change'));}
      isi('mode-generate','materi');isi('materi-category','Numerik/ Kuantitatif');isi('materi-lesson','SHL Interaktif');isi('materi-chapter','pn-peringkat');isi('materi-subchapter','pn-peringkat');
      document.getElementById('materi-jumlah').value=5;document.getElementById('btn-tambah-materi').click();
      isi('tingkat','sedang');isi('benih','20261026');isi('jumlah','1');await AppOjk.generate();
      var st=AppOjk.state.hasil.paket[0].subtes[0],bs=st.butir,i=bs.findIndex(function(b){return b.keluarga==='peringkat-produk';});
      if(i<0)throw new Error('Pola produk tidak muncul pada lima soal Badges sedang');
      var b=Bank.buat('pn','peringkat',4,'sedang',20261026,{acuanAkademik:true});Object.assign(b,{id:bs[i].id,no:bs[i].no,paket:bs[i].paket,tingkatNama:'Sedang'});bs[i]=b;
      AppOjk.tampilkanPaket();window.produkButir=b;window.produkCard=document.getElementById('soal-'+b.id);
      produkCard.querySelector('.coba-buka').click();window.produkWidget=produkCard.querySelector('.wadah-coba');
      produkCard.scrollIntoView({block:'start'});
      return {lulus:AppOjk.state.validasi.lulus,fam:new Set(bs.map(function(b){return b.keluarga;})).size,cards:produkCard.querySelectorAll('.produk-item').length,icons:produkCard.querySelectorAll('.produk-ikon svg').length,awal:produkWidget.kendaliCoba.ambil()};
    }.toString()+')()');
    A(hasil.lulus);A.strictEqual(hasil.fam,5);A.strictEqual(hasil.cards,6);A.strictEqual(hasil.icons,12);A.deepStrictEqual(hasil.awal.peringkat,Array(6).fill(null));
    var layout=await p.evaluasi('('+function(){
      var rs=Array.from(produkCard.querySelectorAll('.produk-item')).map(function(e){var r=e.getBoundingClientRect();return {x:r.x,y:r.y};});
      return {rs:rs,rows:produkCard.querySelector('.peringkat-daftar').getBoundingClientRect().bottom,tray:produkCard.querySelector('.badge-daftar').getBoundingClientRect().top,overflow:produkCard.scrollWidth>produkCard.clientWidth};
    }.toString()+')()');
    A.strictEqual(layout.rs[0].y,layout.rs[1].y);A(layout.rs[1].x>layout.rs[0].x);A(layout.rs[2].y>layout.rs[0].y);A(layout.rows<layout.tray);A(!layout.overflow);
    await p.layar(path.join(dir,'generator-produk.png'));
    console.log('ok produk: Chapter Badges menghasilkan lima keluarga; data 2x3, enam ikon, badge di bawah, awal kosong');
    var interaksi=await p.evaluasi('('+function(){
      var w=produkWidget,api=w.kendaliCoba,rows=w.querySelectorAll('.peringkat-baris'),buttons=w.querySelectorAll('.badge-nomor'),key=[2,6,5,3,1,4];
      key.forEach(function(r,i){buttons[r-1].click();rows[i].querySelector('.peringkat-nama').click();});var klik=api.periksa().benar;
      api.ulang();var dt=new DataTransfer();dt.setData('text/plain','2');rows[0].dispatchEvent(new DragEvent('drop',{dataTransfer:dt,bubbles:true,cancelable:true}));var drag=api.ambil().peringkat[0]===2;
      var sel=rows[1].querySelector('select');sel.value='2';sel.dispatchEvent(new Event('change'));var tukar=api.ambil().peringkat[1]===2&&api.ambil().peringkat[0]===null;
      api.kunci();var kunci=api.periksa().benar;api.ulang();var reset=api.ambil().peringkat.every(function(r){return r===null;})&&!api.periksa().lengkap;
      return {klik:klik,drag:drag,tukar:tukar,kunci:kunci,reset:reset};
    }.toString()+')()');A(Object.values(interaksi).every(Boolean),JSON.stringify(interaksi));
    // Pilihan melalui keyboard sungguhan (ArrowDown) pada produk A.
    await p.evaluasi("produkWidget.querySelector('.peringkat-pilih').focus()");
    await p.kirim('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40,nativeVirtualKeyCode:40});
    await p.kirim('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40,nativeVirtualKeyCode:40});
    A.strictEqual(await p.evaluasi('produkWidget.kendaliCoba.ambil().peringkat[0]'),1);
    console.log('ok produk: klik, drag/drop, pertukaran, keyboard, kunci, reset');
    await p.ukuran(390,844);await p.evaluasi('produkWidget.kendaliCoba.ulang();produkCard.scrollIntoView({block:"start"});');
    A(await p.evaluasi('document.documentElement.scrollWidth<=innerWidth && produkCard.scrollWidth<=produkCard.clientWidth'));
    await p.layar(path.join(dir,'generator-produk-mobile.png'));
    A(!p.konsol.some(function(k){return k.jenis==='error';}),JSON.stringify(p.konsol));
    console.log('ok produk: layar ponsel tanpa luapan horizontal');
  }finally{await p.tutup();}
}
utama().catch(function(e){console.error(e.stack);process.exitCode=1;});
