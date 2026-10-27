const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'Untitled Note',
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '#8b5cf6',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', NoteSchema);
