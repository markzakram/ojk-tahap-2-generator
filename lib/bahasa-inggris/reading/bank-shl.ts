import type { BacaanBank } from './model';

// Bank RC-SHL: bacaan pendek satu paragraf (±100 kata) dengan satu atau dua pertanyaan detail/hubungan dan empat opsi
// berupa frasa pendek tanpa titik, mengikuti gaya latihan Reading Comprehension SHL (folder "Gambaran Tes OJK SHL").
// Semua bacaan ditulis baru. opsi[0] = kunci.

export const BANK_SHL: BacaanBank[] = [
  {
    id: 'istirahat-layar', judul: 'Screen Breaks', konteks: 'kesehatan kerja',
    paragraf: [
      `Office workers who spend long hours in front of a screen often complain of tired eyes, headaches and blurred vision. These symptoms are usually temporary and are caused by focusing at the same distance for too long, not by permanent damage to the eyes. The company's health team recommends a simple routine: every twenty minutes, look at something about six metres away for twenty seconds. Staff who would like a larger screen or a monitor stand must first ask a trained colleague to check their workstation. Workers whose symptoms continue despite these changes should first tell their line manager, who can arrange a free eye test through the company.`,
    ],
    soal: [
      {
        id: 'lanjut', tipe: 'detail', tingkat: 'dasar', tanya: 'According to the passage, what should workers do first if their symptoms continue?',
        opsi: [
          { t: 'Report it to their line manager', j: 'didukung', b: ['should first tell their line manager'], f: [['Report it to their line manager', 'tell their line manager']],
            a: 'Langkah pertama yang disebut adalah memberi tahu atasan langsung; atasan itulah yang dapat mengatur pemeriksaan mata gratis melalui perusahaan.' },
          { t: 'Book an eye test by themselves', j: 'detail-salah', b: ['who can arrange a free eye test through the company'],
            a: 'Jawaban ini terdengar masuk akal, tetapi pemeriksaan mata diatur oleh atasan melalui perusahaan setelah pekerja melapor, bukan dipesan sendiri lebih dulu.' },
          { t: 'Stop using screens for a week', j: 'tidak-disebut', a: 'Berhenti memakai layar tidak disarankan.' },
          { t: 'Buy special glasses for screen work', j: 'tidak-disebut', a: 'Kacamata khusus tidak disebut.' },
        ],
      },
      {
        id: 'layar-besar', tipe: 'detail', tingkat: 'menengah', tanya: 'What must staff do before they can get a larger screen?',
        opsi: [
          { t: 'Have a trained colleague check their desk setup', j: 'didukung', b: ['must first ask a trained colleague to check their workstation'],
            f: [['trained colleague', 'trained colleague'], ['check their desk setup', 'check their workstation']],
            a: 'Staf yang menginginkan layar lebih besar atau penyangga monitor harus lebih dulu meminta rekan terlatih memeriksa meja kerjanya.' },
          { t: 'Get a letter from an eye specialist', j: 'tidak-disebut', a: 'Jawaban ini terdengar masuk akal, tetapi surat dari dokter mata tidak disebut sebagai syarat.' },
          { t: 'Ask the IT team to order one for them', j: 'tidak-disebut',
            a: 'Jawaban ini terdengar seperti prosedur kantor yang lazim, tetapi tim TI tidak disebut; syaratnya pemeriksaan meja kerja oleh rekan terlatih.' },
          { t: 'Show that their symptoms have lasted a month', j: 'tidak-disebut', a: 'Lama keluhan tidak disebut sebagai syarat mendapatkan layar yang lebih besar.' },
        ],
      },
    ],
  },
  {
    id: 'air-hujan', judul: 'Rainwater Tanks', konteks: 'lingkungan & energi',
    paragraf: [
      `In many dry regions, households collect rainwater from their roofs and store it in tanks. The water is suitable for watering gardens, washing cars and flushing toilets, which together account for a large part of domestic water use. Before storing it, however, households are advised to let the first rainwater of each storm run off, because this water carries most of the dust and leaves from the roof. Several local councils now offer a discount of up to forty percent on tanks, but only on models that hold at least two thousand litres.`,
    ],
    soal: [
      {
        id: 'aliran-awal', tipe: 'detail', tingkat: 'dasar', tanya: 'What are households advised to do with the first rainwater of each storm?',
        opsi: [
          { t: 'Let it drain away without storing it', j: 'didukung', b: ['let the first rainwater of each storm run off'], f: [['drain away', 'run off'], ['without storing it', 'Before storing it']],
            a: 'Air hujan pertama dari setiap hujan badai dianjurkan dibiarkan mengalir pergi sebelum air berikutnya disimpan, karena membawa sebagian besar debu dan daun dari atap.' },
          { t: 'Store it separately for the garden', j: 'tidak-disebut', a: 'Jawaban ini terdengar hemat, tetapi bacaan tidak menyarankan air pertama disimpan terpisah.' },
          { t: 'Pass it through a filter into the tank', j: 'tidak-disebut', a: 'Jawaban ini sesuai anggapan umum, tetapi saringan tidak disebut; air pertama dibiarkan mengalir pergi, tidak masuk tangki.' },
          { t: 'Pour it straight into the toilets', j: 'detail-salah', b: ['flushing toilets'], a: 'Menyiram toilet disebut sebagai salah satu kegunaan air yang disimpan, bukan perlakuan untuk air hujan pertama.' },
        ],
      },
      {
        id: 'diskon', tipe: 'detail', tingkat: 'menengah', tanya: 'Which tanks can receive the council discount?',
        opsi: [
          { t: 'Ones of two thousand litres or more', j: 'didukung', b: ['only on models that hold at least two thousand litres'], f: [['two thousand litres or more', 'at least two thousand litres']],
            a: 'Potongan harga hanya berlaku untuk tangki yang menampung sedikitnya dua ribu liter.' },
          { t: 'Ones fitted with a water filter', j: 'tidak-disebut', a: 'Jawaban ini terdengar masuk akal, tetapi saringan air tidak disebut sebagai syarat.' },
          { t: 'Ones installed by an approved plumber', j: 'tidak-disebut', a: 'Pemasangan oleh tukang resmi tidak disebut.' },
          { t: 'Ones that cost forty percent less', j: 'detail-salah', b: ['offer a discount of up to forty percent on tanks'], a: 'Empat puluh persen adalah besar potongan maksimum, bukan syarat tangki yang berhak mendapatkannya.' },
        ],
      },
    ],
  },
  {
    id: 'dua-langkah', judul: 'Two-Step Verification', konteks: 'teknologi',
    paragraf: [
      `Passwords alone offer limited protection, because they can be guessed, stolen or reused across several websites. Two-step verification adds a second check: after entering a password, the user must also type a short code from their phone. On a device that the user marks as trusted, the code is requested only once every thirty days rather than at each sign-in. When setting up the service, users also receive ten backup codes, which are shown on the screen just once. Each code works a single time, so users are told to write the list down before closing the page.`,
    ],
    soal: [
      {
        id: 'cadangan', tipe: 'detail', tingkat: 'dasar', tanya: 'According to the passage, what should users do with their backup codes?',
        opsi: [
          { t: 'Copy them down before leaving the page', j: 'didukung', b: ['so users are told to write the list down before closing the page'],
            f: [['Copy them down', 'write the list down'], ['before leaving the page', 'before closing the page']],
            a: 'Kode cadangan hanya ditampilkan sekali, sehingga pengguna diminta mencatat daftarnya sebelum menutup halaman.' },
          { t: 'Print them and keep them away from the phone', j: 'tidak-disebut',
            a: 'Jawaban ini sesuai saran keamanan yang umum, tetapi bacaan tidak menyebut mencetak kode atau menyimpannya jauh dari telepon; yang disebut adalah mencatat daftar sebelum menutup halaman.' },
          { t: 'Save them in a note on their phone', j: 'tidak-disebut', a: 'Menyimpan kode di catatan telepon tidak disebut.' },
          { t: 'Use one of them at every sign-in', j: 'salah-tafsir', b: ['Each code works a single time'],
            a: 'Setiap kode cadangan hanya berlaku sekali, dan pada perangkat tepercaya kode diminta sekali setiap tiga puluh hari; kode cadangan tidak dipakai setiap kali masuk.' },
        ],
      },
      {
        id: 'perangkat', tipe: 'detail', tingkat: 'dasar', tanya: 'How often is the code requested on a trusted device?',
        opsi: [
          { t: 'Once every thirty days', j: 'didukung', b: ['the code is requested only once every thirty days'], f: [['Once every thirty days', 'once every thirty days']],
            a: 'Pada perangkat yang ditandai tepercaya, kode hanya diminta sekali setiap tiga puluh hari, bukan setiap kali masuk.' },
          { t: 'Every thirty seconds', j: 'tidak-disebut', a: 'Jawaban ini mungkin dikenal dari aplikasi kode, tetapi bacaan menyebut tiga puluh hari, bukan tiga puluh detik.' },
          { t: 'At each sign-in', j: 'bertentangan', b: ['rather than at each sign-in'], a: 'Bacaan menyatakan kode pada perangkat tepercaya diminta sekali setiap tiga puluh hari, bukan setiap kali masuk.' },
          { t: 'Once at the start of each week', j: 'tidak-disebut', a: 'Jangka mingguan tidak disebut.' },
        ],
      },
    ],
  },
  {
    id: 'kompos', judul: 'Community Composting', konteks: 'kegiatan masyarakat',
    paragraf: [
      `Residents who join the town's composting scheme first attend a short workshop, where they learn which kitchen scraps can be composted and which cannot. They are then given a sealed bin for food waste, which they empty into one of the shared compost containers at the local park. Volunteers turn the compost every week to let air in, and after about three months it is ready to use. The finished compost is offered free to participants, and any surplus is given to school gardens. Meat and dairy products are not accepted, as they attract pests.`,
    ],
    soal: [
      {
        id: 'langkah-awal', tipe: 'hubungan', tingkat: 'menengah', tanya: 'What is the first step for residents who join the scheme?',
        opsi: [
          { t: 'Attending a short training session', j: 'didukung', b: ['first attend a short workshop'], f: [['short training session', 'short workshop']],
            a: 'Kata first menandai langkah pertama: mengikuti lokakarya singkat.' },
          { t: 'Collecting a sealed bin for food waste', j: 'detail-salah', b: ['They are then given a sealed bin for food waste'], a: 'Penerimaan tempat sampah tertutup adalah langkah berikutnya (then), bukan langkah pertama.' },
          { t: 'Turning the compost every week', j: 'salah-tafsir', b: ['Volunteers turn the compost every week'], a: 'Membalik kompos adalah tugas relawan, bukan langkah awal warga yang baru bergabung.' },
          { t: 'Paying a small fee to the park', j: 'tidak-disebut', a: 'Biaya pendaftaran tidak disebut.' },
        ],
      },
      {
        id: 'surplus', tipe: 'detail', tingkat: 'dasar', tanya: 'What happens to finished compost that participants do not take?',
        opsi: [
          { t: 'It is passed on to school gardens', j: 'didukung', b: ['any surplus is given to school gardens'], f: [['passed on to school gardens', 'given to school gardens']],
            a: 'Kompos jadi ditawarkan gratis kepada peserta, dan kelebihannya diberikan kepada kebun sekolah.' },
          { t: 'It is sold to local farms', j: 'tidak-disebut', a: 'Penjualan kompos ke peternakan atau pertanian tidak disebut.' },
          { t: "It is spread on the park's flower beds", j: 'tidak-disebut', a: 'Jawaban ini terdengar masuk akal karena wadahnya ada di taman, tetapi bacaan tidak menyebut kompos dipakai untuk taman.' },
          { t: 'It is put back into the shared containers', j: 'detail-salah', b: ['shared compost containers at the local park'], a: 'Wadah bersama adalah tempat warga membuang sisa makanan, bukan tempat kompos jadi dikembalikan.' },
        ],
      },
    ],
  },
  {
    id: 'denda-perpustakaan', judul: 'Ending Library Fines', konteks: 'kebijakan publik',
    paragraf: [
      `Several city libraries have stopped charging fines for overdue books. Library managers had noticed that fines discouraged many readers, particularly children and low-income families, from returning to the library after they had fallen behind. The fines also raised far less money than expected once staff time spent collecting them was taken into account. Since the change, some libraries have reported that more long-overdue books have been returned, and the number of active members has risen. Borrowers who lose a book must still pay for a replacement.`,
    ],
    soal: [
      {
        id: 'alasan', tipe: 'hubungan', tingkat: 'menengah', tanya: 'According to the passage, why did libraries stop charging fines?',
        opsi: [
          { t: 'Fines made many readers stay away', j: 'didukung', b: ['fines discouraged many readers'], f: [['made many readers stay away', 'discouraged many readers']],
            a: 'Pengelola memperhatikan bahwa denda membuat banyak pembaca enggan kembali ke perpustakaan.' },
          { t: 'A new law banned fines in libraries', j: 'tidak-disebut', a: 'Undang-undang baru tidak disebut; keputusan itu diambil pengelola perpustakaan sendiri.' },
          { t: 'Children were losing too many books', j: 'detail-salah', b: ['particularly children and low-income families'], a: 'Anak-anak disebut sebagai kelompok yang enggan kembali, bukan yang menghilangkan buku.' },
          { t: 'Staff wanted to collect fines online', j: 'tidak-disebut', a: 'Penagihan denda secara daring tidak disebut.' },
        ],
      },
      {
        id: 'tetap-bayar', tipe: 'detail', tingkat: 'dasar', tanya: 'Which of these is still charged to borrowers?',
        opsi: [
          { t: 'The cost of replacing a lost book', j: 'didukung', b: ['Borrowers who lose a book must still pay for a replacement'], f: [['cost of replacing a lost book', 'pay for a replacement']],
            a: 'Peminjam yang menghilangkan buku tetap harus membayar penggantinya.' },
          { t: 'A fee for reserving a book', j: 'tidak-disebut', a: 'Biaya memesan buku tidak disebut.' },
          { t: 'A yearly membership fee', j: 'tidak-disebut', a: 'Iuran keanggotaan tidak disebut.' },
          { t: 'A charge for using the library computers', j: 'tidak-disebut', a: 'Biaya pemakaian komputer tidak disebut.' },
        ],
      },
    ],
  },
  {
    id: 'daur-baterai', judul: 'Recycling Batteries', konteks: 'lingkungan & energi',
    paragraf: [
      `Used batteries should not be thrown away with ordinary household rubbish. When they are crushed in collection vehicles or buried in landfill sites, damaged batteries can leak harmful substances into the soil and, in some cases, start fires. Many supermarkets and electronics shops now provide collection boxes where customers can drop off small batteries free of charge. When a box is full, the shop calls a licensed carrier, who takes the batteries to a sorting centre before the metals inside are recovered. Larger batteries, such as those from laptops or power tools, are not accepted in these boxes and must be taken to a council recycling centre.`,
    ],
    soal: [
      {
        id: 'kotak-penuh', tipe: 'hubungan', tingkat: 'dasar', tanya: "What happens when a shop's collection box is full?",
        opsi: [
          { t: 'The shop calls in a licensed carrier', j: 'didukung', b: ['the shop calls a licensed carrier'], f: [['calls in a licensed carrier', 'calls a licensed carrier']],
            a: 'When a box is full menandai keadaannya: toko memanggil pengangkut berizin yang membawa baterai ke pusat pemilahan.' },
          { t: 'Shop staff sort the batteries by type', j: 'detail-salah', b: ['takes the batteries to a sorting centre'],
            a: 'Pemilahan dilakukan di pusat pemilahan setelah baterai diangkut, bukan oleh staf toko.' },
          { t: 'The box is sealed and posted to the maker', j: 'tidak-disebut',
            a: 'Jawaban ini terdengar masuk akal, tetapi pengiriman ke produsen tidak disebut; toko memanggil pengangkut berizin.' },
          { t: 'Customers are asked to use another shop', j: 'tidak-disebut', a: 'Jawaban ini terdengar masuk akal, tetapi tidak disebut; toko memanggil pengangkut berizin.' },
        ],
      },
      {
        id: 'baterai-besar', tipe: 'detail', tingkat: 'dasar', tanya: 'Where should laptop batteries be taken?',
        opsi: [
          { t: "To the council's recycling site", j: 'didukung', b: ['must be taken to a council recycling centre'], f: [["council's recycling site", 'council recycling centre']],
            a: 'Baterai besar, seperti baterai laptop dan perkakas listrik, tidak diterima di kotak toko dan harus dibawa ke pusat daur ulang milik pemerintah daerah.' },
          { t: 'To a collection box in a shop', j: 'bertentangan', b: ['are not accepted in these boxes'], a: 'Baterai besar justru tidak diterima di kotak pengumpulan toko.' },
          { t: 'Back to the shop that sold the laptop', j: 'tidak-disebut', a: 'Jawaban ini terdengar masuk akal, tetapi pengembalian ke toko penjual tidak disebut.' },
          { t: 'Straight to a sorting centre', j: 'detail-salah', b: ['takes the batteries to a sorting centre'],
            a: 'Pusat pemilahan adalah tujuan baterai kecil yang dibawa pengangkut berizin dari toko, bukan tempat pengguna membawa baterai laptop.' },
        ],
      },
    ],
  },
  {
    id: 'agenda-rapat', judul: 'A Clear Agenda', konteks: 'kantor & organisasi',
    paragraf: [
      `A clear agenda is one of the simplest ways to make meetings shorter and more useful. It should be sent to participants at least two working days in advance, so that they can prepare questions and bring any documents that will be discussed. Each item on the agenda should state the decision that needs to be made and the person responsible for leading the discussion. Experienced chairs also deal with any item that requires a vote before the first break, when the largest number of members is present. At the end of the meeting, a brief summary of the decisions should be shared with everyone who attended.`,
    ],
    soal: [
      {
        id: 'isi-butir', tipe: 'detail', tingkat: 'dasar', tanya: 'According to the passage, what should each agenda item state?',
        opsi: [
          { t: 'The decision needed and its leader', j: 'didukung', b: ['should state the decision that needs to be made and the person responsible'],
            f: [['The decision needed', 'the decision that needs to be made'], ['its leader', 'the person responsible for leading the discussion']],
            a: 'Setiap butir agenda harus menyebut keputusan yang perlu diambil dan orang yang memimpin pembahasannya.' },
          { t: 'How many minutes it will take', j: 'tidak-disebut', a: 'Jawaban ini lazim dalam agenda, tetapi lama pembahasan tidak disebut dalam bacaan.' },
          { t: 'Which documents people should bring', j: 'detail-salah', b: ['bring any documents that will be discussed'], a: 'Dokumen disebut sebagai alasan agenda dikirim lebih awal, bukan isi wajib setiap butir agenda.' },
          { t: 'Who first suggested the topic', j: 'tidak-disebut', a: 'Pengusul topik tidak disebut.' },
        ],
      },
      {
        id: 'sebelum-jeda', tipe: 'hubungan', tingkat: 'menengah', tanya: 'Why do experienced chairs deal with items that require a vote before the first break?',
        opsi: [
          { t: 'Most members are present at that time', j: 'didukung', b: ['when the largest number of members is present'], f: [['Most members are present', 'the largest number of members is present']],
            a: 'When di akhir kalimat menyebut alasannya: sebelum jeda pertama, jumlah anggota yang hadir paling banyak.' },
          { t: 'People are less tired early in a meeting', j: 'tidak-disebut', a: 'Jawaban ini sesuai anggapan umum, tetapi bacaan tidak menyebut rasa lelah; alasannya jumlah anggota yang hadir.' },
          { t: 'Votes take longer than other items', j: 'tidak-disebut', a: 'Lama pemungutan suara tidak disebut.' },
          { t: 'The summary must include every vote', j: 'detail-salah', b: ['a brief summary of the decisions should be shared'], a: 'Ringkasan disebut dibagikan di akhir rapat, tetapi tidak dikaitkan dengan waktu pemungutan suara.' },
        ],
      },
    ],
  },
  {
    id: 'pengingat-vaksin', judul: 'Vaccination Reminders', konteks: 'kesehatan masyarakat',
    paragraf: [
      `Many parents intend to take their children for routine vaccinations but miss appointments because of busy schedules. To address this, a regional health service began sending text message reminders three days before each appointment. Over the following year, the proportion of children vaccinated on time rose by eight percentage points, at a cost of only a few cents per message. Messages that included the child's name and the clinic's opening hours worked better than general reminders. The service now plans to add a second reminder on the morning of the appointment.`,
    ],
    soal: [
      {
        id: 'efektif', tipe: 'detail', tingkat: 'dasar', tanya: 'Which reminders were the most effective?',
        opsi: [
          { t: 'Ones naming the child and giving clinic hours', j: 'didukung', b: ["included the child's name and the clinic's opening hours"], f: [['naming the child', "included the child's name"], ['clinic hours', "the clinic's opening hours"]],
            a: 'Pesan yang mencantumkan nama anak dan jam buka klinik bekerja lebih baik daripada pengingat umum.' },
          { t: 'Ones that were sent to parents by email', j: 'tidak-disebut', a: 'Pengingat dikirim lewat pesan teks; email tidak disebut.' },
          { t: 'Ones sent on the morning of the clinic visit', j: 'detail-salah', b: ['add a second reminder on the morning of the appointment'], a: 'Pengingat pagi hari baru direncanakan, belum diuji hasilnya.' },
          { t: 'General messages sent to all parents', j: 'bertentangan', b: ['worked better than general reminders'], a: 'Pengingat umum justru kurang efektif.' },
        ],
      },
      {
        id: 'tiga-hari', tipe: 'detail', tingkat: 'dasar', tanya: 'When were the text message reminders sent?',
        opsi: [
          { t: 'Three days before the visit', j: 'didukung', b: ['began sending text message reminders three days before each appointment'],
            f: [['Three days before the visit', 'three days before each appointment']],
            a: 'Layanan kesehatan mengirim pengingat lewat pesan teks tiga hari sebelum setiap jadwal vaksinasi.' },
          { t: 'On the morning of the visit', j: 'detail-salah', b: ['add a second reminder on the morning of the appointment'],
            a: 'Pengingat pada pagi hari baru direncanakan sebagai pengingat kedua; yang sudah berjalan dikirim tiga hari sebelumnya.' },
          { t: 'A week before each visit', j: 'tidak-disebut', a: 'Satu minggu sebelumnya tidak disebut.' },
          { t: 'The day after a missed appointment', j: 'tidak-disebut', a: 'Pengingat setelah jadwal terlewat tidak disebut; pengingat dikirim sebelum jadwal.' },
        ],
      },
    ],
  },
  {
    id: 'sepeda-kota', judul: 'City Bike Sharing', konteks: 'kebijakan publik',
    paragraf: [
      `The city's bike-sharing scheme allows residents to rent a bicycle from one of two hundred docking stations and return it to another station when they have finished. Users first register through a mobile app, which also shows where bikes are available. The first thirty minutes of each journey are free, after which a small charge is added for every extra quarter of an hour. To keep bikes evenly spread, staff move them by van from full stations to empty ones each evening. Since electric bikes were added last spring, the number of journeys up steep hills has more than doubled.`,
    ],
    soal: [
      {
        id: 'daftar', tipe: 'hubungan', tingkat: 'dasar', tanya: 'What must users do before they can rent a bike?',
        opsi: [
          { t: "Sign up using the scheme's phone app", j: 'didukung', b: ['Users first register through a mobile app'], f: [['Sign up', 'register'], ["the scheme's phone app", 'a mobile app']],
            a: 'Kata first menandai langkah awal: pengguna mendaftar melalui aplikasi ponsel.' },
          { t: 'Pay for the first thirty minutes', j: 'bertentangan', b: ['The first thirty minutes of each journey are free'], a: 'Tiga puluh menit pertama justru gratis.' },
          { t: 'Choose the station where it will be left', j: 'tidak-disebut', a: 'Bacaan tidak menyebut pengguna harus memilih stasiun pengembalian lebih dulu.' },
          { t: 'Collect a bike from the staff van', j: 'detail-salah', b: ['staff move them by van from full stations to empty ones'], a: 'Mobil van dipakai staf untuk memindahkan sepeda antarstasiun, bukan tempat pengguna mengambil sepeda.' },
        ],
      },
      {
        id: 'pindah', tipe: 'hubungan', tingkat: 'menengah', tanya: 'Why do staff move bikes between stations each evening?',
        opsi: [
          { t: 'To keep some stations from running out of bikes', j: 'didukung', b: ['To keep bikes evenly spread, staff move them by van'], f: [['keep some stations from running out of bikes', 'keep bikes evenly spread']],
            a: 'To keep bikes evenly spread menyatakan tujuannya: sepeda dipindahkan dari stasiun yang penuh ke stasiun yang kosong agar sebarannya merata.' },
          { t: 'To repair bikes that have been reported as damaged', j: 'tidak-disebut', a: 'Perbaikan sepeda tidak disebut.' },
          { t: 'To charge the batteries of the electric bikes', j: 'tidak-disebut', a: 'Pengisian baterai sepeda listrik tidak disebut.' },
          { t: 'To take bikes off the streets overnight', j: 'tidak-disebut', a: 'Sepeda dipindahkan antarstasiun, bukan disimpan dari jalan semalaman.' },
        ],
      },
    ],
  },
  {
    id: 'latihan-kebakaran', judul: 'Fire Drills', konteks: 'kantor & organisasi',
    paragraf: [
      `All staff in the building take part in a fire drill twice a year. When the alarm sounds, employees should stop work immediately, leave their belongings behind and walk to the nearest marked exit. The lifts are switched off automatically and return to the ground floor, so everyone must use the stairs. Each floor has a trained fire warden, who checks the toilets and meeting rooms and then collects the visitors' sign-in sheet from reception. At the assembly point in the car park, wardens use this sheet and the day's attendance lists to count everyone. Nobody may return to the building until the fire service gives permission.`,
    ],
    soal: [
      {
        id: 'kembali', tipe: 'detail', tingkat: 'dasar', tanya: 'According to the passage, when may staff go back into the building?',
        opsi: [
          { t: 'Once the fire service allows it', j: 'didukung', b: ['until the fire service gives permission'], f: [['allows it', 'gives permission']],
            a: 'Tidak seorang pun boleh kembali ke gedung sampai dinas pemadam kebakaran memberi izin.' },
          { t: 'As soon as the alarm stops', j: 'tidak-disebut', a: 'Jawaban ini sesuai anggapan umum, tetapi bacaan tidak mengaitkan kembalinya staf dengan berhentinya alarm.' },
          { t: 'When the wardens have finished the count', j: 'detail-salah', b: ["wardens use this sheet and the day's attendance lists to count everyone"],
            a: 'Penghitungan oleh petugas memang dilakukan di titik kumpul, tetapi izin kembali datang dari dinas pemadam kebakaran, bukan dari selesainya penghitungan.' },
          { t: 'After about fifteen minutes outside', j: 'tidak-disebut', a: 'Batas waktu lima belas menit tidak disebut.' },
        ],
      },
      {
        id: 'petugas', tipe: 'hubungan', tingkat: 'menengah', tanya: 'What does each fire warden do after checking the toilets and meeting rooms?',
        opsi: [
          { t: 'Takes the guest list from reception', j: 'didukung', b: ["then collects the visitors' sign-in sheet from reception"], f: [['the guest list', "the visitors' sign-in sheet"], ['from reception', 'from reception']],
            a: 'And then menandai urutannya: setelah memeriksa toilet dan ruang rapat, petugas mengambil lembar daftar hadir tamu dari resepsionis.' },
          { t: 'Calls the fire service for help', j: 'detail-salah', b: ['until the fire service gives permission'],
            a: 'Jawaban ini terdengar masuk akal, tetapi dinas pemadam kebakaran hanya disebut sebagai pemberi izin kembali ke gedung.' },
          { t: 'Heads straight for the nearest marked exit', j: 'detail-salah', b: ['walk to the nearest marked exit'],
            a: 'Berjalan ke pintu keluar terdekat adalah langkah semua karyawan saat alarm berbunyi; petugas lebih dulu mengambil daftar tamu.' },
          { t: 'Turns off the alarm on that floor', j: 'tidak-disebut', a: 'Mematikan alarm tidak disebut.' },
        ],
      },
    ],
  },
  {
    id: 'retur-daring', judul: 'Online Returns', konteks: 'ekonomi umum',
    paragraf: [
      `Customers who buy clothes from the online shop may return items within thirty days of delivery. To start a return, they log in to their account and print a prepaid label, which is attached to the original parcel. Items must be unworn and still have their tags attached. Once the parcel arrives at the warehouse, staff inspect the contents, and a refund is paid to the original card within five working days. Customers who would like a different size can request an exchange instead, which is usually faster because no new payment is needed.`,
    ],
    soal: [
      {
        id: 'langkah', tipe: 'hubungan', tingkat: 'dasar', tanya: 'What is the first step in returning an item?',
        opsi: [
          { t: 'Logging in to the customer account', j: 'didukung', b: ['they log in to their account and print a prepaid label'], f: [['Logging in', 'log in'], ['customer account', 'their account']],
            a: 'To start a return menandai langkah awal: pelanggan masuk ke akunnya lebih dulu, baru mencetak label.' },
          { t: 'Printing out a prepaid label', j: 'salah-tafsir', b: ['they log in to their account and print a prepaid label'], a: 'Mencetak label adalah langkah kedua (and print), sesudah masuk ke akun.' },
          { t: 'Contacting the warehouse staff by phone', j: 'tidak-disebut', a: 'Menelepon staf gudang tidak disebut.' },
          { t: 'Removing the tags from the items', j: 'bertentangan', b: ['still have their tags attached'], a: 'Label harga justru harus tetap terpasang.' },
        ],
      },
      {
        id: 'tukar', tipe: 'detail', tingkat: 'menengah', tanya: 'Why is an exchange usually faster than a refund?',
        opsi: [
          { t: 'No second payment has to be made for it', j: 'didukung', b: ['because no new payment is needed'], f: [['No second payment has to be made', 'no new payment is needed']],
            a: 'Because menyebut alasannya: penukaran tidak memerlukan pembayaran baru.' },
          { t: 'The warehouse checks it more quickly', j: 'tidak-disebut', a: 'Bacaan tidak membandingkan kecepatan pemeriksaan di gudang.' },
          { t: 'Customers can keep the original item', j: 'tidak-disebut', a: 'Bacaan tidak menyebut barang asli boleh disimpan.' },
          { t: 'The new size is sent before the old one arrives', j: 'tidak-disebut', a: 'Urutan pengiriman ukuran baru tidak disebut; alasan yang disebut adalah tidak perlu pembayaran baru.' },
        ],
      },
    ],
  },
  {
    id: 'antrean-klinik', judul: 'Joining the Queue Online', konteks: 'kesehatan masyarakat',
    paragraf: [
      `Patients at the district health clinic can now join the queue online instead of waiting in the reception area. After choosing a time slot on the clinic's website, they receive a text message with a queue number. A second message is sent when their turn is about twenty minutes away, so they can wait at home or nearby. Patients without a mobile phone can still collect a paper ticket at the front desk. Since the system began, the average time spent in the waiting room has fallen from over an hour to about fifteen minutes.`,
    ],
    soal: [
      {
        id: 'pesan-kedua', tipe: 'detail', tingkat: 'dasar', tanya: 'When is the second text message sent?',
        opsi: [
          { t: "About twenty minutes before the patient's turn", j: 'didukung', b: ['A second message is sent when their turn is about twenty minutes away'], f: [['About twenty minutes before', 'about twenty minutes away'], ["the patient's turn", 'their turn']],
            a: 'Pesan kedua dikirim ketika giliran pasien tinggal sekitar dua puluh menit lagi.' },
          { t: 'As soon as the patient has chosen a time slot', j: 'detail-salah', b: ["After choosing a time slot on the clinic's website"], a: 'Setelah memilih jadwal, pasien menerima pesan pertama yang berisi nomor antrean, bukan pesan kedua.' },
          { t: 'When the patient arrives at the front desk', j: 'tidak-disebut', a: 'Bacaan tidak menyebut pesan dikirim saat pasien tiba di meja depan.' },
          { t: 'One hour before the clinic opens', j: 'tidak-disebut', a: 'Jam buka klinik tidak disebut.' },
        ],
      },
      {
        id: 'tanpa-ponsel', tipe: 'detail', tingkat: 'dasar', tanya: 'How can patients without a mobile phone join the queue?',
        opsi: [
          { t: 'By getting a printed ticket at the desk', j: 'didukung', b: ['can still collect a paper ticket at the front desk'], f: [['getting a printed ticket', 'collect a paper ticket'], ['at the desk', 'at the front desk']],
            a: 'Pasien tanpa ponsel tetap dapat mengambil tiket kertas di meja depan.' },
          { t: 'By asking a relative to join for them', j: 'tidak-disebut', a: 'Meminta kerabat mendaftarkan pasien tidak disebut.' },
          { t: 'By booking a slot on the website at home', j: 'detail-salah', b: ["After choosing a time slot on the clinic's website"], a: 'Memilih jadwal di situs web adalah cara bagi pasien yang memakai ponsel; pasien tanpa ponsel mengambil tiket kertas.' },
          { t: 'By arriving before the clinic opens', j: 'tidak-disebut', a: 'Datang sebelum klinik buka tidak disebut.' },
        ],
      },
    ],
  },
  {
    id: 'hemat-listrik', judul: 'Saving Power at Work', konteks: 'lingkungan & energi',
    paragraf: [
      `An office building in the city centre cut its electricity use by nearly a quarter in one year without buying new equipment. The building manager began by asking the evening cleaners to note which rooms still had lights, screens or heaters running. Their notes showed that the biggest waste came not from lights but from heaters left on in empty meeting rooms. Timers were then fitted to the heaters, and staff were asked to shut down their computers before going home. Meters installed on each floor a few months later confirmed that the savings were lasting.`,
    ],
    soal: [
      {
        id: 'langkah-awal', tipe: 'hubungan', tingkat: 'dasar', tanya: 'What did the building manager do first?',
        opsi: [
          { t: 'Asked the cleaners to record what was left on', j: 'didukung', b: ['began by asking the evening cleaners to note which rooms still had lights, screens or heaters running'],
            f: [['Asked the cleaners', 'asking the evening cleaners'], ['record what was left on', 'note which rooms still had lights, screens or heaters running']],
            a: 'Began by menandai langkah pertama: pengelola gedung meminta petugas kebersihan malam mencatat ruangan yang lampu, layar, atau pemanasnya masih menyala.' },
          { t: 'Installed meters on every floor of the building', j: 'salah-tafsir', b: ['Meters installed on each floor a few months later'],
            a: 'Jawaban ini sesuai anggapan umum (mengukur dulu), tetapi meteran baru dipasang beberapa bulan kemudian untuk memastikan penghematan bertahan.' },
          { t: 'Asked staff to shut down their computers', j: 'salah-tafsir', b: ['staff were asked to shut down their computers before going home'],
            a: 'Permintaan mematikan komputer datang sesudahnya (then), setelah catatan petugas kebersihan dibaca.' },
          { t: 'Bought new energy-saving equipment', j: 'bertentangan', b: ['without buying new equipment'], a: 'Penghematan dicapai tanpa membeli peralatan baru.' },
        ],
      },
      {
        id: 'pemboros', tipe: 'detail', tingkat: 'menengah', tanya: 'According to the passage, what caused the most waste?',
        opsi: [
          { t: 'Heaters on in unused meeting rooms', j: 'didukung', b: ['from heaters left on in empty meeting rooms'],
            f: [['Heaters on', 'heaters left on'], ['unused meeting rooms', 'empty meeting rooms']],
            a: 'Catatan petugas kebersihan menunjukkan pemborosan terbesar bukan dari lampu, melainkan dari pemanas yang menyala di ruang rapat kosong.' },
          { t: 'Lights left on in empty offices', j: 'bertentangan', b: ['the biggest waste came not from lights'],
            a: 'Jawaban ini sesuai anggapan umum, tetapi bacaan menegaskan pemborosan terbesar bukan dari lampu.' },
          { t: 'Computers left on at weekends', j: 'tidak-disebut', a: 'Akhir pekan tidak disebut; komputer hanya disebut dalam permintaan agar staf mematikannya sebelum pulang.' },
          { t: 'Lifts running when nobody used them', j: 'tidak-disebut', a: 'Lift tidak disebut.' },
        ],
      },
    ],
  },
];
