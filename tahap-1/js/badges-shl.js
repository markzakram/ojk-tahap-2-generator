/* Pola kendala yang dikembangkan dari contoh pengguna; seluruh narasi Indonesia.
 * Pencarian di sini milik penyusun/visual. Validator memakai pemecah sendiri. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./svg'),require('./bank-aset-badges'),require('./metrik'));else root.BadgesShl=factory(root.Svg,root.BankAsetBadges,root.Metrik);})(typeof self!=='undefined'?self:this,function(S,A,M){
  'use strict';
  var cache={};
  function permutasi(n){if(cache[n])return cache[n];var out=[],p=[],used={};function f(){if(p.length===n){out.push(p.slice());return;}for(var r=1;r<=n;r++)if(!used[r]){used[r]=true;p.push(r);f();p.pop();delete used[r];}}f();return cache[n]=out;}
  function cocok(c,p){var a=p[c.orang],b=p[c.lain];switch(c.jenis){case 'banding':return a<b;case 'tetap':return a===c.posisi;case 'batas':return a<=c.maks;case 'paritas':return a%2===(c.ganjil?1:0);case 'jarak':return b-a===c.jarak;case 'mutlak':return Math.abs(a-b)===c.jarak;case 'minimum':return b-a>=c.jarak;case 'banding-jarak':return Math.abs(a-b)>Math.abs(a-p[c.dekat]);case 'jika':return !cocok(c.syarat,p)||cocok(c.akibat,p);default:throw new Error('Kendala penyusun tidak dikenal');}}
  function teks(m,c){var a=m.nama[c.orang],b=m.nama[c.lain];switch(c.jenis){case 'banding':return a+' berada di atas '+b+'.';case 'tetap':return a+' berada pada peringkat '+c.posisi+'.';case 'batas':return a+' berada dalam '+c.maks+' peringkat teratas.';case 'paritas':return a+' menempati peringkat bernomor '+(c.ganjil?'ganjil':'genap')+'.';case 'jarak':return a+' berada '+c.jarak+' peringkat di atas '+b+'.';case 'mutlak':return 'Ada tepat '+(c.jarak-1)+' orang di antara '+a+' dan '+b+'.';case 'minimum':return a+' berada di atas '+b+', dengan sedikitnya '+(c.jarak-1)+' orang di antaranya.';case 'banding-jarak':return 'Jarak peringkat '+a+' ke '+b+' lebih besar daripada jaraknya ke '+m.nama[c.dekat]+'.';case 'jika':return 'Jika '+m.nama[c.syarat.orang]+' berada pada peringkat '+c.syarat.posisi+', '+m.nama[c.akibat.orang]+' berada di atas '+m.nama[c.akibat.lain]+'.';default:throw new Error('Bahasa kendala tidak dikenal');}}
  function susunModel(m,a,variant,kosong){
    if(!Number.isInteger(variant)||variant<0||variant>2)throw new Error('Acuan SHL harus 0, 1, atau 2');
    var role=a.kocok([0,1,2,3,4,5]),cs=[];function add(c,owner,question){c.pemilik=owner==null?-1:role[owner];if(question)c.lokasi='pertanyaan';cs.push(c);}
    function r(j){return role[j];}
    m.ragam='shl';m.acuanShl=variant;m.konteksShl=variant===0?'gaji':'kedatangan';
    if(variant===0){
      add({jenis:'batas',orang:r(0),maks:3},0);add({jenis:'batas',orang:r(3),maks:3},0);
      add({jenis:'banding',orang:r(4),lain:r(2)},2);add({jenis:'banding',orang:r(2),lain:r(1)},2);
      add({jenis:'jika',syarat:{jenis:'tetap',orang:r(5),posisi:4},akibat:{jenis:'banding',orang:r(3),lain:r(4)}},3);
      add({jenis:'jarak',orang:r(4),lain:r(5),jarak:2},5);
      add({jenis:'banding-jarak',orang:r(2),lain:r(0),dekat:r(3)},null,true);
    }else if(variant===1){
      add({jenis:'paritas',orang:r(1),ganjil:true},1);add({jenis:'banding',orang:r(0),lain:r(2)},2);
      add({jenis:'banding',orang:r(3),lain:r(4)},4);add({jenis:'banding',orang:r(4),lain:r(0)},4);
      add({jenis:'batas',orang:r(5),maks:3},5);add({jenis:'mutlak',orang:r(5),lain:r(1),jarak:3},null,true);
    }else{
      add({jenis:'mutlak',orang:r(0),lain:r(5),jarak:3},0);add({jenis:'mutlak',orang:r(1),lain:r(3),jarak:3},1);
      add({jenis:'banding',orang:r(5),lain:r(4)},4);add({jenis:'banding',orang:r(4),lain:r(1)},4);
      add({jenis:'minimum',orang:r(5),lain:r(3),jarak:2},5);
      // Contoh kiriman masih punya 3 solusi. Relasi ini membuat tepat satu.
      add({jenis:'banding',orang:r(2),lain:r(4)},null,true);
    }
    for(var i=6;i<m.nama.length;i++)cs.push({jenis:'tetap',orang:i,posisi:i+1,pemilik:i});
    var empty=role.filter(function(i){return !cs.some(function(c){return c.pemilik===i;});});
    while(empty.length>kosong){var dst=empty.pop(),src=cs.find(function(c){return c.pemilik>=0&&cs.filter(function(x){return x.pemilik===c.pemilik;}).length>1;})||cs.find(function(c){return c.lokasi==='pertanyaan';});if(!src)throw new Error('Petunjuk kartu tidak dapat disebar');src.pemilik=dst;delete src.lokasi;}
    m.petunjuk=cs;m.deskripsiKosong=empty.sort(function(x,y){return x-y;});
    var all=permutasi(m.nama.length).filter(function(p){return cs.every(function(c){return cocok(c,p);});});
    if(all.length!==1)throw new Error('Pola SHL tidak menghasilkan satu solusi');return all[0];
  }
  function kalimatKartu(m,c,i){var a=m.nama[c.orang],b=m.nama[c.lain],own=c.orang===i,sub=own?'':a+' ';
    switch(c.jenis){
      case 'tetap':return (own?'Menempati ':a+' menempati ')+'peringkat '+c.posisi+'.';
      case 'batas':return (own?'Masuk ':a+' masuk ')+c.maks+' besar.';
      case 'paritas':return (own?'Menempati ':a+' menempati ')+'peringkat '+(c.ganjil?'ganjil':'genap')+'.';
      case 'banding':return own?'Berada di atas '+b+'.':c.lain===i?'Berada di bawah '+a+'.':a+' di atas '+b+'.';
      case 'jarak':return own?c.jarak+' peringkat di atas '+b+'.':c.lain===i?c.jarak+' peringkat di bawah '+a+'.':a+' '+c.jarak+' peringkat di atas '+b+'.';
      case 'mutlak':return 'Ada '+(c.jarak-1)+' orang di antara '+(own?'dirinya':a)+' dan '+(c.lain===i?'dirinya':b)+'.';
      case 'minimum':return own?'Di atas '+b+', minimal '+(c.jarak-1)+' orang di antaranya.':teks(m,c);
      case 'jika':return 'Jika '+m.nama[c.syarat.orang]+' ke-'+c.syarat.posisi+', '+m.nama[c.akibat.orang]+' di atas '+m.nama[c.akibat.lain]+'.';
      default:return teks(m,c);
    }
  }
  function kartu(m){return m.nama.map(function(n,i){return {nama:n,petunjuk:[m.petunjuk.filter(function(c){return c.pemilik===i;}).map(function(c){return m.redaksiRingkas?kalimatKartu(m,c,i):teks(m,c);}).join(' ')]};});}
  function pengantar(m){return ['Setiap nama mewakili seorang pegawai.'];}
  function pertanyaan(m){var extra=m.petunjuk.filter(function(c){return c.lokasi==='pertanyaan';}).map(function(c){return teks(m,c);}).join(' ');return (extra?extra+' ':'')+'Pasangkan lencana 1 sampai '+m.nama.length+' dari '+(m.konteksShl==='gaji'?'gaji tertinggi ke terendah':'kedatangan paling awal ke paling akhir')+'.';}
  function ringkas(all,n){return Array.from({length:n},function(_,i){return Array.from(new Set(all.map(function(p){return p[i];}))).sort(function(a,b){return a-b;});});}
  function susun(m){var t=[],gs=[],all=permutasi(m.nama.length).slice(),n=m.nama.length;
    function save(tahap,line,index){t.push(line);var v={tipe:'posisi',ragam:'shl',kategoriEntitas:m.kategoriEntitas,nama:m.nama.slice(),tahap:tahap,jumlah:all.length,kemungkinan:ringkas(all,n)};if(index!=null)v.petunjuk=index;if(tahap==='akhir')v.peringkat=all[0].slice();gs.push({id:'badges-kendala-'+gs.length,jenis:'badges-kendala',judul:tahap==='awal'?'Kondisi awal: kemungkinan peringkat':tahap==='akhir'?'Urutan final: satu jawaban':'Langkah '+(index+1)+': gunakan petunjuk',setelah:line,model:v});}
    save('awal','Mulai dari semua urutan yang mungkin. Tabel menunjukkan peringkat yang masih mungkin bagi setiap nama.');
    m.petunjuk.forEach(function(c,i){all=all.filter(function(p){return cocok(c,p);});if(!all.length)throw new Error('Petunjuk bertentangan');save('petunjuk','Langkah '+(i+1)+': '+teks(m,c)+' Tersisa '+all.length+' urutan yang memenuhi seluruh petunjuk sampai langkah ini.',i);});
    if(all.length!==1)throw new Error('Jawaban masih ambigu');save('akhir','Semua petunjuk telah digunakan. Hanya satu urutan memenuhi semuanya; pasangkan lencana sesuai urutan tersebut.');return {teks:t,gambar:gs};
  }
  function gambar(m,judul){var W=1100,n=m.nama.length,h=194+n*66,out='',C=S.BAHAS;
    function t(s,x,y,o){out+=S.teks(s,x,y,Object.assign({ukuran:24,isi:C.teks},o||{}));}
    out+=S.rect(1,1,W-2,h-2,{isi:'#fff',garis:'#cbd3df',rx:10});t(judul,24,39,{ukuran:29,tebal:true});
    t('Urutan yang masih mungkin: '+m.jumlah+'. Angka pada kolom adalah nomor peringkat.',24,79,{ukuran:23});
    t('Nama',75,123,{tebal:true});var start=365,cw=87;
    for(var r=1;r<=n;r++)t(r,start+(r-.5)*cw,123,{rata:'middle',tebal:true});
    m.nama.forEach(function(name,i){var y=140+i*66;out+=S.rect(24,y,W-48,64,{isi:i%2?'#f5f7fa':'#fff',garis:'#e1e6ef'});out+=A.svgNama(name,32,y+9,44,44);t(name,88,y+39,{ukuran:24,tebal:true});for(var r=1;r<=n;r++){var possible=m.kemungkinan[i].indexOf(r)>=0,x=start+(r-1)*cw;out+=S.rect(x+5,y+8,cw-10,47,{isi:possible?(m.tahap==='akhir'?C.latarJawab:C.latarPanah):'#f1f2f5',garis:possible?(m.tahap==='akhir'?C.jawab:C.panah):'#e1e6ef',rx:5});t(possible?r:'-',x+cw/2,y+40,{rata:'middle',ukuran:26,tebal:possible,isi:possible?(m.tahap==='akhir'?C.jawab:C.panah):'#a0a8b5'});}});
    t(m.tahap==='akhir'?'Setiap nama memiliki satu peringkat; setiap nomor digunakan sekali.':'Biru: masih mungkin. Tanda -: sudah tersisih oleh petunjuk yang digunakan.',24,h-19,{ukuran:22,isi:m.tahap==='akhir'?C.jawab:C.teksRedup});return {svg:S.doc(out,W,h),lebar:W,tinggi:h};
  }
  return {susunModel:susunModel,teks:teks,kartu:kartu,pengantar:pengantar,pertanyaan:pertanyaan,susun:susun,gambar:gambar,kalimatKartu:kalimatKartu};
});
