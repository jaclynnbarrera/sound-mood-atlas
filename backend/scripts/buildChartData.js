const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const inputPath = path.join(__dirname, '../data/dataset.csv');
const outputPath = path.join(__dirname, '../data/songs.json');

const songs = [];
let skipped = 0;

fs.createReadStream(inputPath)
  .pipe(csv())
  .on('data', (row) => {
    const song = {
      track_name: row.track_name,
      artist: row.artists,
      genre: row.track_genre,
      valence: parseFloat(row.valence) || 0,
      energy: parseFloat(row.energy) || 0,
      tempo: parseFloat(row.tempo) || 0,
      danceability: parseFloat(row.danceability) || 0,
      popularity: parseInt(row.popularity, 10) || 0
    };

    if (!song.track_name || !song.artist) {
      skipped++;
      return;
    }

    songs.push(song);
  })
  .on('end', () => {
    fs.writeFileSync(outputPath, JSON.stringify(songs, null, 2), 'utf8');

    console.log(`Done.`);
    console.log(`Wrote ${songs.length} songs to ${outputPath}`);
    console.log(`Skipped ${skipped} rows missing track name or artist`);
  })
  .on('error', (err) => {
    console.error('Error reading CSV:', err);
  });