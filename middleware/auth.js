const store = require('../data/store');

async function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

async function requireAdmin(req, res, next) {
  try {
    // Fast path: role in session
    if (req.session && req.session.role === 'admin') return next();
    // Otherwise, try to look up user
    if (!req.session || !req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await store.user.findOne({ _id: req.session.userId });
    if (user && user.role === 'admin') return next();
    return res.status(403).json({ error: 'Forbidden' });
  } catch (err) {
    console.error('requireAdmin error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { requireAuth, requireAdmin };
