const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const bcrypt = require('bcryptjs');

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.redirect('/admin/login');
}

router.get('/login', (req, res) => {
  if (req.session && req.session.isAdmin) return res.redirect('/admin');
  res.render('admin/login', { page: 'admin-login', error: null });
});

router.post('/login', (req, res) => {
  const db = getDB();
  const { username, password } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);

  if (admin && bcrypt.compareSync(password, admin.password)) {
    req.session.isAdmin = true;
    req.session.adminUser = admin.username;
    return res.redirect('/admin');
  }
  res.render('admin/login', { page: 'admin-login', error: 'Username atau password salah!' });
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

router.get('/', requireAdmin, (req, res) => {
  const db = getDB();
  const stats = {
    totalOrders: db.prepare('SELECT COUNT(*) as c FROM orders').get().c,
    pendingOrders: db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'").get().c,
    completedOrders: db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'completed'").get().c,
    totalRevenue: db.prepare("SELECT COALESCE(SUM(total_price),0) as s FROM orders WHERE status = 'completed'").get().s,
    totalTemplates: db.prepare('SELECT COUNT(*) as c FROM templates').get().c
  };
  const recentOrders = db.prepare(`
    SELECT o.*, t.name as template_name 
    FROM orders o 
    LEFT JOIN templates t ON o.template_id = t.id 
    ORDER BY o.created_at DESC LIMIT 10
  `).all();
  res.render('admin/dashboard', { page: 'admin', stats, recentOrders });
});

router.post('/order/:id/status', requireAdmin, (req, res) => {
  const db = getDB();
  const { status } = req.body;
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.redirect('/admin');
});

module.exports = router;
