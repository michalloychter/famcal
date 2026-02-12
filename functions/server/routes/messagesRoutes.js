const express = require('express');
const router = express.Router();
const { addMessage, getMessagesByFamily } = require('../business-logic-layer/messagesLogic');
const { protect } = require('../middlewere/varifyLogin');

// Save a new message
router.post('/', protect, async (req, res) => {
  try {
    const msg = req.body;
    if (!msg.familyId || !msg.text || !msg.memberName || !msg.date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const saved = await addMessage(msg);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save message', details: err.message });
  }
});

// Get messages by familyId
router.get('/', protect, async (req, res) => {
  try {
    const { familyId } = req.query;
    if (!familyId) {
      return res.status(400).json({ error: 'familyId is required' });
    }
    const messages = await getMessagesByFamily(familyId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages', details: err.message });
  }
});

module.exports = router;
