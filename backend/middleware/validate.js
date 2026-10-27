/**
 * middleware/validate.js
 *
 * Input validation middleware using built-in checks.
 * Keeps controllers clean by centralizing sanitization.
 */

/**
 * Sanitize a string: trim whitespace and strip HTML tags.
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/<[^>]*>/g, '');
}

/**
 * Middleware factory: validates that required string fields are present.
 * Usage: validate.requireFields(['title', 'priority'])
 */
function requireFields(fields) {
  return (req, res, next) => {
    const missing = fields.filter(f => !req.body[f]);
    if (missing.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missing.join(', ')}`,
      });
    }
    // Sanitize all string fields in the body
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
    next();
  };
}

/**
 * Middleware: validate task priority value
 */
function validatePriority(req, res, next) {
  const { priority } = req.body;
  if (priority && !['low', 'medium', 'high'].includes(priority)) {
    return res.status(400).json({ error: 'Priority must be low, medium, or high' });
  }
  next();
}

/**
 * Middleware: validate chat message length
 */
function validateChatMessage(req, res, next) {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }
  if (message.trim().length === 0) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }
  if (message.length > 4000) {
    return res.status(400).json({ error: 'Message too long (max 4000 characters)' });
  }
  req.body.message = sanitizeString(message);
  next();
}

module.exports = { requireFields, validatePriority, validateChatMessage, sanitizeString };
