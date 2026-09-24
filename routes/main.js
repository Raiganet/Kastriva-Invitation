const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
  const db = getDB();
  const templates = db.prepare('SELECT * FROM templates WHERE is_active = 1 ORDER BY category, name').all();
  const categories = [...new Set(templates.map(t => t.category))];
  res.render('index', { page: 'home', templates, categories });
});

router.get('/templates', (req, res) => {
  const db = getDB();
  const category = req.query.category || 'all';
  let templates;
  if (category === 'all') {
    templates = db.prepare('SELECT * FROM templates WHERE is_active = 1 ORDER BY name').all();
  } else {
    templates = db.prepare('SELECT * FROM templates WHERE is_active = 1 AND category = ? ORDER BY name').all(category);
  }
  const categories = db.prepare('SELECT DISTINCT category FROM templates WHERE is_active = 1').all().map(c => c.category);
  res.render('templates', { page: 'templates', templates, categories, activeCategory: category });
});

router.get('/demo/:slug', (req, res) => {
  const db = getDB();
  const template = db.prepare('SELECT * FROM templates WHERE slug = ?').get(req.params.slug);
  if (!template) return res.redirect('/templates');
  template.features = JSON.parse(template.features || '[]');
  template.colors = template.colors ? template.colors.split(',') : ['#D4A5A5', '#F5E6E8', '#8B4513'];
  res.render('demo', { page: 'demo', template });
});

router.get('/preview/:slug', (req, res) => {
  const db = getDB();
  const template = db.prepare('SELECT * FROM templates WHERE slug = ?').get(req.params.slug);
  if (!template) return res.redirect('/templates');
  template.features = JSON.parse(template.features || '[]');
  template.colors = template.colors ? template.colors.split(',') : ['#D4A5A5', '#F5E6E8', '#8B4513'];

  const demoData = {
    groom: 'Ahmad',
    bride: 'Siti',
    date: '2026-12-25',
    time: '08:00 - 14:00',
    location: 'Masjid Agung Al-Azhar, Jakarta Selatan',
    address: 'Jl. Sisingamangaraja, Kebayoran Baru',
    mapUrl: 'https://maps.google.com',
    guestName: req.query.to || 'Tamu Undangan',
    story: [
      { year: '2020', title: 'Pertama Bertemu', desc: 'Kami bertemu di sebuah acara kampus dan sejak itu takdir mempertemukan kami.' },
      { year: '2022', title: 'Mulai Menjalin Hubungan', desc: 'Setelah dua tahun saling mengenal, kami memutuskan untuk melangkah lebih serius.' },
      { year: '2025', title: 'Lamaran', desc: 'Dengan restu kedua keluarga, kami resmi bertunangan.' },
      { year: '2026', title: 'Pernikahan', desc: 'InsyaAllah kami akan menyatukan langkah dalam ikatan suci pernikahan.' }
    ],
    gallery: ['📸 Foto 1', '📸 Foto 2', '📸 Foto 3', '📸 Foto 4', '📸 Foto 5', '📸 Foto 6']
  };

  res.render('undangan/preview', { template, demo: demoData, isDemo: true });
});

router.get('/order/:slug', (req, res) => {
  const db = getDB();
  const template = db.prepare('SELECT * FROM templates WHERE slug = ?').get(req.params.slug);
  if (!template) return res.redirect('/templates');
  template.features = JSON.parse(template.features || '[]');
  res.render('order', { page: 'order', template });
});

router.get('/pricing', (req, res) => {
  const db = getDB();
  const templates = db.prepare('SELECT * FROM templates WHERE is_active = 1 ORDER BY price').all();
  res.render('pricing', { page: 'pricing', templates });
});

router.post('/order/submit', (req, res) => {
  const db = getDB();
  const { template_id, customer_name, customer_email, customer_phone, event_type,
    groom_name, bride_name, event_date, event_location, custom_message } = req.body;

  const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(template_id);
  if (!template) return res.redirect('/templates');

  const orderCode = 'INV-' + uuidv4().substring(0, 8).toUpperCase();

  db.prepare(`
    INSERT INTO orders (order_code, template_id, customer_name, customer_email, customer_phone,
      event_type, groom_name, bride_name, event_date, event_location, custom_message, total_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(orderCode, template_id, customer_name, customer_email, customer_phone,
    event_type, groom_name || '', bride_name || '', event_date, event_location, custom_message || '', template.price);

  res.render('order', { page: 'order-success', orderCode, template });
});

module.exports = router;
