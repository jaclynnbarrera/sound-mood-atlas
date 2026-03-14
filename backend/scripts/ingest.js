require('dotenv').config();
const fs = require('fs'); 
const path = require('path');
const csv = require('csv-parser');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const results = [];

fs.createReadStream(path.join(__dirname, '../data/dataset.csv'))
  .pipe(csv())
  .on('data', (row) => {
    results.push({
      track_name: row.track_name,
      artist: row.artists,
      genre: row.track_genre,
      valence: parseFloat(row.valence) || 0,
      energy: parseFloat(row.energy) || 0,
      tempo: parseFloat(row.tempo) || 0,
      danceability: parseFloat(row.danceability) || 0,
      popularity: parseInt(row.popularity) || 0
    });
  })
  .on('end', async () => {
    console.log(`CSV parsed — ${results.length} songs found`);
    await insertSongs(results);
  });

async function insertSongs(songs) {
  const client = await pool.connect();
  let inserted = 0;
  let skipped = 0;

  try {
    await client.query('BEGIN');

    for (const song of songs) {
      if (!song.track_name || !song.artist) {
        skipped++;
        continue;
      }

      await client.query(
        `INSERT INTO songs 
          (track_name, artist, genre, valence, energy, tempo, danceability, popularity)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          song.track_name,
          song.artist,
          song.genre,
          song.valence,
          song.energy,
          song.tempo,
          song.danceability,
          song.popularity
        ]
      );
      inserted++;

      if (inserted % 1000 === 0) {
        console.log(`Inserted ${inserted} songs...`);
      }
    }

    await client.query('COMMIT');
    console.log(`Done — ${inserted} inserted, ${skipped} skipped`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error inserting songs:', err);
  } finally {
    client.release();
    await pool.end();
  }
}