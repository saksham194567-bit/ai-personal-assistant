const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const User = require('../models/User');

router.use(verifyToken);

// Middleware to ensure the requester is an Admin
async function adminOnly(req, res, next) {
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const userEmail = (req.email || '').toLowerCase().trim();

  let user = null;
  try {
    user = await User.findOne({ uid: req.uid });
  } catch (_) {}

  const isEmailAdmin = Boolean(adminEmail && userEmail && adminEmail === userEmail);
  const isRoleAdmin = user?.role === 'admin';

  if (!isEmailAdmin && !isRoleAdmin) {
    return res.status(403).json({ error: 'Access denied: Administrator privileges required.' });
  }

  req.userDoc = user;
  next();
}

router.use(adminOnly);

// GET /api/admin/users — List all registered users and their quotas
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({})
      .select('uid email displayName role tokenLimit tokensUsed lastQuotaReset createdAt')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch user list' });
  }
});

// PUT /api/admin/users/:uid/limit — Adjust user's token limit or promote to admin
router.put('/users/:uid/limit', async (req, res) => {
  try {
    const { tokenLimit, role, resetUsage } = req.body;
    const updates = {};

    if (tokenLimit !== undefined) updates.tokenLimit = Number(tokenLimit);
    if (role && ['user', 'admin'].includes(role)) updates.role = role;
    if (resetUsage) updates.tokensUsed = 0;

    const user = await User.findOneAndUpdate(
      { uid: req.params.uid },
      updates,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: `Updated quota for ${user.email || user.uid}`,
      user,
    });
  } catch (err) {
    console.error('Error updating user quota:', err);
    res.status(500).json({ error: 'Failed to update user quota' });
  }
});

module.exports = router;
