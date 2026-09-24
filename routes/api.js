const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

router.post('/rsvp', (req, res) => {
  const db = getDB();
  const { order_code, guest_name, attendance, message } = req.body;
  const order = db.prepare('SELECT id FROM orders WHERE order_code = ?').get(order_code);
  if (!order) return res.json({ success: false, msg: 'Undangan tidak ditemukan' });

  db.prepare('INSERT INTO guests (order_id, guest_name, attendance, message) VALUES (?, ?, ?, ?)')
    .run(order.id, guest_name, attendance, message || '');
  res.json({ success: true, msg: 'Terima kasih atas konfirmasi kehadiran Anda!' });
});

router.get('/rsvp/:order_code', (req, res) => {
  const db = getDB();
  const order = db.prepare('SELECT id FROM orders WHERE order_code = ?').get(req.params.order_code);
  if (!order) return res.json({ hadir: 0, tidak: 0, total: 0 });

  const stats = db.prepare(`
    SELECT 
      SUM(CASE WHEN attendance = 'hadir' THEN 1 ELSE 0 END) as hadir,
      SUM(CASE WHEN attendance = 'tidak' THEN 1 ELSE 0 END) as tidak,
      COUNT(*) as total
    FROM guests WHERE order_id = ?
  `).get(order.id);
  res.json(stats);
});

router.get('/guests/:order_code', (req, res) => {
  const db = getDB();
  const order = db.prepare('SELECT id FROM orders WHERE order_code = ?').get(req.params.order_code);
  if (!order) return res.json([]);
  const guests = db.prepare('SELECT guest_name, attendance, message, created_at FROM guests WHERE order_id = ? ORDER BY created_at DESC').all(order.id);
  res.json(guests);
});

module.exports = router;
