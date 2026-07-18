/**
 * combined.test.js
 * ─────────────────────────────────────────────────────────────────────
 * Cross-stack E2E smoke tests.
 *
 * These tests make real HTTP requests to the running backend server
 * (http://localhost:5000) — no in-memory DB or route imports needed.
 *
 * REQUIREMENT: The backend must be running before executing these tests.
 *   cd backend && npm run dev
 *
 * Run:  cd tests && npm test
 * ─────────────────────────────────────────────────────────────────────
 */

const http = require('http');

// ── Tiny promise-based HTTP helper (no extra deps needed) ─────────────
const get = (path) =>
  new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${path}`, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, body }); }
      });
    }).on('error', reject);
  });

const post = (path, data) =>
  new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(
      { hostname: 'localhost', port: 5000, path, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
          catch { resolve({ status: res.statusCode, body }); }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });

// ── Check server is reachable before running tests ────────────────────
beforeAll(async () => {
  try {
    await get('/');
  } catch (err) {
    throw new Error(
      '❌ Backend server is not running on http://localhost:5000.\n' +
      '   Run: cd backend && npm run dev\n' +
      '   Then re-run: cd tests && npm test'
    );
  }
});

// ─────────────────────────────────────────────────────────────────────
// 1. Server health
// ─────────────────────────────────────────────────────────────────────
describe('Combined — Server Health', () => {
  it('GET / → 200 with API running message', async () => {
    const res = await get('/');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/alumni/i);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 2. Auth API contract
// ─────────────────────────────────────────────────────────────────────
describe('Combined — Auth API Contract', () => {
  it('POST /api/auth/send-otp with missing body → 400', async () => {
    const res = await post('/api/auth/send-otp', {});
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/send-otp with invalid email → 400', async () => {
    const res = await post('/api/auth/send-otp', {
      name: 'Test', email: 'not-an-email', password: 'pass123', role: 'student',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email/i);
  });

  it('POST /api/auth/login with wrong password → 401', async () => {
    const res = await post('/api/auth/login', {
      email: 'nonexistent@example.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 3. Unknown route shape
// ─────────────────────────────────────────────────────────────────────
describe('Combined — 404 Contract', () => {
  it('Unknown route returns JSON with message field', async () => {
    const res = await get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
  });
});
