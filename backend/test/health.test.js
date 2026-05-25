const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/server');

let server;
let port;

before(() => {
  server = app.listen(0); // ephemeral port
  port = server.address().port;
});

after(() => {
  if (server) server.close();
});

function httpGet(pathname) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: pathname, method: 'GET' }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, text: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('GET /api/health returns {status:"ok"}', async () => {
  const res = await httpGet('/api/health');
  assert.equal(res.status, 200);
  const body = JSON.parse(res.text);
  assert.deepEqual(body, { status: 'ok' });
});
