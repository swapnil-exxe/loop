const assert = require('node:assert');
const test = require('node:test');
const { getSystemMetrics } = require('../services/systemHealth');

test('getSystemMetrics returns memory and database state', () => {
  const metrics = getSystemMetrics();
  assert.strictEqual(typeof metrics.uptime_sec, 'number');
  assert.strictEqual(typeof metrics.database_status, 'string');
  assert.strictEqual(typeof metrics.memory.rss_mb, 'string');
});
