
const MemberModel = require("../models/memberModel");
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); 
require('dotenv').config(); 
// POST /api/members
router.post('/', async (req, res) => {
  const { name, isUser, whatsappNumber, familyId, username, email, color, familyName } = req.body;
  if (!name || !familyId || !username || !email) {
    return res.status(400).json({ error: 'Missing required fields', missing: ['name', 'familyId', 'username', 'email'] });
  }
  try {
    const member = {
      name,
      username,
      email,
      isUser: !!isUser,
      whatsappNumber: whatsappNumber || '',
      familyId: String(familyId),
      familyName: familyName || '', // Include family name
      color: color || '#1976d2' // Default blue color
    };
    await MemberModel.addMembers([member], familyId);
    res.status(201).json({ message: 'Member added successfully', member });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add member', details: error.message });
  }
});


// GET /api/members?familyId=123
router.get('/', async (req, res) => {
  const { familyId, familyName } = req.query;
  if (familyName) {
    try {
      const members = await MemberModel.getMembersByFamilyName(familyName);
      return res.json(members);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch members by familyName', details: error.message });
    }
  } else if (familyId) {
    try {
      const members = await MemberModel.getMembersByFamilyId(familyId);
      return res.json(members);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch members by familyId', details: error.message });
    }
  } else {
    return res.status(400).json({ error: 'familyName or familyId is required' });
  }
});

module.exports = router;
