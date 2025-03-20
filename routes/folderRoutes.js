const express = require('express');
const router = express.Router();
const { createFolder, renameFolder, deleteFolder, getFolders } = require('../controllers/folderController');
const { isAdmin } = require('../middleware/authMiddleware');

router.get('/', getFolders);
router.post('/', isAdmin, createFolder);
router.put('/:id', isAdmin, renameFolder);
router.delete('/:id', isAdmin, deleteFolder);

module.exports = router;
