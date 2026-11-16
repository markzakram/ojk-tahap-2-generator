/* Bahasa data pemeringkatan. Tidak menyimpan atau menghitung jawaban. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./format.js'),require('./badges-konteks.js'));
  else root.PeringkatData=factory(root.Fmt,root.BadgesKonteks);
})(typeof self!=='undefined'?self:this,function(Fmt,K){
  'use strict';
  var BIDANG={t:'waktu penyelesaian',q:'jumlah produk terjual',p:'harga jual per produk',c:'biaya produksi per produk'};
  function bidang(m,f){return m.kategoriEntitas?{t:'waktu kerja',q:'jumlah unit terjual',p:'harga per unit',c:'biaya per unit'}[f]:BIDANG[f];}
  function angka(v){return Fmt.angka(v);}
  function uang(v){return '$'+Fmt.angka(v,{desimal:2,tetap:true});}
  function nilai(v,f){return (f==='p'||f==='c'?'$':'')+angka(v)+(f==='t'?' jam':f==='q'?' produk':'');}
  function teks(m,c){
    var a=m.nama[c.orang];
    if(m.kategoriEntitas&&(c.jenis==='banding'||c.jenis==='jarak'||c.jenis==='tetap')){
      if(c.jenis==='tetap')return a+' berada pada peringkat '+c.posisi+' (terakhir).';
      return a+' berada '+(c.jenis==='jarak'?c.jarak+' peringkat ':'')+'di atas '+m.nama[c.lain]+'.';
    }
    if(c.jenis==='banding')return c.balik ? m.nama[c.lain]+' menjual lebih sedikit produk daripada '+a+'.' : a+' menjual lebih banyak produk daripada '+m.nama[c.lain]+'.';
    if(c.jenis==='jarak')return a+' membaca lebih cepat daripada '+m.nama[c.lain]+(c.jarak===1?' dan berada tepat satu peringkat di atasnya.':'; ada tepat '+(c.jarak-1)+' orang di antara keduanya.');
    var awal=bidang(m,c.bidang)+' '+a;
    awal=awal.charAt(0).toUpperCase()+awal.slice(1);
    if(c.jenis==='nilai')return awal+' adalah '+(c.hari?angka(c.nilai)+' hari kerja':nilai(c.nilai,c.bidang))+'.';
    var ref=c.ref.split('_'), fr=c.persen ? angka(c.num*100/c.den)+'%' : c.den===1?String(c.num):c.num+'/'+c.den;
    return awal+(c.num===c.den?' sama dengan ':' adalah '+fr+' dari ')+bidang(m,ref[0])+' '+m.nama[Number(ref[1])]+(c.tambah>0?', ditambah '+nilai(c.tambah,c.bidang):c.tambah<0?', dikurangi '+nilai(-c.tambah,c.bidang):'')+'.';
  }
  function pengantar(m){
    if(m.kategoriEntitas)return K.pengantar(m);
    if(m.tipe==='produk')return ['Setiap produk ditampilkan beserta rata-rata jumlah unit yang terjual per bulan dan laba per unit dalam dolar AS ($), secara berurutan.'];
    if(m.tipe==='perbandingan')return ['Setiap orang memiliki jumlah penjualan yang berbeda. Gunakan seluruh petunjuk untuk menentukan urutan penjualan.'];
    if(m.tipe==='posisi')return ['Tidak ada kecepatan membaca yang sama. Orang yang lebih cepat mendapat nomor peringkat lebih kecil.'];
    if(m.tipe==='waktu')return ['Setiap orang menyelesaikan satu proyek. Satu hari kerja terdiri atas '+m.jamPerHari+' jam. Bandingkan total waktu kerja dalam jam.'];
    return ['Seluruh produk terjual dalam satu minggu. Semua nominal dalam dolar AS ($). Biaya produksi per produk sudah mencakup seluruh biaya; tidak ada biaya tambahan.'];
  }
  /** Narasi satu kartu keuntungan: pelaku ditentukan oleh nama pada kartu.
   * Tidak menuliskan hasil hitungan atau mengganti rujukan dengan angkanya.
   */
  function narasiLaba(m,i){
    return ['q','p','c'].map(function(f){
      var c=m.petunjuk.find(function(x){return x.orang===i&&x.bidang===f;});
      if(!c)throw new Error('Data narasi keuntungan tidak lengkap: '+m.nama[i]+'/'+f);
      if(c.jenis==='nilai')return f==='q'?'Menjual '+angka(c.nilai)+' produk.':(f==='p'?'Harga jual ':'Biaya produksi ')+'$'+angka(c.nilai)+' per produk.';
      var ref=c.ref.split('_'),orang=Number(ref[1]),fr=c.persen?angka(c.num*100/c.den)+'%':Fmt.pecahan(c.num,c.den);
      var rujukan=ref[0]==='q'?'jumlah produk yang dijual '+m.nama[orang]:BIDANG[ref[0]]+(orang===i?'':' '+m.nama[orang]);
      var kalimat=(f==='q'?'Menjual ':f==='p'?'Harga jual per produk ':'Biaya produksi per produk ')+fr+' dari '+rujukan;
      if(c.tambah)kalimat+=(c.tambah>0?', ditambah ':', dikurangi ')+nilai(Math.abs(c.tambah),f);
      return kalimat+'.';
    }).join(' ');
  }
  function kartu(m){if(m.kategoriEntitas)return K.kartu(m);return m.nama.map(function(n,i){return {nama:n,petunjuk:m.tipe==='produk'?[angka(m.produk[i].unit)+', '+uang(m.produk[i].labaPerUnitSen/100)]:m.tipe==='laba'?[narasiLaba(m,i)]:m.petunjuk.filter(function(c){return c.orang===i||((m.tipe==='perbandingan'||m.tipe==='posisi')&&c.lain===i);}).map(function(c){return teks(m,c);})};});}
  function stimulus(m){return pengantar(m).concat(m.kategoriEntitas||m.tipe==='laba'||m.tipe==='produk'?kartu(m).map(function(k){return k.nama+': '+k.petunjuk[0];}):m.petunjuk.map(function(c){return teks(m,c);}));}
  function pertanyaan(m){
    if(m.kategoriEntitas)return K.pertanyaan(m);
    if(m.tipe==='produk')return 'Seret lencana ke setiap produk untuk mengurutkannya dari 1 (peringkat tertinggi) hingga 6 (peringkat terendah) berdasarkan laba penjualan rata-rata per bulan yang dihasilkan bagi perusahaan. Setiap nomor digunakan sekali.';
    return 'Urutkan setiap orang dari Peringkat 1 ('+(m.tipe==='waktu'||m.tipe==='posisi'?'tercepat':'terbesar')+') hingga Peringkat '+m.nama.length+' ('+(m.tipe==='waktu'||m.tipe==='posisi'?'paling lambat':'terkecil')+') berdasarkan '+({waktu:'total waktu penyelesaian proyek',posisi:'kecepatan membaca',perbandingan:'jumlah produk yang terjual',laba:'keuntungan bersih selama satu minggu'}[m.tipe])+'. Setiap peringkat hanya digunakan sekali.';
  }
  return {BIDANG:BIDANG,bidang:bidang,angka:angka,uang:uang,nilai:nilai,teks:teks,pengantar:pengantar,kartu:kartu,stimulus:stimulus,pertanyaan:pertanyaan};
});
