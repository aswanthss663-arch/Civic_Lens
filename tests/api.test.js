const test = require('node:test');
const assert = require('node:assert/strict');
const issuesController = require('../backend/controllers/issuesController');
const { classifyIssue, checkDuplicates } = require('../backend/services/aiProxy');

test('Civic Lens API Tests - Create and Verify Issue Workflow', async (t) => {
  await t.test('1. AI Classification Service Baseline', async () => {
    const result = await classifyIssue({
      category: 'Garbage',
      title: 'Overflowing waste bin',
      description: 'Trash pile near market road'
    });

    assert.ok(result.category, 'Should return a category');
    assert.ok(result.confidence > 0, 'Should return a confidence score');
    assert.ok(result.severity, 'Should return severity rating');
  });

  await t.test('2. Duplicate Issue Detection Algorithm', async () => {
    const result = await checkDuplicates({
      category: 'Road Damage',
      latitude: 13.0850,
      longitude: 80.2101,
      title: 'Deep pothole'
    }, [
      {
        id: 'CL-2026-00101',
        category: 'Road Damage',
        title: 'Deep Dangerous Pothole near Anna Nagar Junction',
        latitude: 13.0850,
        longitude: 80.2101
      }
    ]);

    assert.equal(result.is_duplicate, true, 'Should detect duplicate issue within 500 meters');
    assert.equal(result.similar_issue_id, 'CL-2026-00101', 'Should return matching issue ID');
  });

  await t.test('3. Issue Controller Response Format', async () => {
    const mockReq = { query: {} };
    let jsonResult = null;
    const mockRes = {
      json: (data) => { jsonResult = data; }
    };

    await issuesController.getIssues(mockReq, mockRes);
    assert.ok(Array.isArray(jsonResult), 'getIssues should return an array');
    assert.ok(jsonResult.length > 0, 'Should contain seed issues');
    assert.ok(jsonResult[0].id, 'Issue item should contain id field');
  });
});
