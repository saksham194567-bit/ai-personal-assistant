const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const User = require('../models/User');

// POST /api/auth/sync — Sync or create user profile in MongoDB after Firebase login
router.post('/sync', verifyToken, async (req, res) => {
  try {
    const { displayName, photoURL } = req.body;
    let user = await User.findOne({ uid: req.uid });

    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const userEmail = (req.email || '').toLowerCase().trim();
    const isAdmin = Boolean(adminEmail && userEmail && adminEmail === userEmail);

    if (!user) {
      user = new User({
        uid: req.uid,
        email: req.email || '',
        displayName: displayName || 'User',
        photoURL: photoURL || '',
        role: isAdmin ? 'admin' : 'user',
        tokenLimit: Number(process.env.DEFAULT_USER_TOKEN_LIMIT) || 30,
      });
      await user.save();
    } else {
      let updated = false;
      if (isAdmin && user.role !== 'admin') {
        user.role = 'admin';
        updated = true;
      }
      if (displayName && user.displayName !== displayName) {
        user.displayName = displayName;
        updated = true;
      }
      if (photoURL && user.photoURL !== photoURL) {
        user.photoURL = photoURL;
        updated = true;
      }
      if (updated) await user.save();
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('Error syncing auth user:', err);
    res.status(500).json({ error: 'Failed to sync user data' });
  }
});

// GET /api/auth/me — Get current user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.uid });
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

module.exports = router;
