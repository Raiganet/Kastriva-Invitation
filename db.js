const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

let db;

function getDB() {
  if (!db) {
    db = new Database(process.env.DB_PATH || './database.sqlite');
    db.pragma('journal_mode = WAL');
  }
  return db;
}

function initDB() {
  const db = getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      price REAL DEFAULT 0,
      thumbnail TEXT,
      colors TEXT,
      features TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_code TEXT UNIQUE NOT NULL,
      template_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      event_type TEXT NOT NULL,
      groom_name TEXT,
      bride_name TEXT,
      event_date TEXT,
      event_location TEXT,
      custom_message TEXT,
      gallery_images TEXT,
      status TEXT DEFAULT 'pending',
      payment_proof TEXT,
      total_price REAL DEFAULT 0,
      invitation_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (template_id) REFERENCES templates(id)
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      guest_name TEXT NOT NULL,
      guest_phone TEXT,
      attendance TEXT DEFAULT 'pending',
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
  `);

  const adminExists = db.prepare('SELECT id FROM admins LIMIT 1').get();
  if (!adminExists) {
    const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
    db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run(
      process.env.ADMIN_USERNAME || 'admin', hash
    );
  }

  const templateCount = db.prepare('SELECT COUNT(*) as c FROM templates').get().c;
  if (templateCount === 0) {
    const templates = [
      { slug: 'elegant-rose', name: 'Elegant Rose', category: 'pernikahan', description: 'Tema pernikahan klasik dengan nuansa bunga mawar merah muda yang elegan dan romantis.', price: 150000, thumbnail: '🌹', colors: '#D4A5A5,#F5E6E8,#8B4513', features: '["Countdown Timer","RSVP Online","Gallery","Music","Love Story","Peta Lokasi"]' },
      { slug: 'modern-minimalist', name: 'Modern Minimalist', category: 'pernikahan', description: 'Desain clean dan modern dengan tipografi bold untuk pasangan yang menyukai kesederhanaan.', price: 150000, thumbnail: '✨', colors: '#2C3E50,#ECF0F1,#E74C3C', features: '["Countdown Timer","RSVP Online","Gallery","Music","Love Story","Peta Lokasi"]' },
      { slug: 'tropical-paradise', name: 'Tropical Paradise', category: 'pernikahan', description: 'Nuansa tropis dengan daun monstera dan warna-warna cerah untuk pernikahan outdoor.', price: 200000, thumbnail: '🌴', colors: '#2ECC71,#F39C12,#1ABC9C', features: '["Countdown Timer","RSVP Online","Gallery","Music","Love Story","Peta Lokasi","Amplop Digital"]' },
      { slug: 'rustic-wood', name: 'Rustic Wood', category: 'pernikahan', description: 'Tema rustic dengan elemen kayu dan bunga kering yang hangat dan natural.', price: 175000, thumbnail: '🪵', colors: '#8B6914,#DEB887,#556B2F', features: '["Countdown Timer","RSVP Online","Gallery","Music","Peta Lokasi"]' },
      { slug: 'galaxy-night', name: 'Galaxy Night', category: 'pernikahan', description: 'Tema malam berbintang dengan nuansa galaxy yang memukau dan dramatis.', price: 250000, thumbnail: '🌌', colors: '#0C0C2E,#6C3483,#F4D03F', features: '["Countdown Timer","RSVP Online","Gallery","Music","Love Story","Peta Lokasi","Amplop Digital","Fireworks Animation"]' },
      { slug: 'sweet-birthday', name: 'Sweet Birthday', category: 'ulang-tahun', description: 'Tema ulang tahun ceria dengan balon dan confetti untuk si kecil maupun dewasa.', price: 75000, thumbnail: '🎂', colors: '#FF6B6B,#4ECDC4,#FFE66D', features: '["Countdown Timer","RSVP Online","Gallery","Music","Wish Wall"]' },
      { slug: 'aqiqah-blessing', name: 'Aqiqah Blessing', category: 'aqiqah', description: 'Undangan aqiqah dengan nuansa islami yang lembut dan penuh berkah.', price: 75000, thumbnail: '🕌', colors: '#27AE60,#F0F3F4,#2C3E50', features: '["Countdown Timer","RSVP Online","Gallery","Doa & Harapan"]' },
      { slug: 'corporate-event', name: 'Corporate Event', category: 'acara-kantor', description: 'Desain profesional untuk gathering, launching, atau acara perusahaan.', price: 200000, thumbnail: '🏢', colors: '#2C3E50,#3498DB,#ECF0F1', features: '["Countdown Timer","RSVP Online","Agenda","Peta Lokasi","QR Check-in"]' }
    ];

    const stmt = db.prepare(`
      INSERT INTO templates (slug, name, category, description, price, thumbnail, colors, features)
      VALUES (@slug, @name, @category, @description, @price, @thumbnail, @colors, @features)
    `);

    for (const t of templates) {
      stmt.run(t);
    }
    console.log('  📦 8 template premium telah di-seed ke database');
  }
}

module.exports = { getDB, initDB };
