const fs = require('fs').promises;
const path = require('path');

const REVIEWS_FILE = path.join(__dirname, '../../data/reviews.json');

// Ensure directory and file exist
async function init() {
  const dir = path.dirname(REVIEWS_FILE);
  try {
    await fs.mkdir(dir, { recursive: true });
    try {
      await fs.access(REVIEWS_FILE);
    } catch {
      await fs.writeFile(REVIEWS_FILE, JSON.stringify([]));
    }
  } catch (err) {
    console.error('Error initializing reviews file:', err);
  }
}

init();

async function getReviews() {
  try {
    const data = await fs.readFile(REVIEWS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

async function addReview(pesananId, userId, rating, ulasan, namaPelanggan) {
  const reviews = await getReviews();
  
  // Check if review already exists for this pesanan
  const existingIndex = reviews.findIndex(r => r.pesanan_id === pesananId);
  
  const review = {
    pesanan_id: pesananId,
    user_id: userId,
    nama_pelanggan: namaPelanggan,
    rating,
    ulasan,
    created_at: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    reviews[existingIndex] = { ...reviews[existingIndex], rating, ulasan, created_at: review.created_at };
  } else {
    reviews.push(review);
  }

  await fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
  return review;
}

module.exports = { getReviews, addReview };
