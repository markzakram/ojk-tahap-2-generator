/* Identitas tokoh fiktif: nama, gender dan foto selalu dipilih sebagai satu profil. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./bank-aset-badges'));
  else root.ProfilBadges=factory(root.BankAsetBadges);
})(typeof self!=='undefined'?self:this,function(Aset){
  'use strict';
  var DAFTAR=[
    {id:'andi',nama:'Andi',gender:'laki-laki'},
    {id:'budi',nama:'Budi',gender:'laki-laki'},
    {id:'eko',nama:'Eko',gender:'laki-laki'},
    {id:'farhan',nama:'Farhan',gender:'laki-laki'},
    {id:'citra',nama:'Citra',gender:'perempuan'},
    {id:'dewi',nama:'Dewi',gender:'perempuan'},
    {id:'lili',nama:'Lili',gender:'perempuan'},
    {id:'tiara',nama:'Tiara',gender:'perempuan'}
  ];
  function ambil(nama){
    var p=DAFTAR.find(function(x){return x.nama===nama;});
    if(!p)throw new Error('Profil foto Badges tidak dikenal: '+nama);
    return {id:p.id,nama:p.nama,gender:p.gender,buatanAI:true,berkas:'assets/foto-badges/'+p.id+'.png'};
  }
  function gambar(nama,i,produk){
    var p=produk?null:ambil(nama);
    return {id:'badge-'+(i+1),jenis:produk?'ikon-produk':'foto-badges',model:produk?{indeks:i}:{id:p.id},judul:nama};
  }
  function pasang(b){
    var is=b.isian,produk=is.entitas==='produk';
    if(b.model.kategoriEntitas){
      is.kategoriEntitas=b.model.kategoriEntitas;
      is.profil=is.nama.map(function(n){return Object.assign({},Aset.cari(n,is.kategoriEntitas));});
      is.gambar=is.nama.map(function(n,i){return Aset.deskriptor(n,i,is.kategoriEntitas);});return b;
    }
    delete is.kategoriEntitas;
    if(!produk)is.profil=is.nama.map(ambil);
    is.gambar=is.nama.map(function(n,i){return gambar(n,i,produk);});return b;
  }
  return {DAFTAR:DAFTAR,ambil:ambil,gambar:gambar,pasang:pasang};
});
