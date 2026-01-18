const express = require('express');
const router = express.Router();
const { getShoppingList, updateShoppingList } = require('../business-logic-layer/shoppingListLogic');
const { protect } = require('../middlewere/varifyLogin');



// Get shopping list for a family (familyId in POST body)
router.post('/get', protect, async (req, res) => {
  console.log('POST /api/shopping-list/get called');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  try {
    const { familyId } = req.body;
    if (!familyId) throw new Error('familyId is required');
    const shoppingList = await getShoppingList(familyId);
    res.json({ shoppingList });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update shopping list for a family (familyId and shoppingList in body)
router.put('/', protect, async (req, res) => {
  try {
    const { familyId, shoppingList } = req.body;
    if (!familyId) throw new Error('familyId is required');
    if (!Array.isArray(shoppingList)) throw new Error('shoppingList must be an array');
    await updateShoppingList(familyId, shoppingList);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add a product to the shopping list (familyId and product in body)
router.post('/', protect, async (req, res) => {
  try {
    const { familyId, product } = req.body;
    if (!familyId || !product) throw new Error('familyId and product are required');
    const currentList = await getShoppingList(familyId);
    currentList.push(product);
    await updateShoppingList(familyId, currentList);
    res.json({ shoppingList: currentList });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
