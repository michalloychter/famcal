const express = require('express');
const router = express.Router();
const houseTaskLogic = require('../business-logic-layer/houseTaskLogic');
const { protect } = require('../middlewere/varifyLogin');

// Create a house task
router.post('/', protect, async (req, res) => {
  try {
    const task = await houseTaskLogic.createHouseTask(req.body);
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all house tasks for a family (POST, familyId in body)
router.post('/family', protect, async (req, res) => {
  try {
    const { familyId } = req.body;
    console.log('[HOUSE TASKS] Route hit, familyId:', familyId);
    if (!familyId) {
      return res.status(400).json({ error: 'familyId is required' });
    }
    const tasks = await houseTaskLogic.getHouseTasksByFamily(familyId);
    res.json(tasks);
    console.log("tasksh", tasks);
    
  } catch (err) {
    console.error('[HOUSE TASKS] Error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Update a house task
router.put('/:id', protect, async (req, res) => {
  try {
    const updated = await houseTaskLogic.updateHouseTask(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a house task
router.delete('/:id', protect, async (req, res) => {
  try {
    await houseTaskLogic.deleteHouseTask(req.params.id);
    res.json({ id: req.params.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
