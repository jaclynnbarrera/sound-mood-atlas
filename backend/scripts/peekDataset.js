const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const inputPath = path.join(__dirname, '../data/dataset.csv');

let hasLoggedFirstRow = false;

fs.createReadStream(inputPath)
    .pipe(csv())
    .on('data', (row) => {
        if (!hasLoggedFirstRow) {
            console.log(row);
            hasLoggedFirstRow = true;
        }
    })
    .on('end', () => {
        console.log('Done reading CSV.');
    })
    .on('error', (error) => {
        console.error('Error reading CSV:', error);
    });