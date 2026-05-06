require('dotenv').config();

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const inputPath = path.join(__dirname, '../data/dataset.csv');
const outputPath = path.join(__dirname, '../data/chart-data.json');

const songs = [];

function toNumber(value, fallback = 0) {
    const number = Number.parseFloat(value);
    return Number.isFinite(number) ? number : fallback;
}

function toInteger(value, fallback = 0) {
    const number = Number.parseInt(value, 10);
    return Number.isFinite(number) ? number : fallback;
}

fs.createReadStream(inputPath)
    .pipe(csv())
    .on('data', (row) => {
        console.log('Processing row:', row);

        const trackName = row.track_name;
        const artist = row.artists;
        const genre = row.track_genre;

        if (!trackName || !artist) {
            return;
        }

        const valence = toNumber(row.valence);
        const energy = toNumber(row.energy);
        const danceability = toNumber(row.danceability);
        const tempo = toNumber(row.tempo);
        const popularity = toInteger(row.popularity);

        songs.push({
            id: row.track_id || `${trackName}-${artist}`,

            track_name: trackName,
            artist,
            genre,

            // Chart position
            x: valence,
            y: energy,

            // Extra data for tooltips/filtering
            valence,
            energy,
            danceability,
            tempo,
            popularity
        });
    })
    .on('end', () => {
        const cleanedSongs = songs
            .filter((song) => song.x >= 0 && song.x <= 1)
            .filter((song) => song.y >= 0 && song.y <= 1)
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0,200);

        fs.writeFileSync(outputPath, JSON.stringify(cleanedSongs, null, 2));

        console.log(`Done.`);
        console.log(`Read ${songs.length} songs.`);
        console.log(`Wrote ${cleanedSongs.length} chart points to:`);
        console.log(outputPath);
    })
    .on('error', (error) => {
        console.error('Error reading CSV:', error);
    });