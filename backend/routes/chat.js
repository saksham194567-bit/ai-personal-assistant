const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { validateChatMessage } = require('../middleware/validate');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');

router.use(verifyToken);

// Candidate models to try in order if one experiences a traffic spike
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemma-4-26b-a4b-it',
];

// Helper: check if user is admin and handle daily quota reset
async function getUserQuotaInfo(uid, email) {
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const userEmail = (email || '').toLowerCase().trim();

  let user = null;
  try {
    user = await User.findOne({ uid });
  } catch (_) {}

  const isEmailAdmin = Boolean(adminEmail && userEmail && adminEmail === userEmail);
  const isRoleAdmin = user?.role === 'admin';
  const isAdmin = isEmailAdmin || isRoleAdmin;

  if (isAdmin) {
    return {
      user,
      isAdmin: true,
      tokensUsed: user?.tokensUsed || 0,
      tokenLimit: Infinity,
      remaining: 'Unlimited',
    };
  }

  // Normal user quota handling
  const tokenLimit = user?.tokenLimit || Number(process.env.DEFAULT_USER_TOKEN_LIMIT) || 30;
  let tokensUsed = user?.tokensUsed || 0;

  // Check if daily reset is needed (if last reset was on a previous day)
  if (user) {
    const todayStr = new Date().toDateString();
    const lastResetStr = user.lastQuotaReset ? new Date(user.lastQuotaReset).toDateString() : '';

    if (todayStr !== lastResetStr) {
      tokensUsed = 0;
      user.tokensUsed = 0;
      user.lastQuotaReset = new Date();
      await user.save().catch(() => {});
    }
  }

  const remaining = Math.max(0, tokenLimit - tokensUsed);

  return {
    user,
    isAdmin: false,
    tokensUsed,
    tokenLimit,
    remaining,
  };
}

// GET /api/chat/quota — Fetch user's current token quota and role
router.get('/quota', async (req, res) => {
  try {
    const quotaInfo = await getUserQuotaInfo(req.uid, req.email);
    res.json({
      role: quotaInfo.isAdmin ? 'admin' : 'user',
      isUnlimited: quotaInfo.isAdmin,
      tokensUsed: quotaInfo.tokensUsed,
      tokenLimit: quotaInfo.isAdmin ? 'Unlimited' : quotaInfo.tokenLimit,
      remaining: quotaInfo.remaining,
    });
  } catch (err) {
    console.error('Error fetching quota:', err);
    res.status(500).json({ error: 'Failed to fetch quota info' });
  }
});

// GET /api/chat/history — Fetch conversation history for current user
router.get('/history', async (req, res) => {
  try {
    const messages = await ChatMessage.find({ userId: req.uid })
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(messages);
  } catch (err) {
    console.error('Error fetching chat history:', err);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// POST /api/chat — Send message to Gemini with quota enforcement & admin bypass
router.post('/', validateChatMessage, async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return res.status(503).json({
      error: 'Gemini API key is not configured in backend .env. Please set GEMINI_API_KEY.',
    });
  }

  // 1. Enforce Token Quota
  const quota = await getUserQuotaInfo(req.uid, req.email);

  if (!quota.isAdmin && quota.tokensUsed >= quota.tokenLimit) {
    return res.status(429).json({
      error: `Daily AI message limit reached (${quota.tokensUsed}/${quota.tokenLimit}). Please wait until tomorrow or contact an administrator to increase your limit.`,
      quota: {
        isUnlimited: false,
        tokensUsed: quota.tokensUsed,
        tokenLimit: quota.tokenLimit,
        remaining: 0,
      },
    });
  }

  const { message } = req.body;
  const genAI = new GoogleGenerativeAI(apiKey);

  // 2. Attempt to save user message to database (non-blocking if DB is offline)
  try {
    const userMsg = new ChatMessage({
      userId: req.uid,
      role: 'user',
      content: message,
    });
    await userMsg.save().catch(() => {});
  } catch (_) {}

  // 3. Fetch past conversation context if available
  let formattedHistory = [];
  try {
    const history = await ChatMessage.find({ userId: req.uid })
      .sort({ createdAt: -1 })
      .skip(1)
      .limit(10)
      .maxTimeMS(2000)
      .catch(() => []);

    if (history && history.length > 0) {
      formattedHistory = history.reverse().map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
    }
  } catch (_) {}

  // 4. Try models in cascade until one succeeds
  let replyText = null;
  let lastError = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction:
          'You are an intelligent, friendly AI personal assistant. Answer accurately, concisely, and supportively.',
      });

      const chat = model.startChat({ history: formattedHistory });
      const result = await chat.sendMessage(message);
      replyText = result.response.text();

      if (replyText) {
        break;
      }
    } catch (err) {
      lastError = err;
      console.warn(`Model ${modelName} failed (${err.message}). Trying fallback...`);
    }
  }

  if (!replyText) {
    return res.status(503).json({
      error:
        lastError?.message ||
        'Google Gemini API is currently experiencing peak demand. Please retry in a moment.',
    });
  }

  // 5. Update token usage for non-admin user
  if (!quota.isAdmin && quota.user) {
    try {
      quota.user.tokensUsed = (quota.user.tokensUsed || 0) + 1;
      await quota.user.save().catch(() => {});
    } catch (_) {}
  }

  // 6. Save assistant reply to database (non-blocking)
  try {
    const assistantMsg = new ChatMessage({
      userId: req.uid,
      role: 'assistant',
      content: replyText,
    });
    await assistantMsg.save().catch(() => {});
  } catch (_) {}

  const newTokensUsed = quota.isAdmin ? quota.tokensUsed : quota.tokensUsed + 1;
  const newRemaining = quota.isAdmin ? 'Unlimited' : Math.max(0, quota.tokenLimit - newTokensUsed);

  res.json({
    reply: replyText,
    quota: {
      isUnlimited: quota.isAdmin,
      role: quota.isAdmin ? 'admin' : 'user',
      tokensUsed: newTokensUsed,
      tokenLimit: quota.isAdmin ? 'Unlimited' : quota.tokenLimit,
      remaining: newRemaining,
    },
  });
});

// DELETE /api/chat/history — Clear conversation history
router.delete('/history', async (req, res) => {
  try {
    await ChatMessage.deleteMany({ userId: req.uid });
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (err) {
    console.error('Error clearing chat history:', err);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

module.exports = router;
