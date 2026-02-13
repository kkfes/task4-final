const express = require('express');
const validator = require('validator');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const store = require('../data/store');
const router = express.Router();

// List workouts
router.get('/workouts', async (req, res) => {
  try {
    const items = await store.workout.find();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/workouts/:id', async (req, res) => {
  try {
    const item = await store.workout.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: 'Bad request' });
  }
});

router.post('/workouts', requireAuth, async (req, res) => {
  try {
    const { name, type, durationMinutes, caloriesBurned, intensity, date, equipment, notes } = req.body;
    if (!name || !type || !durationMinutes || !date) return res.status(400).json({ error: 'Invalid input' });
    if (!validator.isInt(String(durationMinutes), { min: 1 })) return res.status(400).json({ error: 'Invalid input' });
    const w = await store.workout.insert({ name, type, durationMinutes: Number(durationMinutes), caloriesBurned: Number(caloriesBurned) || 0, intensity, date: new Date(date), equipment, notes });
    res.status(201).json(w);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/workouts/:id', requireAuth, async (req, res) => {
  try {
    const updates = req.body;
    if (updates.durationMinutes && !validator.isInt(String(updates.durationMinutes), { min: 1 })) return res.status(400).json({ error: 'Invalid input' });
    if (updates.date) updates.date = new Date(updates.date);
    const item = await store.workout.findByIdAndUpdate(req.params.id, updates);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: 'Bad request' });
  }
});

router.delete('/workouts/:id', requireAuth, async (req, res) => {
  try {
    const item = await store.workout.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Bad request' });
  }
});

module.exports = router;

// Admin-only routes
router.delete('/admin/workouts', requireAuth, requireAdmin, async (req, res) => {
  try {
    await store.workout.deleteMany();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await store.user.findAll();
    res.json(users.map(u => ({ _id: u._id, username: u.username, email: u.email, role: u.role })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/admin/users/:id/role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['user','admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const updated = await store.user.findByIdAndUpdate(id, { role });
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json({ _id: updated._id, username: updated.username, email: updated.email, role: updated.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
