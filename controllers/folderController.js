const Folder = require('../models/Folder');

const createFolder = async (req, res) => {
  const { name } = req.body;

  try {
    const newFolder = new Folder({ name });
    const savedFolder = await newFolder.save();
    res.status(201).json(savedFolder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const renameFolder = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const updatedFolder = await Folder.findByIdAndUpdate(id, { name }, { new: true });
    res.json(updatedFolder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteFolder = async (req, res) => {
  const { id } = req.params;

  try {
    await Folder.findByIdAndDelete(id);
    res.json({ message: 'Folder deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFolders = async (req, res) => {
  try {
    const folders = await Folder.find();
    res.json(folders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createFolder, renameFolder, deleteFolder, getFolders };
