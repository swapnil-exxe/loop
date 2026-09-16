const assert = require("node:assert");
const test = require("node:test");
const { verifyAndRotateToken, createToken } = require("../middlewares/tokenRotation");

test("verifyAndRotateToken rejects requests without bearer token", () => {
  const req = { headers: {} };
  let statusCode = null;
  let jsonRes = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonRes = payload;
      return this;
    }
  };

  verifyAndRotateToken(req, res, () => {});
  assert.strictEqual(statusCode, 401);
  assert.ok(jsonRes.error.includes("No bearer token"));
});

test("verifyAndRotateToken allows valid token and rotates near-expiration token", () => {
  // Token expiring in 2 minutes (120 seconds)
  const token = createToken({ id: "user123", email: "test@spit.ac.in" }, 120);

  const req = { headers: { authorization: `Bearer ${token}` } };
  const headersSet = {};
  const res = {
    setHeader(key, val) {
      headersSet[key] = val;
    }
  };

  let nextCalled = false;
  verifyAndRotateToken(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, true);
  assert.strictEqual(req.user.id, "user123");
  assert.ok(headersSet["X-Refreshed-Token"]);
});
