/* Variasi di dalam enam bentuk figural riset, bukan kategori soal tambahan.
 * Sumber dan pembatasan pemilihan dicatat di riset-figural.js.
 * Pemeriksa terpisah: cek-pola-riset.js; tidak memakai aturan/kunci penyusun.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./rng.js'), require('./svg.js'), require('./bentuk.js'), require('./butir.js'), require('./format.js'));
  else root.PolaRiset = factory(root.Rng, root.Svg, root.Bentuk, root.Butir, root.Fmt);
})(typeof self !== 'undefined' ? self : this, function (Rng, S, B, Butir, Fmt) {
  'use strict';
  var INK = '#202020', PALET = ['lingkaran', 'segitiga', 'persegi', 'belah-ketupat', 'bintang', 'segienam'];
  var WARNA = ['#ffffff', '#999999', INK];
  var PERINTAH = 'Pilih gambar yang tepat untuk menggantikan tanda tanya.';
  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  function mod(x, n) { return (x % n + n) % n; }
  function seq(n, f) { return Array.from({ length: n }, function (_, i) { return f(i); }); }
  function nama(b) { return b === 'segienam' ? 'segi enam' : b.replace(/-/g, ' '); }
  function shape(b, i, x, y, s) { return B.svg(b, x, y, s, { isi: WARNA[i], garis: INK, tebal: 1.7 }); }
  function box(x, y, w, h, answer) { return S.rect(x, y, w, h, { isi: answer ? '#edf8ef' : '#ffffff', garis: answer ? '#2e7543' : '#777777', tebal: answer ? 2 : 1.2 }); }

  // Isi satu sel: bentuk/warna, beberapa objek, atau unsur yang ditumpangtindihkan.
  function cell(fig, x, y, u, cfg) {
    var o = [], cx = x + u / 2, cy = y + u / 2;
    if (fig.mode === 'simbol') return shape(fig.b, fig.i, cx, cy, u * .28);
    if (fig.mode === 'atribut') {
      var pos = fig.unsur.length === 1 ? [[.5, .5, .27]] : [[.56, .56, .24], [.2, .2, .115]];
      fig.unsur.forEach(function (v, j) { o.push(shape(v.b, v.i, x + u * pos[j][0], y + u * pos[j][1], u * pos[j][2])); });
    } else if (fig.mode === 'orbit') {
      cfg.bentuk.forEach(function (b, j) {
        var t = (mod(j + fig.pos, 5) * 72 - 90) * Math.PI / 180;
        o.push(shape(b, j === fig.hitam ? 2 : 0, cx + Math.cos(t) * u * .29, cy + Math.sin(t) * u * .29, u * .12));
      });
    } else if (fig.mode === 'gabung') {
      var g = { garis: INK, tebal: 1.8 }, r = u * .31;
      if (fig.mask & 1) o.push(S.lingkaran(cx, cy, r, { isi: 'none', garis: INK, tebal: 1.8 }));
      if (fig.mask & 2) o.push(S.rect(x + u * .27, y + u * .27, u * .46, u * .46, { isi: 'none', garis: INK, tebal: 1.8 }));
      if (fig.mask & 4) o.push(S.garis(cx - r, cy, cx + r, cy, g));
      if (fig.mask & 8) o.push(S.garis(cx, cy - r, cx, cy + r, g));
      if (fig.mask & 16) o.push(S.garis(cx - r, cy - r, cx + r, cy + r, g));
      if (fig.mask & 32) o.push(S.garis(cx - r, cy + r, cx + r, cy - r, g));
      if (fig.mask & 64) [[.13,.13],[.87,.13],[.13,.87],[.87,.87]].forEach(function (p) { o.push(S.lingkaran(x + p[0]*u, y+p[1]*u, u*.035, { isi: INK })); });
      if (fig.mask & 128) o.push(shape('belah-ketupat', 0, cx, cy, u * .14));
    } else if (fig.mode === 'jumlah') {
      fig.jumlah.forEach(function (n, j) {
        for (var k = 0; k < n; k++) o.push(shape(cfg.bentuk[j], 2, x + u * (.13 + (k % 4) * .24), y + u * (.15 + j * .47 + Math.floor(k / 4) * .17), u * .065));
      });
      if (fig.arah != null) {
        var ra = fig.arah * Math.PI / 4;
        o.push(S.panah(cx - Math.sin(ra) * u*.10, cy + Math.cos(ra)*u*.10, cx + Math.sin(ra)*u*.10, cy-Math.cos(ra)*u*.10, { warna: INK, tebal: 1.8, kepala: 4 }));
      }
    } else if (fig.mode === 'ukuran') {
      o.push(shape(cfg.bentuk[0], fig.isi, cx, cy, u * (.055 + fig.ukuran*.031)));
      var a = fig.arah * Math.PI / 4;
      o.push(S.panah(cx - Math.sin(a) * u*.42, cy + Math.cos(a)*u*.42, cx + Math.sin(a)*u*.42, cy-Math.cos(a)*u*.42, { warna: INK, tebal: 2.3, kepala: 7 }));
    }
    return o.join('');
  }
  function svgGrid(m) {
    var rows = m.grid.length, cols = m.grid[0].length, u = cols > 3 ? 47 : 94, pad = 12, top = m.jawaban ? 28 : 0, o = [];
    var holes = m.lubang || [];
    if (m.jawaban) o.push(S.teks('Pola dan pengisian jawaban', pad, 17, { ukuran: 13, tebal: true }));
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var h = holes.findIndex(function (p) { return p[0] === r && p[1] === c; });
      var f = m.grid[r][c], x = pad+c*u, y = top+pad+r*u;
      if (h >= 0 && m.jawaban) f = m.jawaban[h];
      o.push(box(x,y,u,u, h >= 0 && !!m.jawaban));
      if (f) o.push(cell(f,x,y,u,m.cfg));
      else o.push(S.teks('?',x+u/2,y+u*.66,{ukuran:u*.44,rata:'middle',tebal:true}));
      if (h >= 0 && holes.length > 1) o.push(S.teks(String(h+1),x+5,y+12,{ukuran:10,isi:'#455b8c',tebal:true}));
    }
    var W=cols*u+2*pad,H=rows*u+2*pad+top;
    if(m.jawaban && m.operasi){
      var row=m.grid[holes[0][0]],parts=[row[0],row[1],m.jawaban[0]],small=66,y0=H+20;
      o.push(S.teks('Terapkan pada baris yang belum lengkap:',pad,H+9,{ukuran:11}));
      parts.forEach(function(f,j){var x=pad+j*(small+28);o.push(box(x,y0,small,small,j===2));o.push(cell(f,x,y0,small,m.cfg));
        if(j<2)o.push(S.teks(j===0?m.operasi:'=',x+small+14,y0+small/2+5,{ukuran:20,rata:'middle',tebal:true}));});
      H=y0+small+pad;
    }
    return {svg:S.doc(o.join(''),W,H,{latar:'#ffffff'}),lebar:W,tinggi:H};
  }
  function svgSeq(m) {
    var u=94,pad=10,figs=m.kotak.concat([m.jawaban ? m.jawaban[0] : null]),o=[];
    figs.forEach(function (f,j) {
      var x=pad+j*(u+6);o.push(box(x,pad,u,u,j===figs.length-1 && !!m.jawaban));
      if(f) o.push(cell(f,x,pad,u,m.cfg));
      else o.push(S.teks('?',x+u/2,pad+u*.65,{ukuran:38,rata:'middle',tebal:true}));
    });
    var W=pad*2+figs.length*(u+6)-6,H=pad*2+u;
    return {svg:S.doc(o.join(''),W,H,{latar:'#ffffff'}),lebar:W,tinggi:H};
  }
  function svgOption(m) {
    var u=m.fig.length>2?53:85,pad=5,o=[];
    m.fig.forEach(function(f,j){o.push(box(pad,pad+j*u,u,u));o.push(cell(f,pad,pad+j*u,u,m.cfg));});
    var W=u+pad*2,H=u*m.fig.length+pad*2;
    return {svg:S.doc(o.join(''),W,H,{latar:'#ffffff'}),lebar:W,tinggi:H};
  }
  function rack(a,id,level,seed,ops,spec) {
    var target=ops.target==null?a.bulat(0,4):ops.target;
    var seen={},bad=[];seen[JSON.stringify(spec.key)]=true;
    spec.decoys.forEach(function(d){var k=JSON.stringify(d.fig);if(!seen[k]){seen[k]=true;bad.push(d);}});
    if(bad.length<4)return null;
    var list=a.kocok(bad.slice(0,4));list.splice(target,0,{fig:spec.key,alasan:null});
    var gd={cfg:spec.cfg||{}};
    if(spec.grid){gd.grid=spec.grid;gd.lubang=spec.holes;}else gd.kotak=spec.kotak;
    var kind=spec.grid?'riset-grid':'riset-deret';
    var pem=spec.pem.concat(['Gambar 1 menerapkan pola tersebut pada bagian yang kosong; jawaban ditandai dengan bingkai hijau.']);
    if(spec.key.length>1)pem.push('Isi jawaban dibaca dari atas ke bawah, mengikuti nomor pada posisi kosong: '+spec.key.map(function(f,i){return (i+1)+'. '+nama(f.b)+(f.i===2?' hitam':f.i===1?' abu-abu':' kosong');}).join('; ')+'.');
    var b=Butir.rakitPg({subtes:'ku',submateri:'figural',keluarga:id,level:level,benih:seed,a:a},{
      jenisSoal:spec.title,judul:spec.title,teks:[],pertanyaan:'',perintah:PERINTAH+(spec.key.length>1?' Urutan simbol pada pilihan mengikuti nomor pada posisi kosong.':''),
      gambar:[{id:'soal',jenis:kind,model:copy(gd),judul:spec.title}],
      pilihanJadi:{opsi:list.map(function(d,i){return {teks:'Gambar opsi '+Fmt.huruf(i),nilai:i,alasan:d.alasan,kunci:i===target,
        gambar:{id:'opsi-'+Fmt.huruf(i).toLowerCase(),jenis:'riset-opsi',model:{fig:d.fig,cfg:spec.cfg||{}},judul:'Opsi '+Fmt.huruf(i)}};}),kunciIndex:target},
      tulisKunci:false,langkah:[],pembahasan:pem,
      model:{topik:'Figural',tipe:'pola-riset',varian:spec.variant,data:copy(gd),pilihan:list.map(function(d){return d.fig;}),kunciIndex:target},
      sidik:{inti:id+'|'+spec.variant+'|'+JSON.stringify(gd),param:[],entitas:spec.variant}
    });
    if(!b)return null;
    gd.jawaban=spec.key;
    if(spec.operation)gd.operasi=spec.operation;
    b.gambarPembahasan=[{id:'bahas-1',jenis:kind,model:gd,judul:'Gambar 1. Penerapan pola pada jawaban'}];
    b.pola=id+':'+spec.variant;b.kategoriRiset='acuan';return b;
  }
  function changeOne(key,f,alasan) {var x=copy(key);f(x);return {fig:x,alasan:alasan};}
  function holes(grid,coords){return grid.map(function(row,r){return row.map(function(f,c){return coords.some(function(p){return p[0]===r&&p[1]===c;})?null:f;});});}

  function cyclic(a,id,level,seed,ops) {
    var n=id==='matriks-latin'?5:6, shapes=a.kocok(PALET).slice(0,n), step=a.pilih(level==='sulit'?[2,n-2]:[1,n-1]), phase=a.bulat(0,1);
    var fills=a.kocok(n===6?[0,0,0,2,2,2]:[0,0,2,2,2]), grid=[];
    for(var r=0;r<5;r++)grid.push(seq(n,function(c){var j=mod(c+step*r,n);return {mode:'simbol',b:shapes[j],i:n===5?2*((r+c+phase)%2):fills[j]};}));
    var h;
    if(n===6){var col=a.bulat(0,5);h=seq(5,function(r){return [r,col];});}
    else {var rr=a.ambil([0,1,2,3,4],2).sort(),cc=a.ambil([0,1,2,3,4],2);h=rr.map(function(r,j){return [r,cc[j]];});}
    var key=h.map(function(p){return grid[p[0]][p[1]];}),dec=[];
    dec.push({fig:key.map(function(f){var x=copy(f);x.i=2-f.i;return x;}),alasan:'Bentuk sesuai, tetapi isian hitam dan kosong terbalik.'});
    dec.push({fig:copy(key).reverse(),alasan:'Urutan simbol tidak sesuai dengan nomor posisi kosong.'});
    for(var i=0;i<key.length;i++){
      (function(j){dec.push(changeOne(key,function(x){x[j].b=shapes[(shapes.indexOf(x[j].b)+1)%n];},'Bentuk pada posisi '+(j+1)+' tidak meneruskan pergeseran baris.'));
      dec.push(changeOne(key,function(x){x[j].i=2-x[j].i;},'Isian pada posisi '+(j+1)+' melanggar pola warna.'));})(i);
    }
    var delta=step>n/2?n-step:step, dir=step>n/2?'kanan':'kiri';
    return rack(a,id,level,seed,ops,{title:'Figural Matriks - Kotak 5x'+n,variant:n===5?'geser-catur-dua-posisi':'geser-kolom',grid:holes(grid,h),holes:h,key:key,decoys:dec,
      pem:['Setiap baris memuat '+n+' bentuk dengan susunan yang bergeser '+delta+' posisi ke '+dir+' dari baris sebelumnya. Bentuk yang melewati ujung kembali ke sisi lainnya.',
        n===5?'Isian bergantian hitam dan kosong di sepanjang baris maupun kolom, seperti papan catur. Tentukan bentuk dan isian kedua posisi secara terpisah.':'Setiap bentuk mempertahankan isiannya pada seluruh matriks. Kolom yang hilang diisi dengan meneruskan urutan dari simbol di kiri dan kanannya.',
        'Pengecekan dilakukan pada seluruh posisi kosong; semua simbol harus memenuhi aturan bentuk dan warna.']});
  }

  function attributes(a,id,level,seed,ops) {
    var count=level==='sulit'?2:1, colored=level!=='mudah', defs=[];
    for(var j=0;j<count;j++)defs.push({b:a.ambil(PALET,3),br:a.kocok([0,1,2]),bc:a.kocok([0,1,2]),i:a.kocok([0,1,2]),ir:a.kocok([0,1,2]),ic:a.kocok([0,1,2])});
    var grid=seq(3,function(r){return seq(3,function(c){return {mode:'atribut',unsur:defs.map(function(d){return {b:d.b[(d.br[r]+d.bc[c])%3],i:colored?d.i[(d.ir[r]+d.ic[c])%3]:0};})};});});
    var h=[[a.bulat(0,2),a.bulat(0,2)]],key=[grid[h[0][0]][h[0][1]]],dec=[];
    defs.forEach(function(d,j){d.b.forEach(function(b){dec.push(changeOne(key,function(x){x[0].unsur[j].b=b;},'Bentuk '+(j===0?'di tengah':'di kiri atas')+' berulang dalam baris atau kolom yang sama.'));});
      [0,1,2].forEach(function(i){dec.push(changeOne(key,function(x){x[0].unsur[j].i=i;},colored?'Warna '+(j===0?'di tengah':'di kiri atas')+' tidak melengkapi tiga isian yang berbeda.':'Soal memakai bentuk kosong; pilihan ini menambahkan isian yang tidak mengikuti pola.'));});});
    // Pada tingkat sulit, keempat unsur (dua bentuk dan dua isian) harus
    // masing-masing diperlukan untuk menolak satu pengecoh.
    if(count===2){
      var wajib=[];
      defs.forEach(function(d,j){
        wajib.push(changeOne(key,function(x){x[0].unsur[j].b=d.b.find(function(b){return b!==key[0].unsur[j].b;});},'Bentuk '+(j===0?'di tengah':'di kiri atas')+' tidak melengkapi distribusi baris dan kolom.'));
        wajib.push(changeOne(key,function(x){x[0].unsur[j].i=(x[0].unsur[j].i+1)%3;},'Isian '+(j===0?'di tengah':'di kiri atas')+' tidak melengkapi tiga warna berbeda.'));
      });dec=wajib.concat(dec);
    }
    return rack(a,id,level,seed,ops,{title:'Figural Matriks - Kotak 3x3',variant:'distribusi-bentuk-warna',grid:holes(grid,h),holes:h,key:key,decoys:dec,
      pem:['Pada '+(count===2?'masing-masing posisi objek (tengah dan kiri atas)':'objek di tengah')+', setiap baris dan kolom memuat tiga bentuk berbeda tepat satu kali.',
        colored?'Aturan warna diperiksa secara terpisah: putih, abu-abu, dan hitam masing-masing muncul satu kali pada tiap baris dan kolom.':'Seluruh bentuk tanpa isian. Bentuk yang dicari adalah bentuk yang belum muncul pada baris dan kolom posisi kosong.',
        'Posisi kosong berada di baris '+(h[0][0]+1)+', kolom '+(h[0][1]+1)+'. Cocokkan unsur yang belum muncul dari kedua arah.']});
  }
  function orbit(a,id,level,seed,ops){
    var cfg={bentuk:a.ambil(PALET,5)},p=a.bulat(0,4),q=a.bulat(0,4),dr=a.pilih([1,2,3,4]),dc=a.pilih([1,2,3,4]);
    var hr=level==='mudah'?0:a.pilih([1,2,3,4]),hc=level==='mudah'?0:a.pilih([1,2,3,4]);
    var grid=seq(3,function(r){return seq(3,function(c){return {mode:'orbit',pos:mod(p+r*dr+c*dc,5),hitam:mod(q+r*hr+c*hc,5)};});});
    var h=[[a.bulat(0,2),a.bulat(0,2)]],key=[grid[h[0][0]][h[0][1]]],dec=[];
    [1,2,3,4].forEach(function(k){dec.push(changeOne(key,function(x){x[0].pos=(x[0].pos+k)%5;},'Susunan objek bergeser ke posisi yang tidak sesuai dengan baris dan kolom lainnya.'));});
    if(level!=='mudah')dec.splice(1,0,changeOne(key,function(x){x[0].hitam=(x[0].hitam+1)%5;},'Posisi objek benar, tetapi objek yang berwarna hitam tidak mengikuti siklus isian.'));
    return rack(a,id,level,seed,ops,{title:'Figural Matriks - Kotak 3x3',variant:'posisi-dan-isian',cfg:cfg,grid:holes(grid,h),holes:h,key:key,decoys:dec,
      pem:['Lima bentuk yang sama selalu ada di setiap kotak. Urutan melingkarnya tetap; posisinya bergeser '+dc+' tempat searah jarum jam setiap berpindah satu kolom ke kanan, dan '+dr+' tempat setiap berpindah satu baris ke bawah.',
        level==='mudah'?'Bentuk yang berwarna hitam tetap sama di seluruh matriks.':'Bentuk yang dihitamkan mengikuti siklus tersendiri pada urutan '+cfg.bentuk.map(nama).join(', ')+': maju '+hc+' bentuk per kolom dan '+hr+' bentuk per baris.',
        'Terapkan aturan posisi dan aturan isian pada kotak yang hilang secara terpisah.']});
  }
  function overlay(a,id,level,seed,ops){
    var sub=level==='sulit'&&a.untung(.5),grid=[];
    for(var r=0;r<3;r++){
      var parts=a.kocok([1,2,4,8,16,32,64,128]),n=level==='mudah'?1:level==='sedang'?2:3;
      var left=parts.slice(0,n).reduce(function(x,y){return x|y;},0),right=parts.slice(n,n*2).reduce(function(x,y){return x|y;},0);
      var row=sub?[left|right,right,left]:[left,right,left|right];
      grid.push(row.map(function(mask){return {mode:'gabung',mask:mask};}));
    }
    var h=[[a.bulat(0,2),2]],key=[grid[h[0][0]][2]],dec=[];
    [1,2,4,8,16,32,64,128].forEach(function(bit){dec.push(changeOne(key,function(x){x[0].mask^=bit;},(key[0].mask&bit?'Satu unsur gambar yang seharusnya tetap ada dihilangkan.':'Ada unsur tambahan yang tidak diperoleh dari operasi kedua kotak.')));});
    return rack(a,id,level,seed,ops,{title:'Figural Matriks - Kotak 3x3',variant:sub?'pengurangan-unsur':'penggabungan-unsur',operation:sub?'-':'+',grid:holes(grid,h),holes:h,key:key,decoys:a.kocok(dec),
      pem:[sub?'Pada setiap baris, gambar ketiga merupakan gambar pertama setelah semua unsur gambar kedua dihilangkan.':'Pada setiap baris, gambar ketiga menggabungkan seluruh unsur gambar pertama dan kedua tanpa menghilangkan unsur apa pun.',
        'Periksa dua baris yang lengkap terlebih dahulu. Terapkan operasi yang sama pada baris '+(h[0][0]+1)+'. Perhatikan garis, bingkai, titik, dan bentuk kecil secara terpisah.']});
  }
  function serial(a,id,level,seed,ops){
    var V=level==='mudah'?3:a.pilih([4,5]),size=a.untung(.5),cfg={bentuk:a.ambil(PALET,2)},start=a.bulat(0,7),rot=a.pilih([1,2,3,4,-1,-2,-3]),phase=a.bulat(0,1),rev=a.untung(.5),kotak=[],pem;
    var step=level==='mudah'?1:a.pilih([1,2]),two=level!=='mudah';
    for(var t=0;t<=V;t++){
      if(size)kotak.push({mode:'ukuran',ukuran:rev?V+1-t:t+1,arah:mod(start+(level==='mudah'?0:t*rot),8),isi:level==='sulit'?2*((t+phase)%2):0});
      else {var f={mode:'jumlah',jumlah:two?[rev?V-t:t,(rev?t:V-t)*step]:[rev?V-t:t]};if(level==='sulit')f.arah=mod(start+t*rot,8);kotak.push(f);}
    }
    var key=[kotak.pop()],dec=[];
    if(size){
      [-1,1,2,-2,3,-3,4,-4].forEach(function(d){var k=key[0].ukuran+d;if(k>=1&&k<=7)dec.push(changeOne(key,function(x){x[0].ukuran=k;},'Ukuran objek tidak meneruskan perubahan bertahap pada kotak sebelumnya.'));});
      var bedaUkuran=dec.slice();
      [1,2,3,4].forEach(function(d){dec.push(changeOne(key,function(x){x[0].arah=mod(x[0].arah+d,8);},'Arah panah tidak mengikuti pola pada deret.'));});
      if(level!=='mudah')dec=[changeOne(key,function(x){x[0].arah=mod(x[0].arah+2,8);},'Ukuran dan isian benar, tetapi arah panah salah.')].concat(bedaUkuran.slice(0,2),dec);
      if(level==='sulit')dec.unshift(changeOne(key,function(x){x[0].isi=2-x[0].isi;},'Isian tidak meneruskan pergantian hitam dan putih.'));
      pem=['Ukuran bentuk '+nama(cfg.bentuk[0])+' '+(rev?'mengecil':'membesar')+' dengan perubahan yang tetap pada tiap kotak.',level==='mudah'?'Arah panah tetap.':('Panah berputar '+Math.abs(rot)*45+' derajat '+(rot>0?'searah':'berlawanan arah')+' jarum jam setiap kotak.')];
      if(level==='sulit')pem.push('Isian bentuk bergantian hitam dan putih. Ketiga aturan harus dipenuhi bersamaan.');
    }else{
      var setiap=[];
      key[0].jumlah.forEach(function(n,j){var list=[];[-1,1,-2,2,-3,3,-4,4].forEach(function(d){if(n+d>=0&&n+d<=10)list.push(changeOne(key,function(x){x[0].jumlah[j]=n+d;},'Jumlah '+nama(cfg.bentuk[j])+' tidak sesuai dengan perubahan pada deret.'));});setiap.push(list);});
      // Selang-seling jenis objek, agar jenis kedua ikut menentukan jawaban.
      for(var di=0;di<8;di++)setiap.forEach(function(list){if(list[di])dec.push(list[di]);});
      if(level==='sulit')dec.unshift(changeOne(key,function(x){x[0].arah=mod(x[0].arah+2,8);},'Jumlah objek benar, tetapi putaran panah tidak sesuai.'));
      pem=['Jumlah '+nama(cfg.bentuk[0])+' '+(rev?'berkurang':'bertambah')+' satu setiap kotak.'];
      if(two)pem.push('Jumlah '+nama(cfg.bentuk[1])+' '+(rev?'bertambah':'berkurang')+' '+step+' setiap kotak. Hitung kedua jenis objek secara terpisah.');
      if(level==='sulit')pem.push('Panah juga berputar '+Math.abs(rot)*45+' derajat '+(rot>0?'searah':'berlawanan arah')+' jarum jam setiap kotak.');
    }
    return rack(a,id,level,seed,ops,{title:'Figural Serial - The Next Box',variant:size?'ukuran-putaran':'jumlah-objek',cfg:cfg,kotak:kotak,key:key,decoys:dec,pem:pem});
  }
  function buat(id,level,seed,ops,variant){
    ops=ops||{};var a=Rng.alat(seed);
    if(id==='serial')return serial(a,id,level,seed,ops);
    if(id==='matriks-latin'||id==='matriks-isi')return cyclic(a,id,level,seed,ops);
    if(variant==='distribusi')return attributes(a,id,level,seed,ops);
    if(variant==='posisi')return orbit(a,id,level,seed,ops);
    return overlay(a,id,level,seed,ops);
  }
  return {buat:buat,GAMBAR:{'riset-grid':svgGrid,'riset-deret':svgSeq,'riset-opsi':svgOption}};
});
