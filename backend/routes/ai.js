const express = require('express');
const router = express.Router();
const { classifyIssue, checkDuplicates } = require('../services/aiProxy');

// POST /api/ai/classify
router.post('/classify', async (req, res) => {
  try {
    const result = await classifyIssue(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/duplicate-check
router.post('/duplicate-check', async (req, res) => {
  try {
    const existing = req.body.existing_issues || [];
    const result = await checkDuplicates(req.body, existing);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
