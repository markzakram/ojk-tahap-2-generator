/* Pemecah independen: membaca petunjuk yang ditampilkan, bukan kunci penyusun. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./hitung.js'),require('./peringkat-data.js'),require('./profil-badges.js'),require('./bank-aset-badges.js'),require('./metrik.js'),require('./cek-kartu-badges.js'));
  else root.CekPeringkat=factory(root.Hitung,root.PeringkatData,root.ProfilBadges,root.BankAsetBadges,root.Metrik,root.CekKartuBadges);
})(typeof self!=='undefined'?self:this,function(H,D,Profil,Aset,Metrik,Kartu){
  'use strict';
  function sahKendala(c,n){
    if(!c||typeof c!=='object')throw new Error('Kendala tidak sah');
    if(c.jenis==='jika'){if(!c.syarat||c.syarat.jenis!=='tetap'||!c.akibat||c.akibat.jenis!=='banding')throw new Error('Kondisi jika tidak sah');sahKendala(c.syarat,n);sahKendala(c.akibat,n);return;}
    function idx(i){return Number.isInteger(i)&&i>=0&&i<n;}
    if(!idx(c.orang))throw new Error('Nama kendala tidak sah');
    if(c.jenis==='tetap'){if(!Number.isInteger(c.posisi)||c.posisi<1||c.posisi>n)throw new Error('Peringkat tetap tidak sah');return;}
    if(c.jenis==='batas'){if(!Number.isInteger(c.maks)||c.maks<1||c.maks>n)throw new Error('Kelompok peringkat tidak sah');return;}
    if(c.jenis==='paritas'){if(typeof c.ganjil!=='boolean')throw new Error('Paritas peringkat tidak sah');return;}
    if(!['banding','jarak','mutlak','minimum','banding-jarak'].includes(c.jenis)||!idx(c.lain)||c.orang===c.lain)throw new Error('Hubungan kendala tidak sah');
    if(['jarak','mutlak','minimum'].includes(c.jenis)&&(!Number.isInteger(c.jarak)||c.jarak<1||c.jarak>=n))throw new Error('Jarak kendala tidak sah');
    if(c.jenis==='banding-jarak'&&(!idx(c.dekat)||c.dekat===c.orang||c.dekat===c.lain))throw new Error('Perbandingan jarak tidak sah');
  }
  function cocokKendala(c,p){
    if(c.jenis==='jika'){
      if(!p[c.syarat.orang]||!p[c.akibat.orang]||!p[c.akibat.lain])return true;
      return p[c.syarat.orang]!==c.syarat.posisi||p[c.akibat.orang]<p[c.akibat.lain];
    }
    var a=p[c.orang],b=p[c.lain];if(!a)return true;
    if(c.jenis==='tetap')return a===c.posisi;
    if(c.jenis==='batas')return a<=c.maks;
    if(c.jenis==='paritas')return a%2===(c.ganjil?1:0);
    if(!b)return true;
    if(c.jenis==='banding')return a<b;
    if(c.jenis==='jarak')return b-a===c.jarak;
    if(c.jenis==='mutlak')return Math.abs(b-a)===c.jarak;
    if(c.jenis==='minimum')return b-a>=c.jarak;
    if(c.jenis==='banding-jarak')return !p[c.dekat]||Math.abs(a-b)>Math.abs(a-p[c.dekat]);
    throw new Error('Kendala tidak dikenal');
  }
  function semuaKendala(m,maks){
    var n=m.nama.length,p=Array(n).fill(0),used=Array(n+1).fill(false),sol=[];
    m.petunjuk.forEach(function(c){sahKendala(c,n);});
    function f(i){if(maks&&sol.length>=maks)return;if(i===n){sol.push(p.slice());return;}for(var r=1;r<=n;r++)if(!used[r]){p[i]=r;if(m.petunjuk.every(function(c){return cocokKendala(c,p);})){used[r]=true;f(i+1);used[r]=false;}p[i]=0;}}
    f(0);return sol;
  }
  function periksaKendala(b,sol){
    var m=b.model,n=m.nama.length,gs=b.gambarPembahasan||[],all=semuaKendala({nama:m.nama,petunjuk:[]}),last=-1;
    function canon(c){if(!c||typeof c!=='object')return c;var x={};Object.keys(c).sort().forEach(function(k){if(k!=='pemilik'&&k!=='lokasi')x[k]=canon(c[k]);});return x;}
    function sama(a,b){return JSON.stringify(a)===JSON.stringify(b);}
    if(gs.length!==m.petunjuk.length+2)throw new Error('Visual kendala tidak lengkap');
    gs.forEach(function(g,k){var v=g.model,at=b.pembahasan.indexOf(g.setelah),end=k===gs.length-1;
      if(!v||g.jenis!=='badges-kendala'||g.id!=='badges-kendala-'+k||at<=last||b.pembahasan.lastIndexOf(g.setelah)!==at||!sama(v.nama,m.nama)||v.kategoriEntitas!==m.kategoriEntitas||v.ragam!=='shl'||v.tipe!=='posisi')throw new Error('Urutan atau identitas visual kendala salah');last=at;
      if(k&&!end){var c=m.petunjuk[k-1];if(v.petunjuk!==k-1||v.tahap!=='petunjuk')throw new Error('Petunjuk visual salah');var sent=g.setelah.slice(('Langkah '+k+': ').length).split(' Tersisa ')[0];if(!sent.endsWith('.')||!sama(canon(Kartu.kendalaDari(sent.slice(0,-1),m.nama)),canon(c)))throw new Error('Kalimat penjelasan kendala tidak sesuai');all=all.filter(function(p){return cocokKendala(c,p);});}
      var possible=m.nama.map(function(_,i){return Array.from(new Set(all.map(function(p){return p[i];}))).sort(function(a,b){return a-b;});});
      if(v.jumlah!==all.length||!sama(v.kemungkinan,possible))throw new Error('Kemungkinan peringkat visual salah/bocor');
      if(end){if(v.tahap!=='akhir'||all.length!==1||!sama(v.peringkat,sol.peringkat))throw new Error('Hasil akhir kendala tidak tunggal');}
      else if(v.peringkat!==undefined||v.urutan!==undefined||!k&&v.tahap!=='awal')throw new Error('Visual kendala membocorkan kunci');
    });
  }
  function pecahkan(m){
    var n=m.nama.length;
    if(n<(m.kategoriEntitas?6:4)||n>8||new Set(m.nama).size!==n)throw new Error('Jumlah/nama peserta tidak sah: Badges aktif harus memakai 6–8 variabel');
    if(m.ragam==='shl'){var all=semuaKendala(m,2);if(all.length!==1)throw new Error(all.length?'Petunjuk memiliki lebih dari satu urutan':'Petunjuk saling bertentangan');return {peringkat:all[0]};}
    if(m.tipe==='produk'){
      if(!m.kategoriEntitas&&(n!==6||m.nama.join('|')!=='Produk A|Produk B|Produk C|Produk D|Produk E|Produk F')||!Array.isArray(m.produk)||m.produk.length!==n)throw new Error('Pola laba bulanan mensyaratkan 6–8 entitas dengan data lengkap');
      var nilai=m.produk.map(function(p){
        if(!p||!Number.isSafeInteger(p.unit)||p.unit<=0||!Number.isSafeInteger(p.labaPerUnitSen)||p.labaPerUnitSen<=0)throw new Error('Unit terjual atau laba per unit tidak sah');
        return H.kali(p.unit,H.bagi(p.labaPerUnitSen,100));
      });
      if(nilai.some(function(x,i){return nilai.slice(0,i).some(function(y){return H.sama(x,y);});}))throw new Error('Ada laba produk sama / peringkat seri');
      var urutan=m.nama.map(function(_,i){return i;}).sort(function(i,j){return H.banding(nilai[j],nilai[i]);});
      return {peringkat:m.nama.map(function(_,i){return urutan.indexOf(i)+1;}),nilai:nilai.map(H.keAngka)};
    }
    if(m.tipe==='perbandingan'||m.tipe==='posisi'){
      m.petunjuk.forEach(function(c){if(c.jenis==='tetap'&&m.tipe==='perbandingan'){if(!Number.isInteger(c.orang)||c.orang<0||c.orang>=n||!Number.isInteger(c.posisi)||c.posisi<1||c.posisi>n)throw new Error('Peringkat tetap tidak sah');return;}if(!Number.isInteger(c.orang)||!Number.isInteger(c.lain)||c.orang<0||c.lain<0||c.orang>=n||c.lain>=n||c.orang===c.lain||c.jenis!==(m.tipe==='posisi'?'jarak':'banding')||c.jenis==='jarak'&&(!Number.isInteger(c.jarak)||c.jarak<1||c.jarak>=n))throw new Error('Petunjuk relasi tidak sah');});
      var posisi=Array(n).fill(0),pakai=Array(n+1).fill(false),solusi=[];
      var prior=m.nama.map(function(_,i){return i;}).sort(function(a,b){return m.petunjuk.filter(function(c){return c.orang===b||c.lain===b;}).length-m.petunjuk.filter(function(c){return c.orang===a||c.lain===a;}).length;});
      function cari(k){
        if(solusi.length>=2)return;
        if(k===n){solusi.push(posisi.slice());return;}
        var i=prior[k];
        for(var r=1;r<=n;r++)if(!pakai[r]){
          posisi[i]=r;
          var ok=m.petunjuk.every(function(c){var a=posisi[c.orang],b=posisi[c.lain];if(c.jenis==='tetap')return !a||a===c.posisi;return !a||!b|| (c.jenis==='jarak'?b-a===c.jarak:a<b);});
          if(ok){pakai[r]=true;cari(k+1);pakai[r]=false;}
          posisi[i]=0;
        }
      }
      cari(0);
      if(solusi.length!==1)throw new Error(solusi.length?'Petunjuk memiliki lebih dari satu urutan':'Petunjuk saling bertentangan');
      return {peringkat:solusi[0]};
    }
    if(m.tipe!=='waktu'&&m.tipe!=='laba')throw new Error('Jenis pemeringkatan tidak dikenal');
    var v={},pending=m.petunjuk.slice(),keys=new Set(),fields=m.tipe==='waktu'?['t']:['q','p','c'];
    pending.forEach(function(c){var key=c.bidang+'_'+c.orang;if(keys.has(key)||fields.indexOf(c.bidang)<0||!Number.isInteger(c.orang)||c.orang<0||c.orang>=n)throw new Error('Data peserta ganda/tidak sah');keys.add(key);});
    if(keys.size!==fields.length*n)throw new Error('Data perhitungan tidak lengkap');
    while(pending.length){
      var maju=false;
      for(var j=pending.length-1;j>=0;j--){
        var c=pending[j],q;
        if(c.jenis==='nilai'){
          if(!Number.isFinite(c.nilai)||c.nilai<=0||c.hari&&(c.bidang!=='t'||!Number.isInteger(m.jamPerHari)||m.jamPerHari<1||m.jamPerHari>24))throw new Error('Nilai/satuan tidak sah');
          q=H.kali(c.nilai,c.hari?m.jamPerHari:1);
        }else if(c.jenis==='turunan'){
          if(!keys.has(c.ref)||![c.num,c.den,c.tambah].every(Number.isFinite)||c.num<=0||c.den<=0||c.hari)throw new Error('Rujukan hitungan tidak sah');
          if(!v[c.ref])continue;
          q=H.tambah(H.kali(v[c.ref],H.bagi(c.num,c.den)),c.tambah);
        }else throw new Error('Petunjuk hitungan tidak dikenal');
        if(H.banding(q,0)<=0)throw new Error('Nilai harus positif');
        v[c.bidang+'_'+c.orang]=q;pending.splice(j,1);maju=true;
      }
      if(!maju)throw new Error('Rujukan hitungan melingkar');
    }
    var hasil=m.nama.map(function(_,i){return m.tipe==='waktu'?v['t_'+i]:H.kali(v['q_'+i],H.kurang(v['p_'+i],v['c_'+i]));});
    if(hasil.some(function(x,i){return H.banding(x,0)<=0||hasil.slice(0,i).some(function(y){return H.sama(x,y);});}))throw new Error('Hasil tidak positif atau ada peringkat seri');
    var urut=m.nama.map(function(_,i){return i;}).sort(function(a,b){return H.banding(hasil[a],hasil[b])*(m.tipe==='waktu'?1:-1);});
    return {peringkat:m.nama.map(function(_,i){return urut.indexOf(i)+1;}),nilai:hasil.map(H.keAngka)};
  }
  // Audit jejak dari petunjuk asli dan solusi independen; tidak memanggil penyusun visual.
  function periksaLangkah(b,sol){
    var m=b.model,n=m.nama.length,gs=b.gambarPembahasan||[],sebelum=Array(n).fill(null),par=-1;
    var sama=function(a,b){return JSON.stringify(a)===JSON.stringify(b);};
    if(gs.length!==n+2)throw new Error('Visual posisi harus lengkap dari kondisi awal sampai urutan final');
    gs.forEach(function(g,k){
      var v=g.model,at=b.pembahasan.indexOf(g.setelah),fase=k===0?'awal':k===1?'acuan':k===gs.length-1?'akhir':'petunjuk';
      if(m.kategoriEntitas&&(v.kategoriEntitas!==m.kategoriEntitas||!sama(v.kode,m.kode)))throw new Error('Identitas visual posisi tidak konsisten');
      if(g.jenis!=='peringkat-langkah'||g.id!=='posisi-langkah-'+k||!g.setelah||at<=par||b.pembahasan.lastIndexOf(g.setelah)!==at||v.tahap!==fase||!sama(v.nama,m.nama)||!Array.isArray(v.posisi)||v.posisi.length!==n)throw new Error('Urutan visual/paragraf posisi tidak sesuai');
      par=at;
      if(fase!=='akhir'&&v.peringkat!==undefined)throw new Error('Nomor peringkat muncul sebelum langkah final');
      if(fase==='awal'){
        if(!sama(v.posisi,sebelum))throw new Error('Kondisi awal membocorkan posisi');
      }else if(fase==='akhir'){
        var min=Math.min.apply(null,sebelum);
        if(!sama(v.posisi,sebelum)||!sama(v.peringkat,sol.peringkat)||!sama(v.peringkat,sebelum.map(function(x){return x-min+1;})))throw new Error('Normalisasi peringkat visual salah');
      }else{
        var berubah=[];v.posisi.forEach(function(x,i){if(x!==sebelum[i])berubah.push(i);});
        if(berubah.length!==1||berubah[0]!==v.baru||sebelum[v.baru]!==null||!Number.isInteger(v.posisi[v.baru]))throw new Error('Visual harus menambahkan tepat satu orang tanpa mengubah posisi sebelumnya');
        if(fase==='acuan'){
          if(v.baru!==0||v.posisi[0]!==0)throw new Error('Titik acuan visual salah');
        }else{
          var c=m.petunjuk[v.petunjuk];
          if(!c||!Number.isInteger(v.acuan)||sebelum[v.acuan]==null||v.jarak!==c.jarak||![c.orang,c.lain].includes(v.baru)||![c.orang,c.lain].includes(v.acuan)||v.posisi[c.lain]-v.posisi[c.orang]!==c.jarak||!g.setelah.includes(D.teks(m,c)))throw new Error('Arah/jarak visual tidak sesuai petunjuk');
        }
        v.posisi.forEach(function(x,i){if(x!=null&&x!==sol.peringkat[i]-sol.peringkat[0])throw new Error('Posisi relatif visual tidak sesuai solusi');});
      }
      sebelum=v.posisi.slice();
    });
  }
  function periksaVisualBadges(b,sol){
    var m=b.model,n=m.nama.length,gs=b.gambarPembahasan||[],sama=function(a,b){return JSON.stringify(a)===JSON.stringify(b);};
    var jumlah=m.tipe==='perbandingan'?m.petunjuk.length+2:n+2;
    if(gs.length!==jumlah)throw new Error('Visual Badges tidak lengkap dari kondisi awal sampai final');
    var sebelumnya={},dipakai=[],selesai=[],akhirPar=-1;
    if(m.tipe==='produk')m.produk.forEach(function(p,i){sebelumnya['u_'+i]=p.unit;sebelumnya['s_'+i]=H.keAngka(H.bagi(p.labaPerUnitSen,100));});
    function objekSama(a,b){return Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(function(k){return a[k]===b[k];});}
    gs.forEach(function(g,k){
      var v=g.model,awal=k===0,akhir=k===gs.length-1,at=b.pembahasan.indexOf(g.setelah),mulai=b.pembahasan.indexOf(g.mulai||g.setelah);
      if(m.kategoriEntitas&&(v.kategoriEntitas!==m.kategoriEntitas||!sama(v.kode,m.kode)))throw new Error('Identitas visual Badges tidak konsisten');
      if(g.id!=='badges-langkah-'+k||!v||v.tipe!==m.tipe||!sama(v.nama,m.nama)||at<0||mulai<=akhirPar||mulai>at||b.pembahasan.lastIndexOf(g.setelah)!==at||b.pembahasan.lastIndexOf(g.mulai||g.setelah)!==mulai)throw new Error('Urutan visual/paragraf Badges salah');
      akhirPar=at;
      if(!akhir&&(v.peringkat!==undefined||v.urutan!==undefined))throw new Error('Peringkat akhir muncul terlalu dini');
      var jenis=m.tipe==='perbandingan'?'badges-rantai':akhir?'badges-akhir':'badges-hitung';
      if(g.jenis!==jenis||!v.nilai||!Object.values(v.nilai).every(Number.isFinite))throw new Error('Jenis/data visual Badges tidak sah');
      if(awal){
        if(v.tahap!=='awal'||!objekSama(v.nilai,sebelumnya)||m.tipe==='perbandingan'&&(!sama(v.terpakai,[])||!sama(v.rantai,[])))throw new Error('Kondisi awal visual membocorkan hasil');
      }else if(akhir){
        var urut=m.nama.map(function(_,i){return i;}).sort(function(a,b){return sol.peringkat[a]-sol.peringkat[b];});
        if(v.tahap!=='akhir'||!objekSama(v.nilai,sebelumnya)||!sama(v.peringkat,sol.peringkat)||!sama(v.urutan,urut))throw new Error('Urutan final visual salah');
        if(m.tipe!=='perbandingan')sol.nilai.forEach(function(x,i){if(sebelumnya[(m.tipe==='waktu'?'t':'l')+'_'+i]!==x)throw new Error('Hasil visual berbeda dari hitungan independen');});
      }else if(m.tipe==='perbandingan'){
        var j=k-1,c=m.petunjuk[j];dipakai.push(j);
        if(v.tahap!=='relasi'||v.petunjuk!==j||!sama(v.terpakai,dipakai)||!sama(v.sorot,c.jenis==='tetap'?[c.orang]:[c.orang,c.lain])||!g.setelah.includes(D.teks(m,c))||Object.keys(v.nilai).length)throw new Error('Visual rantai tidak sesuai petunjuk baru');
        var edges=[],nodes=[];
        if(!Array.isArray(v.rantai))throw new Error('Rantai visual hilang');
        v.rantai.forEach(function(row){if(row.length<2)throw new Error('Rantai visual terlalu pendek');row.forEach(function(i,p){if(!Number.isInteger(i)||i<0||i>=n||nodes.indexOf(i)>=0)throw new Error('Nama visual rantai ganda/tidak sah');nodes.push(i);if(p)edges.push(row[p-1]+'>'+i);});});
        var expected=dipakai.filter(function(j){return m.petunjuk[j].jenis!=='tetap';}).map(function(j){var c=m.petunjuk[j];return c.orang+'>'+c.lain;});
        if(!sama(edges.sort(),expected.sort()))throw new Error('Rantai memuat relasi yang belum diturunkan');
      }else if(m.tipe==='laba'){
        var o=v.operasi,i=o&&o.orang,keys=['q_'+i,'p_'+i,'c_'+i,'l_'+i];
        if(v.tahap!=='orang'||!o||o.jenis!=='orang'||!Number.isInteger(i)||i<0||i>=n||selesai.indexOf(i)>=0||v.baru!=='l_'+i||!sama(v.kolomBaru,keys)||!Array.isArray(o.hitung)||o.hitung.length!==3)throw new Error('Visual keuntungan harus satu langkah lengkap per orang');
        if(Object.keys(v.nilai).length!==Object.keys(sebelumnya).length+4||!Object.keys(sebelumnya).every(function(key){return v.nilai[key]===sebelumnya[key];}))throw new Error('Visual orang mengubah baris lama atau tidak mengisi empat kolom');
        var kerja=Object.assign({},sebelumnya),fields=[];
        o.hitung.forEach(function(op){
          var c=m.petunjuk[op.petunjuk],key=c&&c.bidang+'_'+i;
          if(!c||c.orang!==i||['q','p','c'].indexOf(c.bidang)<0||fields.indexOf(c.bidang)>=0||kerja[key]!=null)throw new Error('Kolom orang hilang/ganda');
          fields.push(c.bidang);
          if(c.jenis==='turunan'&&kerja[c.ref]==null)throw new Error('Orang memakai nilai rujukan yang belum dihitung');
          var masukan=c.jenis==='turunan'?kerja[c.ref]:c.nilai,hasil=H.keAngka(c.jenis==='turunan'?H.tambah(H.kali(masukan,H.bagi(c.num,c.den)),c.tambah):H.q(c.nilai));
          var ex={jenis:c.jenis,orang:i,bidang:c.bidang,hasil:hasil,petunjuk:op.petunjuk,acuan:c.jenis==='turunan'?c.ref:null,masukan:masukan,num:c.num||1,den:c.den||1,tambah:c.tambah||0,persen:!!c.persen,hari:false,jamPerHari:m.jamPerHari};
          if(!sama(op,ex))throw new Error('Operasi kolom orang tidak sesuai petunjuk');kerja[key]=hasil;
        });
        var q=kerja['q_'+i],p=kerja['p_'+i],biaya=kerja['c_'+i],margin=H.keAngka(H.kurang(p,biaya)),laba=H.keAngka(H.kali(q,margin));kerja['l_'+i]=laba;
        if(o.jumlah!==q||o.harga!==p||o.biaya!==biaya||o.margin!==margin||o.hasil!==laba||!objekSama(v.nilai,kerja))throw new Error('Empat kolom/keuntungan orang tidak sesuai hitungan independen');
        selesai.push(i);sebelumnya=kerja;
      }else{
        var now=v.nilai,key=v.baru,o=v.operasi;
        if(!o||!key||Object.keys(now).length!==Object.keys(sebelumnya).length+1||sebelumnya[key]!==undefined||!Object.keys(sebelumnya).every(function(k){return now[k]===sebelumnya[k];}))throw new Error('Langkah hitungan harus menambah satu hasil dan mempertahankan hasil sebelumnya');
        var expectedOp,hasil;
        if(v.tahap==='data'){
          var j=v.petunjuk,c=m.petunjuk[j];
          if(!c||dipakai.indexOf(j)>=0||key!==c.bidang+'_'+c.orang||!g.mulai||!g.mulai.includes(D.teks(m,c)))throw new Error('Petunjuk hitungan visual ganda/salah');
          dipakai.push(j);
          if(c.jenis==='turunan'&&sebelumnya[c.ref]==null)throw new Error('Visual memakai rujukan yang belum dihitung');
          var masukan=c.jenis==='turunan'?sebelumnya[c.ref]:c.nilai;
          hasil=H.keAngka(c.jenis==='turunan'?H.tambah(H.kali(masukan,H.bagi(c.num,c.den)),c.tambah):H.kali(c.nilai,c.hari?m.jamPerHari:1));
          expectedOp={jenis:c.jenis,orang:c.orang,bidang:c.bidang,hasil:hasil,petunjuk:j,acuan:c.jenis==='turunan'?c.ref:null,masukan:masukan,num:c.num||1,den:c.den||1,tambah:c.tambah||0,persen:!!c.persen,hari:!!c.hari,jamPerHari:m.jamPerHari};
        }else if(v.tahap==='hasil'){
          var i=o.orang;if(!Number.isInteger(i)||i<0||i>=n||key!=='l_'+i||selesai.indexOf(i)>=0)throw new Error('Hasil visual salah/ganda');selesai.push(i);
          if(m.tipe==='produk'){
            hasil=H.keAngka(H.bagi(H.kali(m.produk[i].unit,m.produk[i].labaPerUnitSen),100));expectedOp={jenis:'produk',orang:i,hasil:hasil};
          }else if(m.tipe==='laba'){
            var q=sebelumnya['q_'+i],p=sebelumnya['p_'+i],c=sebelumnya['c_'+i];if([q,p,c].some(function(x){return x==null;}))throw new Error('Keuntungan ditampilkan sebelum data lengkap');
            var margin=H.keAngka(H.kurang(p,c));hasil=H.keAngka(H.kali(q,margin));expectedOp={jenis:'laba',orang:i,jumlah:q,harga:p,biaya:c,margin:margin,hasil:hasil};
          }else throw new Error('Tahap hasil tidak sesuai keluarga');
        }else throw new Error('Tahap hitungan tidak dikenal');
        if(now[key]!==hasil||!sama(o,expectedOp))throw new Error('Operasi/hasil visual salah');
        sebelumnya=Object.assign({},now);
      }
    });
  }
  function periksa(b,masalah){
    try{
      var m=b.model,is=b.isian,sol=pecahkan(m),sama=function(a,b){return JSON.stringify(a)===JSON.stringify(b);};
      if(!sama(is.nama,m.nama)||!sama(is.kartu,D.kartu(m))||!sama(is.pengantar,D.pengantar(m))||!sama(b.stimulus.teks,D.stimulus(m))||b.pertanyaan!==D.pertanyaan(m))throw new Error('Petunjuk/nama yang ditampilkan tidak sesuai data yang diperiksa');
      if(!sama(is.kunci.peringkat,sol.peringkat))throw new Error('Kunci peringkat tidak sesuai hasil pemecahan petunjuk');
      if(m.ragam==='shl')periksaKendala(b,sol);
      else if(m.tipe==='posisi')periksaLangkah(b,sol);
      else periksaVisualBadges(b,sol);
      if(!sama(is.awal.peringkat,m.nama.map(function(){return null;})))throw new Error('Peringkat awal harus kosong');
      if(!sama(is.kontrol,[{nama:'peringkat',min:1,maks:m.nama.length,langkah:1}]))throw new Error('Kontrol peringkat tidak sesuai');
      if(m.kategoriEntitas){
        var ps=m.nama.map(function(n){var p=Aset.cari(n,m.kategoriEntitas);if(!p)throw new Error('Nama/kategori tidak sesuai manifest');return p;});
        if(is.kategoriEntitas!==m.kategoriEntitas||!sama(is.profil,ps)||!sama(is.gambar,m.nama.map(function(n,i){return Aset.deskriptor(n,i,m.kategoriEntitas);})))throw new Error('Identitas atau gambar tidak sesuai bank aset');
        var isiSoal=is.pengantar.concat(is.kartu.map(function(k){return k.petunjuk.join(' ');}));
        if(is.kartu.some(function(k){return k.petunjuk.length!==1||Metrik.lebar(k.petunjuk[0],10.5,false)>260||k.petunjuk[0]&&(k.petunjuk[0].match(/\.(?:\s|$)/g)||[]).length!==1;}))throw new Error('Deskripsi kartu harus satu kalimat dalam satu baris');
        if(is.kartu.some(function(k){return /\b\d+\s*\/\s*\d+\b/.test(k.petunjuk[0]);}))throw new Error('Pecahan implisit tidak dipakai pada deskripsi ringkas');
        if(is.pengantar.concat([b.pertanyaan,b.perintah||'']).some(function(t){return /Jika suatu petunjuk|Di atas berarti|Deskripsi kosong tidak berarti|Dua angka pada setiap|Kalikan kedua|kerjakan perkalian|hitung bagian|gunakan semua petunjuk|Tidak ada nilai yang sama|Akhiran "nya"|Lencana 1 berarti/i.test(t);}))throw new Error('Petunjuk cara mengerjakan hanya boleh di pembahasan');
        var empty=is.kartu.map(function(k,i){return !k.petunjuk.join(' ').trim()?i:-1;}).filter(function(i){return i>=0;});
        if(empty.length>2)throw new Error('Maksimal dua deskripsi kosong');
        if(m.deskripsiKosong&&!sama(empty,m.deskripsiKosong))throw new Error('Daftar deskripsi kosong tidak sesuai tampilan');
        if(isiSoal.some(function(t){return /[=]|\bKode nama\b|\b[JHBWUL]\s*\([A-Z]\)/.test(t);}))throw new Error('Soal Badges tidak boleh memakai kode nama atau persamaan');
        var tampil=pecahkan(Kartu.modelDari(b));if(!sama(tampil.peringkat,sol.peringkat))throw new Error('Narasi yang tampil tidak menghasilkan kunci tunggal yang sama');
        if(m.tipe==='posisi'||m.tipe==='perbandingan'){
          if(m.petunjuk.some(function(c){return c.lokasi==='pertanyaan'?c.pemilik!==-1:!Number.isInteger(c.pemilik)||c.pemilik<0||c.pemilik>=m.nama.length;}))throw new Error('Setiap petunjuk harus tampil pada kartu atau pertanyaan');
        }
      }else{
        if(m.tipe!=='produk'&&!sama(is.profil,m.nama.map(Profil.ambil)))throw new Error('Nama, gender atau foto tidak sesuai profil tokoh');
        if(!sama(is.gambar,m.nama.map(function(n,i){return Profil.gambar(n,i,m.tipe==='produk');})))throw new Error('Gambar badge tidak sesuai nama/produk');
      }
      if(is.kartu.some(function(k){return !Array.isArray(k.petunjuk)||k.petunjuk.some(function(t){return typeof t!=='string';});})||is.kartu.filter(function(k){return !k.petunjuk.join(' ').trim();}).length>2)throw new Error('Deskripsi badge tidak sah / lebih dari dua kosong');
      var urut=m.nama.map(function(_,i){return i;}).sort(function(a,b){return sol.peringkat[a]-sol.peringkat[b];});
      var k=urut.map(function(i){return sol.peringkat[i]+'. '+m.nama[i];}).join('; ')+'.';
      if(b.kunciTeks!==k||b.pembahasan[b.pembahasan.indexOf('Kesimpulan')+1]!==k)throw new Error('Kesimpulan/kunci tertulis tidak sesuai urutan');
      if(sol.nilai)sol.nilai.forEach(function(x,i){var t='Hasil '+m.nama[i]+': '+(m.tipe==='produk'?D.uang(x):m.tipe==='laba'?'$'+D.angka(x):D.angka(x)+' jam')+'.';if(b.pembahasan.indexOf(t)<0)throw new Error('Hasil hitungan pembahasan tidak sesuai: '+m.nama[i]);});
      if(m.tipe==='produk'){
        if(is.entitas!=='produk')throw new Error('Isian harus menyebut produk');
        if(['mudah','sedang'].indexOf(b.level)<0)throw new Error('Perhitungan langsung produk hanya tersedia mudah/sedang');
        var rumus='§ \\text{laba bulanan} = \\text{unit terjual per bulan} \\times \\text{laba per unit}';
        if(b.pembahasan.indexOf(rumus)<0)throw new Error('Rumus laba bulanan tidak sesuai riset');
      }
    }catch(e){masalah.push('Pemeringkatan: '+e.message);}
  }
  return {pecahkan:pecahkan,periksa:periksa};
});
