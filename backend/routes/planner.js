const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const PlannerEvent = require('../models/PlannerEvent');

router.use(verifyToken);

// GET /api/planner — Get all planner events or by dateKey (?date=YYYY-MM-DD)
router.get('/', async (req, res) => {
  try {
    const query = { userId: req.uid };
    if (req.query.date) {
      query.dateKey = req.query.date;
    }
    const events = await PlannerEvent.find(query).sort({ hour: 1 });
    res.json(events);
  } catch (err) {
    console.error('Error fetching planner events:', err);
    res.status(500).json({ error: 'Failed to fetch planner events' });
  }
});

// POST /api/planner — Add a planner event
router.post('/', async (req, res) => {
  try {
    const { dateKey, hour, text, color } = req.body;
    if (!dateKey || hour === undefined || !text) {
      return res.status(400).json({ error: 'dateKey, hour, and text are required' });
    }

    const event = new PlannerEvent({
      userId: req.uid,
      dateKey,
      hour: Number(hour),
      text: text.trim(),
      color: color || 'purple',
    });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    console.error('Error creating planner event:', err);
    res.status(500).json({ error: 'Failed to create planner event' });
  }
});

// DELETE /api/planner/:id — Delete a planner event
router.delete('/:id', async (req, res) => {
  try {
    const event = await PlannerEvent.findOneAndDelete({
      _id: req.params.id,
      userId: req.uid,
    });
    if (!event) {
      return res.status(404).json({ error: 'Planner event not found or unauthorized' });
    }
    res.json({ success: true, message: 'Planner event removed' });
  } catch (err) {
    console.error('Error deleting planner event:', err);
    res.status(500).json({ error: 'Failed to delete planner event' });
  }
});

module.exports = router;
