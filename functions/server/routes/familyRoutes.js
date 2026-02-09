const FamilyModel = require("../models/familyModel");
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewere/varifyLogin');

// GET /api/families/:id - Get family by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ error: 'Family ID is required' });
  }
  
  try {
    const family = await FamilyModel.getFamilyById(id);
    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }
    res.json(family);
  } catch (error) {
    console.error('Error fetching family:', error);
    res.status(500).json({ error: 'Failed to fetch family', details: error.message });
  }
});

// REDUNDANT: Love notes are now saved as tasks with type='private'
// POST /api/families/:id/love-notes - Add a love note
// router.post('/:id/love-notes', protect, async (req, res) => {
//   const { id } = req.params;
//   const { message, author } = req.body;
//   
//   if (!message) {
//     return res.status(400).json({ error: 'Message is required' });
//   }
//   
//   try {
//     const note = await FamilyModel.addLoveNote(id, { message, author });
//     res.json(note);
//   } catch (error) {
//     console.error('Error adding love note:', error);
//     res.status(500).json({ error: 'Failed to add love note', details: error.message });
//   }
// });

// REDUNDANT: Love notes are now saved as tasks with type='private'
// DELETE /api/families/:id/love-notes/:noteId - Delete a love note
// router.delete('/:id/love-notes/:noteId', protect, async (req, res) => {
//   const { id, noteId } = req.params;
//   
//   try {
//     await FamilyModel.deleteLoveNote(id, noteId);
//     res.json({ success: true });
//   } catch (error) {
//     console.error('Error deleting love note:', error);
//     res.status(500).json({ error: 'Failed to delete love note', details: error.message });
//   }
// });

module.exports = router;

