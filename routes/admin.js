const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', requireAuth, requireAdmin, (req, res) => {
  res.render('admin');
});

module.exports = router;
