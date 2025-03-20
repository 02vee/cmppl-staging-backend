const File = require('../models/File');
const path = require('path');
const fs = require('fs');

const uploadFile = async (req, res) => {
  const { originalname, filename, path: filePath } = req.file;
  const { folderId } = req.body;

  try {
    const newFile = new File({ name: originalname, path: filePath, folder: folderId });
    const savedFile = await newFile.save();
    res.status(201).json(savedFile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFiles = async (req, res) => {
  try {
    const files = await File.find().populate('folder');
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const downloadFile = (req, res) => {
  const { id } = req.params;

  File.findById(id, (err, file) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!file) return res.status(404).json({ message: 'File not found' });

    res.download(file.path, file.name);
  });
};

const deleteFile = async (req, res) => {
  const { id } = req.params;

  try {
    const file = await File.findByIdAndDelete(id);
    fs.unlinkSync(file.path);
    res.json({ message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { uploadFile, getFiles, downloadFile, deleteFile };
