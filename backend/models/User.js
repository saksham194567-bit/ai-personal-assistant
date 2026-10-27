const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      default: 'User',
      trim: true,
    },
    photoURL: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true,
    },
    tokenLimit: {
      type: Number,
      default: 30, // Default 30 messages/tokens per day for normal users
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    lastQuotaReset: {
      type: Date,
      default: Date.now,
    },
    settings: {
      accentColor: { type: String, default: '#8b5cf6' },
      notifications: { type: Boolean, default: true },
      soundEffects: { type: Boolean, default: false },
      compactMode: { type: Boolean, default: false },
      aiProvider: { type: String, default: 'gemini' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
