/* Keluarga Badges (Logical Ranking), mapping 26 Oktober 2026.
 * Penyusun menghitung dengan angka biasa; cek-peringkat memecahkan ulang dengan
 * pencarian semua urutan / pecahan eksak, tanpa memanggil penyusun ini.
 */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./rng.js'),require('./butir.js'),require('./rumus.js'),require('./peringkat-data.js'),require('./profil-badges.js'),require('./peringkat-langkah.js'),require('./badges-langkah.js'),require('./bank-aset-badges.js'),require('./badges-konteks.js'),require('./badges-shl'));
  else root.PnPeringkat=factory(root.Rng,root.Butir,root.Rumus,root.PeringkatData,root.ProfilBadges,root.PeringkatLangkah,root.BadgesLangkah,root.BankAsetBadges,root.BadgesKonteks,root.BadgesShl);
})(typeof self!=='undefined'?self:this,function(Rng,Butir,Rumus,D,Profil,Langkah,BadgesLangkah,Aset,Konteks,Shl){
  'use strict';
  function identitas(a,n,opsi,tipe){
    var kategori=opsi&&opsi.kategoriEntitas||a.pilih(Aset.KATEGORI),profil=a.ambil(Aset.daftar(kategori),n);
    if(profil.length!==n)throw new Error('Kategori aset tidak cukup: '+kategori);
    return {nama:profil.map(function(p){return p.nama;}),kategoriEntitas:kategori,tipe:tipe};
  }
  var KELUARGA=[
    {id:'peringkat-perbandingan',nama:'Pemeringkatan: perbandingan penjualan'},
    {id:'peringkat-posisi',nama:'Pemeringkatan: selisih posisi'},
    {id:'peringkat-waktu',nama:'Pemeringkatan: waktu penyelesaian'},
    {id:'peringkat-laba',nama:'Keuntungan penjualan mingguan (narasi per orang)'},
    {id:'peringkat-produk',nama:'Laba penjualan produk (riset akademik)',tingkat:['mudah','sedang']}
  ];
  function kosongkan(m,a,opsi){
    var k=opsi&&opsi.deskripsiKosong!=null?opsi.deskripsiKosong:a.bulat(0,2);
    if(!Number.isInteger(k)||k<0||k>2)throw new Error('Deskripsi kosong harus 0, 1, atau 2');
    var idx=m.nama.map(function(_,i){return i;}),empty=a.ambil(idx,k),isi=idx.filter(function(i){return empty.indexOf(i)<0;});
    m.petunjuk.forEach(function(c){if(empty.indexOf(c.pemilik)>=0){var counts=isi.map(function(i){return m.petunjuk.filter(function(x){return x.pemilik===i;}).length;}),min=Math.min.apply(null,counts);c.pemilik=isi[counts.indexOf(min)];}});
    m.deskripsiKosong=empty.sort(function(a,b){return a-b;});
  }
  function buatProduk(level,benih,opsi){
    if(level!=='mudah'&&level!=='sedang')return null;
    var a=Rng.alat(benih),n=opsi&&opsi.acuanAkademik?6:level==='mudah'?6:a.pilih([7,8]),ident=identitas(a,n,opsi,'produk'),nama=ident.nama;
    var produk,sen,urut,sah=false,acuan=!!(opsi&&opsi.acuanAkademik);
    for(var coba=0;coba<400&&!sah;coba++){
      produk=acuan?[[10500,160],[5000,300],[6500,250],[9500,175],[8500,250],[11000,150]].map(function(x){return {unit:x[0],labaPerUnitSen:x[1]};}):nama.map(function(){
        return {unit:level==='mudah'?a.bulat(3,12)*1000:a.bulat(8,24)*500,labaPerUnitSen:level==='mudah'?a.pilih([100,150,200,250,300]):a.bulat(24,70)*5};
      });
      // Kerjakan dalam sen: tidak ada galat pecahan dolar atau pembulatan tersembunyi.
      sen=produk.map(function(p){return p.unit*p.labaPerUnitSen;});
      urut=nama.map(function(_,i){return i;}).sort(function(i,j){return sen[j]-sen[i];});
      var samaUrutan=function(field){return urut.join()===nama.map(function(_,i){return i;}).sort(function(i,j){return produk[j][field]-produk[i][field];}).join();};
      var dekat=urut.slice(1).some(function(i,j){return (sen[urut[j]]-sen[i])/sen[urut[j]]<=0.03;});
      sah=new Set(sen).size===n&&!samaUrutan('unit')&&!samaUrutan('labaPerUnitSen')&&(level==='mudah'||dekat);
    }
    if(!sah)return null;
    var m=Object.assign(ident,{produk:produk}),peringkat=nama.map(function(_,i){return urut.indexOf(i)+1;});
    var kunci=urut.map(function(i,k){return (k+1)+'. '+nama[i];}).join('; ')+'.';
    Konteks.siapkan(m,{});
    var jejak=BadgesLangkah.susun(m),pem=['Diketahui'].concat(D.pengantar(m),['Ditanyakan',D.pertanyaan(m),'Pengerjaan'],jejak.teks,['Kesimpulan',kunci]);
    var b=Butir.rakitIsian({submateri:'peringkat',keluarga:'peringkat-produk',level:level,benih:benih},{
      judul:Konteks.judul(m),teks:D.stimulus(m),pertanyaan:D.pertanyaan(m),
      perintah:'Pasangkan satu lencana pada setiap nama.',
      isian:{jenis:'peringkat',entitas:'produk',nama:nama.slice(),kartu:D.kartu(m),pengantar:D.pengantar(m),kontrol:[{nama:'peringkat',min:1,maks:n,langkah:1}],awal:{peringkat:nama.map(function(){return null;})},kunci:{peringkat:peringkat}},
      kunciTeks:kunci,pembahasan:pem,gambarPembahasan:jejak.gambar,model:m,sidik:{inti:JSON.stringify(m),param:produk.flatMap(function(p){return [p.unit,p.labaPerUnitSen];}),entitas:n+'-produk'}
    });
    b.pola='laba-bulanan-unit-kali-laba';b.kategoriRiset='acuan';
    b.catatanRiset='Riset tim akademik, Badges Soal 1: Laba Penjualan Produk. '+n+' entitas dari satu kategori manifest; unit per bulan dan laba per unit dalam USD; peringkat 1 tertinggi sampai '+n+' terendah.'+(acuan?' Data contoh akademik.':' Variasi angka dalam pola yang sama.');
    return Profil.pasang(b);
  }
  function buat(id,level,benih,opsi){
    if(id==='peringkat-produk')return buatProduk(level,benih,opsi);
    var a=Rng.alat(benih),tipe=id.replace('peringkat-','');
    if(!KELUARGA.some(function(k){return k.id===id;}))throw new Error('Keluarga pemeringkatan tidak dikenal: '+id);
    var logis=tipe==='perbandingan'||tipe==='posisi',n=level==='mudah'?6:level==='sedang'?7:8;
    var m=Object.assign(identitas(a,n,opsi,tipe),{petunjuk:[],jamPerHari:8}),v={},hasil=[],urutan=[];
    var pakaiShl=tipe==='posisi'&&m.kategoriEntitas==='orang'&&(!opsi||opsi.ragam!=='jarak')&&(opsi&&opsi.acuanShl!=null||a.bulat(0,2)===0);
    var kerja=[],gambarPembahasan=[];
    function langsung(f,i,x,hari){var c={jenis:'nilai',bidang:f,orang:i,nilai:x};if(hari)c.hari=true;m.petunjuk.push(c);v[f+'_'+i]=x*(hari?m.jamPerHari:1);}
    function turunan(f,i,ref,num,den,add,persen){var c={jenis:'turunan',bidang:f,orang:i,ref:ref,num:num,den:den,tambah:add||0};if(persen)c.persen=true;m.petunjuk.push(c);v[f+'_'+i]=v[ref]*num/den+(add||0);}
    if(logis){
      if(pakaiShl){var k=opsi&&opsi.deskripsiKosong!=null?opsi.deskripsiKosong:a.bulat(0,2);if(!Number.isInteger(k)||k<0||k>2)throw new Error('Deskripsi kosong harus 0, 1, atau 2');var ranks=Shl.susunModel(m,a,opsi&&opsi.acuanShl!=null?opsi.acuanShl:a.bulat(0,2),k);urutan=m.nama.map(function(_,i){return i;}).sort(function(a,b){return ranks[a]-ranks[b];});}
      else{
      urutan=a.kocok(m.nama.map(function(_,i){return i;}));
      if(tipe==='perbandingan'){
        for(var j=0;j<n-1;j++)m.petunjuk.push({jenis:'banding',orang:urutan[j],lain:urutan[j+1],pemilik:urutan[j],balik:a.bulat(0,1)===1});
      }else{
        // Satu hubungan per kartu; siklus jarak berarah tetap konsisten dan terhubung.
        var simpul=a.kocok(urutan);
        for(var h=0;h<n;h++){
          var u=simpul[h],w=simpul[(h+1)%n],pu=urutan.indexOf(u),pw=urutan.indexOf(w);
          m.petunjuk.push({jenis:'jarak',orang:pu<pw?u:w,lain:pu<pw?w:u,jarak:Math.abs(pu-pw),pemilik:u});
        }
      }
      m.petunjuk=a.kocok(m.petunjuk);
      if(tipe==='perbandingan')m.petunjuk.push({jenis:'tetap',orang:urutan[n-1],pemilik:urutan[n-1],posisi:n});
      kosongkan(m,a,opsi);
      }
    }else{
      // Coba ulang jika parameter menghasilkan nilai sama atau biaya tidak wajar.
      var sah=false;
      for(var coba=0;coba<200&&!sah;coba++){
        m.petunjuk=[];v={};
        if(tipe==='waktu'){
          if(level==='mudah'){
            langsung('t',0,a.bulat(2,5),true);
            langsung('t',1,a.bulat(15,45));
            turunan('t',2,'t_1',1,1,a.bulat(3,12));
            langsung('t',3,a.bulat(18,50));
            turunan('t',4,'t_0',1,1,a.bulat(3,12));
            langsung('t',5,a.bulat(20,60));
          }else{
            langsung('t',0,a.bulat(4,8)*8);
            langsung('t',1,a.bulat(2,5),true);
            turunan('t',2,'t_1',1,1,a.bulat(7,16));
            turunan('t',3,'t_0',a.pilih([1,3]),4,a.bulat(4,12));
            turunan('t',4,level==='sulit'?'t_3':'t_0',a.pilih([3,5,7]),8,a.bulat(3,10));
            turunan('t',5,'t_0',1,1,-a.bulat(3,10));
            for(var e=6;e<n;e++)turunan('t',e,'t_'+(e-1),1,1,a.bulat(3,12));
          }
          hasil=m.nama.map(function(_,i){return v['t_'+i];});
        }else{
          var q=a.bulat(4,10)*20,p=a.bulat(6,16)*5;
          langsung('q',0,q);langsung('p',0,p);turunan('c',0,'p_0',a.pilih([60,80]),100,0,true);
          if(level==='mudah'){
            for(var e=1;e<n;e++){langsung('q',e,a.bulat(4,10)*20);langsung('p',e,a.bulat(3,8)*10);langsung('c',e,a.bulat(10,25));}
          }else{
            // Contoh enam kartu: biaya 62,5% = 5/8, jumlah dan harga saling merujuk.
            // Harga kelipatan 40 menjaga 5/8 dan 4/5 tepat, tanpa pembulatan tersirat.
            turunan('q',1,'q_0',a.pilih([3,5,7]),4);langsung('p',1,a.pilih([40,80]));turunan('c',1,'p_1',5,8,0,true);
            turunan('q',2,'q_1',a.pilih([2,3,4]),5);turunan('p',2,'p_1',4,5);langsung('c',2,a.bulat(10,20));
            langsung('q',3,a.bulat(5,10)*20);langsung('p',3,a.bulat(3,7)*10);langsung('c',3,a.bulat(15,25));
            turunan('q',4,level==='sulit'?'q_2':'q_3',4,5);turunan('p',4,'p_3',80,100,0,true);langsung('c',4,a.bulat(12,22));
            langsung('q',5,a.bulat(6,15)*10);langsung('p',5,a.bulat(3,7)*10);turunan('c',5,'p_5',3,5);
            for(var e=6;e<n;e++){turunan('q',e,'q_0',a.pilih([3,5,7]),4);langsung('p',e,a.pilih([40,60,80]));turunan('c',e,'p_'+e,a.pilih([60,75]),100,0,true);}
          }
          hasil=m.nama.map(function(_,i){return v['q_'+i]*(v['p_'+i]-v['c_'+i]);});
        }
        sah=hasil.every(function(x){return x>0&&Number.isInteger(x);})&&new Set(hasil).size===n&&Object.values(v).every(function(x){return x>0&&Number.isInteger(x);});
      }
      if(!sah)return null;
      urutan=m.nama.map(function(_,i){return i;}).sort(function(x,y){return tipe==='waktu'?hasil[x]-hasil[y]:hasil[y]-hasil[x];});
      kerja.push(tipe==='waktu'?'Waktu yang lebih singkat mendapat peringkat lebih kecil.':'Keuntungan bersih yang lebih besar mendapat peringkat lebih kecil.');
    }
    Konteks.siapkan(m,v);
    if(tipe==='posisi'){var jejak=m.ragam==='shl'?Shl.susun(m):Langkah.susun(m);kerja=jejak.teks;gambarPembahasan=jejak.gambar;}
    else{var jejak=BadgesLangkah.susun(m);kerja=jejak.teks;gambarPembahasan=jejak.gambar;}
    var peringkat=m.nama.map(function(_,i){return urutan.indexOf(i)+1;});
    var kunci=urutan.map(function(i,k){return (k+1)+'. '+m.nama[i];}).join('; ')+'.';
    var bahas=['Diketahui'].concat(D.pengantar(m),['Semua petunjuk pada kartu nama digunakan bersama.','Ditanyakan',D.pertanyaan(m),'Pengerjaan'],kerja,['Kesimpulan',kunci]);
    var b=Butir.rakitIsian({submateri:'peringkat',keluarga:id,level:level,benih:benih},{
      judul:Konteks.judul(m),
      teks:D.stimulus(m),pertanyaan:D.pertanyaan(m),perintah:'Pasangkan satu lencana pada setiap nama.',
      isian:{jenis:'peringkat',nama:m.nama.slice(),kartu:D.kartu(m),pengantar:D.pengantar(m),kontrol:[{nama:'peringkat',min:1,maks:n,langkah:1}],awal:{peringkat:m.nama.map(function(){return null;})},kunci:{peringkat:peringkat}},
      kunciTeks:kunci,pembahasan:bahas,gambarPembahasan:gambarPembahasan,model:m,
      sidik:{inti:JSON.stringify(m),param:logis?peringkat:hasil,entitas:m.nama.join('|')}
    });
    b.pola='peringkat-'+tipe;b.kategoriRiset='variasi latihan';b.catatanRiset='Pengembangan bank latihan mengikuti QC akademik Paket 003; konteks entitas tidak menentukan jawaban. Chapter Badges, Logical Ranking. Bukan klaim pola yang semuanya ditemukan pada tes asli.';
    if(tipe==='laba')b.catatanRiset+=' Narasi satu paragraf per orang mengikuti enam kartu keuntungan penjualan; nominal USD sesuai QC. Biaya dapat berupa nilai tetap, persen (termasuk 62,5%), atau pecahan harga jual.';
    return Profil.pasang(b);
  }
  return {KELUARGA:KELUARGA,buat:buat};
});
