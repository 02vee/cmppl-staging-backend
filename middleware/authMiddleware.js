const isAdmin = (req, res, next) => {
  if (req.session && req.session.isAuthenticated) {
    return next();
  } else {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

module.exports = { isAdmin };
