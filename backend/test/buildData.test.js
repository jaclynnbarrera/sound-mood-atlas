const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');

const backendDir = path.join(__dirname, '..');
const dataDir = path.join(backendDir, 'data');
const csvPath = path.join(dataDir, 'dataset.csv');
const songsPath = path.join(dataDir, 'songs.json');

let csvBackup;
let songsBackup;

function runBuild() {
  return new Promise((resolve, reject) => {
    execFile('node', ['scripts/buildChartData.js'], { cwd: backendDir }, (err, stdout, stderr) => {
      if (err) {
        err.stdout = stdout;
        err.stderr = stderr;
        return reject(err);
      }
      resolve({ stdout, stderr });
    });
  });
}

before(() => {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (fs.existsSync(csvPath)) csvBackup = fs.readFileSync(csvPath, 'utf8');
  if (fs.existsSync(songsPath)) songsBackup = fs.readFileSync(songsPath, 'utf8');
});

after(() => {
  if (typeof csvBackup === 'string') fs.writeFileSync(csvPath, csvBackup, 'utf8');
  else if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);

  if (typeof songsBackup === 'string') fs.writeFileSync(songsPath, songsBackup, 'utf8');
  else if (fs.existsSync(songsPath)) fs.unlinkSync(songsPath);
});

test('buildChartData generates least popular songs sorted ascending and skips invalid rows', async () => {
  const csv = [
    'track_name,artists,track_genre,valence,energy,tempo,danceability,popularity',
    'Song A,Artist 1,pop,0.5,0.6,120,0.7,50',
    'Song B,Artist 2,rock,0.4,0.5,110,0.6,10',
    'Song C,Artist 3,jazz,0.3,0.4,90,0.5,30',
    'Song NoArtist,,pop,0.2,0.3,80,0.4,5' // invalid (missing artist)
  ].join('\n');
  fs.writeFileSync(csvPath, csv + '\n', 'utf8');

  await runBuild();

  assert.ok(fs.existsSync(songsPath), 'songs.json should be created');
  const raw = fs.readFileSync(songsPath, 'utf8');
  // Be tolerant to any stray bytes by extracting the first JSON array
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  assert.ok(start !== -1 && end !== -1 && end > start, 'output should contain a JSON array');
  const data = JSON.parse(raw.slice(start, end + 1));

  // One row is invalid, so expect 3 items
  assert.equal(data.length, 3);

  // Verify ascending by popularity and correctness of selected rows
  const popularities = data.map((s) => s.popularity);
  const sorted = [...popularities].sort((a, b) => a - b);
  assert.deepEqual(popularities, sorted);

  // Expected order by ascending popularity: 10 (B), 30 (C), 50 (A)
  assert.equal(data[0].track_name, 'Song B');
  assert.equal(data[1].track_name, 'Song C');
  assert.equal(data[2].track_name, 'Song A');
});
