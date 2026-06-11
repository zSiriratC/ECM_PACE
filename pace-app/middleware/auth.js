function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/login');
}

function attachUser(req, res, next) {
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;
  next();
}

function roleCheck() {
  var roles = Array.prototype.slice.call(arguments);
  return function(req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    if (req.session.user.role === 'it_admin') return next();
    if (roles.indexOf(req.session.user.role) !== -1) return next();
    req.session.error = 'Access denied.';
    return res.redirect('/home');
  };
}

module.exports = {
  isAuthenticated: isAuthenticated,
  attachUser: attachUser,
  roleCheck: roleCheck
};