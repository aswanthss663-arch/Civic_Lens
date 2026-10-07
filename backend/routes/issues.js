const express = require('express');
const router = express.Router();
const issuesController = require('../controllers/issuesController');

// Standard /api/issues endpoints
router.get('/', issuesController.getIssues);
router.post('/', issuesController.createIssue);
router.get('/:id', issuesController.getIssueById);
router.patch('/:id/status', issuesController.updateStatus);
router.post('/:id/evidence', issuesController.uploadEvidence);
router.post('/:id/verify', issuesController.verifyResolution);

module.exports = router;
