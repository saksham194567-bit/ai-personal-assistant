/**
 * middleware/verifyToken.js
 *
 * Firebase Admin SDK token verification middleware with development fallback.
 */

const { admin, isInitialized } = require('../config/firebase');
const jwt = require('jsonwebtoken');

module.exports = async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No Bearer token provided' });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // 1. Dev Mode fallback if Firebase Admin is not yet configured
  if (!isInitialized()) {
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      if (token && token !== 'demo-token') {
        const decoded = jwt.decode(token);
        if (decoded) {
          req.uid = decoded.user_id || decoded.sub || token;
          req.email = decoded.email || process.env.ADMIN_EMAIL || 'saksham194567@gmail.com';
          return next();
        }
      }
      req.uid = token === 'demo-token' || !token ? 'dev-admin-123' : token;
      req.email = process.env.ADMIN_EMAIL || 'saksham194567@gmail.com';
      return next();
    }
    return res.status(500).json({
      error: 'Firebase Auth is not configured on the server. Please set service account credentials.',
    });
  }

  // 2. Real Firebase ID token verification
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.uid = decodedToken.uid;
    req.email = decodedToken.email;
    next();
  } catch (err) {
    console.error('Token verification error:', err.code || err.message);
    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please sign in again.' });
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
