const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const songsPath = path.join(__dirname, '../../frontend/public/songs.json');
const publicPath = path.join(__dirname, '../public');

app.use(express.static(publicPath));

app.get('/api/songs', (req, res) => {
  fs.readFile(songsPath, 'utf8', (error, data) => {
    if (error) {
      console.error('Error reading songs JSON:', error);
      return res.status(500).json({
        error: 'Could not read songs data. Run npm run build:data first.'
      });
    }

    try {
      const songs = JSON.parse(data);
      res.json(songs);
    } catch (parseError) {
      console.error('Error parsing songs JSON:', parseError);
      res.status(500).json({
        error: 'Songs JSON is invalid.'
      });
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok'
  });
});

// Only start the server if this file is executed directly (not when imported by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;