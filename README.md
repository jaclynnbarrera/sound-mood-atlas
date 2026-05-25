# Sound Mood Atlas

An interactive mood map for exploring music by **valence** and **energy**. Each dot is a track—position shows emotional tone, size shows tempo. Built as a portfolio piece combining data visualization, UI design, and full-stack web development.

**Repository:** [github.com/jaclynnbarrera/sound-mood-atlas](https://github.com/jaclynnbarrera/sound-mood-atlas)

**Live demo:** _Coming soon — add your deployed URL here_

<img width="1502" height="875" alt="Screenshot 2026-05-25 at 11 55 34 AM" src="https://github.com/user-attachments/assets/b923ed6b-3ea0-4109-8b05-31fa77816b5f" />

---

## Features

- **Mood scatter plot** — valence (horizontal) × energy (vertical), inspired by Spotify-style audio features
- **Genre filter bar** — horizontal chip filters above the chart
- **Interactive dots** — hover to inspect a song; gradient fill with glow and zoom
- **Shareable URLs** — genre and selected track sync to the address bar (`?genre=pop&track=…&artist=…`)
- **Song details panel** — track, artist, genre, valence, energy, popularity
- **How-to-read legend** — axis meaning, tempo scale, and map guide in the sidebar
- **Responsive layout** — full-viewport desktop dashboard; stacked layout on smaller screens

---

## Tech stack

| Layer | Tools |
|--------|--------|
| Frontend | React 19, Vite |
| Backend | Node.js, Express 5 |
| Data | CSV → JSON build pipeline (`songs.json`) |
| Visualization | SVG scatter plot, CSS |
| Tests | Node built-in test runner (API + data pipeline) |

---

## Project structure

```
sound-mood-atlas/
├── frontend/              # React app (Vite)
│   ├── src/
│   └── public/
├── backend/
│   ├── src/server.js      # API server
│   ├── data/
│   │   ├── dataset.csv    # source data (optional)
│   │   └── songs.json     # chart dataset
│   ├── scripts/
│   │   └── buildChartData.js
│   └── test/
└── README.md
```

---

## Getting started

### Prerequisites

- Node.js 18+ (20+ recommended)
- npm

### Install dependencies

```bash
cd frontend && npm install
cd ../backend && npm install
```

### Data

The API reads `backend/data/songs.json`. A built file is included in the repo.

To regenerate from CSV (requires `backend/data/dataset.csv`):

```bash
cd backend
npm run build:data
```

This keeps the **top 250 rows by popularity** from the dataset.

### Run locally (development)

Use two terminals:

**Terminal 1 — API**

```bash
cd backend
npm start
```

Runs at [http://localhost:3000](http://localhost:3000) (`/api/songs`, `/api/health`).

**Terminal 2 — Frontend**

```bash
cd frontend
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173) with `/api` proxied to the backend (see `frontend/vite.config.js`).

### Production build (frontend)

```bash
cd frontend
npm run build
```

Output: `frontend/dist/`. For a single production URL, serve this folder from Express alongside the API (see Deployment).

---

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check `{ "status": "ok" }` |
| `GET /api/songs` | Array of song objects for the chart |

Example song object:

```json
{
  "track_name": "Example",
  "artist": "Artist Name",
  "genre": "pop",
  "valence": 0.85,
  "energy": 0.72,
  "tempo": 120.5,
  "danceability": 0.65,
  "popularity": 90
}
```

---

## URL state

Share or bookmark views:

| Param | Meaning |
|--------|---------|
| `genre` | Active genre filter (omit for all genres) |
| `track` | Selected track name |
| `artist` | Selected artist |
| `songGenre` | Genre for that row (disambiguates duplicate tracks) |

Example:

```
/?genre=pop&track=Song%20Name&artist=Artist%20Name&songGenre=pop
```

---

## Tests

```bash
cd backend
npm test
```

Covers the health check, songs API error handling, and the chart data build script.

---

## Deployment

**Recommended:** one Node service (e.g. [Render](https://render.com)) that:

1. Builds the frontend: `cd frontend && npm ci && npm run build`
2. Serves `frontend/dist` from Express alongside `/api/*`
3. Starts with: `cd backend && npm start`

> **Note:** In development, Vite and the API run as separate processes. For production, Express should serve the Vite build so the app and API share one origin.

Environment:

- `PORT` — set by the host (defaults to `3000` locally)

---

## Design notes

- **Valence** → horizontal axis (sad ↔ happy)
- **Energy** → vertical axis (chill ↔ intense)
- **Tempo** → dot radius
- Axis titles and a sidebar legend explain the map without cluttering the plot area
- The source dataset can list the same track multiple times with different genre tags; use the genre filter to explore subsets

---

## Roadmap

- [ ] Live deployment URL
- [ ] Dedupe tracks (one dot per song) and tune dataset size
- [ ] Search by track or artist
- [ ] CSV upload or demo playlists for “Upload your songs”
- [ ] Screenshots and case study write-up

---

## Author

[Jaclyn Barrera](https://github.com/jaclynnbarrera) — [Sound Mood Atlas](https://github.com/jaclynnbarrera/sound-mood-atlas)

---

## License

ISC
