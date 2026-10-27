const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const User = require('../models/User');

router.use(verifyToken);

// GET /api/user/settings — Get user settings
router.get('/settings', async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      userName: user.displayName,
      ...user.settings?.toObject(),
    });
  } catch (err) {
    console.error('Error fetching user settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/user/settings — Update user settings & profile
router.put('/settings', async (req, res) => {
  try {
    const { userName, accentColor, notifications, soundEffects, compactMode, aiProvider } = req.body;

    const user = await User.findOne({ uid: req.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userName !== undefined) user.displayName = userName;
    if (accentColor !== undefined) user.settings.accentColor = accentColor;
    if (notifications !== undefined) user.settings.notifications = notifications;
    if (soundEffects !== undefined) user.settings.soundEffects = soundEffects;
    if (compactMode !== undefined) user.settings.compactMode = compactMode;
    if (aiProvider !== undefined) user.settings.aiProvider = aiProvider;

    await user.save();
    res.json({
      userName: user.displayName,
      ...user.settings.toObject(),
    });
  } catch (err) {
    console.error('Error updating user settings:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
