const express = require('express');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const methodOverride = require('method-override');
const { initDatabase } = require('./database/init');
const { attachUser } = require('./middleware/auth');

async function start() {
  await initDatabase();

  const app = express();
  app.use(helmet({ contentSecurityPolicy: false }));
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(methodOverride('_method'));
  app.use(session({
    secret: 'pace-2026-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 86400000, httpOnly: true, sameSite: 'lax' }
  }));
  app.use('/login', rateLimit({ windowMs: 900000, max: 10 }));
  app.use(attachUser);
  app.use(function(req, res, next) {
    res.locals.success = req.session.success || null;
    res.locals.error = req.session.error || null;
    delete req.session.success;
    delete req.session.error;
    next();
  });

  app.use('/', require('./routes/auth'));
  app.use('/home', require('./routes/home'));
  app.use('/planning', require('./routes/planning'));
  app.use('/daily-report', require('./routes/dailyReport'));
  app.use('/dashboard', require('./routes/dashboard'));
  app.use('/actual', require('./routes/actual'));
  app.use('/setup', require('./routes/setup'));
  app.use('/timesheet', require('./routes/timesheet'));
  app.get('/', function(req, res) {
    res.redirect(req.session.user ? '/home' : '/login');
  });

  var PORT = process.env.PORT || 3000;
  app.listen(PORT, function() {
    console.log('PACE running at http://localhost:' + PORT);
  });
}

start().catch(function(err) {
  console.error('Failed to start:', err);
  process.exit(1);
});