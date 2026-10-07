const express = require('express');
const router = express.Router();

// GET /api/stats/public
router.get('/public', (req, res) => {
  res.json({
    total: 1284,
    resolved: 947,
    pending: 337,
    highPriority: 75,
    resolutionRate: 73.7,
    categories: {
      "Pothole / Road Damage": 420,
      "Garbage / Waste": 310,
      "Streetlight Problem": 240,
      "Drainage Problem": 180,
      "Water Leakage": 134
    },
    areas: {
      "Zone 8 - Anna Nagar": 340,
      "Zone 9 - T. Nagar": 290,
      "Zone 5 - Royapuram": 260,
      "Zone 10 - Kodambakkam": 210,
      "Zone 13 - Adyar": 184
    }
  });
});

module.exports = router;
