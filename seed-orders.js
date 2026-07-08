const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seedOrders() {
  // 1. Get User ID for agung@gmail.com
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error('Failed to list users', userError);
    return;
  }
  const agung = users.users.find(u => u.email === 'agung@gmail.com');
  if (!agung) {
    console.log('User agung@gmail.com not found. Create the user first via the app UI.');
    return;
  }

  const userId = agung.id;

  const { data: pakets, error: paketError } = await supabase.from('pakets').select('id').limit(3);
  if (paketError || !pakets || pakets.length < 3) {
      console.log('Not enough pakets found. Please run seed.js first.');
      return;
  }
  
  // 2. Insert Orders
  console.log('Inserting orders for', userId);
  const { data: orderData, error: orderError } = await supabase
    .from('pesanans')
    .insert([
      { user_id: userId, paket_id: pakets[0].id, berat: 2, total_bayar: 16000, status: 'Baru', status_bayar: 'Belum Lunas' },
      { user_id: userId, paket_id: pakets[1].id, berat: 3, total_bayar: 45000, status: 'Proses', status_bayar: 'Menunggu Verifikasi' },
      { user_id: userId, paket_id: pakets[2].id, berat: 1, total_bayar: 35000, status: 'Selesai', status_bayar: 'Lunas', tanggal_selesai: new Date() }
    ])
    .select();

  if (orderError) {
    console.error('Error inserting orders:', orderError);
  } else {
    console.log('Inserted Orders:', orderData.map(o => o.id));
    
    // 3. Insert Review for the completed order
    const fs = require('fs');
    const path = require('path');
    const reviewsPath = path.join(__dirname, 'data', 'reviews.json');
    if (!fs.existsSync(path.dirname(reviewsPath))) {
        fs.mkdirSync(path.dirname(reviewsPath), { recursive: true });
    }
    const review = {
        pesanan_id: orderData[2].id, // The 'Selesai' order
        user_id: userId,
        nama_pelanggan: agung.user_metadata?.full_name || 'Agung',
        rating: 5,
        ulasan: 'Pelayanan sangat memuaskan, baju rapi dan wangi!',
        created_at: new Date().toISOString()
    };
    fs.writeFileSync(reviewsPath, JSON.stringify([review], null, 2));
    console.log('Review seeded.');
  }
  
  console.log('Done!');
}

seedOrders();
