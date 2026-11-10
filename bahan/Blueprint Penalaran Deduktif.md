# Blueprint Penalaran Deduktif

Sumber: https://docs.google.com/document/d/1cyjSgqmwe_kaAeOCiMibLQ9FQGmgz7ETeTKFN0i-TAw/edit?usp=drivesdk&ouid=108536839094954732391

# Calendar Date Selection  

# Blueprint Generator — Calendar Date Selection

## Format SHL interaktif • hanya pola yang ditemukan pada sumber

# 1\. Cakupan dan dasar blueprint

Blueprint ini digunakan untuk menghasilkan soal Calendar Date Selection dalam bahasa Indonesia dengan struktur informasi, beban baca, kalender, dan cara menjawab yang mendekati contoh latihan SHL yang tersedia. Template dasar mengikuti mekanisme sumber. Variasi bentuk pertanyaan dan himpunan tanggal jawaban yang diizinkan dijelaskan tersendiri sebagai pengembangan dekat sumber; tidak diklaim sebagai contoh yang sudah teramati di SHL.

“Semua pola” dalam dokumen ini berarti seluruh keluarga pola yang ditemukan pada berkas sumber yang diperiksa, bukan klaim mencakup bank soal internal SHL. Sumber memuat empat contoh kalender dengan tiga keluarga mekanisme; dua contoh giliran kerja merupakan satu template yang sama dengan pergantian nama/konteks.

Sumber utama: folder SHL\_Deductive Reasoning Test (Interactive): contoh 1.pdf halaman 1 (ketersediaan tim); deduktif.pdf halaman 5–6 (Letter Distribution), 7–8 (Meeting Notes), dan 21–22 (Training Schedule). Halaman pertama pasangan memuat informasi dan pertanyaan; halaman kedua memuat kalender. Pemisahan ini akibat pencetakan tampilan, sehingga soal aplikasi tetap satu kesatuan.

Sumber interaksi: dokumen JadiOJK - Rancangan Fitur TKU, bagian Calendar Date Selection, mencatat batas pilihan SHL sebanyak lima tanggal walaupun kunci kurang dari lima. Ini digunakan sebagai spesifikasi implementasi yang mengikuti referensi tersebut, bukan kesimpulan universal tentang seluruh versi SHL.

## Penanda kepastian

TERAMATI = angka, format, atau mekanisme terlihat pada contoh. ATURAN PRODUKSI = batas operasional yang ditetapkan untuk meniru contoh dan menjaga kejelasan. PERLU DIJELASKAN = makna yang tidak boleh hanya diasumsikan oleh mesin. Ketentuan produksi bukan penambahan keluarga pola baru.

# 2\. Tiga profil soal yang diizinkan

## CDS-A — Irisan ketersediaan dan tanggal paling awal

TERAMATI: contoh 1.pdf halaman 1, Team Schedule. Empat orang: Diana, Edward, Fei, George. Empat baris informasi; satu baris berisi dua klausa. Diana tidak tersedia Senin/Jumat dan cuti 24–26; Edward cuti 2–13; Fei tersedia Selasa; George tersedia Selasa/Kamis. Pertanyaan terdiri atas satu kalimat: pilih hari kerja pertama ketika seluruh anggota dapat bertemu.

Kalender sumber: 30 hari, tanggal 1 pada Minggu, kolom Minggu–Sabtu. Ketersediaan mingguan dipadukan dengan pengecualian rentang tanggal. Tidak ada durasi rapat dalam jam, pergiliran tugas, penetapan ruang, atau aturan kapasitas.

Mekanisme: buat himpunan tanggal hari kerja; iriskan ketersediaan setiap orang; kurangi seluruh tanggal cuti; pilih tanggal terkecil. Kunci berisi tepat satu tanggal. Hari Selasa adalah satu-satunya hari bersama; kandidat 3 dan 10 gugur karena cuti Edward; 17 memenuhi seluruh ketentuan. Jawaban contoh sumber: tanggal 17.

ATURAN PRODUKSI: tepat empat orang; empat kartu/baris; tiga baris satu klausa dan satu baris dua klausa; total lima klausa informasi. Pertahankan dua pembatas ketersediaan mingguan positif, satu pembatas hari tidak tersedia, serta dua rentang cuti pada dua orang. Satu pertanyaan satu kalimat yang menyebut seluruh anggota, hari kerja, dan paling awal.

Saat mengganti tanggal, buat kandidat lebih awal gugur oleh kendala yang diberikan dan pilih hari bersama yang nyata pada kalender. Pastikan informasi tiap orang memiliki fungsi penyaringan. Template A sumber meminta tanggal paling awal. Bentuk tanggal paling akhir, semua tanggal cocok, atau sejumlah tanggal pertama hanya diperbolehkan sebagai variasi dekat sumber yang diberi label; aturan seluruh anggota tetap dipertahankan. Jangan menggantinya dengan “sebagian anggota” atau kuota minimum peserta.

## CDS-B — Giliran berurutan dalam blok hari kerja

TERAMATI: deduktif.pdf halaman 5–8. Lima orang mendapat giliran tugas, masing-masing empat hari berturut-turut dengan akhir pekan dikecualikan. Terdapat lima baris informasi: satu rentang tidak tersedia, tiga relasi urutan, dan satu pembatas nama hari untuk hari terakhir orang tertentu. Pertanyaan meminta tanggal pertama dan terakhir tugas satu orang.

Letter Distribution: Beatrice tidak tersedia 9–13; David sebelum Manpreet; Fei sesudah David; Jack sesudah Manpreet; hari terakhir Manpreet adalah Senin. Target Beatrice. Meeting Notes memakai pola identik: Pete tidak tersedia 9–13; Erica sebelum Ken; Ian sesudah Erica; Jasmine sesudah Ken; hari terakhir Ken adalah Senin. Target Pete.

Kalender sumber: 29 hari, tanggal 1 pada Minggu. Terdapat 20 hari Senin–Jumat: 2–6, 9–13, 16–20, dan 23–27. Lima blok empat hari kerja menghasilkan posisi blok: (2,3,4,5), (6,9,10,11), (12,13,16,17), (18,19,20,23), (24,25,26,27). Akhir pekan memisahkan tanggal kalender tanpa memutus urutan hari kerja.

ATURAN PRODUKSI: tepat lima orang; lima baris/kartu, masing-masing satu klausa; satu paragraf tiga kalimat: konteks giliran, durasi dan definisi hari kerja, lalu pertanyaan awal–akhir. Tetapkan satu giliran per orang, satu orang aktif pada satu hari, serta cakupan bulan dan ada/tidaknya celah secara eksplisit dalam redaksi ringkas. Kunci adalah dua tanggal batas, bukan empat tanggal tugas.

PERLU DIJELASKAN: sebelum/sesudah berarti relasi urutan umum; tepat sebelum/tepat sesudah berarti dua giliran bersebelahan tanpa orang lain di antaranya. Mesin tidak boleh menafsirkan “sesudah” sebagai “tepat sesudah” demi memperoleh jawaban unik.

## Audit contoh sumber dan akibatnya

Dengan lima blok yang menutup 20 hari kerja, Manpreet/Ken harus di blok 4: tanggal akhir blok berturut-turut adalah 5 (Kamis), 11 (Rabu), 17 (Selasa), 23 (Senin), dan 27 (Jumat). Jack/Jasmine harus di blok 5. Beatrice/Pete tidak dapat di blok 2 atau 3 karena beririsan dengan 9–13, sehingga harus di blok 1.

David/Erica dan Fei/Ian mengisi blok 2 dan 3 sesuai relasi sesudah. Urutan lengkap: Beatrice–David–Fei–Manpreet–Jack, atau Pete–Erica–Ian–Ken–Jasmine. Target bertugas 2, 3, 4, 5; jawaban awal–akhir adalah tanggal 2 dan 5. Enumerasi seluruh 120 permutasi menghasilkan satu susunan sah di bawah model cakupan penuh tersebut.

Relasi sebelum/sesudah pada contoh ini cukup dibaca sebagai urutan umum; tidak perlu dipaksa menjadi kedekatan langsung. Generator harus mempertahankan arti tersebut dan memeriksa seluruh penempatan. Cakupan giliran pada horizon tetap perlu jelas agar model tidak menambahkan hari jeda yang tidak disebutkan.

## CDS-C — Sesi beberapa hari dengan jeda dan ketergantungan

TERAMATI: deduktif.pdf halaman 21–22, Training Schedule. Empat sesi: Orientation, Company Policies, Data Protection, IT. Empat baris informasi: Orientation sesudah Data Protection; Company Policies tidak boleh tepat sebelum atau sesudah Orientation; Data Protection tidak tersedia 6–10; IT tidak boleh pertama.

Paragraf pertanyaan sumber terdiri atas lima kalimat: empat sesi pada hari kerja; setiap sesi tiga hari kerja berturut-turut; setelah dua sesi ada jeda dua hari kerja; tidak ada sesi pada tanggal 3 atau 17; lalu pertanyaan tanggal pelaksanaan IT. Kalender 28 hari, tanggal 1 pada Rabu, kolom Minggu–Sabtu. Kunci yang diminta adalah tiga tanggal pelaksanaan satu sesi, bukan hanya tanggal awal–akhir.

Mekanisme: gabungkan urutan empat sesi, relasi sesudah, larangan berdampingan, larangan posisi pertama, rentang ketidaktersediaan satu sesi, dua tanggal larangan global, durasi blok tiga hari, dan jeda dua hari kerja setelah sesi kedua. Seluruhnya tetap satu soal kalender tanggal, bukan timeline per jam.

ATURAN PRODUKSI: tepat empat sesi; empat baris, masing-masing satu klausa; satu paragraf lima kalimat seperti sumber. Gunakan satu relasi sesudah, satu relasi tidak berdampingan, satu rentang tidak tersedia, dan satu larangan urutan pertama. Pertahankan durasi tiga hari kerja, jeda dua hari kerja setelah dua sesi, serta dua tanggal larangan global. Target hanya satu sesi, dengan tiga tanggal jawaban.

## Makna kalender yang wajib dikunci

Tentukan awal horizon, aturan celah di luar jeda, dan apakah tanggal larangan global menghentikan pekerjaan atau mengubah definisi hari kerja. Hari kerja pada dasarnya Senin–Jumat. Tanggal terlarang tetap tanggal hari kerja: sesi tidak boleh diletakkan di sana, tetapi jangan otomatis menghapusnya dari perhitungan “berturut-turut” atau jeda kecuali redaksi menyatakannya sebagai hari nonoperasional.

Jeda dua hari kerja dihitung setelah hari terakhir sesi kedua, dengan akhir pekan dilewati. Dua sesi yang “tepat sebelum/sesudah” dibandingkan pada urutan sesi; bukan selisih tanggal kalender, karena tiap sesi berlangsung beberapa hari dan dapat dipisahkan jeda.

Sumber yang dicetak tidak menjelaskan semua asumsi awal dan celah. Karena itu, jangan menerbitkan ulang kunci contoh C dari asumsi diam-diam. Untuk instans generator, nyatakan jadwal dimulai pada hari kerja yang ditentukan, jelaskan kesinambungan/jeda, kemudian hitung seluruh solusi. Gunakan klausa pendek dalam kalimat konteks yang sama; jangan mengubahnya menjadi soal narasi panjang.

# 3\. Batas struktur, variabel, dan bahasa

## Jumlah entitas utama

A: empat orang. B: lima orang. C: empat sesi. Rentang empat–lima ini adalah hasil observasi template; jangan mengacak menjadi enam–delapan entitas. Nama dan foto hanya identitas; tidak menjadi informasi tersirat tentang umur, jabatan, atau ketersediaan.

Bedakan jumlah orang atau sesi dari hal yang diminta sebagai jawaban. A menanyakan tanggal rapat; B menanyakan batas tanggal tugas satu orang; C menanyakan tanggal pelaksanaan sesi target. Pada variasi jawaban, ikuti bentuk pertanyaan yang dinyatakan. Tanggal, lama sesi, dan hari awal bulan merupakan informasi kalender yang harus konsisten.

## Jumlah kalimat dan klausa

Pisahkan hitungan paragraf pertanyaan dari kartu petunjuk. A memiliki satu kalimat pertanyaan dan lima klausa pada empat kartu; B tiga kalimat konteks/pertanyaan dan lima klausa pada lima kartu; C lima kalimat konteks/pertanyaan dan empat klausa pada empat kartu. Kartu boleh berupa frasa, sehingga jumlah titik tidak sama dengan jumlah kendala.

Batas produksi mengikuti profil tersebut. Maksimal dua klausa pada satu kartu, hanya untuk A seperti sumber; B/C satu klausa per kartu. Jangan menyembunyikan kendala baru dalam judul, nama, foto, atau teks dekoratif. Jika klarifikasi semantik memerlukan klausa tambahan, catat sebagai klarifikasi dan pertahankan jumlah kalimat utama profil; jangan mengklaim seluruh jumlah katanya identik dengan SHL.

ATURAN PRODUKSI bahasa Indonesia: judul konteks dua–empat kata; nama satu kata dan unik; petunjuk kartu ringkas dengan sasaran sekitar 3–16 kata; paragraf utama sekitar 12–25 kata untuk A, 35–65 kata untuk B, dan 55–90 kata untuk C. Ini batas editorial usulan, bukan hitungan atau ketentuan resmi SHL. Kejelasan makna lebih utama daripada memaksakan jumlah kata.

Gunakan istilah konsisten: hari kerja = Senin–Jumat; akhir pekan = Sabtu–Minggu; rentang tanggal inklusif; “tepat” menandai kedekatan langsung; “pertama/paling awal” menandai minimum tanggal; “hari pertama dan terakhir” meminta batas; “pada tanggal berapa saja” meminta seluruh tanggal target.

# 4\. Kalender dan ketentuan opsi

## Kalender sebagai area jawaban

TERAMATI: satu bulan, tujuh kolom, urutan Minggu–Sabtu. A: 30 hari/Minggu; B: 29 hari/Minggu; C: 28 hari/Rabu. Untuk versi pertama generator, pertahankan konfigurasi kalender tiap template. Tampilan 29 hari adalah kalender ilustratif sumber; tidak perlu mengarang nama bulan/tahun nyata yang tidak cocok.

Sel sebelum tanggal 1 dan setelah tanggal terakhir kosong serta tidak dapat dipilih. Tanggal diurutkan sesuai posisi hari. Warna pilihan harus berbeda dari keadaan awal. Tampilkan judul konteks, kartu informasi, pertanyaan, dan kalender sebagai satu soal; perbedaan halaman pada PDF bukan dua soal.

## Tidak ada opsi A–E

Sel tanggal adalah kandidat jawaban. Jangan mengubah Calendar Date Selection menjadi lima opsi teks, pasangan tanggal pilihan ganda, atau daftar jadwal alternatif. Kalender menampilkan seluruh tanggal bulan; jumlah sel kalender berbeda dari jumlah tanggal yang boleh dipilih.

Jumlah tanggal dalam kunci jawaban wajib minimal 1 dan maksimal 5, dengan tanggal unik yang berada dalam bulan soal. Jumlah yang dipilih peserta untuk dikirim juga 1–5. Batas antarmuka selalu lima, tidak disesuaikan dengan banyaknya tanggal kunci. Pada template sumber A/B/C, panjang kunci masing-masing satu/dua/tiga; variasi bentuk pertanyaan dapat menghasilkan 1–5 tanggal sesuai ketentuan bagian variasi.

ATURAN PRODUKSI interaksi: klik tanggal untuk memilih, klik ulang untuk membatalkan, dan sediakan reset. Saat lima tanggal sudah dipilih, cegah penambahan tanggal keenam dengan umpan balik netral. Jangan mengungkap benar/salah, jumlah tanggal kunci, atau otomatis mengisi tanggal di antara dua klik.

Pada template sumber: A memilih tanggal pertama yang memenuhi; B memilih tanggal pertama dan terakhir tugas; C memilih seluruh tiga tanggal sesi. Pada variasi, ikuti operator pertanyaan yang ditulis secara eksplisit. Tanggal jawaban dapat berurutan, terpisah akhir pekan, atau berjauhan. Jangan otomatis mengisi rentang di antara dua tanggal yang dipilih. Semua tanggal harus diturunkan dari kendala, bukan diacak tanpa alasan.

## Tanggal akhir pekan/terlarang

Di sumber PDF, semua nomor tanggal terlihat tanpa jawaban atau validasi langsung. Untuk menghindari pemberian petunjuk tambahan, tampilkan akhir pekan dan tanggal larangan sebagaimana tanggal lain; biarkan pembaca menafsirkan kartu. Jangan menonaktifkannya berdasarkan kunci. Hanya sel kosong di luar bulan yang pasti tidak menjadi kandidat.

ATURAN PRODUKSI penilaian: cocokkan himpunan tanggal terpilih dengan satu himpunan kunci secara tepat; urutan klik tidak berpengaruh. Pilihan berlebih, kurang, atau salah tanggal berarti jawaban belum tepat. Peserta boleh mengosongkan pilihan ketika mengedit/reset, tetapi tidak dapat mengirim jawaban kosong; minimum satu berlaku saat pengiriman. Sistem boleh menyimpan status belum dijawab tanpa menilainya sebagai jawaban yang sah. Ini rancangan aplikasi, bukan klaim metode skor internal SHL.

# 5\. Ketentuan soal dan pemeriksaan solusi

## Informasi yang harus jelas dalam soal

Setiap soal harus menjelaskan kalender yang digunakan, orang atau sesi yang terlibat, petunjuk, hal yang ditanyakan, serta cara memilih tanggal. Sertakan rujukan sumber, kunci jawaban, dan pembahasan untuk keperluan peninjauan materi. Blueprint menjelaskan ketentuan soal dalam bahasa biasa agar penerapannya tetap fleksibel.

Ketentuan yang dapat digunakan meliputi hari tersedia atau tidak tersedia, rentang tanggal larangan, hubungan sebelum/sesudah atau tepat sebelum/sesudah, larangan sesi berdampingan, larangan menjadi urutan pertama, hari terakhir tertentu, durasi tugas, jeda, tanggal larangan bersama, serta awal dan kesinambungan jadwal. Gunakan hanya ketentuan yang sesuai dengan profil soal dan tuliskan maknanya dengan jelas.

A hanya memakai masker hari dan pengecualian rentang; B memakai giliran berblok, urutan, ketidaktersediaan, dan nama hari akhir; C memakai blok sesi, jeda, ketidaktersediaan, urutan/ketidakberdampingan, dan larangan global. Jangan menambahkan jam, uang, jarak, kapasitas, persentase, atau kuantor jumlah peserta.

## Prosedur solusi A

Bangun tanggal hari kerja dari kalender. Terapkan ketersediaan positif terlebih dahulu; potong hari tidak tersedia dan cuti. Ambil minimum dari irisan nonkosong. Simpan kandidat sebelum dan sesudah tiap penyaringan agar pembahasan dapat menunjukkan mengapa tanggal lebih awal gugur.

## Prosedur solusi B

Bangun urutan hari kerja dan blok empat hari menurut horizon/celah yang dinyatakan. Enumerasi penempatan lima orang, lalu periksa larangan tanggal, relasi urutan atau kedekatan sesuai teks, dan nama hari akhir. Proyeksikan setiap solusi menjadi pasangan tanggal target. Jangan berhenti setelah menemukan satu penempatan yang cocok.

## Prosedur solusi C

Enumerasi urutan empat sesi dan seluruh penempatan tanggal yang diperbolehkan oleh awal horizon, durasi tiga hari kerja, kebijakan celah, jeda setelah dua sesi, serta tanggal larangan. Uji semua kendala kartu. Proyeksikan setiap solusi menjadi himpunan tiga tanggal sesi target.

## Syarat keunikan jawaban

Setiap soal wajib menghasilkan tepat satu himpunan tanggal jawaban yang benar. Banyak tanggal dalam satu himpunan bukan banyak kemungkinan jawaban. Contohnya, kunci {3,10,24} adalah satu jawaban berisi tiga tanggal; jika {3,10,24} dan {3,17,24} sama-sama dapat dibenarkan, soal ambigu dan wajib ditolak. Semua solusi jadwal harus diproyeksikan melalui operator pertanyaan; jumlah himpunan hasil proyeksi yang berbeda harus tepat satu. Untuk B/C, utamakan pula jadwal lengkap yang unik agar pembahasannya pasti; apabila beberapa jadwal lengkap diperbolehkan, seluruhnya wajib memberi himpunan target identik.

Tolak soal tanpa solusi, kunci kosong, kunci berisi lebih dari lima tanggal, tanggal duplikat/tidak ada di kalender, durasi tidak terpenuhi, ketentuan bertabrakan, atau teks yang berbeda makna dari model. Untuk “semua tanggal”, jangan memangkas hasil yang lebih dari lima menjadi lima; buat ulang instans. Untuk “k tanggal pertama”, tolak jika jumlah tanggal valid kurang dari k. Periksa ulang keunikan setelah perubahan nama, tanggal, kartu, atau bentuk pertanyaan.

# 6\. Pembentukan soal dan kendali kemiripan

Bangun jadwal/himpunan yang sah terlebih dahulu, turunkan petunjuk sesuai profil sumber, tulis redaksi, lalu pecahkan ulang hanya dari informasi yang terlihat oleh peserta. Jangan membiarkan generator memakai fakta internal yang tidak dituliskan untuk menentukan kunci.

Beban penalaran A berasal dari irisan beberapa aturan hari dan cuti; B dari urutan, blok empat hari, serta perpindahan melewati akhir pekan; C dari interaksi urutan, ketidakberdampingan, durasi, jeda, dan tanggal larangan. Tingkatkan variasi instans melalui parameter yang sama, bukan dengan menambah entitas, klausa, atau mekanisme baru.

Jangan menetapkan distribusi frekuensi keluarga sebagai frekuensi SHL: dua contoh B merupakan versi ulang satu template, sehingga jumlah tangkapan layar tidak menunjukkan bobot tes. Untuk bank awal, buat ketiga keluarga tersedia; pemilihan proporsi paket ditetapkan terpisah setelah kebutuhan tryout diketahui.

## Pembahasan yang wajib disertakan

A: hari bersama, tanggal yang gugur, dan alasan memilih yang paling awal. B: urutan giliran, daftar empat tanggal tiap blok, pemeriksaan seluruh petunjuk, dan dua batas tanggal target. C: urutan sesi, kalender pelaksanaan, dua hari jeda, seluruh tanggal yang dilarang, dan tiga tanggal sesi target. Tampilkan hanya kesimpulan yang benar-benar didukung redaksi.

## Daftar lulus sebelum penerbitan

Profil dan sumber tercatat; jumlah entitas/kartu/kalimat sesuai; kalender cocok; tidak ada pola luar sumber; before/after dan immediate dibedakan; awal/celah dan hari terlarang jelas; himpunan target tunggal; maksimal lima pilihan terpisah dari jumlah kunci; tidak ada petunjuk jawaban melalui warna/disable; pembahasan cocok dengan seluruh kendala.

# 7\. Variasi jawaban yang tetap dekat dengan sumber

## Status variasi

Bagian ini ditambahkan sesuai kebutuhan pengembangan generator. Yang divariasikan adalah cara meminta tanggal dari mekanisme A/B/C yang sama. Tidak ada tambahan orang, jenis relasi, konteks jam, atau aturan di luar keluarga kalender sumber. Dalam pembahasan blueprint, bedakan bentuk asli yang ditemukan pada sumber dan variasi jawaban yang dikembangkan. Jangan menyebut variasi sebagai bentuk yang sudah terbukti keluar di SHL.

## A — Tanggal bersama seluruh anggota

A0 sumber: pilih tanggal hari kerja paling awal ketika seluruh anggota tersedia → satu tanggal. A1 variasi: pilih tanggal hari kerja paling akhir yang memenuhi → satu tanggal. A2 variasi: pilih semua tanggal hari kerja dalam bulan ketika seluruh anggota tersedia → satu sampai lima tanggal, dengan jumlah tidak dibocorkan oleh antarmuka. A3 variasi: pilih k tanggal hari kerja pertama yang memenuhi, dengan k dinyatakan jelas dan bernilai 2–5 → tepat k tanggal.

Tetap gunakan empat orang, empat kartu, dan struktur kendala A. Untuk A2, jawaban dapat berbentuk beberapa hari mingguan yang berjauhan dan terpotong rentang cuti. Untuk A3, jika ada lebih dari k kandidat, operator “pertama” menentukan himpunan tunggal; jangan menulis “pilih k tanggal yang cocok” karena beberapa kombinasi dapat sama-sama benar. Kunci lima tanggal hanya diterbitkan bila kalender dan kendala memang menghasilkan lima tanggal yang diminta.

## B — Tanggal tugas satu orang

B0 sumber: pilih tanggal pertama dan terakhir tugas → dua tanggal batas. B1 variasi: pilih hanya tanggal pertama → satu tanggal. B2 variasi: pilih hanya tanggal terakhir → satu tanggal. B3 variasi: pilih seluruh tanggal tugas orang tersebut → empat tanggal sesuai durasi sumber. Pertahankan lima orang dan empat hari kerja per giliran. Jangan menaikkan durasi menjadi lima hanya untuk memaksakan kunci lima tanggal.

Tulis “tanggal pertama dan terakhir” untuk B0; tulis “semua tanggal bertugas” untuk B3. Keduanya tidak dapat dipertukarkan. Empat hari kerja dapat menghasilkan empat nomor tanggal berurutan atau dua kelompok yang dipisahkan akhir pekan. Dua tanggal batas sendiri umumnya berjauhan dan tetap dihitung dua pilihan, bukan seluruh rentang kalender.

## C — Tanggal sesi target

C0 sumber: pilih seluruh tanggal pelaksanaan sesi target → tiga tanggal. C1 variasi: pilih tanggal mulai → satu tanggal. C2 variasi: pilih tanggal selesai → satu tanggal. C3 variasi: pilih tanggal mulai dan selesai → dua tanggal batas. Tetap gunakan empat sesi, durasi tiga hari kerja, dan struktur jeda/larangan C. Jangan memilih gabungan beberapa sesi atau menambah durasi tanpa perluasan blueprint tersendiri.

## Bentuk dan urutan tanggal

Kunci boleh berupa tanggal berurutan, misalnya {8,9,10}; terpisah akhir pekan, misalnya {6,9,10}; atau berjauhan, misalnya {3,10,24}. Ini ilustrasi bentuk himpunan, bukan kunci baru untuk contoh sumber. Kelayakan setiap contoh bergantung pada hari awal bulan, definisi hari kerja, serta kendala yang benar-benar dituliskan. Simpan kunci berurutan naik untuk pembahasan, tetapi urutan klik peserta bebas.

## Validasi logika dan antiambiguitas

Bangun model kendala hanya dari informasi yang terlihat. Pastikan ada sekurang-kurangnya satu jadwal/himpunan yang memenuhi semuanya sekaligus. Untuk setiap kandidat, periksa ketersediaan positif dan negatif, rentang inklusif, urutan versus kedekatan, hari akhir, durasi, awal horizon, kebijakan celah, dan jeda. Larangan tanggal untuk satu entitas tidak boleh diterapkan sebagai larangan global tanpa pernyataan.

Enumerasi seluruh solusi yang sah, terapkan operator pertanyaan yang dipilih, lalu buang duplikasi himpunan hasil. Terbitkan hanya jika tersisa tepat satu himpunan dengan 1–5 tanggal. Simpan bukti satu jawaban serta alasan kandidat lain gugur. Solver yang berhenti pada solusi pertama tidak memadai untuk membuktikan keunikan.

Konsistensi redaksi diuji dua arah: setiap kalimat memiliki padanan kendala, dan setiap kendala yang menentukan jawaban memiliki padanan kalimat/kalender yang terlihat. Jika ada konflik, jangan melemahkan atau mengabaikan petunjuk demi menyelamatkan kunci; ubah parameter atau buat ulang soal, lalu pecahkan ulang seluruhnya.

Pemeriksaan akhir wajib: tipe pertanyaan eksplisit; panjang kunci 1–5; tepat satu himpunan jawaban; semua tanggal sah; tidak ada kendala bertabrakan; panjang tugas/sesi sesuai; tidak ada asumsi tersembunyi; kunci dan pembahasan cocok; pilihan keenam ditolak; jawaban kosong tidak dapat dikirim; urutan klik tidak mengubah penilaian.

# Rujukan

Berkas sumber lokal: contoh 1.pdf halaman 1; deduktif.pdf halaman 5–8 dan 21–22, folder SHL\_Deductive Reasoning Test (Interactive). Contoh 2–5 dan halaman lain dalam deduktif.pdf menampilkan tipe interaksi lain dan tidak dijadikan pola kalender.

Referensi perilaku pilihan kalender: JadiOJK - Rancangan Fitur TKU (Tahap 2 PCAM OJK), bagian Calendar Date Selection. https://docs.google.com/document/d/10dlHfSw8pDwCI7mUqJP1WE5JFH1V9f4Ut\_48MINroYk

# 8\. Nama orang dan gambar

Daftar pada subtes ini memuat tepat 26 nama orang yang berbeda. Gunakan daftar identitas berikut untuk memilih nama dan gambar orang pada soal Calendar Date Selection. Setiap entri terdiri atas satu nama dan satu gambar tersendiri.

Jumlah orang mengikuti profil kalender: empat orang untuk ketersediaan tim dan lima orang untuk giliran tugas. Pada profil sesi pelatihan, gunakan nama sesi dan gambar kegiatan; daftar orang ini tidak menambah peserta pada soal.

Nama pada kartu petunjuk, gambar, pertanyaan, kunci, dan pembahasan harus konsisten. Dalam satu soal, jangan memakai gambar yang sama untuk dua orang berbeda. Nama berikut adalah nama latihan; gambar merupakan cuplikan sumber SHL dan tidak menyatakan identitas asli orang dalam foto.

Aset generator: [folder utama](https://drive.google.com/drive/folders/1WtNF6dSO3lE7ZtT6ty41f5vQhSy9S4FS) • [Folder PNG subtes ini](https://drive.google.com/drive/folders/1_iXerpQh_CL0P8cdfrHMJJ4xiewnFR2h). Klik nama orang pada tabel untuk membuka file PNG masing-masing; satu file berisi satu orang.

  

|  |  |
| :-: | :-: |
| \*\*Foto\*\* | \*\*Nama\*\* |
|  | \[Arman\](https://drive.google.com/file/d/1S5lVLYR3qbmnbJln157jcQ672Z\_y2MNS/view?usp=drivesdk) |
|  | \[Bella\](https://drive.google.com/file/d/1biII6OCTVNj9VKevZ88PQQFLEFvi\_u81/view?usp=drivesdk) |
|  | \[Candra\](https://drive.google.com/file/d/1L6bqJph0UMNFYh2kTEfm9\_k8wk3xgWAA/view?usp=drivesdk) |
|  | \[Dinda\](https://drive.google.com/file/d/17\_11Z5rr0S0gshr9-8U52sKDbZ1SqBRY/view?usp=drivesdk) |
|  | \[Evan\](https://drive.google.com/file/d/17I7OgJoJRROX0KbEZwM8SWGnyfBZyZPM/view?usp=drivesdk) |
|  | \[Farah\](https://drive.google.com/file/d/1ygqLuWHWUyk7iXeikVzO67sDSELlGnsJ/view?usp=drivesdk) |
|  | \[Gita\](https://drive.google.com/file/d/1TjFCf-nYuVprGQCVyvEpghBLvgk8JzyF/view?usp=drivesdk) |
|  | \[Hendra\](https://drive.google.com/file/d/1Waa0Lbw-sh1af3LwCLL3Hp3IUU3vk9CB/view?usp=drivesdk) |
|  | \[Irfan\](https://drive.google.com/file/d/1mCD2SXvU\_rppFQIRcQUzDRnrSmJPN\_WZ/view?usp=drivesdk) |
|  | \[Jelita\](https://drive.google.com/file/d/1oFjgQP4WjtsDaDIH5\_gKOoAkhcIRlIPa/view?usp=drivesdk) |
|  | \[Kevin\](https://drive.google.com/file/d/1LCKQq3IbkayTeQtRqPXogWHEaL6oEyh8/view?usp=drivesdk) |
|  | \[Laras\](https://drive.google.com/file/d/16h0yaLNIKmpdo9o04hMc8Ye2gMplATO4/view?usp=drivesdk) |
|  | \[Malik\](https://drive.google.com/file/d/1jS5OqytpCOVeeIQUAtJ8APgJAFCPVcQH/view?usp=drivesdk) |
|  | \[Nadia\](https://drive.google.com/file/d/151e\_GX-GS6fSr5B\_Mb7wLEsjYGwTaqRL/view?usp=drivesdk) |
|  | \[Omar\](https://drive.google.com/file/d/1vNZdZa19EwBvwYsFshcDDgN-V9jjBrZr/view?usp=drivesdk) |
|  | \[Putra\](https://drive.google.com/file/d/1C-UcsdxKedDYzAoBt5pZBKeb4NBITTKe/view?usp=drivesdk) |
|  | \[Qadir\](https://drive.google.com/file/d/1Bwwbc18UsTIfi9p9cU6fSPm\_1X4x2FIR/view?usp=drivesdk) |
|  | \[Rani\](https://drive.google.com/file/d/1MgW4obiLHnetVjqt1H3g\_sNBcFERaIPZ/view?usp=drivesdk) |
|  | \[Surya\](https://drive.google.com/file/d/10ZC-o42MG4-f4cydzie34gZLioTpNxnj/view?usp=drivesdk) |
|  | \[Tegar\](https://drive.google.com/file/d/1WPGLXxwGC0k9QFkK7ZkCwxU5yypOXY3\_/view?usp=drivesdk) |
|  | \[Ulfa\](https://drive.google.com/file/d/16tzkSa4Ml\_QUYoQGQHKLoakmyCxQDYhm/view?usp=drivesdk) |
|  | \[Vania\](https://drive.google.com/file/d/1C641hNc3r4XpkAWxRqEw8LrF4OTBwDtV/view?usp=drivesdk) |
|  | \[Wulan\](https://drive.google.com/file/d/1HaQhiM73Dc0lgBQhTWWD7kafGcayt-x9/view?usp=drivesdk) |
|  | \[Xenia\](https://drive.google.com/file/d/1nzEJ2m8uE-DeIXI8NkpFeIbFVKwMBLl-/view?usp=drivesdk) |
|  | \[Yasmin\](https://drive.google.com/file/d/1NeLZCG8ImoJINsnRC1rxcBTbOPIZA48Z/view?usp=drivesdk) |
|  | \[Zahra\](https://drive.google.com/file/d/1ANUJDW\_kXwjA45bv17PTw6o02uhA5UAe/view?usp=drivesdk) |

  
  
**  
**

# Room Allocations**  
**

# Blueprint Generator — Room Allocations

## Lima orang • maksimal tiga orang per ruangan • satu alokasi jawaban

# 1\. Cakupan dan ketentuan utama

Blueprint mengikuti tiga mekanisme pada sumber SHL interaktif: pengelompokan orang berdasarkan ruangan sama/berbeda; alokasi kantor berdasarkan divisi, penggunaan ruangan, serta posisi fasilitas; dan pembagian ruang rapat berdasarkan durasi serta jam ketersediaan. Nama, gambar, dan konteks dapat diganti tanpa menambah mekanisme penalaran baru.

Setiap soal Room Allocations selalu menggunakan tepat lima orang. Istilah “variabel” di sini berarti lima orang atau gambar yang dipindahkan pada soal, bukan nama variabel pemrograman. Dokumen tidak menetapkan penamaan variabel teknis, bentuk data, atau struktur penyimpanan.

Setiap orang ditempatkan tepat satu kali ke tepat satu ruangan. Setiap ruangan maksimal menampung tiga gambar orang. Pada soal durasi, batas tiga berlaku pada jumlah orang yang dialokasikan ke ruangan, walaupun rapat berlangsung bergantian. Batas lima orang dan maksimal tiga per ruangan merupakan ketentuan blueprint yang diminta; bukan klaim batas universal SHL.

Seluruh ruangan dan area denah harus bernama. Ruangan yang tidak ditempati tetap harus berlabel. Ruangan boleh tidak terisi apabila ketentuan soal mengizinkannya; “tidak boleh ada ruangan kosong tanpa nama” tidak berarti semua ruangan wajib terisi orang. Jika semua ruangan harus ditempati, nyatakan secara eksplisit dan periksa kelayakannya.

Semua penempatan harus memenuhi seluruh ketentuan secara bersamaan dan menghasilkan tepat satu alokasi lengkap. Pertukaran dua orang ke ruangan berbeda dihitung sebagai jawaban berbeda, walaupun keduanya memiliki durasi/divisi sama. Urutan gambar di dalam ruangan tidak mengubah jawaban.

## Dasar sumber

Sumber: folder SHL\_Deductive Reasoning Test (Interactive): deduktif.pdf halaman 13–14 (Office Requirements), 19–20 (Convention Booths), serta contoh 2.pdf halaman 1 (Meeting Room Requirements). Sumber durasi memuat empat orang; versi blueprint menyesuaikannya menjadi lima sesuai permintaan, dengan mekanisme kapasitas waktu tetap sama. Jangan menyebut penyesuaian jumlah orang tersebut sebagai salinan persis soal SHL.

Referensi fitur: JadiOJK - Rancangan Fitur TKU, bagian Room Allocations, mengatur maksimal tiga orang per sel dan nama pada sel. Tiga keluarga di bawah adalah yang ditemukan pada sumber yang tersedia; tidak diklaim mencakup seluruh bank soal internal SHL.

# 2\. Pengelompokan ruangan sama atau berbeda

## Bentuk sumber dan batas produksi

Convention Booths memuat lima orang, dua booth bernama Research dan Marketing, lima baris informasi, serta satu kalimat perintah penempatan. Satu orang sudah ditentukan booth-nya; dua relasi mengharuskan booth sama; dua relasi mengharuskan booth berbeda. Bentuk tersebut dipertahankan sebagai profil utama.

Gunakan tepat lima nama dan lima gambar berbeda, dua ruangan bernama, lima baris petunjuk, dan satu kalimat instruksi. Setiap baris satu klausa; satu orang dapat menjadi rujukan pada baris orang lain. Gunakan satu penempatan langsung, dua petunjuk ruangan sama, serta dua petunjuk ruangan berbeda. Sebutkan batas maksimal tiga orang per ruangan dalam satu kalimat aturan umum.

Relasi “sama dengan” berarti satu ruangan yang sama, bukan bersebelahan atau satu divisi. Relasi “berbeda dari” berarti dua ruangan yang berbeda; pada dua ruangan, relasi tersebut menentukan ruangan lawannya. Semua rantai relasi harus tersambung ke informasi yang menentukan nama ruangan agar tidak dapat ditukar seluruhnya.

## Contoh instans yang konsisten

Ruangan: Riset dan Pemasaran. Aditya harus di Pemasaran. Bianca satu ruangan dengan Dewi. Cakra satu ruangan dengan Aditya. Dewi berbeda ruangan dari Aditya. Erlangga berbeda ruangan dari Cakra. Pertanyaan: tempatkan setiap orang ke ruangan yang sesuai. Maksimal tiga orang per ruangan.

Jawaban: Pemasaran berisi Aditya dan Cakra; Riset berisi Bianca, Dewi, dan Erlangga. Semua lima orang terpakai; kapasitas 2 dan 3; seluruh petunjuk terpenuhi. Pemeriksaan seluruh 32 kemungkinan penempatan ke dua ruangan menghasilkan satu jawaban.

## Pola jawaban dan variasi dekat sumber

Untuk lima orang dan dua ruangan dengan batas tiga orang, komposisi wajib 2–3 atau 3–2. Komposisi 4–1 dan 5–0 tidak sah. Variasikan orang yang menjadi penempatan langsung, rujukan relasi, serta nama ruangan; komposisi 3–2 bukan alasan menebak identitas tiga anggotanya tanpa petunjuk.

Jangan menggunakan dua ruangan tanpa satu pun penetapan nama ruangan: hubungan sama/berbeda saja dapat menghasilkan dua alokasi yang saling bertukar. Jangan menambah jumlah ruangan pada profil ini lalu menganggap “berbeda” otomatis menentukan tujuan; pilihan lebih dari dua membutuhkan profil dan validasi yang berbeda.

# 3\. Alokasi kantor berdasarkan divisi dan denah

## Bentuk sumber dan batas produksi

Office Requirements memuat lima orang; divisi HR, Sales, dan IT; ketentuan harus sendirian, ruangan tertentu, tidak boleh di sebelah mesin fotokopi, serta orang tanpa pembatas pribadi. Aturan umum melarang orang berbeda divisi berbagi ruangan dan mengizinkan HR memakai ruang pertemuan ketika ruangan biasa tidak tersedia.

Denah sumber memiliki Ruang 1, Ruang 2, Ruang 3, Ruang Pertemuan, Mesin Fotokopi, dan Koridor. Empat ruang pertama adalah tujuan penempatan; mesin fotokopi dan koridor merupakan fasilitas/area pendukung yang tetap berlabel dan tidak menerima orang sebagai jawaban. Jangan menampilkan sel kosong sebagai ruangan tanpa nama.

Gunakan tepat lima baris orang. Setiap baris menampilkan gambar, nama, satu petunjuk singkat, dan nama divisi bila relevan. Pembatas pribadi maksimal dua klausa per baris agar pembatas lokasi dapat dipadukan dengan “sendirian” saat diperlukan untuk keunikan. Paragraf umum dua sampai empat kalimat, termasuk perintah penempatan dan batas maksimal tiga orang.

Gunakan tiga divisi dengan komposisi dua orang, dua orang, dan satu orang seperti sumber. Jenis ketentuan yang diizinkan: sendirian; ruangan tertentu; larangan lokasi di dekat fasilitas; tidak ada pembatas pribadi; larangan berbagi lintas divisi; serta penggunaan ruang pertemuan bersyarat. “Tanpa pembatas pribadi” tetap tunduk pada kapasitas dan aturan umum.

## Posisi dan syarat penggunaan ruangan

Denah harus menunjukkan kedekatan secara pasti. Untuk barisan Ruang 1–Ruang 2–Ruang 3–Mesin Fotokopi, yang tepat di sebelah mesin fotokopi adalah Ruang 3. Jangan menyimpulkan bersebelahan karena sekadar tampak dekat, berada diagonal, atau menyentuh koridor yang sama. Keterangan kedekatan harus sesuai garis batas dan orientasi denah.

Jika ruang pertemuan hanya boleh digunakan oleh divisi tertentu, tuliskan larangan untuk divisi lainnya. “Jika tidak ada ruangan lain” harus dinilai setelah semua kapasitas, pembatas pribadi, dan aturan berbagi dipenuhi, bukan dari urutan peserta menyeret gambar. Jangan menentukan jawaban berdasarkan siapa yang ditempatkan lebih dahulu.

Waspadai dua orang satu divisi yang sama-sama dapat bertukar antara ruang pertemuan dan ruangan biasa. Ketentuan fallback saja belum selalu membedakan mereka. Bila dua alokasi lengkap tetap sah, gunakan pembatas lokasi yang termasuk mekanisme sumber, atau buat ulang soal; jangan memilih salah satunya sebagai kunci secara sembarang.

## Contoh instans yang memiliki satu alokasi

Denah: Ruang 1, Ruang 2, Ruang 3 berderet; Mesin Fotokopi di sebelah kanan Ruang 3; Ruang Pertemuan terpisah; Koridor berlabel. Aditya dan Bianca dari SDM; Cakra dan Dewi dari Penjualan; Erlangga dari TI. Aditya harus sendirian di Ruang 3. Cakra harus di Ruang 2. Erlangga tidak boleh di ruangan yang tepat bersebelahan dengan Mesin Fotokopi. Bianca dan Dewi tidak memiliki pembatas pribadi.

Aturan umum: divisi berbeda tidak boleh berbagi ruangan. Ruang Pertemuan hanya dapat digunakan SDM ketika tidak ada ruangan biasa yang memenuhi seluruh ketentuan untuk orang tersebut. Maksimal tiga orang per ruangan. Tempatkan kelima orang ke ruangan yang sesuai.

Jawaban: Ruang 1 Erlangga; Ruang 2 Cakra dan Dewi; Ruang 3 Aditya; Ruang Pertemuan Bianca. Koridor dan Mesin Fotokopi bukan tujuan jawaban. Aditya mengunci Ruang 3 dan tidak boleh ditemani; Erlangga tidak bisa Ruang 3/Ruang 2/Ruang Pertemuan sehingga memakai Ruang 1; Dewi hanya dapat bergabung dengan Cakra; Bianca memakai ruang pertemuan karena seluruh ruang biasa tidak sesuai.

## Bentuk jawaban dekat sumber

Dengan empat ruangan tujuan yang semuanya terpakai, komposisi lima orang adalah 2–1–1–1. Jika ada ruang tujuan yang tidak ditempati, komposisi 3–1–1–0 atau 2–2–1–0 dapat dipakai hanya bila semua aturan secara unik menentukan ruang yang kosong dan penempatan orang. Ruangan kosong tetap memiliki nama; fasilitas tidak ikut dihitung sebagai ruangan kosong.

Angka komposisi hanya pemeriksaan kapasitas, bukan pola jawaban yang boleh dipaksakan. Jangan menambahkan ruang kosong agar gambar lebih ramai, atau menyediakan dua ruang identik yang dapat dipertukarkan tanpa pembatas. Utamakan denah sumber dengan empat tujuan dan fasilitas pendukung yang jelas.

# 4\. Pembagian ruang berdasarkan durasi rapat

## Bentuk sumber dan penyesuaian lima orang

Meeting Room Requirements pada contoh 2.pdf memakai dua ruang Barat dan Timur yang tersedia 08.00–16.00. Kartu memuat nama, pilihan ruang, dan durasi rapat; satu orang memerlukan ruang Timur sementara yang lain boleh menggunakan ruang mana pun. Jawaban berupa penempatan orang ke ruangan, bukan penyusunan jam rapat pada timeline.

Pada blueprint ini gunakan tepat lima orang dan lima baris petunjuk. Setiap baris satu keterangan pilihan ruangan dan satu durasi. Pertahankan dua ruang bernama serta horizon yang sama untuk keduanya. Paragraf instruksi dua atau tiga kalimat: jam tersedia, kapasitas maksimal tiga orang, dan perintah pembagian ruang agar semua rapat dapat berlangsung.

Nyatakan bahwa rapat dalam satu ruangan berlangsung bergantian tanpa jeda tambahan dan setiap rapat harus selesai dalam jam tersedia. Total durasi tiap ruangan tidak melebihi delapan jam. Batas tiga orang diperiksa tersendiri; ruangan dengan total enam jam tetap tidak boleh menerima empat orang.

## Contoh adaptasi lima orang

Aditya: ruang mana pun, empat jam. Bianca: harus ruang Timur, tiga jam. Cakra: ruang mana pun, dua jam. Dewi: ruang mana pun, empat jam. Erlangga: ruang mana pun, tiga jam. Kedua ruangan tersedia 08.00–16.00; rapat berlangsung bergantian tanpa jeda tambahan; maksimal tiga orang per ruangan.

Jawaban: Barat berisi Aditya dan Dewi, total delapan jam; Timur berisi Bianca, Cakra, dan Erlangga, total delapan jam. Ruang Timur dikunci oleh Bianca. Dari 32 kemungkinan pembagian lima orang, hanya alokasi tersebut memenuhi pembatas ruang, total durasi, dan jumlah orang. Tidak perlu menentukan siapa rapat lebih dahulu di dalam satu ruangan.

## Batas variasi jawaban

Komposisi orang tetap 2–3 atau 3–2. Total durasi boleh tepat memenuhi kapasitas atau menyisakan waktu, tetapi harus menghasilkan satu pembagian. Durasi yang sama diperbolehkan selama pertukaran orang ke ruangan berbeda tidak menghasilkan jawaban kedua. Jangan menambahkan waktu mulai individu, rapat terpecah, perjalanan antar-ruang, atau pemindahan rapat di tengah sesi: mekanisme tersebut tidak tampak pada sumber profil ini.

# 5\. Nama ruangan, nama orang, dan gambar

## Pengaturan nama yang ditampilkan

Bedakan nama orang, nama ruangan, nama divisi, dan nama fasilitas. Nama orang merupakan label pada gambar yang dipindahkan; nama ruangan merupakan label tujuan; nama divisi dipakai hanya ketika menjadi informasi; fasilitas membantu membaca denah. Tidak ada penetapan nama variabel atau struktur data teknis.

Pilihan pasangan nama dua ruangan: Riset/Pemasaran atau Barat/Timur sesuai konteks. Untuk kantor gunakan Ruang 1, Ruang 2, Ruang 3, Ruang Pertemuan, Koridor, dan Mesin Fotokopi. Jika denah dibalik atau nama ditukar, seluruh petunjuk kedekatan dan kuncinya harus mengikuti perubahan tersebut.

Semua nama ruangan unik di dalam satu soal, terbaca saat kosong maupun terisi, serta sama ejaannya antara petunjuk dan denah. Jangan menggunakan nama orang sebagai nama ruangan. Area tunggu gambar sebelum penempatan diberi judul “Daftar Peserta” atau “Belum Ditempatkan”; jangan dibuat menyerupai ruangan tanpa nama.

Untuk Room Allocations, ambil tepat lima nama berbeda dari daftar nama. Gunakan lima inisial berbeda agar identitas mudah dibedakan. Tidak perlu selalu A–E atau disusun alfabetis pada soal. Nama pada kartu petunjuk, gambar, pembahasan, dan kunci harus sama.

Satu nama selalu memakai satu gambar yang sama dalam bank ini; satu soal tidak boleh menampilkan dua orang berbeda dengan gambar identik. Nama dan gambar tidak boleh mengisyaratkan penempatan, divisi, durasi, atau jawaban. Seluruh gambar berukuran seragam, tidak terpotong pada wajah, dan dapat dibaca bersama label nama.

Daftar identitas di bagian akhir memakai foto profil untuk ilustrasi soal; sumber foto dicantumkan pada pengantar tabel. Nama pada daftar adalah nama latihan yang kita tetapkan, bukan pernyataan identitas asli orang dalam foto. Gambar sumber dipakai sebagai referensi identitas visual; variasi nama tidak mengubah pola penalaran.

# 6\. Ketentuan interaksi dan pemeriksaan jawaban

## Interaksi penempatan

Lima gambar orang dimulai pada area daftar peserta. Peserta menyeret setiap gambar ke satu ruangan tujuan; gambar dapat dipindahkan atau dikembalikan. Nama ruangan tetap terlihat ketika terisi. Sediakan reset untuk mengembalikan seluruh gambar. Orang yang sama tidak dapat terduplikasi di dua ruangan.

Sistem mencegah penempatan orang keempat dalam satu ruangan dan penempatan ke koridor/fasilitas. Jangan menolak penempatan karena salah divisi, salah arah, atau durasi tidak cocok secara langsung, sebab hal itu memberi umpan balik jawaban. Ketentuan tersebut dievaluasi sebagai logika soal setelah peserta menjawab.

Pengiriman jawaban memerlukan kelima orang sudah ditempatkan, masing-masing tepat sekali. Jawaban benar adalah seluruh penempatan cocok dengan satu alokasi kunci. Urutan klik/seret dan susunan gambar kiri–kanan di ruangan tidak dinilai. Tidak ada opsi A–E dan tidak ada urutan penempatan yang wajib.

## Validasi konsistensi dan keunikan

Periksa seluruh kemungkinan penempatan lima orang ke ruangan tujuan. Jika dua ruangan, ada 32 pembagian awal; jika empat ruangan, ada 1.024 penempatan awal. Buang penempatan yang melanggar batas tiga orang, lalu periksa semua ketentuan pribadi, relasi, divisi, fasilitas, durasi, dan syarat ruangan. Terbitkan soal hanya jika tersisa tepat satu alokasi lengkap.

Tolak soal tanpa solusi maupun lebih dari satu solusi. Jangan memilih jawaban pertama yang ditemukan. Ruang bernama berbeda tetap tujuan berbeda, sehingga pertukaran seluruh isi Ruang 1 dan Ruang 2 bukan jawaban identik. Hanya urutan orang di dalam ruangan yang dapat diabaikan.

Konflik yang wajib dicegah: orang harus sendirian tetapi diwajibkan bersama orang lain; pasangan sekaligus harus sama dan berbeda ruangan; tiga divisi dipaksa berbagi pada aturan larangan campur; orang terikat ke fasilitas bukan ruangan; kapasitas waktu kurang; empat orang dipaksa ke satu ruang; atau aturan ruang pertemuan yang tidak menentukan siapa dapat memakainya.

Setiap kendala yang menentukan jawaban harus terlihat pada petunjuk atau denah; setiap petunjuk harus memiliki makna yang konsisten. Setelah penggantian nama, gambar, arah denah, durasi, atau label ruang, periksa ulang seluruh alokasi. Jangan menilai berdasarkan asumsi tentang jabatan atau foto.

Pembahasan wajib menyebut isi setiap ruangan, alasan tiap orang ditempatkan, verifikasi batas tiga orang, pemeriksaan semua petunjuk, serta total durasi jika relevan. Sebutkan ruangan yang tidak ditempati dengan namanya bila memang diizinkan. Pembahasan tidak boleh menambahkan alasan yang tidak tersedia pada soal.

## Daftar lulus sebelum penerbitan

Tepat lima orang; lima nama dan gambar berbeda; semua area berlabel; tujuan dan fasilitas dibedakan; maksimal tiga orang per ruangan; relasi sama/berbeda serta kedekatan jelas; durasi dan jam tersedia konsisten; syarat ruang pertemuan dapat diterapkan tanpa bergantung urutan seret; seluruh orang ditempatkan sekali; tepat satu alokasi; pembahasan memeriksa seluruh ketentuan.

# 7\. Nama orang dan gambar

Daftar pada subtes ini memuat tepat 26 nama orang yang berbeda. Pilih tepat lima nama dan lima gambar berbeda dari daftar berikut untuk setiap soal Room Allocations. Setiap entri terdiri atas satu nama dan satu gambar tersendiri.

Nama pada kartu petunjuk, gambar, pertanyaan, kunci, dan pembahasan harus konsisten. Dalam satu soal, gunakan nama dan gambar berbeda untuk setiap orang. Foto profil pada tabel bersumber dari Random User Generator (https://randomuser.me/photos); nama yang ditampilkan adalah nama latihan, bukan identitas asli orang pada foto.

Aset generator: [folder utama](https://drive.google.com/drive/folders/1WtNF6dSO3lE7ZtT6ty41f5vQhSy9S4FS) • [Folder PNG subtes ini](https://drive.google.com/drive/folders/1aJwetJrhNU5WYorPlTWaMSVAzL8wzUNe). Klik nama orang pada tabel untuk membuka file PNG masing-masing; satu file berisi satu orang.

  

|  |  |
| :-: | :-: |
| \*\*Foto\*\* | \*\*Nama\*\* |
|  | \[Aditya\](https://drive.google.com/file/d/1EKt7VGxGjj1dfCoOqlkgvC7cwT1GRwb2/view?usp=drivesdk) |
|  | \[Bianca\](https://drive.google.com/file/d/1Z6ZaGXMMIG0BPkizJgotS\_n9LBOLNJaN/view?usp=drivesdk) |
|  | \[Cakra\](https://drive.google.com/file/d/1mIkQsZ990lPIqgWqzzw\_o7ONQ8YjJNBO/view?usp=drivesdk) |
|  | \[Dewi\](https://drive.google.com/file/d/1nBMXrDbaWUHPgLVn3Saj4O4w3AK6O3RZ/view?usp=drivesdk) |
|  | \[Erlangga\](https://drive.google.com/file/d/17r9o7bltQdJNbf-QU6MyArUxAKBZYdOc/view?usp=drivesdk) |
|  | \[Felicia\](https://drive.google.com/file/d/1yxlbwd8py2plJ\_Ee8Cdbdsb0SPh6ZVDF/view?usp=drivesdk) |
|  | \[Gilang\](https://drive.google.com/file/d/1lqVvaVSnPt-vRNZwgPFY019qL8JmYgKK/view?usp=drivesdk) |
|  | \[Hana\](https://drive.google.com/file/d/10UbWzgbE81ZfTAB1mpBM2TOun7ob7Hkk/view?usp=drivesdk) |
|  | \[Ilham\](https://drive.google.com/file/d/1ldDCt2pasagFz7RQxrV11eBpKCgTWssO/view?usp=drivesdk) |
|  | \[Julia\](https://drive.google.com/file/d/1jobGilwOSHBEsl2QdBLzjUwjv5EKFAdE/view?usp=drivesdk) |
|  | \[Kenan\](https://drive.google.com/file/d/1nVunoPBNZzYrvO8LGavwMQvX\_DYxaiG6/view?usp=drivesdk) |
|  | \[Livia\](https://drive.google.com/file/d/1g1WnbqNwJbCzfH921FdR26Gf09mC006H/view?usp=drivesdk) |
|  | \[Mahesa\](https://drive.google.com/file/d/15C099fgh1xCiQFfReVvR3NFQILt1O-hI/view?usp=drivesdk) |
|  | \[Nabila\](https://drive.google.com/file/d/1y9sG6MJugzZndapbrJ5CBCaN\_eB-Lmb-/view?usp=drivesdk) |
|  | \[Oka\](https://drive.google.com/file/d/1A4x60R8VMV0b8DKjPsaKMIUEXDZhhMC8/view?usp=drivesdk) |
|  | \[Prita\](https://drive.google.com/file/d/1YjCfyfdYp6zW9bfd2HFAufVlYlhdXUT\_/view?usp=drivesdk) |
|  | \[Qais\](https://drive.google.com/file/d/1w8NJsorb1gaP-GEMMaq728W8Tcmi-up3/view?usp=drivesdk) |
|  | \[Ratih\](https://drive.google.com/file/d/1u4uidiWW1CJq0DuHhSwGtxJU4wdD\_k8N/view?usp=drivesdk) |
|  | \[Satria\](https://drive.google.com/file/d/1oD\_x5jtYNXicmdjmOBUZ0E2U5SlK5lAl/view?usp=drivesdk) |
|  | \[Tania\](https://drive.google.com/file/d/19UAOS7LhvY0d0X\_7QaMHhKZO8LASgNvg/view?usp=drivesdk) |
|  | \[Umar\](https://drive.google.com/file/d/1U31zHidoW3Y\_2pbzbgUSqiB-EyYCPYDt/view?usp=drivesdk) |
|  | \[Vera\](https://drive.google.com/file/d/1NprfzMx9uIt-MPhhhNn7lxAww4lSf80h/view?usp=drivesdk) |
|  | \[Wahyu\](https://drive.google.com/file/d/1DjIq1Fl6A-e4SD7x1bnHJdPxfHyb8T9v/view?usp=drivesdk) |
|  | \[Xaviera\](https://drive.google.com/file/d/1yjKL8htUpJtf2vP-URZChg9Vpa47bAc8/view?usp=drivesdk) |
|  | \[Yuda\](https://drive.google.com/file/d/1NXWki6KGkIjtz3pzW9O1ketW28NaYOgP/view?usp=drivesdk) |
|  | \[Ziva\](https://drive.google.com/file/d/16D2uwhRWSTmHVkgidgATbbR2jUgGVUVb/view?usp=drivesdk) |

  

# Rujukan

SHL\_Deductive Reasoning Test (Interactive): deduktif.pdf halaman 13–14 dan 19–20; contoh 2.pdf halaman 1. Foto pada daftar Room Allocations bersumber dari Random User Generator: https://randomuser.me/photos. Nama adalah label latihan. Referensi fitur Room Allocations: https://docs.google.com/document/d/10dlHfSw8pDwCI7mUqJP1WE5JFH1V9f4Ut\_48MINroYk

  
  

# Timeline Scheduling  

# Blueprint Generator — Timeline Scheduling

## 18 kotak tetap • 30 menit per kotak • kegiatan dipindahkan utuh

# 1\. Cakupan dan profil tetap

Blueprint mengikuti tiga keluarga soal pada sumber SHL interaktif: memajukan rapat tim dengan pemindahan janji terbatas; mencari waktu pelatihan yang bergantung pada beberapa ruangan; serta menentukan jadwal tim tambahan untuk memenuhi kebutuhan petugas. Bagian pola kemungkinan menambahkan pengembangan yang belum teramati pada berkas sumber dan diberi status tersendiri. Daftar nama dan kegiatan di dokumen ini merupakan pilihan label latihan, bukan tambahan fakta yang boleh memengaruhi jawaban.

Setiap soal selalu menampilkan tiga baris informasi yang diketahui dan satu baris jawaban. Pada pola rapat: tiga kalender orang dan Kalender Anda. Pada pola ruangan: tiga kalender ruangan dan ruangan keempat sebagai jawaban. Pada pola petugas: tiga jadwal tim dan tim keempat sebagai jawaban. Jumlah tersebut tetap; ketentuan lima orang pada Room Allocations tidak diterapkan pada subtes ini.

Setiap baris berisi tepat 18 kotak, sehingga terdapat 54 kotak informasi dan 18 kotak jawaban, total 72 kotak per soal. Nama baris selalu terlihat. Tidak ada penetapan nama variabel teknis, struktur data, atau format penyimpanan dalam blueprint ini.

## Dasar sumber dan status batas produksi

Sumber utama: SHL\_Deductive Reasoning Test (Interactive), contoh 3.pdf (Team Calendar), deduktif.pdf halaman 15–16 (Meeting Room Schedule) dan 23–24 (Community Service Schedule), serta rekaman interaktif.mp4. PDF hasil cetak dapat kehilangan warna abu-abu dan isi hover; kotak putih pada cetakan bukan bukti bahwa jadwal sumber kosong.

Sumber interaksi: JadiOJK - Rancangan Fitur TKU, bagian Timeline Scheduling, yang menampilkan hover keterangan kegiatan dan sel abu-abu. Nama serta batas slot dalam contoh asli menjadi rujukan. Batas jumlah kegiatan, pilihan nama, variasi durasi, dan redaksi yang ditetapkan di sini adalah aturan produksi untuk generator, bukan klaim batas universal seluruh tes SHL.

# 2\. Jumlah kotak dan arti waktu

Gunakan satu hari pukul 09.00–18.00 untuk seluruh profil. Satu kotak = 30 menit. Kotak pertama mewakili 09.00–09.30; kotak kedua 09.30–10.00; kotak ke-17 17.00–17.30; kotak ke-18 17.30–18.00. Angka 18.00 adalah batas akhir, bukan kotak ke-19.

Semua baris memakai skala, lebar kotak, dan batas jam yang sama. Tampilkan label jam penuh 09.00, 10.00, …, 18.00 pada batas setiap dua kotak; waktu setengah jam tetap dapat dibaca saat hover atau memilih. Dilarang mengubah jumlah kotak mengikuti panjang kegiatan, memperpanjang hari, atau mengubah satu kotak menjadi 15/60 menit pada soal tertentu.

Semua kegiatan harus mulai dan selesai pada batas 30 menit. Satu kotak berarti 30 menit, dua kotak 60 menit, tiga kotak 90 menit. Kegiatan 10.00–11.00 dan 11.00–11.30 boleh berdampingan karena batas akhirnya bertemu; keduanya tidak bertabrakan. Kegiatan 10.00–11.00 dan 10.30–11.30 bertabrakan selama 30 menit pada orang/ruang yang sama.

## Arti warna mengikuti jenis soal

Pada profil rapat dan ruangan, abu-abu berarti kegiatan sudah dijadwalkan sehingga waktu tersebut terisi. Putih berarti belum terisi. Pada profil cakupan petugas, abu-abu pada Tim A/B/C justru menunjukkan tim sedang bertugas dan menyumbang petugas, sesuai contoh Community Service; jangan menafsirkannya sebagai tim tidak tersedia.

Pilihan peserta diberi warna berbeda, misalnya hijau. Warna pilihan bukan umpan balik benar/salah. Tampilkan legenda yang sesuai profil. Pada baris jawaban, jadwal tetap berwarna abu-abu hanya jika memang ada kegiatan awal yang harus dihormati; Tim D boleh seluruhnya putih pada kondisi awal seperti sumber.

# 3\. Satu kegiatan adalah satu blok utuh

## Batas kegiatan harus jelas

Setiap kegiatan awal terdiri atas satu sampai tiga kotak berurutan: 30, 60, atau 90 menit. Rentang abu-abu yang panjang dapat terdiri atas beberapa kegiatan berdampingan; jangan menganggap semua kotak abu-abu yang saling menempel sebagai satu kegiatan. Sebaliknya, dua kotak milik satu rapat tetap satu kegiatan, bukan dua janji terpisah.

Bedakan kegiatan yang berdampingan dengan garis batas atau penanda blok dan hover. Contoh: Rapat Proyek 10.00–11.00 diikuti Tinjauan Dokumen 11.00–11.30 adalah dua kegiatan. Hover pada kedua kotak Rapat Proyek harus menampilkan nama dan waktu yang sama serta menyorot kedua kotaknya; hover pada kotak berikutnya menampilkan kegiatan lain.

## Aturan pemindahan wajib

Jika Meeting A berlangsung 10.00–11.00 dan mengisi dua kotak, dimundurkan 30 menit berarti seluruh kegiatan menjadi 10.30–11.30, tetap dua kotak. Dimajukan 30 menit berarti 09.30–10.30, juga tetap dua kotak. Yang berubah adalah posisi awal dan akhirnya, bukan jumlah kotak, durasi, nama, atau jenis kegiatan.

Memindahkan satu kotak saja dari rapat dua kotak, membelah rapat, memperpendek durasi menjadi 30 menit, atau memindahkan dua kotaknya dengan jarak berbeda adalah tidak sah. Pergeseran 30 menit adalah satu kotak, bukan satu kali panjang blok; rapat tiga kotak yang digeser 30 menit tetap tiga kotak dan hanya bergeser satu kotak.

Sebelum menguji tabrakan, lepaskan seluruh posisi lama kegiatan yang dipindahkan. Sebagian posisi baru boleh berimpit dengan posisi lamanya sendiri; yang dilarang adalah berimpit dengan kegiatan lain. Setelah berpindah, bagian lama yang ditinggalkan kembali putih kecuali diisi kegiatan lain yang sah. Jangan menyalin blok sehingga kegiatan muncul dua kali.

## Ilustrasi pemindahan kegiatan utuh

## Batas perpindahan

Untuk profil pemajuan rapat, maksimal satu kegiatan awal per orang diketahui boleh dipindahkan, paling jauh 30 menit dari posisi aslinya, ke arah lebih awal atau lebih lambat. Rapat dua kotak tetap dihitung satu kegiatan. Tiga orang dapat masing-masing memindahkan satu kegiatan; batasnya bukan satu kegiatan untuk seluruh tim.

Pemindahan dua kali sehingga total bergeser 60 menit tetap melanggar batas, walaupun setiap langkah seret hanya 30 menit. Memindahkan kegiatan pertama lalu kegiatan kedua pada orang yang sama juga melanggar. Kegiatan tidak boleh keluar dari 09.00–18.00 atau menabrak kegiatan lain. Demo klien dan seluruh janji pribadi pada Kalender Anda tetap tidak boleh dipindahkan, sesuai ketentuan profil.

# 4\. Pola pemajuan rapat tim

## Jumlah baris dan isi yang diketahui

Tiga nama orang dan Kalender Anda: empat baris keseluruhan. Pada setiap baris, buat empat sampai tujuh kegiatan awal dengan panjang masing-masing satu sampai tiga kotak; jumlah kotak terisi umumnya enam sampai empat belas. Ini rentang produksi, bukan hitungan baku SHL. Jangan memenuhi seluruh baris sehingga tidak ada peluang jawaban, atau mengosongkan ketiga kalender sehingga kendala perpindahan tidak berfungsi.

Kalender Anda berisi janji tetap dan satu Rapat Tim yang ingin dijadwalkan ulang. Waktu mulai dan durasi Rapat Tim semula harus diketahui melalui teks atau hover. Contoh sumber menyebut pukul 15.30; bentuk pilihan pada rekaman menggunakan unit 30 menit. Untuk versi dasar gunakan rapat 30 menit; rapat 60/90 menit dapat menjadi variasi dekat sumber dengan durasi dinyatakan jelas.

## Ketentuan dan bentuk pertanyaan

Cari satu blok waktu yang lebih awal daripada waktu mulai rapat semula, cukup panjang untuk seluruh durasi rapat, dan tersedia bagi Anda serta ketiga orang setelah perpindahan yang diperbolehkan. Janji pribadi Anda dan demo klien tidak dapat dipindah. Gunakan tiga sampai empat kalimat pertanyaan: tujuan perubahan, durasi bila diperlukan, batas satu kegiatan dan 30 menit per orang, serta larangan pemindahan.

Perubahan rapat target berbeda dari izin menggeser janji orang lain. Rapat target boleh dijadwalkan ke waktu lebih awal yang memenuhi seluruh aturan; batas 30 menit berlaku pada kegiatan penunjang yang boleh digeser, bukan otomatis membatasi rapat target hanya 30 menit lebih awal. Nyatakan jika ingin menetapkan batas lain; jangan menyisipkannya secara diam-diam.

Rapat target pada jadwal semula dilepaskan sebagai satu blok ketika menguji jadwal barunya. Jangan memperlakukan bekas rapat target sebagai janji pribadi lain yang tetap menghalangi dirinya sendiri. Semua janji pribadi lain tetap terisi. Jam selesai baru dihitung dari durasi yang sama.

## Jawaban dan variasi dekat sumber

Jawaban berupa satu blok rapat: satu kotak untuk 30 menit, dua kotak berurutan untuk 60 menit, atau tiga kotak berurutan untuk 90 menit. Jangan menerima dua bagian yang terpisah sebagai satu rapat. Semua kotak blok dipilih bersama atau dipilih lengkap sesuai cara interaksi aplikasi.

Pertanyaan “lebih awal” harus memiliki tepat satu waktu mulai yang layak; jangan memilih yang paling awal secara otomatis bila dua waktu lebih awal sama-sama sah. Variasi “waktu paling awal yang memungkinkan” boleh digunakan jika frasa tersebut ditulis jelas, lalu satu waktu terbaik dipilih dari seluruh kandidat yang sah. Pergantian orang yang memerlukan pergeseran, arah pergeseran, dan panjang blok merupakan variasi dekat mekanisme sumber.

Baris diketahui dapat tetap hanya-baca seperti referensi: peserta memilih waktu rapat pada Kalender Anda, sedangkan kelayakan pemindahan diperiksa oleh logika soal dan dijelaskan pada pembahasan. Jika aplikasi juga menyediakan interaksi pemindahan janji, seluruh kotak kegiatan harus bergerak bersama. Jangan membuat peserta seolah memindahkan kegiatan dengan mengubah satu sel abu-abu secara terpisah.

# 5\. Pola pelatihan dengan ketergantungan ruangan

## Jumlah baris dan ketergantungan

Tiga baris diketahui: Ruang 1, Ruang 2, dan Ruang 3. Baris jawaban: Ruang 4. Semua baris tetap 18 kotak. Pilihan nama ruangan lain boleh dipakai bila seluruh rujukan pada soal ikut diperbarui. Jadwal yang diketahui tetap; tidak ada izin menggeser rapat pada profil ini.

Sumber meminta dua pelatihan TI masing-masing satu jam; masing-masing memerlukan persiapan 30 menit; setelah pelatihan kedua terdapat pembongkaran 45 menit. Pelatihan tidak boleh berlangsung bersamaan dengan Sales Meeting di ruangan lain. Ruang 3 juga harus tersedia, termasuk selama persiapan dan pembongkaran. Ini dua jenis ketergantungan dengan cakupan waktu berbeda.

## Batas 45 menit pada grid tetap

Durasi 45 menit dalam contoh asli tidak sama dengan sejumlah bulat kotak 30 menit. Total 30 + 60 + 30 + 60 + 45 = 225 menit, atau 7,5 kotak. Cara sumber merender ketelitian 45 menit tidak dapat dipastikan hanya dari cetakan grid; jangan menganggap 45 menit sebagai satu atau dua kotak tanpa keterangan.

Agar jumlah kotak tetap 18 dan jawaban tepat pada batas sel, versi generator ini mempertahankan mekanismenya tetapi memakai pembongkaran 30 atau 60 menit yang dinyatakan secara eksplisit. Total reservasi menjadi 210 menit/tujuh kotak atau 240 menit/delapan kotak. Tandai sebagai penyesuaian durasi dekat sumber, bukan salinan persis contoh. Nilai asli 45 menit tidak diterbitkan pada konfigurasi grid ini.

## Urutan kegiatan dan rentang jawaban

Tetapkan urutan berkesinambungan: persiapan pertama 30 menit → pelatihan pertama 60 menit → persiapan kedua 30 menit → pelatihan kedua 60 menit → pembongkaran 30/60 menit. Seluruh reservasi Ruang 4 merupakan satu blok jawaban tujuh/delapan kotak. Batas satu sampai tiga kotak berlaku untuk setiap kegiatan penyusunnya, bukan batas panjang seluruh reservasi gabungan.

Ruang 4 dan Ruang 3 harus bebas sepanjang reservasi lengkap. Larangan berbarengan dengan Rapat Penjualan diterapkan pada dua fase pelatihan, bukan otomatis pada persiapan/pembongkaran, sesuai pembedaan pada sumber. Jika larangan dimaksudkan sepanjang reservasi, tuliskan sebagai ketentuan berbeda; jangan menilai dengan cakupan yang tidak tertulis.

Buat empat sampai tujuh kegiatan awal pada setiap ruangan dengan durasi satu sampai tiga kotak per kegiatan, sejauh masih menyisakan satu jawaban. Petunjuk harus membedakan Rapat Penjualan dari rapat lain melalui hover. Pertanyaan sekitar lima sampai enam kalimat, mencakup dua sesi, persiapan, pembongkaran, larangan bersamaan, ketergantungan Ruang 3, dan kebutuhan blok berkesinambungan.

Variasikan waktu mulai, letak rapat penjualan, dan ruang yang menjadi ketergantungan. Jawaban tetap satu blok lengkap. Jangan menerima hanya jam pelatihan tanpa persiapan/pembongkaran, dua reservasi terpisah, atau jadwal yang masih memerlukan pemindahan rapat lain tanpa izin.

# 6\. Pola pemenuhan kebutuhan petugas

## Jumlah tim dan arti baris

Tiga tim diketahui dan satu tim jawaban. Sumber memakai Tim A empat orang, Tim B enam orang, Tim C delapan orang, dan Tim D empat orang. Kebutuhan minimal enam orang berlaku 10.00–17.00, dengan penutupan makan siang 12.00–13.00. Timeline tetap 09.00–18.00, sehingga sebagian kotak di luar jam acara tetap ditampilkan.

Pada setiap kotak aktif, hitung seluruh anggota tim yang sedang bertugas. Kotak abu-abu Tim A/B/C adalah kegiatan bertugas, bukan ketidaktersediaan. Tim D menyumbang empat orang saat dijadwalkan dan nol saat tidak dijadwalkan. Nama kegiatan pada hover harus menunjukkan tugas aktif, misalnya Pelayanan Peserta, sehingga arti warna tidak tertukar dengan profil rapat.

Untuk versi dasar, pertahankan jumlah orang dan ambang kebutuhan sumber. Setiap tim diketahui memiliki dua blok kerja masing-masing dua kotak seperti contoh; variasi dekat sumber dapat memakai dua atau tiga kegiatan, masing-masing satu sampai tiga kotak, selama jumlah anggota dan arti jadwal tetap jelas. Semua jadwal diketahui tetap dan tidak dipindahkan.

Istirahat makan siang adalah penutupan acara, bukan tugas aktif suatu tim. Tandai melalui keterangan waktu atau penanda penutupan yang berbeda, tanpa menghitungnya sebagai kontribusi petugas. Bila ada jadwal abu-abu pada jam penutupan untuk alasan lain, keterangan itu harus jelas dan tetap tidak menimbulkan kebutuhan Tim D pada jam tutup.

## Keunikan jawaban dan variasinya

Perintah “pastikan petugas cukup” saja dapat mengizinkan terlalu banyak jawaban karena menambahkan Tim D pada waktu yang sudah cukup juga tetap memenuhi kebutuhan. Untuk generator, nyatakan bahwa Tim D hanya dijadwalkan ketika tambahan petugas diperlukan, dengan total waktu bertugas minimum. Ini klarifikasi tujuan produksi agar hasil tunggal, bukan tambahan jenis penalaran baru.

Jawaban adalah seluruh kotak aktif yang jumlah petugas awalnya kurang dari enam dan menjadi cukup setelah Tim D ditambahkan. Jangan memilih kotak makan siang atau waktu di luar acara. Jika pada satu kotak Tim D tetap tidak dapat menutup kekurangan, soal tidak mempunyai solusi dan harus dibuat ulang.

Jawaban dapat satu blok atau beberapa blok terpisah. Panjang total tidak mengikuti batas lima pilihan pada Calendar Date Selection: untuk acara sumber terdapat dua belas kotak aktif, sehingga batas fisiknya satu sampai dua belas kotak yang benar-benar diperlukan. Tolak instans dengan Tim D sama sekali tidak dibutuhkan. Untuk produksi kegiatan satu–tiga kotak, setiap rentang tugas Tim D yang berkesinambungan dibatasi satu sampai tiga kotak; jangan membelah satu rentang panjang secara fiktif hanya untuk memenuhi batas.

Pertanyaan empat sampai lima kalimat: konteks acara, jam acara dan kebutuhan minimal, waktu makan siang, perintah penjadwalan Tim D, serta klarifikasi minimum bila belum tergabung pada kalimat perintah. Jangan memaksa semua jawaban berurutan; jangan menjadikan semua kotak kosong pada baris Tim D sebagai jawaban.

# 7\. Pilihan nama baris informasi dan jawaban

Pilih satu kelompok nama yang sesuai jenis soal. Semua baris harus bernama dan ejaannya konsisten pada pertanyaan, hover, serta pembahasan. Nama tidak menambah ketentuan tersirat. Orang, ruangan, dan tim tidak dicampur sebagai tiga baris dalam satu soal.

  

|  |  |  |
| :-: | :-: | :-: |
| \*\*Pola\*\* | \*\*Tiga baris diketahui\*\* | \*\*Baris jawaban\*\* |
| Rapat — nama sumber | Naomi; Oscar; Patsy | Kalender Anda |
| Rapat — pilihan nama | Alya; Bayu; Citra | Kalender Anda |
| Rapat — pilihan nama | Eko; Fitri; Gani | Kalender Anda |
| Rapat — pilihan nama | Intan; Joko; Kirana | Kalender Anda |
| Rapat — pilihan nama | Lukman; Maya; Naufal | Kalender Anda |
| Rapat — pilihan nama | Olivia; Pandu; Queena | Kalender Anda |
| Rapat — pilihan nama | Reza; Salsa; Tomi | Kalender Anda |
| Rapat — pilihan nama | Uli; Vino; Winda | Kalender Anda |
| Ruangan — sumber | Ruang 1; Ruang 2; Ruang 3 | Ruang 4 |
| Ruangan — pilihan nama | Ruang Cendana; Ruang Mahoni; Ruang Meranti | Ruang Jati |
| Tim — sumber | Tim A (4 orang); Tim B (6 orang); Tim C (8 orang) | Tim D (4 orang) |
| Tim — pilihan nama | Tim Registrasi (4); Tim Logistik (6); Tim Layanan (8) | Tim Cadangan (4 orang) |
| Tim — pilihan nama | Tim Utara (4); Tim Tengah (6); Tim Selatan (8) | Tim Bantuan (4 orang) |

  

Untuk pola orang, “Kalender Anda” merupakan baris keempat; tidak diperlukan nama orang keempat dari daftar. Untuk pola ruangan/tim, nama tujuan keempat harus disebut dalam pertanyaan. Jumlah orang dan foto pada daftar subtes lain tidak menjadi ketentuan untuk Timeline Scheduling.

# 8\. Kelompok kegiatan sesuai konteks soal

Daftar berikut memuat 84 pilihan nama kegiatan dalam enam kelompok konteks. Ini bank label latihan untuk mekanisme Timeline Scheduling; daftar tersebut bukan klaim bahwa seluruh nama kegiatan pernah muncul dalam SHL. Pilih satu kelompok konteks untuk satu soal dan gunakan secara konsisten pada seluruh baris.

## Aturan pemilihan kegiatan

Tentukan jenis soal, lingkungan kerja/acara, dan hubungan orang atau ruangan terlebih dahulu. Sesudah konteks ditetapkan, pilih seluruh kegiatan awal, kegiatan target, judul soal, nama tim/ruangan, serta teks hover dari kelompok yang sesuai. Jangan memilih nama kegiatan secara acak dari seluruh bank.

Pola pemajuan rapat memakai kelompok proyek aplikasi, penjualan/layanan klien, atau administrasi/keuangan. Pola ketergantungan ruang memakai kelompok ruang kantor/pelatihan TI. Pola kebutuhan petugas memakai kelompok bakti sosial atau lokakarya literasi keuangan. Pengembangan pola tetap menggunakan kelompok yang sesuai konteksnya.

Satu soal tidak boleh mencampurkan kegiatan bakti sosial, pekerjaan penggajian, dan pengujian aplikasi tanpa konteks yang menghubungkannya. Kelompok ruang kantor/pelatihan TI secara sengaja memuat unit TI dan penjualan karena hubungan pelatihan dengan Rapat Penjualan merupakan mekanisme sumber; konteks kantor bersama harus dinyatakan.

Jumlah kegiatan yang muncul tetap mengikuti batas profil, bukan seluruh daftar pada satu soal. Masing-masing kegiatan abu-abu adalah satu kegiatan nyata berdurasi satu sampai tiga kotak. Durasi pada tabel merupakan pilihan yang harus ditetapkan untuk setiap instans, bukan durasi yang boleh berubah saat kegiatan dipindahkan.

Jika kelompok tidak cocok dengan ketentuan khusus template, pilih kelompok lain yang sesuai. Template yang membutuhkan demo klien harus memakai kelompok proyek aplikasi atau penjualan; jangan mengarang demo pajak pada konteks administrasi untuk memenuhi syarat. Ketiadaan demo tidak membuat janji pribadi Anda menjadi boleh dipindahkan.

Bedakan kegiatan berbeda melalui nama yang jelas. Nama yang sama dapat dipakai pada orang berbeda bila memang kegiatan bersama, tetapi waktu dan identitas kegiatan harus konsisten. Jika dua kegiatan berbeda pada satu orang memiliki nama dasar sama, tampilkan pembeda yang nyata, seperti Rapat Proyek — Tahap 1 dan Rapat Proyek — Tahap 2.

## Kelompok 1 — Proyek pengembangan dan implementasi aplikasi

Pola yang sesuai: Pemajuan rapat tim. Seluruh orang terlibat dalam satu proyek aplikasi untuk klien. Kegiatan mencakup koordinasi proyek, kebutuhan klien, pengujian, anggaran proyek, dan rencana rilis.

  

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| \*\*Kegiatan\*\* | \*\*Kotak\*\* | \*\*Durasi\*\* | \*\*Fungsi dalam konteks\*\* |
| Rapat Tim Proyek | 1–3 | 30–90 menit | Rapat target yang dijadwalkan ulang. |
| Rapat Harian Proyek | 1–3 | 30–90 menit | Koordinasi pekerjaan harian proyek. |
| Tinjauan Data Proyek | 1–3 | 30–90 menit | Pemeriksaan data yang digunakan proyek. |
| Rapat Proyek | 2 | 60 menit | Satu kegiatan dua kotak; berpindah utuh. |
| Demo Aplikasi Klien | 1–3 | 30–90 menit | Demo kepada klien; tetap pada profil sumber. |
| Tinjauan Spesifikasi | 1–3 | 30–90 menit | Pemeriksaan spesifikasi aplikasi. |
| Koordinasi Tim Pengembang | 1–3 | 30–90 menit | Koordinasi pekerjaan pengembangan. |
| Pembahasan Anggaran Proyek | 1–3 | 30–90 menit | Anggaran proyek yang sama. |
| Koordinasi Implementasi | 1–3 | 30–90 menit | Persiapan implementasi aplikasi. |
| Analisis Hasil Uji | 1–3 | 30–90 menit | Evaluasi hasil pengujian aplikasi. |
| Rapat Kebutuhan Klien | 1–3 | 30–90 menit | Pembahasan kebutuhan proyek klien. |
| Peninjauan Rencana Rilis | 1–3 | 30–90 menit | Penetapan kesiapan rilis aplikasi. |
| Uji Penerimaan Pengguna | 1–3 | 30–90 menit | Pengujian penerimaan aplikasi. |
| Evaluasi Risiko Proyek | 1–3 | 30–90 menit | Peninjauan risiko pelaksanaan proyek. |

  

## Kelompok 2 — Penjualan dan layanan klien

Pola yang sesuai: Pemajuan rapat tim. Orang-orang pada soal bekerja dalam tim penjualan dan pengelolaan akun klien. Gunakan hanya kegiatan komersial atau layanan pelanggan yang berkaitan.

  

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| \*\*Kegiatan\*\* | \*\*Kotak\*\* | \*\*Durasi\*\* | \*\*Fungsi dalam konteks\*\* |
| Rapat Tim Penjualan | 1–3 | 30–90 menit | Rapat target tim penjualan. |
| Rapat Target Penjualan | 1–3 | 30–90 menit | Pembahasan sasaran penjualan. |
| Tinjauan Prospek Klien | 1–3 | 30–90 menit | Peninjauan calon pelanggan. |
| Diskusi Kebutuhan Pelanggan | 1–3 | 30–90 menit | Penggalian kebutuhan pelanggan. |
| Demo Produk Klien | 1–3 | 30–90 menit | Demo kepada klien; tetap pada profil sumber. |
| Presentasi Proposal Klien | 1–3 | 30–90 menit | Presentasi penawaran kepada klien. |
| Penyusunan Penawaran | 1–3 | 30–90 menit | Penyusunan dokumen penawaran. |
| Koordinasi Akun Pelanggan | 1–3 | 30–90 menit | Koordinasi pengelolaan akun. |
| Pembahasan Kontrak Penjualan | 1–3 | 30–90 menit | Pembahasan kontrak dengan pelanggan. |
| Tinjauan Kinerja Penjualan | 1–3 | 30–90 menit | Evaluasi capaian penjualan. |
| Koordinasi Layanan Pelanggan | 1–3 | 30–90 menit | Penanganan kebutuhan layanan. |
| Tindak Lanjut Penawaran | 1–3 | 30–90 menit | Tindak lanjut proposal pelanggan. |
| Rapat Strategi Pemasaran | 1–3 | 30–90 menit | Koordinasi strategi penjualan produk. |
| Evaluasi Kepuasan Pelanggan | 1–3 | 30–90 menit | Evaluasi umpan balik pelanggan. |

  

## Kelompok 3 — Administrasi dan keuangan operasional

Pola yang sesuai: Pemajuan rapat tim. Seluruh orang berasal dari fungsi administrasi dan keuangan kantor. Gunakan kelompok ini untuk jadwal tugas atau rapat internal; jangan memaksakan demo produk klien pada konteks yang tidak memerlukannya.

  

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| \*\*Kegiatan\*\* | \*\*Kotak\*\* | \*\*Durasi\*\* | \*\*Fungsi dalam konteks\*\* |
| Rapat Tim Administrasi | 1–3 | 30–90 menit | Rapat target administrasi kantor. |
| Verifikasi Dokumen | 1–3 | 30–90 menit | Pemeriksaan dokumen administrasi. |
| Rekonsiliasi Transaksi | 1–3 | 30–90 menit | Pencocokan catatan transaksi. |
| Pemeriksaan Tagihan | 1–3 | 30–90 menit | Verifikasi tagihan operasional. |
| Pembahasan Anggaran Operasional | 1–3 | 30–90 menit | Pembahasan biaya operasional. |
| Tinjauan Laporan Keuangan | 1–3 | 30–90 menit | Peninjauan laporan periode berjalan. |
| Koordinasi Penggajian | 1–3 | 30–90 menit | Koordinasi proses penggajian. |
| Pemeriksaan Dokumen Pajak | 1–3 | 30–90 menit | Pemeriksaan dokumen perpajakan. |
| Persiapan Laporan Bulanan | 1–3 | 30–90 menit | Penyusunan laporan bulanan. |
| Koordinasi Pembayaran Vendor | 1–3 | 30–90 menit | Koordinasi pembayaran operasional. |
| Audit Dokumen Internal | 1–3 | 30–90 menit | Penelaahan dokumen internal. |
| Konfirmasi Dokumen Pendukung | 1–3 | 30–90 menit | Konfirmasi kelengkapan dokumen. |
| Rapat Penutupan Buku | 1–3 | 30–90 menit | Koordinasi penutupan periode. |
| Peninjauan Prosedur Administrasi | 1–3 | 30–90 menit | Evaluasi prosedur administrasi. |

  

## Kelompok 4 — Pemakaian ruang kantor dan pelatihan TI

Pola yang sesuai: Ketergantungan jadwal ruangan. Empat ruangan kantor digunakan oleh unit TI dan unit penjualan. Kombinasi pelatihan TI dengan Rapat Penjualan memang diperlukan oleh mekanisme sumber dan harus diperkenalkan sebagai konteks kantor bersama.

  

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| \*\*Kegiatan\*\* | \*\*Kotak\*\* | \*\*Durasi\*\* | \*\*Fungsi dalam konteks\*\* |
| Persiapan Pelatihan Pertama | 1 | 30 menit | Fase sebelum pelatihan pertama. |
| Pelatihan TI Pertama | 2 | 60 menit | Fase pelatihan; periksa larangan Rapat Penjualan. |
| Persiapan Pelatihan Kedua | 1 | 30 menit | Fase sebelum pelatihan kedua. |
| Pelatihan TI Kedua | 2 | 60 menit | Fase pelatihan; periksa larangan Rapat Penjualan. |
| Pembongkaran Peralatan | 1 atau 2 | 30 atau 60 menit | Penyesuaian grid; nilai harus dinyatakan. |
| Rapat Penjualan | 1–3 | 30–90 menit | Pembatas antar-ruang sesuai sumber. |
| Koordinasi Divisi TI | 1–3 | 30–90 menit | Kegiatan tetap pada ruangan lain. |
| Orientasi Sistem Baru | 1–3 | 30–90 menit | Kegiatan pengenalan sistem kantor. |
| Peninjauan Keamanan Aplikasi | 1–3 | 30–90 menit | Kegiatan TI internal. |
| Uji Koneksi Peralatan | 1–3 | 30–90 menit | Pengujian perangkat ruang kantor. |
| Sesi Tanya Jawab Pelatihan | 1–3 | 30–90 menit | Kegiatan pelatihan internal. |
| Rapat Implementasi Sistem | 1–3 | 30–90 menit | Pembahasan implementasi sistem. |
| Koordinasi Fasilitas Ruang | 1–3 | 30–90 menit | Pengaturan pemakaian ruang kantor. |
| Demo Internal Produk | 1–3 | 30–90 menit | Kegiatan internal; bukan otomatis demo klien. |

  

## Kelompok 5 — Bakti sosial dan penyaluran bantuan

Pola yang sesuai: Pemenuhan kebutuhan petugas. Tim-tim melayani satu kegiatan bakti sosial. Kegiatan abu-abu adalah pekerjaan operasional acara yang menyumbang petugas aktif sesuai jumlah anggota tim.

  

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| \*\*Kegiatan\*\* | \*\*Kotak\*\* | \*\*Durasi\*\* | \*\*Fungsi dalam konteks\*\* |
| Registrasi Penerima Bantuan | 1–3 | 30–90 menit | Tugas aktif registrasi acara. |
| Pemeriksaan Data Penerima | 1–3 | 30–90 menit | Tugas aktif verifikasi penerima. |
| Penerimaan Donasi | 1–3 | 30–90 menit | Tugas aktif penerimaan bantuan. |
| Pemilahan Donasi | 1–3 | 30–90 menit | Tugas aktif pemilahan bantuan. |
| Penyiapan Paket Bantuan | 1–3 | 30–90 menit | Tugas aktif penyiapan paket. |
| Distribusi Paket Bantuan | 1–3 | 30–90 menit | Tugas aktif pembagian paket. |
| Pendampingan Penerima Bantuan | 1–3 | 30–90 menit | Tugas aktif pendampingan. |
| Pengaturan Antrean | 1–3 | 30–90 menit | Tugas aktif pengaturan layanan. |
| Pelayanan Meja Informasi | 1–3 | 30–90 menit | Tugas aktif informasi acara. |
| Koordinasi Pos Layanan | 1–3 | 30–90 menit | Tugas aktif koordinasi pos. |
| Pencatatan Penyaluran Bantuan | 1–3 | 30–90 menit | Tugas aktif pencatatan bantuan. |
| Pengelolaan Logistik Bantuan | 1–3 | 30–90 menit | Tugas aktif logistik acara. |
| Pengarahan Relawan | 1–3 | 30–90 menit | Tugas aktif koordinasi relawan. |
| Penataan Area Layanan | 1–3 | 30–90 menit | Tugas aktif penataan lokasi. |

  

## Kelompok 6 — Lokakarya literasi keuangan

Pola yang sesuai: Pemenuhan kebutuhan petugas. Tim-tim mendukung satu lokakarya edukasi keuangan. Semua pekerjaan pada tabel merupakan kegiatan operasional acara; nama kegiatan tidak otomatis menambahkan syarat keahlian khusus.

  

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| \*\*Kegiatan\*\* | \*\*Kotak\*\* | \*\*Durasi\*\* | \*\*Fungsi dalam konteks\*\* |
| Registrasi Peserta Lokakarya | 1–3 | 30–90 menit | Tugas aktif penerimaan peserta. |
| Verifikasi Kehadiran Peserta | 1–3 | 30–90 menit | Tugas aktif pemeriksaan kehadiran. |
| Distribusi Bahan Edukasi | 1–3 | 30–90 menit | Tugas aktif pembagian bahan. |
| Pendampingan Sesi Tabungan | 1–3 | 30–90 menit | Tugas aktif pendampingan sesi. |
| Pendampingan Sesi Anggaran Pribadi | 1–3 | 30–90 menit | Tugas aktif pendampingan sesi. |
| Pendampingan Sesi Keamanan Digital | 1–3 | 30–90 menit | Tugas aktif pendampingan sesi. |
| Pelayanan Informasi Lokakarya | 1–3 | 30–90 menit | Tugas aktif informasi acara. |
| Koordinasi Fasilitator | 1–3 | 30–90 menit | Tugas aktif koordinasi pelaksana. |
| Pendampingan Konsultasi Dasar | 1–3 | 30–90 menit | Tugas aktif pendampingan peserta. |
| Pengaturan Ruang Kelas | 1–3 | 30–90 menit | Tugas aktif pengaturan lokasi. |
| Pendampingan Latihan Perencanaan | 1–3 | 30–90 menit | Tugas aktif pendampingan latihan. |
| Pencatatan Evaluasi Peserta | 1–3 | 30–90 menit | Tugas aktif pencatatan hasil. |
| Distribusi Sertifikat | 1–3 | 30–90 menit | Tugas aktif penyerahan sertifikat. |
| Pengelolaan Perangkat Presentasi | 1–3 | 30–90 menit | Tugas aktif perangkat acara. |

  

## Aturan nama yang memengaruhi logika

Nama kegiatan tidak menambah ketentuan tersembunyi. Demo Aplikasi Klien dan Demo Produk Klien harus disebut atau dijelaskan sebagai demo kepada klien sehingga larangan pemindahan dapat diketahui peserta. Presentasi proposal biasa tidak otomatis dianggap demo tetap kecuali soal menyatakannya.

Pada pola ruangan, Rapat Penjualan adalah kegiatan yang digunakan oleh ketentuan larangan bersamaan. Jika namanya diganti, perbarui seluruh rujukan dan hover dengan arti yang sama. Demo Internal Produk bukan otomatis Demo Klien dan tidak otomatis Rapat Penjualan. Jangan menyatukan semua rapat sebagai larangan waktu.

Pada pola petugas, kegiatan yang ditampilkan merupakan pekerjaan aktif acara yang diperhitungkan dalam kecukupan petugas. Kegiatan istirahat, cuti, perjalanan pribadi, atau pekerjaan di luar acara tidak boleh diberi arti sebagai petugas aktif. Penutupan makan siang ditunjukkan secara terpisah, bukan diambil sebagai kegiatan pelayanan dari tabel.

Nama seperti pendampingan sesi atau koordinasi fasilitator tidak otomatis memberikan kompetensi khusus. Untuk pola kemungkinan yang mensyaratkan keahlian tertentu, tuliskan jumlah petugas yang memiliki keahlian itu; jangan menebaknya dari nama kegiatan atau nama tim.

## Isi hover dan pemeriksaan akhir

Hover memuat nama kegiatan, waktu mulai–selesai, durasi, serta status tetap/boleh dipindah sesuai aturan profil. Semua kotak dalam satu kegiatan menampilkan keterangan yang sama. Pergantian nama kegiatan tidak mengubah durasi, banyaknya kotak, batas pergeseran, atau status tetap secara diam-diam.

Sebelum menerbitkan soal, periksa bahwa judul, konteks, orang/tim/ruangan, seluruh kegiatan, dan target berasal dari satu kelompok yang sesuai. Setiap kegiatan harus dapat dijelaskan perannya dalam konteks tersebut. Jika perlu penjelasan tambahan untuk membuat satu kegiatan tampak berkaitan, ganti kegiatannya atau perjelas konteks tanpa menambah aturan penalaran baru.

Contoh penggunaan yang konsisten: satu soal proyek aplikasi dapat memuat Rapat Proyek, Tinjauan Spesifikasi, Demo Aplikasi Klien, Analisis Hasil Uji, dan Peninjauan Rencana Rilis. Satu soal bakti sosial dapat memuat registrasi penerima, penyiapan paket, distribusi bantuan, dan pelayanan informasi. Jangan menggabungkan kedua daftar tersebut dalam satu acara tanpa alasan yang dinyatakan.

# 9\. Contoh lengkap yang telah diperiksa

## Contoh pemajuan rapat dua kotak

Contoh ini menggunakan variasi rapat target 60 menit agar perpindahan blok dua kotak terlihat jelas; bukan kunci resmi contoh SHL. Ketiganya merupakan anggota proyek implementasi aplikasi untuk klien. Baris diketahui Alya, Bayu, Citra; baris jawaban Kalender Anda. Awalnya Rapat Tim Proyek berlangsung 15.30–16.30. Maksimal satu kegiatan per orang diketahui dapat bergeser 30 menit; demo klien dan janji pribadi Anda tetap.

Alya: Rapat Harian Proyek 09.00–10.00; Tinjauan Data Proyek 10.00–10.30; Rapat Proyek 11.00–12.00; Demo Aplikasi Klien 13.30–15.00; Tinjauan Spesifikasi 16.00–17.00; Koordinasi Tim Pengembang 17.00–17.30.

Bayu: Pembahasan Anggaran Proyek 09.30–11.00; Koordinasi Implementasi 12.00–12.30; Analisis Hasil Uji 13.00–14.30; Rapat Kebutuhan Klien 15.00–16.00; Peninjauan Rencana Rilis 17.00–18.00.

Citra: Rapat Harian Proyek 09.00–10.30; Tinjauan Spesifikasi 10.30–11.30; Analisis Hasil Uji 13.00–14.30; Demo Aplikasi Klien 15.30–17.00; Koordinasi Tim Pengembang 17.00–17.30.

Kalender Anda: janji tetap 09.00–10.00, 10.30–11.30, 12.30–13.30, 14.00–15.30, dan 17.00–18.00; Rapat Tim Proyek semula 15.30–16.30. Setiap janji tetap memiliki nama berbeda pada hover.

Jawaban: Rapat Tim Proyek 11.30–12.30, dua kotak. Rapat Proyek Alya dipindah utuh dari 11.00–12.00 menjadi 10.30–11.30; Koordinasi Implementasi Bayu dari 12.00–12.30 menjadi 12.30–13.00; Citra tidak perlu menggeser kegiatan. Semua durasi tetap dan tidak ada tabrakan. Pemeriksaan seluruh kandidat rapat lebih awal menghasilkan satu waktu mulai yang sah.

## Contoh reservasi pelatihan delapan kotak

Konteksnya adalah empat ruang kantor yang dipakai bersama oleh unit TI dan penjualan. Gunakan pembongkaran 60 menit yang dinyatakan pada soal, sebagai penyesuaian durasi dekat sumber. Ruang 4 kosong 09.30–14.30 dan terisi di luar rentang itu. Ruang 3 kosong 09.30–14.00 dan terisi di luar rentang itu. Rentang terisi yang panjang dipecah menjadi kegiatan nyata berbeda, masing-masing maksimal 90 menit, dengan nama serta batas yang terlihat.

Ruang 1 memiliki Rapat Penjualan 10.00–10.30; Ruang 2 memiliki Rapat Penjualan 15.00–16.00. Kegiatan lain pada kedua ruangan bukan Rapat Penjualan dan tidak menambah larangan tersirat. Tampilkan seluruh kegiatan dengan nama/waktu sehingga syarat “rapat penjualan” dapat diperiksa.

Jawaban: reservasi Ruang 4 pukul 10.00–14.00, delapan kotak. Fase: persiapan pertama 10.00–10.30; pelatihan pertama 10.30–11.30; persiapan kedua 11.30–12.00; pelatihan kedua 12.00–13.00; pembongkaran 13.00–14.00.

Kandidat 09.30–13.30 gugur karena pelatihan pertama 10.00–11.00 bertabrakan dengan Rapat Penjualan 10.00–10.30. Kandidat 10.30–14.30 gugur karena Ruang 3 sudah terisi mulai 14.00. Kandidat 10.00–14.00 sah: rapat penjualan 10.00–10.30 hanya berbarengan dengan persiapan, bukan fase pelatihan. Pemeriksaan seluruh awal reservasi menghasilkan satu jawaban.

## Contoh cakupan petugas dengan jawaban terpisah

Konteksnya adalah acara bakti sosial dan penyaluran bantuan; nama kegiatan pada hover diambil dari kelompok bakti sosial. Tim A empat orang bertugas 11.00–12.00 dan 14.00–15.00. Tim B enam orang bertugas 10.00–11.00 dan 15.00–16.00. Tim C delapan orang bertugas 13.00–14.00 dan 16.00–17.00. Tim D empat orang. Acara 10.00–17.00, minimal enam petugas, istirahat 12.00–13.00. Minta penugasan Tim D hanya ketika diperlukan dengan waktu minimum.

Jawaban Tim D: 11.00–12.00 dan 14.00–15.00, total empat kotak dalam dua blok. Pada kedua rentang itu hanya ada empat petugas awal; Tim D menambah empat sehingga menjadi delapan. Rentang aktif lain sudah memiliki minimal enam petugas. Memilih jam lain adalah penugasan tambahan yang tidak minimum; tidak memilih salah satu kotak yang diperlukan menyebabkan kekurangan.

# 10\. Pola yang mungkin muncul — pengembangan

Enam pola berikut adalah kemungkinan pengembangan berdasarkan mekanisme kalender tim, ketergantungan ruang, dan kecukupan petugas. Belum ada bukti pada sumber yang diperiksa bahwa bentuk-bentuk tersebut benar-benar keluar di SHL. Beri penanda “Pola kemungkinan” pada blueprint dan pembahasan internal, berbeda dari “Pola sumber SHL” atau “Penyesuaian dekat sumber”.

Seluruh pengembangan tetap menggunakan tiga baris diketahui, satu baris jawaban, 18 kotak per baris, dan 30 menit per kotak. Kegiatan awal tetap satu sampai tiga kotak. Jika ada izin pergeseran janji, tetap maksimal satu kegiatan utuh per orang dan maksimal 30 menit; jangan menambah kelonggaran tanpa ketentuan baru yang dinyatakan.

## Rapat paling akhir sebelum batas waktu

Alihkan tujuan dari waktu lebih awal/paling awal menjadi waktu paling akhir sebelum tenggat yang ditentukan. Semua peserta yang disebut tetap harus tersedia dan seluruh larangan perpindahan tetap berlaku. Tuliskan apakah tenggat berlaku pada awal atau selesainya rapat; untuk bank ini, utamakan “rapat harus selesai paling lambat pukul …”.

Jawaban satu blok satu–tiga kotak. Enumerasi seluruh kandidat yang selesai sebelum tenggat, lalu pilih waktu mulai paling akhir. Pola ini mengembangkan pengutamaan waktu pada sumber; tidak boleh diselesaikan dengan sekadar membalik urutan gambar.

## Rapat dengan kuorum dua dari tiga orang

Tiga kalender orang tetap ditampilkan, tetapi rapat cukup dihadiri Anda dan minimal dua dari tiga orang tersebut. Keperluan kuorum harus tertulis; jangan menggunakan kata “seluruh anggota”. Izin pergeseran serta demo tetap sama seperti profil rapat sumber.

Jawaban waktu harus tunggal walaupun lebih dari satu pasangan peserta mungkin cocok pada waktu tersebut. Jika dua waktu berbeda sama-sama memenuhi kuorum dan tidak ada pengutamaan yang tertulis, tolak soal. Jangan memperlakukan orang yang tidak perlu hadir sebagai peserta wajib.

## Salah satu dari dua ruangan pendukung tersedia

Gunakan tiga jadwal ruang diketahui dan Ruang 4 sebagai tujuan. Reservasi memerlukan salah satu dari Ruang 2 atau Ruang 3 sebagai pendukung, alih-alih satu ruang pendukung tertentu. Ruang 1 dapat memuat Rapat Penjualan sebagai pembatas lainnya.

Nyatakan apakah satu ruang pendukung yang sama harus tersedia sepanjang reservasi. Untuk bank ini, wajib satu ruang yang sama selama seluruh blok; jangan menyambung setengah waktu Ruang 2 dengan setengah waktu Ruang 3. Jawaban satu blok tujuh/delapan kotak sesuai durasi yang dinyatakan; beberapa ruang pendukung boleh sama-sama cocok selama waktu reservasinya tetap tunggal.

## Rapat setelah kegiatan acuan selesai

Selain mencari slot bersama, rapat harus dimulai setelah kegiatan acuan yang disebut, misalnya Tinjauan Spesifikasi pada Kalender Anda, selesai. Batas yang digunakan adalah waktu akhir kegiatan utuh, bukan akhir kotak pertamanya. Bila perlu ada jeda 30 menit, tuliskan secara eksplisit; tanpa ketentuan jeda, rapat boleh langsung dimulai pada batas akhir kegiatan acuan.

Kegiatan acuan tetap dan tidak termasuk janji yang boleh digeser. Jawaban satu blok satu–tiga kotak yang memenuhi semua kalender dan hubungan waktu. Tolak jika beberapa waktu masih sama-sama memenuhi pertanyaan tanpa pengutamaan yang jelas.

## Kebutuhan jumlah dan kompetensi petugas

Selain jumlah minimum petugas, tetapkan kebutuhan sekurang-kurangnya satu petugas dengan kompetensi tertentu, misalnya pertolongan pertama. Tiga tim diketahui serta Tim D tetap digunakan; jumlah anggota dan banyak petugas kompeten pada masing-masing tim harus disebutkan. Jangan menyimpulkan kompetensi dari nama tim.

Untuk tiap kotak aktif, periksa jumlah orang dan jumlah petugas kompeten secara terpisah. Tim D hanya dijadwalkan jika diperlukan untuk memenuhi salah satu syarat, dengan waktu minimum yang dinyatakan. Jika Tim D tidak dapat menutup salah satu kekurangan, soal ditolak. Himpunan kotak jawaban harus tunggal; tidak boleh menganggap terpenuhinya jumlah orang otomatis memenuhi kompetensi.

## Kebutuhan petugas berubah menurut jam

Tetapkan dua tingkat kebutuhan yang jelas, misalnya minimal enam orang sebelum makan siang dan delapan orang setelah makan siang. Jam pergantian ambang harus bertepatan dengan batas kotak. Jam acara, makan siang, dan jumlah anggota setiap tim tetap ditampilkan.

Hitung kekurangan pada setiap kotak dengan ambang yang berlaku saat itu. Jawaban Tim D boleh terpisah, hanya pada waktu yang membutuhkan tambahan dan dengan waktu minimum. Tolak jika kebutuhan melampaui jumlah petugas yang dapat disediakan atau menghasilkan lebih dari satu jawaban yang sesuai perintah.

## Kendali agar kemungkinan tidak berubah menjadi tebakan

Jangan memberi klaim bahwa pola pengembangan sudah keluar di SHL. Setiap soal harus menyebut semua tambahan ketentuannya, tetap menggunakan kegiatan utuh, dan dipecahkan ulang dengan pemeriksaan seluruh kandidat. Kriteria paling awal/paling akhir/minimum harus ada pada soal bila dipakai menentukan kunci. Perubahan nama atau warna saja bukan pola kemungkinan baru.

# 11\. Konsistensi, keunikan, dan penilaian

## Periksa semua kemungkinan, bukan hanya satu contoh solusi

Pada pola rapat, periksa seluruh waktu mulai lebih awal serta seluruh kemungkinan tanpa perpindahan atau satu kegiatan digeser 30 menit per orang. Kegiatan digeser sebagai satu blok. Ambil hanya jadwal yang memenuhi batas hari, durasi, larangan pemindahan, dan bebas tabrakan. Pada pola ruangan, periksa seluruh waktu mulai reservasi beserta masing-masing fase dan ketergantungannya. Pada pola petugas, hitung kecukupan pada setiap kotak aktif.

Keunikan dinilai pada jawaban yang diminta. Beberapa cara menggeser janji dapat diterima bila semuanya mengarah pada satu waktu rapat yang sama dan perintah hanya meminta waktu rapat. Jika peserta juga diminta menentukan pergeserannya, bentuk jawaban tersebut harus dinyatakan dan seluruh pergeseran yang sah harus ditangani konsisten; jangan menyalahkan pilihan sah hanya karena berbeda dari satu contoh pembahasan.

Pertanyaan “lebih awal” tanpa pengutamaan harus menghasilkan satu blok waktu saja. Pertanyaan “paling awal” dapat memiliki beberapa kandidat sah, tetapi hasil terbaik harus satu. Untuk petugas, himpunan kotak minimum harus satu; penugasan berlebih tidak diterima bila tujuan minimum dinyatakan. Kotak jawaban terpisah sah untuk cakupan petugas dan tidak sah untuk satu rapat atau reservasi berkesinambungan.

## Hal yang menyebabkan soal ditolak

Tidak ada solusi; lebih dari satu jawaban yang sama-sama memenuhi perintah; durasi tidak cocok dengan kotak; kegiatan terbelah saat dipindah; pergeseran kumulatif lebih dari 30 menit; dua kegiatan orang yang sama ikut berpindah; tabrakan dengan demo tetap; reservasi melewati 18.00; 45 menit dipaksakan ke kotak 30 menit; jumlah petugas tetap kurang setelah ditambah Tim D; atau petunjuk penting hanya ada pada kunci dan tidak terlihat pada soal.

Jangan mengisi sel abu-abu secara acak lalu mencari cerita yang membenarkannya. Susun kegiatan bernama dengan batas waktu yang jelas, tentukan kegiatan tetap/boleh pindah sesuai profil, tampilkan semua informasi yang dipakai, kemudian pecahkan ulang soal hanya dari informasi yang terlihat. Pergantian nama, arah pergeseran, durasi, dan jam harus diikuti pemeriksaan ulang.

## Interaksi dan penilaian

Tampilkan empat baris, masing-masing 18 kotak. Baris informasi tidak dapat diubah kecuali antarmuka memang menyediakan pemindahan kegiatan utuh. Baris jawaban memperlihatkan jadwal awal yang relevan dan pilihan peserta dengan warna berbeda. Hover menjelaskan semua kegiatan abu-abu. Sediakan pembatalan/reset tanpa mengungkap benar/salah atau jumlah kotak jawaban secara terselubung.

Untuk rapat/reservasi, peserta harus memilih satu blok lengkap sesuai durasi; untuk cakupan petugas, pilih seluruh kotak yang diperlukan, boleh beberapa blok. Urutan klik tidak berpengaruh. Pilihan kosong belum menjadi jawaban sah. Nilai jawaban berdasarkan kesamaan blok atau himpunan kotak yang diminta, tanpa memakai batas lima pilihan milik subtes kalender.

## Daftar lulus sebelum penerbitan

Tepat tiga baris diketahui dan satu baris jawaban; tepat 18 kotak per baris; satu kotak 30 menit; seluruh baris bernama; setiap kegiatan satu–tiga kotak dengan batas jelas; hover benar; kegiatan utuh ketika digeser; satu kegiatan maksimal per orang dan maksimal 30 menit; kegiatan tetap dihormati; arti warna sesuai profil; seluruh ketergantungan/kebutuhan petugas diperiksa; satu jawaban; pembahasan memverifikasi seluruh ketentuan.

# Rujukan

Folder SHL\_Deductive Reasoning Test (Interactive): contoh 3.pdf; deduktif.pdf halaman 15–16 dan 23–24; rekaman interaktif.mp4. Angka halaman mengacu pada urutan PDF, bukan nomor tes. Gambar atau pilihan hijau peserta dalam rekaman tidak dianggap kunci resmi.

Referensi interaksi: JadiOJK - Rancangan Fitur TKU (Tahap 2 PCAM OJK), bagian Timeline Scheduling. https://docs.google.com/document/d/10dlHfSw8pDwCI7mUqJP1WE5JFH1V9f4Ut\_48MINroYk

  
  

# Timeslot Scheduling  

# Blueprint Generator — Timeslot Scheduling

# 1\. Tujuan dan acuan

Peserta menempatkan empat kegiatan berwarna pada satu jadwal harian dengan memenuhi batas waktu, urutan, keterkaitan dengan kegiatan tetap, dan tujuan penjadwalan. Setiap opsi merupakan satu kegiatan yang wajib ditempatkan, bukan pilihan jawaban A–D yang dipilih salah satu. Kunci jawaban adalah susunan lengkap keempat kegiatan.

Acuan pola: SHL\_Deductive Reasoning Test (Interactive), deduktif.pdf halaman 9 dan 11; contoh 5.pdf; serta rekaman interaktif.mp4 untuk kotak abu-abu, penempatan, dan keadaan opsi. Tiga pola di bawah teramati pada berkas tersebut. Batas ini merupakan blueprint latihan berdasarkan sampel yang tersedia, bukan klaim bahwa seluruh tes SHL selalu identik.

Komposisi generator: 60% soal memakai tiga pola terverifikasi pada bagian 4, masing-masing 20% dari seluruh soal. Sebanyak 40% memakai lima pola pengembangan pada bagian 5, masing-masing 8% dari seluruh soal. Untuk 100 soal, distribusinya adalah 20 + 20 + 20 soal terverifikasi dan 8 + 8 + 8 + 8 + 8 soal pengembangan. Persentase mengatur jumlah soal yang dihasilkan, bukan jumlah opsi, durasi kegiatan, atau peluang kemunculan pada tes SHL asli.

Untuk paket kecil, prioritaskan komposisi kelompok 60/40: misalnya 10 soal berisi 6 terverifikasi dan 4 pengembangan. Rotasikan pola pengembangan yang belum masuk agar distribusi lima pola tetap seimbang pada kumpulan paket. Dalam kelipatan 25 soal, rasio tiap pola dapat dibuat tepat: 5 soal untuk masing-masing pola terverifikasi dan 2 soal untuk masing-masing pola pengembangan. Penggantian nama atau konteks tanpa menambah aturan baru tetap mengikuti kelompok pola asal. Soal yang menambahkan mekanisme belum terverifikasi dihitung dalam porsi 40%, meskipun juga memakai aturan dasar dari sumber.

# 2\. Papan waktu dan batas kegiatan

Gunakan satu baris jadwal dari pukul 09.00 sampai 18.00, dengan 18 kotak berukuran sama. Setiap kotak mewakili 30 menit. Label jam utama ditampilkan setiap satu jam; batas setengah jam tetap terlihat. Pukul 18.00 adalah batas akhir, bukan awal kotak tambahan.

## Batas operasional

  

|  |  |  |
| :-: | :-: | :-: |
| \*\*Komponen\*\* | \*\*Ketentuan\*\* | \*\*Status acuan\*\* |
| Jumlah opsi | Selalu 4 kegiatan; semuanya ditempatkan | Teramati pada tiga contoh |
| Rentang papan | 09.00–18.00; minimum = maksimum 9 jam | Tetap untuk bank awal |
| Jumlah kotak papan | 18 kotak × 30 menit | Tetap untuk bank awal |
| Durasi per opsi | 1–3 kotak = 30–90 menit; pilihan 30, 60, 90 menit | Teramati pada sumber |
| Komposisi pola proyek | 2 + 2 + 1 + 2 = 7 kotak / 3,5 jam | Urutan mengikuti opsi |
| Komposisi pola pelatihan | 2 + 1 + 3 + 3 = 9 kotak / 4,5 jam | Urutan mengikuti opsi |
| Komposisi pola laptop | 2 + 2 + 3 + 3 = 10 kotak / 5 jam | Urutan mengikuti opsi |
| Kotak abu-abu | Kegiatan tetap; setiap kegiatan memiliki nama dan awal–akhir | Identitas dapat dibaca pada keterangan |
| Jumlah orang/jadwal | Satu jadwal harian; nama orang dapat menjadi rujukan kegiatan | Bukan penjadwalan banyak kalender |

Semua contoh sumber menggunakan papan sembilan jam yang sama. Karena itu, minimum dan maksimum panjang papan untuk blueprint ini sama-sama sembilan jam atau 18 kotak. Durasi satu opsi berbeda: minimum 30 menit dan maksimum 90 menit. Jangan mencampur panjang papan dengan lama kegiatan yang dijadwalkan.

Total durasi keempat opsi pada sumber adalah tujuh kotak untuk pola proyek, sembilan kotak untuk pola pelatihan, dan sepuluh kotak untuk pola laptop. Pertahankan komposisi tersebut pada bank soal awal. Batas total yang teramati adalah 3,5–5 jam, tetapi bukan berarti setiap komposisi di antara kedua batas tersebut sudah terverifikasi. Tidak perlu membuat total enam jam atau memperpanjang papan untuk menambah kesulitan.

# 3\. Empat warna opsi

## Palet acuan

  

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| \*\*Opsi\*\* | \*\*Warna aktif\*\* | \*\*Kode HEX\*\* | \*\*Pemakaian\*\* |
| Pertama | Biru keunguan | \\\#4C4CFF | Penanda opsi dan seluruh bloknya |
| Kedua | Hijau | \\\#007300 | Penanda opsi dan seluruh bloknya |
| Ketiga | Oranye | \\\#FFA500 | Penanda opsi dan seluruh bloknya |
| Keempat | Toska | \\\#40E0D0 | Penanda opsi dan seluruh bloknya |

Urutan warna pada opsi pertama sampai keempat konsisten pada tiga contoh sumber. Gunakan satu palet tetap; tidak perlu mengacak empat warnanya. Kode berikut diukur dari bidang warna solid pada hasil render PDF sumber halaman 9 dan 11. Keduanya menghasilkan kode yang sama. Ini adalah kode acuan aset sumber, bukan hasil pembacaan kode CSS resmi SHL. Rekaman video yang terkompresi dapat memperlihatkan sedikit perbedaan rona.

Warna mengikuti identitas opsi sejak daftar sampai ditempatkan di jadwal, termasuk ketika dipindahkan lagi. Opsi yang sudah ditempatkan dapat dipudarkan atau dinonaktifkan di daftar; keadaan pudar bukan palet baru. Tuliskan nama dan durasi agar identitas kegiatan tidak bergantung pada warna saja. Hijau pada opsi kedua bukan tanda jawaban benar; abu-abu menunjukkan jadwal tetap yang terisi, bukan jawaban salah.

## 4\. Pola terverifikasi di SHL (60%)

## Pola 1 — Urutan kegiatan dan jadwal target paling awal

Sumber: deduktif.pdf halaman 9. Empat kegiatan adalah Demo Produk (60 menit), Tinjauan Kualitas (60 menit), Tinjauan bersama Jay (30 menit), dan Rapat Scrum (60 menit), dalam urutan warna pertama sampai keempat. Tinjauan Kualitas harus selesai sebelum Rapat Scrum dimulai; Rapat Scrum harus selesai sebelum Demo Produk dimulai. Tinjauan bersama Jay harus langsung dimulai setelah Pertemuan Singkat dengan Peter selesai. Setelah syarat dipenuhi, jadwalkan Demo Produk sedini mungkin.

Mekanisme yang diuji: rantai sebelum–sesudah, satu kegiatan menempel pada akhir kegiatan tetap, dan optimasi satu target. Kata “sebelum” mengizinkan jeda; kata “langsung setelah” tidak mengizinkan jeda. Jangan menjadikan seluruh rantai wajib berdampingan. Kegiatan tetap harus memiliki nama serta batas awal–akhir yang dapat dibaca melalui keterangan pada kotak abu-abu.

## Pola 2 — Semua selesai sebelum tenggat dan satu kegiatan terakhir

Sumber: deduktif.pdf halaman 11. Opsi: Pelatihan Kepatuhan (60 menit), Pelatihan Keberagaman (30 menit), Pelatihan SDM (90 menit), dan Pelatihan TI (90 menit). Semua pelatihan harus selesai paling lambat pukul 15.30 dan Pelatihan TI harus selesai terakhir. “Terakhir” ditentukan berdasarkan waktu selesainya kegiatan, bukan posisi pada daftar opsi.

Contoh kunci terverifikasi: Pelatihan Kepatuhan 09.30–10.30; Pelatihan Keberagaman 11.00–11.30; Pelatihan SDM 12.00–13.30; Pelatihan TI 14.00–15.30. Kotak tetap pada sumber menutup 09.00–09.30, 10.30–11.00, 11.30–12.00, 13.30–14.00, dan 16.00–16.30. Empat blok bebas sebelum tenggat tepat menampung empat durasi tersebut. Kunci ini hanya berlaku bila tata letak abu-abu dan tenggatnya sama.

## Pola 3 — Sebagian kegiatan menunggu sumber daya tersedia

Sumber: contoh 5.pdf dan rekaman interaktif. Opsi: Entri Data (60 menit), Rapat Penjualan (60 menit), Menjalankan Laporan (90 menit), dan Wawancara (90 menit). Laptop sedang diperbaiki. Entri Data dan Menjalankan Laporan baru boleh dilakukan setelah laptop diambil; kegiatan lain tidak memiliki pembatasan tersebut. Instruksi meminta tugas dijadwalkan sedini mungkin.

Mekanisme yang diuji: pemisahan kegiatan yang bergantung pada sumber daya dan kegiatan yang tidak bergantung padanya, lalu pemanfaatan celah waktu. Batas “setelah mengambil laptop” memakai waktu selesai kegiatan pengambilan yang sebenarnya. Jangan menebaknya dari awal blok abu-abu atau dari ujung suatu deretan abu-abu yang mungkin berisi beberapa kegiatan berbeda.

# 5\. Pola pengembangan — belum terverifikasi di SHL (40%)

Kelima pola berikut merupakan kemungkinan pengembangan dari mekanisme penjadwalan pada sumber. Pola-pola ini belum ditemukan sebagai pola tersendiri dalam sampel SHL yang digunakan. Contoh, jadwal abu-abu, dan kunci pada bagian ini adalah rancangan latihan, bukan salinan soal SHL. Setiap contoh telah diperiksa dengan menelusuri seluruh penempatan pada batas 30 menit; masing-masing menghasilkan tepat satu susunan akhir yang sah atau satu susunan optimal tunggal.

Semua pola tetap menggunakan empat opsi berwarna, papan 09.00–18.00 berisi 18 kotak, dan kegiatan utuh berdurasi 30–90 menit. Jangan menambahkan penjadwalan banyak orang, kegiatan yang dapat dipecah, perjalanan, kapasitas ruangan, atau aturan tersembunyi. Jumlah dan identitas jadwal tetap di bawah harus ditampilkan lengkap beserta rentang waktunya.

## Acuan bersama untuk contoh Pengembangan 1, 2, dan 5

Jadwal tetap: Pengarahan Tim 09.00–09.30; Rapat Koordinasi 10.30–11.00; Pemeriksaan Sistem 11.30–12.00; Istirahat 13.30–14.00; Rapat Unit 16.00–16.30. Hanya kelima rentang ini yang berwarna abu-abu; seluruh kotak lain tersedia. Tidak ada tenggat atau prioritas tambahan selain yang tertulis pada masing-masing contoh.

## Pengembangan 1 — Jeda pasti antarkegiatan

Inti pola: satu kegiatan dimulai tepat 30 atau 60 menit setelah kegiatan lain selesai. Ini berbeda dari “langsung setelah” dan berbeda dari “setidaknya 30 menit setelah”. Selisih dihitung dari waktu selesai kegiatan pertama sampai waktu mulai kegiatan berikutnya. Selama jeda, kegiatan lain boleh berlangsung jika soal tidak melarangnya; jeda tidak otomatis menjadi blok abu-abu.

Contoh: gunakan jadwal tetap acuan bersama. Opsi sesuai urutan warna: Pemeriksaan Data 60 menit; Konfirmasi Data 30 menit; Analisis Data 90 menit; Penyusunan Laporan 90 menit. Konfirmasi Data harus dimulai tepat 30 menit setelah Pemeriksaan Data selesai. Analisis Data harus selesai sebelum Penyusunan Laporan dimulai. Penyusunan Laporan harus selesai paling lambat 15.30.

Kunci tunggal: Pemeriksaan Data 09.30–10.30; Konfirmasi Data 11.00–11.30; Analisis Data 12.00–13.30; Penyusunan Laporan 14.00–15.30. Hubungan jeda menempatkan dua kegiatan pertama secara tunggal; dua kegiatan 90 menit kemudian hanya dapat menempati celah sebelum tenggat dalam urutan tersebut. Hasil pemeriksaan: satu susunan sah.

Variasi yang diizinkan: ubah panjang jeda menjadi kelipatan 30 menit, nama kegiatan, atau posisi celah tanpa mengubah makna “tepat”. Untuk menjaga kedekatan dengan sumber, batasi jeda eksplisit pada 30 atau 60 menit. Setiap perubahan harus diperiksa ulang; jawaban contoh tidak diwariskan otomatis.

## Pengembangan 2 — Kegiatan di dalam jendela waktu

Inti pola: satu kegiatan tidak boleh mulai sebelum waktu tertentu dan harus selesai paling lambat waktu tertentu. Kedua batas berlaku untuk seluruh kegiatan, bukan hanya jam mulainya. Jendela waktu merupakan ketersediaan kegiatan tersebut; kotak di luar jendela tetap dapat digunakan oleh kegiatan lain.

Contoh: gunakan jadwal tetap acuan bersama. Opsi sesuai urutan warna: Pemeriksaan Data 60 menit; Konfirmasi Data 30 menit; Analisis Data 90 menit; Penyusunan Laporan 90 menit. Analisis Data tidak boleh dimulai sebelum 12.00 dan harus selesai paling lambat 13.30. Semua kegiatan harus selesai paling lambat 15.30. Pemeriksaan Data harus selesai sebelum Konfirmasi Data dimulai, dan Konfirmasi Data harus selesai sebelum Penyusunan Laporan dimulai.

Kunci tunggal: Pemeriksaan Data 09.30–10.30; Konfirmasi Data 11.00–11.30; Analisis Data 12.00–13.30; Penyusunan Laporan 14.00–15.30. Jendela 90 menit mengunci Analisis Data; panjang celah dan dua hubungan urutan mengunci kegiatan lain. Hasil pemeriksaan: satu susunan sah.

Variasi yang diizinkan: jendela dapat lebih lebar daripada durasi kegiatan, asalkan celah dan ketentuan lain tetap menyisakan satu jawaban. Hindari beberapa jendela berbeda sekaligus pada bank awal. Periksa khusus batas akhir: kegiatan 90 menit dalam jendela 12.00–13.30 harus mulai 12.00, bukan 13.30.

## Pengembangan 3 — Sepasang opsi harus berurutan tanpa jeda

Inti pola: dua dari empat opsi bergerak sendiri-sendiri, tetapi dalam jawaban wajib bersebelahan dengan urutan tertentu. Pola ini mengembangkan hubungan langsung setelah kegiatan tetap pada sumber menjadi hubungan antara dua opsi yang sama-sama dijadwalkan. Kedua opsi tetap memiliki warna dan durasi masing-masing; jangan digabung menjadi satu opsi baru.

Contoh: jadwal tetap adalah Rapat Koordinasi 10.30–12.00; Istirahat 13.30–14.00; Rapat Unit 15.30–17.00. Kotak lain tersedia. Opsi sesuai urutan warna: Pemeriksaan Data 60 menit; Konfirmasi Data 30 menit; Analisis Data 90 menit; Penyusunan Laporan 90 menit. Pemeriksaan Data harus menjadi kegiatan pertama di antara empat opsi. Konfirmasi Data harus langsung dimulai setelah Pemeriksaan Data selesai. Analisis Data harus selesai sebelum Penyusunan Laporan dimulai. Semua kegiatan harus selesai paling lambat 15.30.

Kunci tunggal: Pemeriksaan Data 09.00–10.00; Konfirmasi Data 10.00–10.30; Analisis Data 12.00–13.30; Penyusunan Laporan 14.00–15.30. Dua opsi pertama bersama-sama membutuhkan tiga kotak berurutan dan wajib berada paling awal; urutan dan tenggat mengunci dua opsi sisanya. Hasil pemeriksaan: satu susunan sah.

Variasi yang diizinkan: ganti pasangan kegiatan dan gabungan durasinya, tetapi keduanya harus muat pada satu rangkaian kotak kosong tanpa melewati jadwal tetap. Tetap hanya satu pasangan yang wajib berdampingan pada bank awal. Kata “pertama” harus dijelaskan sebagai pertama di antara empat opsi, bukan mendahului kegiatan tetap.

## Pengembangan 4 — Dua opsi mengapit satu jadwal tetap

Inti pola: satu opsi selesai tepat ketika kegiatan tetap dimulai, dan opsi lain dimulai tepat ketika kegiatan tetap selesai. Hubungan “langsung sebelum” dan “langsung setelah” mengacu pada kegiatan tetap yang sama dan dinamai dengan jelas. Tidak ada perpindahan atau pemendekan jadwal tetap.

Contoh: jadwal tetap adalah Pengarahan Tim 09.00–10.00; Rapat Data 11.00–12.00; Istirahat 13.00–14.00; Rapat Unit 15.30–16.30. Kotak lain tersedia. Opsi sesuai urutan warna: Pemeriksaan Data 60 menit; Konfirmasi Data 60 menit; Analisis Data 90 menit; Penyusunan Laporan 90 menit. Pemeriksaan Data harus selesai tepat ketika Rapat Data dimulai. Konfirmasi Data harus langsung dimulai setelah Rapat Data selesai. Analisis Data harus selesai sebelum Penyusunan Laporan dimulai.

Kunci tunggal: Pemeriksaan Data 10.00–11.00; Konfirmasi Data 12.00–13.00; Analisis Data 14.00–15.30; Penyusunan Laporan 16.30–18.00. Dua sisi Rapat Data mengunci dua opsi pertama; dua celah 90 menit dan hubungan urutan mengunci dua opsi lainnya. Hasil pemeriksaan: satu susunan sah.

Variasi yang diizinkan: ubah jam kegiatan tetap dan durasi kedua opsi yang mengapitnya. Pastikan kotak sebelum dan sesudah kegiatan tetap cukup panjang. Jangan menyatakan satu kegiatan harus sekaligus langsung sebelum dan langsung setelah kegiatan tetap yang sama.

## Pengembangan 5 — Seluruh rangkaian selesai secepat mungkin

Inti pola: optimalkan waktu selesai kegiatan terakhir dari keseluruhan rangkaian, dengan urutan kegiatan yang dinyatakan jelas. Ini merupakan pengembangan sasaran “sedini mungkin” pada sumber menjadi ukuran yang spesifik: waktu selesai seluruh tugas. Jangan menyamakannya dengan mendahulukan warna pertama atau menempatkan satu opsi tertentu sedini mungkin.

Contoh: gunakan jadwal tetap acuan bersama. Opsi sesuai urutan warna: Pengiriman Laporan 60 menit; Persetujuan Laporan 30 menit; Analisis Data 90 menit; Pengumpulan Data 90 menit. Pengumpulan Data harus selesai sebelum Analisis Data dimulai. Analisis Data harus selesai sebelum Persetujuan Laporan dimulai. Persetujuan Laporan harus selesai sebelum Pengiriman Laporan dimulai. Atur seluruh kegiatan agar waktu selesai kegiatan terakhir menjadi sedini mungkin.

Kunci optimal tunggal: Pengumpulan Data 12.00–13.30; Analisis Data 14.00–15.30; Persetujuan Laporan 15.30–16.00; Pengiriman Laporan 16.30–17.30. Urutan warna jawaban tidak sama dengan urutan waktu kegiatan. Terdapat empat susunan yang memenuhi syarat dasar, tetapi hanya satu yang menyelesaikan seluruh tugas pada 17.30; susunan lain selesai pada 18.00. Tidak diperlukan prioritas tambahan untuk memecah seri.

Variasi yang diizinkan: ubah urutan yang masuk akal dalam satu konteks, durasi, dan celah jadwal. Setelah memilih waktu selesai terbaik, tetap hitung jumlah susunan lengkap yang mencapai waktu tersebut. Jika dua susunan sama-sama optimal, soal harus diperbaiki; waktu selesai terbaik saja belum membuktikan kunci tunggal.

## Batas penerapan pola pengembangan

Gunakan satu mekanisme pengembangan utama per soal, didampingi ketentuan dasar seperti urutan atau tenggat. Jangan menggabungkan kelima pola baru dalam satu soal. Contoh di atas membuktikan bahwa tiap pola dapat menghasilkan jawaban tunggal pada konfigurasi tertentu; bukan jaminan bahwa semua variasinya otomatis konsisten. Kunci harus diperiksa kembali setelah nama yang dirujuk, jam, durasi, hubungan, atau jadwal abu-abu diubah.

6\. Naskah soal dan variasi yang tetap dekat sumber

Untuk bank awal gunakan empat opsi, dengan nama kegiatan singkat dan durasi tertulis di setiap opsi. Naskah terdiri dari instruksi, syarat hubungan atau batas waktu, dan sasaran penjadwalan bila ada. Kisaran editorial: 2–5 kalimat ringkas dan 2–4 ketentuan substantif. Kisaran ini mempermudah penulisan bahasa Indonesia; bukan batas baku SHL. Jangan menambahkan kalimat panjang hanya demi memenuhi jumlah.

Pada pola proyek, pertahankan dua hubungan sebelum–sesudah, satu hubungan langsung setelah kegiatan tetap, dan sasaran satu kegiatan sedini mungkin. Pada pola pelatihan, pertahankan satu tenggat untuk semua kegiatan dan satu kegiatan yang wajib terakhir. Pada pola sumber daya, pertahankan dua kegiatan yang menunggu satu sumber daya dan dua kegiatan yang tidak menunggunya. Mengganti nama kegiatan, nama orang, posisi celah, atau waktu tenggat diperbolehkan setelah kunci diuji ulang.

Variasi jawaban dapat menempatkan kegiatan pada celah pagi, tengah hari, atau sore; beberapa kegiatan boleh berurutan dan kegiatan lain boleh terpisah oleh jadwal tetap atau celah kosong. Urutan jawaban tidak harus mengikuti urutan opsi maupun urutan warna. Akhir satu kegiatan boleh sama dengan awal kegiatan berikutnya. Tidak semua kotak putih harus diisi, kecuali pengisian itu memang dipaksa oleh syarat dan durasi.

## Daftar kegiatan per konteks

  

|  |  |  |
| :-: | :-: | :-: |
| \*\*Konteks\*\* | \*\*Empat opsi, sesuai urutan warna\*\* | \*\*Kegiatan tetap yang relevan\*\* |
| Proyek aplikasi — sumber | Demo Produk; Tinjauan Kualitas; Tinjauan bersama Jay; Rapat Scrum | Pertemuan Singkat dengan Peter |
| Pelatihan pegawai — sumber | Pelatihan Kepatuhan; Pelatihan Keberagaman; Pelatihan SDM; Pelatihan TI | Jadwal tetap bernama sesuai konteks; jangan mengarang nama sebagai kutipan sumber |
| Pekerjaan kantor — sumber | Entri Data; Rapat Penjualan; Menjalankan Laporan; Wawancara | Pengambilan Laptop; kegiatan tetap lain sesuai keterangan sumber |
| Persiapan audit — adaptasi pola proyek | Presentasi Temuan; Pemeriksaan Bukti; Tinjauan bersama Kepala Tim; Rapat Audit | Koordinasi dengan Ketua Audit |
| Pelatihan layanan — adaptasi pola pelatihan | Pelatihan Layanan; Pengarahan Etika; Pelatihan Produk; Pelatihan Sistem | Pengarahan Pagi; Istirahat; Rapat Tim |
| Produksi presentasi — adaptasi pola sumber daya | Mengolah Grafik; Rapat Materi; Menyusun Slide; Wawancara Narasumber | Pengambilan Laptop; Rapat Internal; Istirahat |

Tiga set pertama menerjemahkan kegiatan pada sumber. Tiga set berikutnya merupakan penggantian konteks dengan hubungan logis yang sama, bukan klaim sebagai contoh SHL tambahan. Pilih satu set utuh untuk satu soal. Jangan mencampur kegiatan pelatihan, produksi aplikasi, dan layanan nasabah secara acak. Nama kegiatan tetap yang menjadi rujukan harus muncul persis sama di naskah dan keterangan jadwal.

## Bank kegiatan tambahan untuk variasi soal

Bank ini menyediakan 12 konteks, 36 set berisi empat kegiatan, serta 72 nama kegiatan tetap untuk kotak abu-abu. Totalnya 144 nama kegiatan opsi dan 72 nama kegiatan tetap. Seluruh nama tambahan merupakan adaptasi editorial. Penggantian nama saja tetap dihitung sesuai pola logika asal dalam komposisi 60/40; bank nama ini tidak membuktikan adanya pola SHL baru.

Pilih satu konteks dan satu set empat kegiatan sebagai titik awal. Tiga set dalam satu konteks merupakan alternatif, bukan 12 opsi yang tampil bersamaan. Kegiatan tetap dipilih seperlunya dari konteks yang sama; keenam nama tidak wajib dipakai semua. Semua kegiatan dalam satu soal dijalankan oleh pemilik satu jadwal, bukan otomatis oleh orang berbeda. Istirahat dapat digunakan di semua konteks dengan nama yang sesuai.

Set 1 terutama cocok untuk hubungan urutan dan tinjauan yang merujuk jadwal tetap; set 2 cocok untuk pola pelatihan bertenggat; set 3 cocok untuk pekerjaan kantor dan ketergantungan sumber daya jika sesuai catatan. Kelima pola pengembangan juga dapat memakai nama-nama ini. Daftar nama tidak menentukan kunci, durasi, atau urutan waktu. Tulis hubungan yang diperlukan secara eksplisit dan pilih durasi 30, 60, atau 90 menit sesuai komposisi pola.

Pertahankan tema dan sebab-akibat yang masuk akal. Jangan menempatkan pengiriman laporan sebelum penyusunan laporan jika keduanya disebut sebagai satu rangkaian yang saling bergantung. Jangan membuat sebuah tugas menunggu laptop bila tugas itu jelas dikerjakan tanpa laptop. Bila mengganti nama orang dalam kegiatan tinjauan atau koordinasi, tuliskan nama yang sama persis di naskah, opsi, dan keterangan jadwal.

### 1\. Pengembangan aplikasi

  

|  |  |
| :-: | :-: |
| \*\*Pilihan\*\* | \*\*Nama kegiatan\*\* |
| Set 1 — empat opsi alternatif | Demo Fitur; Pengujian Fungsi; Tinjauan Desain; Rapat Pengembang |
| Set 2 — empat opsi alternatif | Penyusunan Spesifikasi; Pemeriksaan Kode; Evaluasi Prototipe; Presentasi Rilis |
| Set 3 — empat opsi alternatif | Pembaruan Aplikasi; Diskusi Pengguna; Analisis Galat; Wawancara Pengguna |
| Jadwal tetap — pilih seperlunya | Pengarahan Proyek; Koordinasi dengan Manajer Produk; Pengambilan Laptop Pengembang; Rapat Tim Teknologi; Konsultasi Arsitektur; Istirahat Tim Pengembang |

Untuk pola sumber daya, Pembaruan Aplikasi dan Analisis Galat dapat menunggu laptop; Diskusi Pengguna dan Wawancara Pengguna dapat berlangsung tatap muka tanpa laptop. Nyatakan keadaan ini di naskah.

### 2\. Pengolahan data dan pelaporan

  

|  |  |
| :-: | :-: |
| \*\*Pilihan\*\* | \*\*Nama kegiatan\*\* |
| Set 1 — empat opsi alternatif | Presentasi Ringkasan; Pemeriksaan Data; Tinjauan Hasil Analisis; Rapat Pelaporan |
| Set 2 — empat opsi alternatif | Pengumpulan Data; Pembersihan Data; Analisis Tren; Penyusunan Laporan |
| Set 3 — empat opsi alternatif | Entri Transaksi; Diskusi Kebutuhan Data; Pembuatan Dasbor; Wawancara Pemilik Data |
| Jadwal tetap — pilih seperlunya | Pengarahan Analis; Koordinasi Sumber Data; Pengaktifan Akses Data; Rapat Evaluasi Angka; Konsultasi Metode Analisis; Istirahat Tim Data |

Untuk pola sumber daya, Entri Transaksi dan Pembuatan Dasbor dapat menunggu akses sistem. Kedua diskusi tatap muka tidak bergantung pada akses tersebut jika dinyatakan demikian.

### 3\. Audit dan pengendalian internal

  

|  |  |
| :-: | :-: |
| \*\*Pilihan\*\* | \*\*Nama kegiatan\*\* |
| Set 1 — empat opsi alternatif | Presentasi Temuan Audit; Pemeriksaan Bukti Audit; Tinjauan bersama Ketua Audit; Rapat Pembahasan Temuan |
| Set 2 — empat opsi alternatif | Penelaahan Prosedur; Pengujian Sampel; Evaluasi Pengendalian; Penyusunan Rekomendasi |
| Set 3 — empat opsi alternatif | Pencatatan Temuan; Diskusi Proses Bisnis; Penelusuran Transaksi; Wawancara Penanggung Jawab |
| Jadwal tetap — pilih seperlunya | Pengarahan Penugasan Audit; Koordinasi dengan Auditor Senior; Penyerahan Berkas Audit; Rapat Pembukaan Audit; Rapat Penutupan Audit; Istirahat Tim Audit |

Jika suatu tugas membutuhkan berkas, tentukan secara eksplisit tugas mana yang baru boleh dimulai setelah Penyerahan Berkas Audit selesai. Jangan menganggap semua tugas memerlukannya.

### 4\. Pelatihan dan pengembangan pegawai

  

|  |  |
| :-: | :-: |
| \*\*Pilihan\*\* | \*\*Nama kegiatan\*\* |
| Set 1 — empat opsi alternatif | Presentasi Rencana Pelatihan; Pemeriksaan Materi Pelatihan; Tinjauan bersama Fasilitator; Rapat Persiapan Pelatihan |
| Set 2 — empat opsi alternatif | Pelatihan Kepatuhan Internal; Pengarahan Etika Kerja; Pelatihan Layanan Pelanggan; Pelatihan Sistem Operasional |
| Set 3 — empat opsi alternatif | Pembaruan Modul Digital; Diskusi Kebutuhan Peserta; Penyusunan Kuis Daring; Wawancara Calon Fasilitator |
| Jadwal tetap — pilih seperlunya | Pengarahan Panitia Pelatihan; Koordinasi dengan Instruktur; Pengambilan Laptop Pelatihan; Rapat Evaluasi Pembelajaran; Konsultasi Kurikulum; Istirahat Peserta Pelatihan |

Set kedua dapat langsung dipakai untuk pola tenggat dan pelatihan terakhir. Nama modul terakhir harus disebutkan jelas. Set ketiga dapat memakai laptop sebagai sumber daya bagi dua tugas digital.

### 5\. Rekrutmen dan orientasi pegawai

  

|  |  |
| :-: | :-: |
| \*\*Pilihan\*\* | \*\*Nama kegiatan\*\* |
| Set 1 — empat opsi alternatif | Presentasi Hasil Seleksi; Pemeriksaan Berkas Kandidat; Tinjauan bersama Perekrut; Rapat Keputusan Rekrutmen |
| Set 2 — empat opsi alternatif | Orientasi Perusahaan; Pengarahan Aturan Pegawai; Pelatihan Administrasi SDM; Pengenalan Sistem Kerja |
| Set 3 — empat opsi alternatif | Pembaruan Data Kandidat; Diskusi Kriteria Jabatan; Penyusunan Rekap Seleksi; Wawancara Kandidat |
| Jadwal tetap — pilih seperlunya | Pengarahan Tim Rekrutmen; Koordinasi dengan Manajer SDM; Pengaktifan Akses Rekrutmen; Rapat Kebutuhan Tenaga Kerja; Konsultasi Deskripsi Jabatan; Istirahat Tim SDM |

Pada pola sumber daya, dua tugas pengolahan data dapat menunggu akses sistem; wawancara dapat dilakukan langsung. Hindari membuat keputusan seleksi mendahului pemeriksaan yang dinyatakan sebagai prasyaratnya.

### 6\. Penjualan dan pengelolaan klien

  

|  |  |
| :-: | :-: |
| \*\*Pilihan\*\* | \*\*Nama kegiatan\*\* |
| Set 1 — empat opsi alternatif | Presentasi Penawaran; Pemeriksaan Proposal; Tinjauan bersama Kepala Penjualan; Rapat Strategi Klien |
| Set 2 — empat opsi alternatif | Pelatihan Produk Penjualan; Pengarahan Etika Penawaran; Pelatihan Negosiasi; Pelatihan Sistem Penjualan |
| Set 3 — empat opsi alternatif | Pembaruan Data Prospek; Diskusi Kebutuhan Klien; Penyusunan Prakiraan Penjualan; Pertemuan dengan Calon Klien |
| Jadwal tetap — pilih seperlunya | Pengarahan Target Penjualan; Koordinasi dengan Manajer Akun; Pengaktifan Akses Penjualan; Rapat Evaluasi Prospek; Konsultasi Harga Penawaran; Istirahat Tim Penjualan |

Bedakan rapat internal dan pertemuan dengan klien. Jika dua nama dipakai dalam satu soal, gunakan identitas kegiatan yang jelas agar rujukan seperti “setelah rapat” tidak ambigu.

### 7\. Pemasaran dan kampanye

  

|  |  |
| :-: | :-: |
| \*\*Pilihan\*\* | \*\*Nama kegiatan\*\* |
| Set 1 — empat opsi alternatif | Presentasi Konsep Kampanye; Pemeriksaan Materi Promosi; Tinjauan bersama Manajer Merek; Rapat Peluncuran Kampanye |
| Set 2 — empat opsi alternatif | Pelatihan Identitas Merek; Pengarahan Etika Iklan; Pelatihan Riset Pasar; Pelatihan Analitik Kampanye |
| Set 3 — empat opsi alternatif | Pembaruan Iklan Digital; Diskusi Konsep Kreatif; Analisis Kinerja Kampanye; Wawancara Konsumen |
| Jadwal tetap — pilih seperlunya | Pengarahan Tim Pemasaran; Koordinasi dengan Desainer; Pengaktifan Akun Iklan; Rapat Anggaran Kampanye; Konsultasi Pesan Promosi; Istirahat Tim Kampanye |

Pengaktifan Akun Iklan dapat menjadi jangkar bagi Pembaruan Iklan Digital. Analisis Kinerja Kampanye tidak otomatis membutuhkan akun yang sama; ketergantungannya harus dijelaskan jika digunakan.

### 8\. Layanan nasabah dan penanganan keluhan

  

|  |  |
| :-: | :-: |
| \*\*Pilihan\*\* | \*\*Nama kegiatan\*\* |
| Set 1 — empat opsi alternatif | Presentasi Perbaikan Layanan; Pemeriksaan Berkas Keluhan; Tinjauan bersama Supervisor Layanan; Rapat Tindak Lanjut Keluhan |
| Set 2 — empat opsi alternatif | Pelatihan Layanan Nasabah; Pengarahan Kerahasiaan Data; Pelatihan Penanganan Keluhan; Pelatihan Aplikasi Layanan |
| Set 3 — empat opsi alternatif | Pencatatan Permintaan Nasabah; Diskusi Penanganan Kasus; Penyusunan Rekap Keluhan; Wawancara Kebutuhan Nasabah |
| Jadwal tetap — pilih seperlunya | Pengarahan Petugas Layanan; Koordinasi dengan Kepala Layanan; Pengaktifan Akses Layanan; Rapat Evaluasi Waktu Tanggap; Konsultasi Kasus Nasabah; Istirahat Petugas Layanan |

Gunakan istilah nasabah secara konsisten dalam satu soal. Dua tugas administrasi dapat bergantung pada aplikasi layanan, sedangkan diskusi dan wawancara dapat berlangsung langsung sesuai keterangan soal.

### 9\. Pengadaan dan pengelolaan pemasok

  

|  |  |
| :-: | :-: |
| \*\*Pilihan\*\* | \*\*Nama kegiatan\*\* |
| Set 1 — empat opsi alternatif | Presentasi Rencana Pengadaan; Pemeriksaan Dokumen Penawaran; Tinjauan bersama Ketua Pengadaan; Rapat Evaluasi Pemasok |
| Set 2 — empat opsi alternatif | Pelatihan Prosedur Pengadaan; Pengarahan Etika Pengadaan; Pelatihan Evaluasi Pemasok; Pelatihan Sistem Pembelian |
| Set 3 — empat opsi alternatif | Pembaruan Data Pemasok; Diskusi Kebutuhan Barang; Penyusunan Perbandingan Harga; Pertemuan dengan Pemasok |
| Jadwal tetap — pilih seperlunya | Pengarahan Tim Pengadaan; Koordinasi dengan Bagian Pembelian; Penerimaan Dokumen Pemasok; Rapat Anggaran Pengadaan; Konsultasi Spesifikasi Barang; Istirahat Tim Pengadaan |

Jika perbandingan harga baru dapat dilakukan sesudah dokumen diterima, hubungan itu harus tertulis. Kegiatan tetap Penerimaan Dokumen Pemasok selesai sebelum tugas yang bergantung padanya dimulai.

### 10\. Administrasi dan pengelolaan dokumen

  

|  |  |
| :-: | :-: |
| \*\*Pilihan\*\* | \*\*Nama kegiatan\*\* |
| Set 1 — empat opsi alternatif | Presentasi Penataan Arsip; Pemeriksaan Kelengkapan Dokumen; Tinjauan bersama Kepala Administrasi; Rapat Pengelolaan Dokumen |
| Set 2 — empat opsi alternatif | Pelatihan Tata Naskah; Pengarahan Kerahasiaan Arsip; Pelatihan Pengarsipan; Pelatihan Sistem Dokumen |
| Set 3 — empat opsi alternatif | Pemindaian Berkas; Diskusi Kebutuhan Arsip; Pengindeksan Dokumen Digital; Wawancara Pengguna Arsip |
| Jadwal tetap — pilih seperlunya | Pengarahan Tim Administrasi; Koordinasi dengan Pengelola Arsip; Pengambilan Pemindai Dokumen; Rapat Evaluasi Arsip; Konsultasi Retensi Dokumen; Istirahat Tim Administrasi |

Pemindaian Berkas dapat menunggu pemindai tersedia. Pengindeksan Dokumen Digital tidak otomatis menunggu pemindai jika berkas digital sudah ada; nyatakan kebutuhan sebenarnya atau pilih satu jangkar laptop untuk keduanya.

### 11\. Persiapan acara dan seminar

  

|  |  |
| :-: | :-: |
| \*\*Pilihan\*\* | \*\*Nama kegiatan\*\* |
| Set 1 — empat opsi alternatif | Presentasi Rencana Acara; Pemeriksaan Susunan Acara; Tinjauan bersama Ketua Panitia; Rapat Kesiapan Acara |
| Set 2 — empat opsi alternatif | Pelatihan Petugas Registrasi; Pengarahan Tata Tertib Acara; Pelatihan Pemandu Acara; Pelatihan Perangkat Presentasi |
| Set 3 — empat opsi alternatif | Pembaruan Daftar Peserta; Diskusi Teknis Acara; Penyusunan Materi Tayangan; Wawancara Calon Pembicara |
| Jadwal tetap — pilih seperlunya | Pengarahan Panitia Acara; Koordinasi dengan Pengelola Tempat; Pengambilan Laptop Acara; Rapat Koordinasi Pembicara; Konsultasi Kebutuhan Panggung; Istirahat Panitia Acara |

Untuk pola sumber daya, dua tugas digital dapat menunggu laptop. Hindari menambahkan perpindahan tempat atau lama perjalanan; seluruhnya tetap penjadwalan satu orang pada satu papan.

### 12\. Produksi konten dan publikasi

  

|  |  |
| :-: | :-: |
| \*\*Pilihan\*\* | \*\*Nama kegiatan\*\* |
| Set 1 — empat opsi alternatif | Presentasi Konsep Konten; Pemeriksaan Naskah; Tinjauan bersama Editor; Rapat Persiapan Publikasi |
| Set 2 — empat opsi alternatif | Pelatihan Gaya Penulisan; Pengarahan Etika Publikasi; Pelatihan Penyuntingan; Pelatihan Sistem Penerbitan |
| Set 3 — empat opsi alternatif | Penyuntingan Video; Diskusi Sudut Cerita; Penyusunan Tata Letak; Wawancara Narasumber Konten |
| Jadwal tetap — pilih seperlunya | Pengarahan Tim Konten; Koordinasi dengan Redaktur; Pengambilan Laptop Penyuntingan; Rapat Kalender Publikasi; Konsultasi Materi Visual; Istirahat Tim Publikasi |

Penyuntingan Video dan Penyusunan Tata Letak dapat menunggu laptop. Wawancara dan diskusi dapat dilakukan tatap muka. Dalam pola berantai, tetapkan persetujuan sebelum pengiriman jika keduanya menjadi prasyarat yang disebutkan.

## Cara menjaga variasi pada banyak soal

Rotasikan konteks dan set kegiatan, lalu variasikan penempatan celah, durasi, dan identitas kegiatan yang menjadi target atau terikat jadwal tetap. Hindari mengulang konteks dan set yang sama pada dua soal berturut-turut jika tersedia pilihan lain. Pengacakan urutan opsi diperbolehkan hanya bila aturan pola tetap dipenuhi; warna selalu mengikuti posisi opsi pertama sampai keempat dan identitasnya tetap sama setelah ditempatkan.

Untuk pola 60% terverifikasi, pertahankan mekanisme dan komposisi durasi yang ditetapkan pada sumber. Untuk pola 40% pengembangan, pilih satu mekanisme pengembangan utama dan ketentuan pendukung yang diperlukan. Mengganti konteks tidak mengubah porsi 60/40. Setiap perubahan jam, durasi, jadwal tetap, atau hubungan wajib diikuti pemeriksaan ulang bahwa empat kegiatan memiliki satu susunan akhir yang sah atau satu susunan optimal tunggal.

7\. Aturan interaksi dan kotak abu-abu

Empat opsi dipindahkan dengan seret dan lepas. Pratinjau penempatan menampilkan seluruh panjang kegiatan: satu kotak untuk 30 menit, dua kotak untuk 60 menit, dan tiga kotak untuk 90 menit. Semua awal dan akhir kegiatan harus tepat pada batas kotak. Kegiatan tidak boleh dipecah, saling menumpuk, menimpa jadwal tetap, atau melewati pukul 18.00.

Kotak abu-abu berisi kegiatan tetap yang sudah terjadwal. Nama dan rentang waktu kegiatan dapat dibaca saat diarahkan penunjuk; jangan memberi area abu-abu tanpa identitas kegiatan. Jika satu kegiatan tetap berdurasi satu jam, dua kotaknya adalah satu kegiatan utuh. Jika dua kegiatan berbeda saling berdampingan, identitas dan batas keduanya tetap harus jelas. Deretan tiga kotak abu-abu tidak otomatis berarti satu kegiatan 90 menit.

Kegiatan yang telah ditempatkan dapat dipindahkan lagi sebagai satu blok dengan durasi tetap. Jika kegiatan 60 menit dipindahkan 30 menit, kedua kotaknya bergeser bersama. Posisi lama harus kembali kosong; satu opsi tidak boleh muncul dua kali. Gunakan tombol atur ulang untuk mengembalikan susunan awal. Bedakan aturan ini dari Timeline Scheduling: dalam Timeslot ini empat opsi berwarna yang dijadwalkan, sedangkan jadwal tetap menjadi pembatas.

8\. Kunci tunggal dan konsistensi logika

Kunci harus memuat waktu mulai dan waktu selesai keempat kegiatan. Sebelum soal diterbitkan, periksa seluruh kemungkinan penempatan pada batas setengah jam, bukan hanya susunan yang semula dirancang penulis. Sisihkan susunan yang melanggar durasi, kegiatan tetap, urutan, tenggat, atau sumber daya; lalu terapkan sasaran sedini mungkin jika dinyatakan.

Soal layak terbit hanya jika tepat satu susunan lengkap memenuhi semua syarat dan sasaran. Tidak ada susunan berarti soal mustahil. Lebih dari satu susunan akhir berarti soal ambigu untuk kebutuhan bank ini, meskipun waktu targetnya sama. Perbaiki celah waktu, durasi, atau ketentuan yang terlihat oleh peserta, kemudian uji kembali. Jangan memakai urutan opsi, warna, atau preferensi tersembunyi sebagai pemecah seri.

“Sedini mungkin” untuk satu target hanya mengoptimalkan target tersebut; tidak otomatis menentukan posisi tiga kegiatan lain. “Semua tugas sedini mungkin” juga tidak boleh diam-diam ditafsirkan sebagai mendahulukan opsi pertama. Pilih tata letak dan ketentuan yang menghasilkan susunan optimal tunggal. Jika prioritas tambahan diperlukan, sebutkan secara jelas di soal dan tandai sebagai penegasan editorial dalam bank internal, bukan aturan tersembunyi SHL.

Pastikan kegiatan yang wajib setelah pengambilan laptop dimulai setelah pengambilan selesai, kegiatan yang wajib sebelum kegiatan lain selesai sebelum kegiatan berikutnya mulai, semua pelatihan selesai pada atau sebelum tenggat, dan kegiatan terakhir memiliki waktu selesai paling akhir. Kapasitas total kotak bebas saja tidak cukup: setiap kegiatan juga harus memperoleh rangkaian kotak kosong yang utuh sesuai durasinya.

9\. Pembahasan dan kelayakan rilis

Pembahasan menjelaskan identitas kegiatan tetap yang relevan, celah yang tersedia, penempatan yang dipaksa oleh durasi atau hubungan langsung, lalu alasan susunan akhir memenuhi urutan dan sasaran optimasi. Untuk soal bertenggat, jelaskan mengapa kegiatan terakhir dan kegiatan panjang hanya dapat masuk pada celah tertentu. Untuk soal sumber daya, pisahkan kegiatan yang boleh dilakukan sebelum dan setelah sumber daya tersedia.

Tolak soal jika nama pada naskah berbeda dengan nama pada opsi atau keterangan, warna berubah saat dipindahkan, durasi tertulis berbeda dari panjang blok, jadwal abu-abu tidak terbaca identitasnya, ada syarat yang bertabrakan, tidak ada kunci, atau ada lebih dari satu susunan optimal. Blueprint ini sengaja tidak menetapkan nama variabel teknis, skema data, maupun struktur implementasi.

  