// Removed FamilyModel
const MemberModel = require("../models/memberModel");
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); 
require('dotenv').config(); 
const JWT_SECRET = process.env.JWT_SECRET;
// Ensure 'app', 'jwt', 'JWT_SECRET', and 'openaiClient' are defined in the scope where this code runs
// It is highly recommended to use a library like bcrypt for password hashing

// 1. Family Registration Route
router.post('/register', async (req, res) => {
  console.log('REGISTER PAYLOAD:', req.body);
  const { familyName, members } = req.body;

  // Basic input validation
  const missing = [];
  if (!familyName) missing.push('familyName');
  if (!Array.isArray(members) || members.length === 0) missing.push('members');
  if (members && members.length > 0) {
    const first = members[0];
    if (!first.name) missing.push('first member name');
    if (!first.username) missing.push('first member username');
    if (!first.email) missing.push('first member email');
    if (!first.whatsappNumber) missing.push('first member whatsappNumber');
  }
  if (missing.length > 0) {
    return res.status(400).json({ error: 'Missing required fields', missing });
  }

  try {
    // Check for duplicate familyName
    const existingMembersByFamily = await MemberModel.getMembersByFamilyName(familyName);
    if (existingMembersByFamily && existingMembersByFamily.length > 0) {
      return res.status(400).json({ error: 'Family name already exists' });
    }
    // Check for duplicate username or email across all members
    const allMembers = await MemberModel.getMembersByFamilyName(''); // Get all members (empty string returns all)
    for (const member of members) {
      if (allMembers.some(m => m.username === member.username)) {
        return res.status(400).json({ error: `Username '${member.username}' already exists` });
      }
      if (allMembers.some(m => m.email === member.email)) {
        return res.status(400).json({ error: `Email '${member.email}' already exists` });
      }
    }
  // Save family document with name and empty shoppingList, get familyId
  const FamilyModel = require('../models/familyModel');
  const familyDoc = await FamilyModel.registerFamily({ familyName, shoppingList: [] });
  const familyId = familyDoc.id;
  // Add familyId to each member before saving (use familyId, not familyID for consistency)
  const membersWithFamily = members.map(m => ({ ...m, familyName, familyId }));
  await MemberModel.addMembers(membersWithFamily, familyId);
  res.status(201).json({ message: 'Family registered successfully and members added', familyId });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'An error occurred during registration: ' + error.message });
  }
});


// 2. Login Route (Corrected and Improved)
router.post('/login', async (req, res) => {
  const { email, username } = req.body;
  console.log("login payload", req.body);

  if (email && username) {
    try {
      // Search members collection directly
      const members = await MemberModel.findMembersByEmailAndUsername(email, username);
      if (!members || members.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const member = members[0];
      console.log('[LOGIN DEBUG] member object from Firestore:', member);
      const token = jwt.sign(
        { memberId: member.id, familyId: member.familyId, username: member.username },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      return res.status(200).json({
        message: 'Login successful',
        user: {
          id: member.id,
          name: member.name, // always return the real name
          username: member.username,
          email: member.email,
          familyId: member.familyId,
          familyName: member.familyName,
          isParent: member.isParent || false
        },
        token: token
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).send('An error occurred during login: ' + error.message);
    }
  } else {
    return res.status(400).json({ error: 'Email and username are required.' });
  }
});
// 3. Get AI Clothing Advice Route (This route was largely correct, adding basic validation)
router.post('/clothing-advice', async (req, res) => {
    const { temp, description, city } = req.body; 

    if (!temp || !description) {
        return res.status(400).json({ error: "Missing temperature or description in request body." });
    }
    // ... (rest of the OpenAI logic) ...
     const prompt = `Based on the current weather in ${city || 'your location'}: 
                    Temperature: ${temp}°C, Description: ${description}. 
                    Provide a single, friendly sentence of advice on what clothes to wear today.`;

    try {
        const response = await openaiClient.chat.completions.create({
            model: "gpt-3.5-turbo", 
            messages: [{ role: "user", content: prompt }],
            max_tokens: 60 
        });

        const adviceText = response.choices.message.content;
        res.json({ advice: adviceText });

    } catch (error) {
        console.error("Error calling OpenAI:", error.message);
        res.status(500).json({ 
            error: "Failed to get clothing advice from AI.",
            details: error.message
        });
    }
});

module.exports = router;

// GET user by id (used by frontend to refresh current user profile)
router.get('/users/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).send('User id is required');
    const user = await UserModel.getUserById(id);
    if (!user) return res.status(404).send('User not found');
    res.json(user);
  } catch (error) {
    console.error('Error fetching user by id:', error);
    res.status(500).send('Error fetching user: ' + error.message);
  }
});

module.exports = router;