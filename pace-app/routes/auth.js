var express = require('express');
var bcrypt = require('bcryptjs');
var db = require('../database/init');
var router = express.Router();

router.get('/login', function(req, res) {
  if (req.session.user) return res.redirect('/home');
  res.render('login', { title: 'Login' });
});

router.post('/login', function(req, res) {
  var u = db.getDb().prepare('SELECT * FROM users WHERE username=? AND is_active=1').get(req.body.username);
  if (!u || !bcrypt.compareSync(req.body.password, u.password)) {
    req.session.error = 'Invalid credentials.';
    return res.redirect('/login');
  }
  req.session.user = { id: u.id, username: u.username, full_name: u.full_name, role: u.role, email: u.email };
  res.redirect('/home');
});

router.get('/logout', function(req, res) {
  req.session.destroy(function() { res.redirect('/login'); });
});

module.exports = router;