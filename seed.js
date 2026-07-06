const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const pakets = [
  {
    nama_paket: 'Cuci Kiloan Reguler',
    harga: 8000,
    estimasi: '2 Hari',
    deskripsi: 'Layanan cuci dan setrika pakaian harian dengan perhitungan per kilogram. Cocok untuk pakaian sehari-hari keluarga Anda.',
    foto_url: null
  },
  {
    nama_paket: 'Cuci Kiloan Express',
    harga: 15000,
    estimasi: '1 Hari',
    deskripsi: 'Cucian bersih, rapi, dan wangi dalam waktu 24 jam. Pilihan tepat untuk Anda yang sibuk.',
    foto_url: null
  },
  {
    nama_paket: 'Cuci Satuan Jas / Gaun',
    harga: 35000,
    estimasi: '3 Hari',
    deskripsi: 'Penanganan khusus untuk pakaian formal Anda. Dicuci satuan dengan teknik dry-cleaning profesional tanpa merusak serat kain.',
    foto_url: null
  },
  {
    nama_paket: 'Cuci Sepatu Premium',
    harga: 40000,
    estimasi: '2 Hari',
    deskripsi: 'Perawatan deep-cleaning untuk sepatu kesayangan Anda. Membersihkan noda membandel secara maksimal dari luar hingga dalam.',
    foto_url: null
  },
  {
    nama_paket: 'Cuci Bedcover / Selimut',
    harga: 30000,
    estimasi: '2 Hari',
    deskripsi: 'Pencucian higienis untuk perlengkapan tidur tebal. Efektif menghilangkan debu, noda, dan tungau untuk tidur yang lebih lelap.',
    foto_url: null
  }
];

async function seed() {
  console.log('1. Menghapus data lama (jika ada)...');
  await supabase.from('pakets').delete().neq('id', 0); // Delete all

  console.log('2. Menyisipkan paket ke Supabase...');
  const { data: paketData, error: paketError } = await supabase
    .from('pakets')
    .insert(pakets)
    .select();
  
  if (paketError) {
    console.error('Gagal menyisipkan paket:', paketError);
  } else {
    console.log('Berhasil menambahkan paket:', paketData.length);
  }

  console.log('3. Membuat Akun Admin...');
  const { error: adminError } = await supabase.auth.admin.createUser({
    email: 'admin@laundry.com',
    password: 'admin123',
    email_confirm: true,
    user_metadata: {
      full_name: 'Administrator',
      role: 'admin'
    }
  });

  if (adminError) {
    if (adminError.message.includes('already exists') || adminError.status === 422) {
      console.log('Akun Admin (admin@laundry.com) sudah tersedia.');
    } else {
      console.error('Gagal membuat akun admin:', adminError.message);
    }
  } else {
    console.log('Berhasil membuat akun Admin!');
    console.log('Email: admin@laundry.com');
    console.log('Password: admin123');
  }
}

seed();
