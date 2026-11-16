/* Contexts and narrative clue language following the latest academic QC.
 * Context never contributes an answer: only the explicit numbers/relations do. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./format'),require('./badges-shl'),require('./metrik'));
  else root.BadgesKonteks=factory(root.Fmt,root.BadgesShl,root.Metrik);
})(typeof self!=='undefined'?self:this,function(F,Shl,M){
  'use strict';
  var C={
    orang:{objek:'orang',ordinal:'jumlah batu bata yang dikumpulkan',arah:'terbesar',unit:'produk yang dijual',waktu:'waktu penyelesaian tugas'},
    produk:{objek:'produk',ordinal:'jumlah unit terjual',arah:'terbesar',unit:'unit produk yang dijual',waktu:'waktu produksi satu batch'},
    kendaraan:{objek:'kendaraan',ordinal:'biaya operasional bulanan dalam USD ($)',arah:'terkecil',unit:'layanan sewa kendaraan',waktu:'total waktu operasional'},
    hewan:{objek:'kelompok hewan',ordinal:'kebutuhan pakan mingguan seluruh kelompok dalam kg',arah:'terkecil',unit:'paket pakan untuk jenis hewan tersebut',waktu:'total waktu perawatan seluruh kelompok'},
    tumbuhan:{objek:'kelompok tanaman',ordinal:'jumlah bibit terjual dalam satu minggu',arah:'terbesar',unit:'bibit yang dijual',waktu:'total waktu perawatan seluruh kelompok'},
    perusahaan:{objek:'perusahaan',ordinal:'pendapatan bulanan dalam USD ($)',arah:'terbesar',unit:'unit barang yang dijual perusahaan',waktu:'waktu penyelesaian proyek'}
  };
  function ambil(m){var c=C[m.kategoriEntitas];if(!c)throw new Error('Kategori entitas Badges tidak sah');return c;}
  function fr(c){return c.persen?F.angka(c.num*100/c.den)+'%':c.den===1?String(c.num):c.num+'/'+c.den;}
  function narasi(m,c){
    if(c.jenis==='nilai')return 'Memerlukan '+F.angka(c.nilai)+(c.hari?' hari kerja.':' jam.');
    var ref=Number(c.ref.split('_')[1]),nama=m.nama[ref];
    if(c.num===c.den)return c.tambah?F.angka(Math.abs(c.tambah))+' jam lebih '+(c.tambah>0?'lama':'singkat')+' dari '+nama+'.':'Sama lama dengan '+nama+'.';
    return 'Waktunya '+F.angka(c.num*100/c.den)+'% waktu '+nama+(c.tambah?', '+(c.tambah>0?'ditambah ':'dikurangi ')+F.angka(Math.abs(c.tambah))+' jam':'')+'.';
  }
  function laba(m,i){
    function part(f){var c=m.petunjuk.find(function(c){return c.orang===i&&c.bidang===f;});if(!c)throw new Error('Data kartu tidak lengkap');
      if(c.jenis==='nilai')return f==='q'?'Menjual '+F.angka(c.nilai)+' unit':(f==='p'?'harga $':'biaya $')+F.angka(c.nilai);
      var ref=Number(c.ref.split('_')[1]),pct=F.angka(c.num*100/c.den)+'%';
      if(c.tambah)throw new Error('Tambahan pada kartu keuntungan ringkas belum didukung');
      return f==='q'?'Menjual '+pct+' penjualan '+m.nama[ref]:(f==='p'?'harga ':'biaya ')+pct+(ref===i?' harga jual':' harga '+m.nama[ref]);
    }
    return part('q')+'; '+part('p')+', '+part('c')+'.';
  }
  function relasiKartu(m,c,i){
    if(c.jenis==='tetap')return (c.orang===i?'Berada':m.nama[c.orang]+' berada')+' pada peringkat terakhir.';
    if(c.orang!==i&&c.lain!==i)return m.nama[c.orang]+' berada '+(c.jenis==='jarak'?c.jarak+' peringkat ':'')+'di atas '+m.nama[c.lain]+'.';
    return 'Berada '+(c.jenis==='jarak'?(c.jarak===1?'tepat ':c.jarak+' peringkat '):'')+'di '+(c.orang===i?'atas ':'bawah ')+m.nama[c.orang===i?c.lain:c.orang]+'.';
  }
  function fakta(m,c){
    return c.jenis==='tetap'?m.nama[c.orang]+' berada pada peringkat terakhir.':m.nama[c.orang]+' berada '+(c.jenis==='jarak'?c.jarak+' peringkat ':'')+'di atas '+m.nama[c.lain]+'.';
  }
  function lebar(s){return M.lebar(s,10.5,false);}
  function siapkan(m,v){
    if(m.tipe==='perbandingan'||m.tipe==='posisi'){
      var kosong=m.deskripsiKosong||[],owners=m.nama.map(function(_,i){return i;}).filter(function(i){return kosong.indexOf(i)<0;}),assigned={},prefer=m.petunjuk.map(function(c){return c.pemilik;});
      var kalimat=function(c,i){return m.ragam==='shl'?Shl.kalimatKartu(m,c,i):relasiKartu(m,c,i);};
      function pasang(i,seen){var idx=m.petunjuk.map(function(_,j){return j;}).sort(function(a,b){return (prefer[a]===i?0:prefer[a]<0?3:1)-(prefer[b]===i?0:prefer[b]<0?3:1);});
        for(var a=0;a<idx.length;a++){var j=idx[a];if(seen[j]||lebar(kalimat(m.petunjuk[j],i))>260)continue;seen[j]=true;if(assigned[j]==null||pasang(assigned[j],seen)){assigned[j]=i;return true;}}return false;
      }
      owners.forEach(function(i){if(!pasang(i,{}))throw new Error('Petunjuk tidak dapat dipadatkan menjadi satu baris');});
      m.petunjuk.forEach(function(c,j){c.pemilik=assigned[j]==null?-1:assigned[j];if(c.pemilik<0)c.lokasi='pertanyaan';else delete c.lokasi;});
      m.redaksiRingkas=true;
    }else if(m.tipe==='waktu'){
      m.petunjuk.forEach(function(c){if(c.jenis!=='turunan')return;c.persen=c.num!==c.den;if(lebar(narasi(m,c))>260){c.num=c.den=1;c.tambah=v['t_'+c.orang]-v[c.ref];delete c.persen;}});
    }else if(m.tipe==='laba'){
      m.petunjuk.forEach(function(c){if(c.jenis==='turunan')c.persen=true;});
      m.nama.forEach(function(_,i){while(lebar(laba(m,i))>260){var candidates=m.petunjuk.map(function(c,j){return {c:c,j:j};}).filter(function(x){return x.c.orang===i&&x.c.jenis==='turunan';}),best=null;
        candidates.forEach(function(x){var old=x.c,priority=Number(old.ref.split('_')[1])===i?1:0;m.petunjuk[x.j]={jenis:'nilai',bidang:old.bidang,orang:i,nilai:v[old.bidang+'_'+i]};var w=lebar(laba(m,i));m.petunjuk[x.j]=old;if(!best||priority<best.priority||priority===best.priority&&w<best.width)best={index:x.j,width:w,priority:priority};});
        if(!best)throw new Error('Data keuntungan tidak muat satu baris');var c=m.petunjuk[best.index];m.petunjuk[best.index]={jenis:'nilai',bidang:c.bidang,orang:i,nilai:v[c.bidang+'_'+i]};
      }});
    }
    kartu(m).forEach(function(c){if(lebar(c.petunjuk[0])>260)throw new Error('Deskripsi melebihi satu baris: '+c.nama);});
  }
  function kartu(m){
    if(m.ragam==='shl')return Shl.kartu(m);
    return m.nama.map(function(n,i){
      var desc;
      if(m.tipe==='produk')desc='Menjual '+F.angka(m.produk[i].unit)+' unit/bulan dengan laba $'+F.angka(m.produk[i].labaPerUnitSen/100,{desimal:2,tetap:true})+'/unit.';
      else if(m.tipe==='laba')desc=laba(m,i);
      else if(m.tipe==='waktu'){var c=m.petunjuk.find(function(c){return c.orang===i;});desc=narasi(m,c);}
      else{
        desc=m.petunjuk.filter(function(c){return c.pemilik===i;}).map(function(c){return relasiKartu(m,c,i);}).join(' ');
      }
      return {nama:n,petunjuk:[desc]};
    });
  }
  function pengantar(m){
    if(m.ragam==='shl')return Shl.pengantar(m);
    var c=ambil(m),out=['Setiap nama mewakili '+c.objek+'.'];
    if(m.tipe==='laba'||m.tipe==='produk')out[0]={orang:'Setiap nama mewakili penjual.',produk:'Setiap nama mewakili jenis produk.',kendaraan:'Nama kendaraan menandai usaha sewa jenis kendaraan tersebut.',hewan:'Nama hewan menandai usaha penjualan paket pakan untuk jenis hewan tersebut.',tumbuhan:'Nama tanaman menandai usaha penjualan bibit jenis tanaman tersebut.',perusahaan:'Setiap nama mewakili perusahaan penjual barang.'}[m.kategoriEntitas];
    if(m.tipe!=='perbandingan'&&m.tipe!=='posisi'){
      if(m.tipe==='waktu')out.push('Satu hari kerja terdiri atas '+m.jamPerHari+' jam.');
      else{
        out.push('Unit: '+c.unit+'. '+(m.tipe==='produk'?'Nominal dalam USD ($).':'Harga dan biaya dalam USD ($) per unit.'));
      }
    }
    return out;
  }
  function pertanyaan(m){if(m.ragam==='shl')return Shl.pertanyaan(m);var c=ambil(m),terkecil=m.tipe==='waktu'||(m.tipe==='perbandingan'||m.tipe==='posisi')&&c.arah==='terkecil';
    var metric=m.tipe==='waktu'?c.waktu+' dalam jam':m.tipe==='laba'?'keuntungan bersih selama satu minggu':m.tipe==='produk'?'laba penjualan rata-rata per bulan':c.ordinal;
    var extra=(m.petunjuk||[]).filter(function(c){return c.lokasi==='pertanyaan';}).map(function(c){return fakta(m,c);}).join(' ');
    return (extra?extra+' ':'')+'Pasangkan lencana 1 sampai '+m.nama.length+' berdasarkan '+metric+', dari '+(terkecil?'terkecil ke terbesar':'terbesar ke terkecil')+'.';
  }
  function judul(m){if(m.ragam==='shl')return m.konteksShl==='gaji'?'Peringkat gaji pegawai':'Urutan kedatangan pegawai';var c=ambil(m);return ({perbandingan:'Perbandingan '+c.ordinal,posisi:'Jarak peringkat '+c.ordinal,waktu:'Peringkat '+c.waktu,laba:'Keuntungan penjualan mingguan',produk:'Laba penjualan bulanan'})[m.tipe];}
  return {KATEGORI:Object.keys(C),ambil:ambil,kartu:kartu,pengantar:pengantar,pertanyaan:pertanyaan,judul:judul,siapkan:siapkan};
});
