const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFile, getFiles, downloadFile, deleteFile } = require('../controllers/fileController');
const { isAdmin } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

router.get('/', getFiles);
router.post('/', isAdmin, upload.single('file'), uploadFile);
router.get('/:id/download', downloadFile);
router.delete('/:id', isAdmin, deleteFile);

module.exports = router;
