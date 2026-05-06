const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

const chartDataPath = path.join(__dirname, '../data/chart-data.json');

app.get('/api/songs', (req, res) => {
    fs.readFile(chartDataPath, 'utf8', (error, data) => {
        if (error) {
            console.error('Error reading chart data:', error);

            return res.status(500).json({
                error: 'Could not load chart data'
            });
        }

        const songs = JSON.parse(data);

        res.json(songs);
    });
});

app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
});