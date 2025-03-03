const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const adminUsername = 'admin';
const adminPassword = bcrypt.hashSync('admin123', 10);  // Hashed password

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`Login attempt: { username: '${username}', password: '${password}' }`);

  if (username === adminUsername && bcrypt.compareSync(password, adminPassword)) {
    req.session.isAuthenticated = true;
    console.log('Login successful');
    console.log('Session after login:', req.session);
    res.json({ message: 'Login successful' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

router.get('/check-session', (req, res) => {
  console.log('Session check:', req.session);
  res.json({ isAuthenticated: req.session.isAuthenticated || false });
});

router.get('/logout', (req, res) => {
  console.log('Logout request:', req.session);
  req.session.destroy((err) => {
    if (err) {
      console.error('Failed to logout:', err);
      return res.status(500).json({ message: 'Failed to logout' });
    }
    res.json({ message: 'Logout successful' });
  });
});

module.exports = router;