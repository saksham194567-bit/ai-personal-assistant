/**
 * middleware/verifyToken.js
 *
 * Firebase Admin SDK token verification middleware. Fails closed when Firebase
 * Admin is not configured; development tokens must never authorize API access.
 */

const { admin, isInitialized } = require('../config/firebase');

module.exports = async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No Bearer token provided' });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  if (!isInitialized()) {
    return res.status(503).json({
      error: 'Firebase Auth is not configured on the server. Please set service account credentials.',
    });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.uid = decodedToken.uid;
    req.email = decodedToken.email;
    return next();
  } catch (err) {
    console.error('Token verification error:', err.code || err.message);
    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please sign in again.' });
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
