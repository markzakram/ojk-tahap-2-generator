/* Jejak pembahasan posisi: setiap gambar hanya memuat informasi yang sudah diturunkan.
 * Posisi relatif tidak memakai batas urutan final sebelum semua petunjuk tersambung. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./svg'),require('./peringkat-data'),require('./rumus'),require('./badges-visual-qc'));
  else root.PeringkatLangkah=factory(root.Svg,root.PeringkatData,root.Rumus,root.BadgesVisualQc);
})(typeof self!=='undefined'?self:this,function(S,D,R,Qc){
  'use strict';
  function susun(m){
    var teks=[],gambar=[],posisi=m.nama.map(function(){return null;});
    function simpan(tahap,judul,t,baru,acuan,petunjuk){
      teks.push(t);
      var model={nama:m.nama.slice(),posisi:posisi.slice(),tahap:tahap,baru:baru==null?null:baru,acuan:acuan==null?null:acuan,petunjuk:petunjuk==null?null:petunjuk};
      if(m.kategoriEntitas)model.kategoriEntitas=m.kategoriEntitas;
      if(petunjuk!=null)model.jarak=m.petunjuk[petunjuk].jarak;
      if(tahap==='akhir'){var min=Math.min.apply(null,posisi);model.peringkat=posisi.map(function(x){return x-min+1;});}
      gambar.push({id:'posisi-langkah-'+gambar.length,jenis:'peringkat-langkah',judul:judul,setelah:t,model:model});
    }
    teks.push(m.kategoriEntitas?'Jika ada k nama di antara dua nama, selisih nomor peringkatnya adalah k + 1. Di atas berarti nomor peringkat lebih kecil.':'Jika ada k orang di antara dua orang, selisih nomor peringkatnya adalah k + 1. Orang yang lebih cepat memiliki nomor lebih kecil.');
    teks.push(R.baris('\\text{selisih peringkat} = \\text{banyak orang di antaranya} + 1'));
    simpan('awal','Kondisi awal: belum diurutkan','Kondisi awal: belum ada orang yang ditempatkan. Nama-nama berikut belum menunjukkan urutan peringkat.');
    posisi[0]=0;
    simpan('acuan','Langkah 1: tentukan titik acuan','Ambil posisi relatif '+m.nama[0]+' sebagai 0. Angka 0 hanya titik acuan, belum Peringkat 1. Posisi di kiri bernilai lebih kecil; posisi di kanan bernilai lebih besar.',0);
    var sisa=m.petunjuk.map(function(_,i){return i;}),langkah=2;
    while(sisa.length){
      var maju=false;
      for(var z=sisa.length-1;z>=0;z--){
        var j=sisa[z],c=m.petunjuk[j],x=posisi[c.orang],y=posisi[c.lain];
        if(x==null&&y==null)continue;
        if(x!=null&&y!=null){if(y-x!==c.jarak)throw new Error('Petunjuk posisi bertentangan');}
        else{
          var baru=x==null?c.orang:c.lain,acuan=x==null?c.lain:c.orang,arah=x==null?-1:1;
          posisi[baru]=posisi[acuan]+arah*c.jarak;
          var t='Langkah '+langkah+': '+D.teks(m,c)+' Dari '+m.nama[acuan]+' ('+posisi[acuan]+'), geser '+c.jarak+' posisi ke '+(arah>0?'kanan':'kiri')+'. '+m.nama[baru]+' berada pada posisi relatif '+posisi[baru]+'.';
          simpan('petunjuk','Langkah '+langkah+': tempatkan '+m.nama[baru],t,baru,acuan,j);langkah++;
        }
        sisa.splice(z,1);maju=true;
      }
      if(!maju)throw new Error('Petunjuk posisi terputus');
    }
    var min=Math.min.apply(null,posisi),max=Math.max.apply(null,posisi);
    if(posisi.some(function(x){return !Number.isInteger(x);})||new Set(posisi).size!==m.nama.length||max-min!==m.nama.length-1)throw new Error('Posisi tidak membentuk urutan lengkap');
    simpan('akhir','Urutan final: ubah menjadi nomor peringkat','Semua nama sudah ditempatkan. Posisi relatif terkecil adalah '+min+'. Jadikan posisi ini Peringkat 1, lalu beri nomor berurutan ke kanan. Peringkat = posisi relatif - ('+min+') + 1.');
    return {teks:teks,gambar:gambar};
  }
  function svg(m,judul){
    if(m.kategoriEntitas)return Qc.gambar('posisi',m,judul);
    var W=800,H=310,C=S.BAHAS,out='';
    function t(s,x,y,o){out+=S.teks(s,x,y,Object.assign({ukuran:18,isi:C.teks},o||{}));}
    out+=S.rect(1,1,W-2,H-2,{isi:'#ffffff',garis:'#cbd3df',tebal:1,rx:10});
    t(judul,24,32,{ukuran:23,tebal:true});
    if(m.tahap==='awal'){
      t('Semua posisi belum diketahui. Susunan kartu ini belum merupakan peringkat.',24,62,{ukuran:18});
      m.nama.forEach(function(n,i){var x=24+(i%4)*190,y=88+Math.floor(i/4)*83;
        out+=S.rect(x,y,180,66,{isi:'#f4f6fa',garis:'#cbd3df',tebal:1,rx:7});
        t(n,x+14,y+28,{tebal:true,ukuran:21});t('Posisi: ?',x+14,y+52,{ukuran:17,isi:C.teksRedup});
      });
      t('Mulai dengan satu titik acuan, lalu gunakan petunjuk satu per satu.',24,285,{ukuran:18});
    }else{
      var akhir=m.tahap==='akhir',diketahui=m.posisi.filter(function(x){return x!=null;}),min=Math.min.apply(null,diketahui),max=Math.max.apply(null,diketahui);
      var n=max-min+1,step=94,x0=(W-step*n)/2;
      function tengah(p){return x0+(p-min)*step+step/2;}
      t(akhir?'Peringkat 1 = tercepat. Nomor semakin besar berarti semakin lambat.':'Posisi relatif: semakin ke kiri, semakin cepat. Belum nomor peringkat.',24,62,{ukuran:18});
      if(m.tahap==='petunjuk'){
        var awal=m.posisi[m.acuan],tujuan=m.posisi[m.baru],tambah=tujuan>awal;
        t(m.jarak+' langkah = '+(m.jarak-1)+' orang di antara + 1',W/2,93,{rata:'middle',tebal:true,ukuran:19});
        out+=S.panah(tengah(awal),119,tengah(tujuan),119,{warna:C.panah,tebal:3,kepala:10});
        t(awal+' '+(tambah?'+':'-')+' '+m.jarak+' = '+tujuan,W/2,278,{rata:'middle',tebal:true,ukuran:21});
      }else t(akhir?'Nomor lencana ditampilkan di bawah setiap nama.':'Titik acuan boleh berada di mana saja dalam urutan akhir.',W/2,103,{rata:'middle',ukuran:18});
      for(var p=min;p<=max;p++){
        var i=m.posisi.indexOf(p),baru=!akhir&&i===m.baru,acuan=!akhir&&i===m.acuan;
        var warna=akhir?C.jawab:baru?C.sorot:acuan?C.panah:'#8490a4',latar=akhir?C.latarJawab:baru?C.latarSorot:acuan?C.latarPanah:'#f4f6fa';
        var cx=tengah(p),x=cx-43;
        out+=S.rect(x,143,86,91,{isi:latar,garis:warna,tebal:baru||acuan?2.5:1,rx:6});
        t(i<0?'?':m.nama[i],cx,174,{rata:'middle',tebal:true,ukuran:20});
        t(akhir?'Peringkat':'Relatif',cx,198,{rata:'middle',ukuran:14,isi:C.teksRedup});
        if(akhir)out+=S.lingkaran(cx,218,16,{isi:C.jawab});
        t(akhir?m.peringkat[i]:p,cx,225,{rata:'middle',tebal:true,ukuran:akhir?22:24,isi:akhir?'#ffffff':warna});
        if(akhir)t('Relatif '+p,cx,255,{rata:'middle',ukuran:15});
        else if(baru||acuan)t(baru?'BARU':'RUJUKAN',cx,253,{rata:'middle',ukuran:14,tebal:true,isi:warna});
      }
      if(akhir)t('Urutan selesai: seluruh petunjuk terpenuhi.',24,289,{ukuran:18,isi:C.jawab});
      else{
        var belum=m.nama.filter(function(_,i){return m.posisi[i]==null;});
        t(belum.length?'Belum ditempatkan: '+belum.join(', ')+'.':'Semua nama tersambung; berikutnya tentukan nomor peringkat.',24,300,{ukuran:17,isi:C.teksRedup});
      }
    }
    return {svg:S.doc(out,W,H),lebar:W,tinggi:H};
  }
  return {susun:susun,GAMBAR:{'peringkat-langkah':svg}};
});
