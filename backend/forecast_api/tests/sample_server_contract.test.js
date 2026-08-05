const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const net = require('node:net');
const path = require('node:path');
const { spawn } = require('node:child_process');

let child;
let baseUrl;

function reservePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

before(async () => {
  const port = await reservePort();
  baseUrl = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, [path.resolve(__dirname, '..', 'server.js')], {
    env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) },
    stdio: 'ignore',
  });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('Sample forecast server did not start');
});

after(() => {
  if (child && !child.killed) child.kill();
});

test('Node server never labels static sample predictions as real history', async () => {
  const history = Array.from({ length: 337 }, (_, index) => ({
    timestamp: new Date(Date.UTC(2026, 0, 1, index)).toISOString(),
    power_kw: 1.0,
  }));
  const response = await fetch(`${baseUrl}/forecast/bundle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history, allow_sample: false }),
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.dataMode, 'sample');
  assert.equal(body.historyHourlyRows, 0);
  assert.equal(body.sampleOnly, true);
  assert.ok(body.predictions.every((row) => row.source === 'sample_forecast'));
});

test('Node server rejects fake retraining', async () => {
  const response = await fetch(`${baseUrl}/forecast/trigger-retrain`, { method: 'POST' });
  assert.equal(response.status, 501);
});
