const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { requireFields, validatePriority } = require('../middleware/validate');
const Task = require('../models/Task');

// Protect all task routes
router.use(verifyToken);

// GET /api/tasks — Retrieve all tasks for current user
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.uid }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks — Create a new task
router.post('/', requireFields(['title']), validatePriority, async (req, res) => {
  try {
    const { title, priority, dueDate } = req.body;
    const task = new Task({
      userId: req.uid,
      title,
      priority: priority || 'medium',
      dueDate: dueDate || '',
      completed: false,
    });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id — Update a task
router.put('/:id', validatePriority, async (req, res) => {
  try {
    const { title, priority, completed, dueDate } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (priority !== undefined) updates.priority = priority;
    if (completed !== undefined) updates.completed = completed;
    if (dueDate !== undefined) updates.dueDate = dueDate;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.uid },
      updates,
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    res.json(task);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id — Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.uid });
    if (!task) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
