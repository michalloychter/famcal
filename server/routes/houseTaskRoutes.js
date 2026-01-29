const express = require('express');
const router = express.Router();
const houseTaskLogic = require('../business-logic-layer/houseTaskLogic');
const { protect } = require('../middlewere/varifyLogin');

// Create a house task
router.post('/', protect, async (req, res) => {
  try {
    console.log('[API] POST /api/house-tasks - body:', req.body);
    const task = await houseTaskLogic.createHouseTask(req.body);
    res.status(201).json(task);
  } catch (err) {
    console.error('[API] POST /api/house-tasks ERROR:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Get all house tasks for a family
router.get('/family/:familyId', protect, async (req, res) => {
  try {
    console.log('[API] GET /api/house-tasks/family/' + req.params.familyId);
    const tasks = await houseTaskLogic.getHouseTasksByFamily(req.params.familyId);
    res.json(tasks);
  } catch (err) {
    console.error('[API] GET /api/house-tasks/family ERROR:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Update a house task
router.put('/:id', protect, async (req, res) => {
  try {
    console.log('[API] PUT /api/house-tasks/' + req.params.id, 'body:', req.body);
    const updated = await houseTaskLogic.updateHouseTask(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error('[API] PUT /api/house-tasks ERROR:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Delete a house task
router.delete('/:id', protect, async (req, res) => {
  try {
    console.log('[API] DELETE /api/house-tasks/' + req.params.id);
    await houseTaskLogic.deleteHouseTask(req.params.id);
    res.json({ id: req.params.id });
  } catch (err) {
    console.error('[API] DELETE /api/house-tasks ERROR:', err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
