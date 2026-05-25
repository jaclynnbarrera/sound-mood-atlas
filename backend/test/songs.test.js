const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const app = require('../src/server');

const dataDir = path.join(__dirname, '..', 'data');
const songsPath = path.join(dataDir, 'songs.json');

let server;
let port;
let backup;

function start() {
  server = app.listen(0);
  port = server.address().port;
}

function stop() {
  if (server) server.close();
}

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

before(() => {
  if (fs.existsSync(songsPath)) {
    backup = fs.readFileSync(songsPath, 'utf8');
  }
});

after(() => {
  // restore songs.json
  if (typeof backup === 'string') {
    fs.writeFileSync(songsPath, backup, 'utf8');
  } else if (fs.existsSync(songsPath)) {
    fs.unlinkSync(songsPath);
  }
});

test('GET /api/songs returns array from songs.json', async () => {
  const fixture = [
    { track_name: 'a', artist: 'x', genre: 'pop', valence: 0.1, energy: 0.2, tempo: 100, danceability: 0.3, popularity: 5 },
    { track_name: 'b', artist: 'y', genre: 'rock', valence: 0.4, energy: 0.5, tempo: 110, danceability: 0.6, popularity: 10 }
  ];
  fs.writeFileSync(songsPath, JSON.stringify(fixture), 'utf8');

  start();
  try {
    const res = await httpGet('/api/songs');
    assert.equal(res.status, 200);
    const body = JSON.parse(res.text);
    assert.deepEqual(body, fixture);
  } finally {
    stop();
  }
});

test('GET /api/songs returns 500 when songs.json missing', async () => {
  if (fs.existsSync(songsPath)) fs.unlinkSync(songsPath);
  start();
  try {
    const res = await httpGet('/api/songs');
    assert.equal(res.status, 500);
    const body = JSON.parse(res.text);
    assert.ok(body.error && body.error.includes('Run npm run build:data'));
  } finally {
    stop();
  }
});

test('GET /api/songs returns 500 when songs.json invalid', async () => {
  fs.writeFileSync(songsPath, '{ invalid json', 'utf8');
  start();
  try {
    const res = await httpGet('/api/songs');
    assert.equal(res.status, 500);
    const body = JSON.parse(res.text);
    assert.ok(body.error && body.error.includes('invalid'));
  } finally {
    stop();
  }
});
