const assert = require('node:assert');
const test = require('node:test');
const { verifyToken, generateRefreshToken } = require('../middlewares/authMiddleware');

const SECRET = 'test_loop_jwt_secret_2026';

test('verifyToken validates token structure', () => {
  const token = generateRefreshToken({ userId: 'user_101' }, SECRET, '1h');
  const result = verifyToken(token, SECRET);

  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.decoded.userId, 'user_101');
});

test('verifyToken handles missing and invalid tokens gracefully', () => {
  const missingResult = verifyToken('', SECRET);
  assert.strictEqual(missingResult.valid, false);

  const invalidResult = verifyToken('invalid_token_string', SECRET);
  assert.strictEqual(invalidResult.valid, false);
});
