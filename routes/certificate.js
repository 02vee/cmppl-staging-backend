const express = require('express');
const router = express.Router();

// Placeholder route for certificates
router.get('/', (req, res) => {
  // Simulate fetching certificates from Google Drive
  const certificates = [
    { name: 'Certificate 1', url: 'https://drive.google.com/file/d/1A2B3C4D5E6F7G8H/view?usp=sharing' },
    { name: 'Certificate 2', url: 'https://drive.google.com/file/d/9H8G7F6E5D4C3B2A/view?usp=sharing' },
  ];
  res.json(certificates);
});

module.exports = router;