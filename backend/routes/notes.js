const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const Note = require('../models/Note');

// Protect all note routes
router.use(verifyToken);

// GET /api/notes — Retrieve all notes for current user
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.uid }).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// POST /api/notes — Create a new note
router.post('/', async (req, res) => {
  try {
    const { title, content, color } = req.body;
    const note = new Note({
      userId: req.uid,
      title: title || 'Untitled Note',
      content: content || '',
      color: color || '#8b5cf6',
    });
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    console.error('Error creating note:', err);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// PUT /api/notes/:id — Update note
router.put('/:id', async (req, res) => {
  try {
    const { title, content, color } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (color !== undefined) updates.color = color;

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.uid },
      updates,
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ error: 'Note not found or unauthorized' });
    }

    res.json(note);
  } catch (err) {
    console.error('Error updating note:', err);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// DELETE /api/notes/:id — Delete note
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.uid });
    if (!note) {
      return res.status(404).json({ error: 'Note not found or unauthorized' });
    }
    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

module.exports = router;
