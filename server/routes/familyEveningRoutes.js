
const express = require('express');
const router = express.Router();
const familyEveningModel = require('../models/familyEveningModel');
const { emitFamilyEveningUpdate } = require('../socket');

// Delete a family evening by id
router.delete('/:eveningId', async (req, res) => {
  try {
    await familyEveningModel.deleteFamilyEvening(req.params.eveningId);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new family evening
router.post('/', async (req, res) => {
  try {
    const { familyId, date, title, tasks } = req.body;
    const docRef = await familyEveningModel.createFamilyEvening({ familyId, date, title, tasks });
    // Emit update to all family members
    emitFamilyEveningUpdate(familyId, { type: 'created', eveningId: docRef.id });
    res.status(201).json({ id: docRef.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a member task to an existing family evening
router.post('/:eveningId/task', async (req, res) => {
  try {
    const { memberName, task, familyId } = req.body;
    await familyEveningModel.addTaskToEvening(req.params.eveningId, memberName, task);
    // Emit update to all family members
    if (familyId) emitFamilyEveningUpdate(familyId, { type: 'taskAdded', eveningId: req.params.eveningId });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all family evenings for a familyId (POST for privacy)
router.post('/by-family', async (req, res) => {
  try {
    console.log('POST /by-family body:', req.body);
    const { familyId } = req.body;
    if (!familyId) return res.status(400).json({ error: 'familyId required' });
    const snapshot = await familyEveningModel.getFamilyEveningsByFamilyId(familyId);
    const evenings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(evenings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
