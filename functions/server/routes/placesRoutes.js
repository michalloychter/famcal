const express = require('express');
const router = express.Router();
const { getNearbyPlaces } = require('../business-logic-layer/placesLogic');

// GET /api/places?type=coffee shops&lat=...&lon=...
router.get('/', async (req, res) => {
  const { type, lat, lon } = req.query;
  if (!type || !lat || !lon) {
    return res.status(400).json({ error: 'Missing type, lat, or lon' });
  }
  try {
    const places = await getNearbyPlaces(type, lat, lon);
    res.json({ places });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
