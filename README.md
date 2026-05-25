# Sound Mood Atlas

An interactive mood map for exploring music by **valence** and **energy**. Each dot is a track—position shows emotional tone, size shows tempo. Built as a portfolio piece combining data visualization, UI design, front-end development, and a Node.js data pipeline.

**Repository:** [github.com/jaclynnbarrera/sound-mood-atlas](https://github.com/jaclynnbarrera/sound-mood-atlas)

**Live demo:** _Add your Vercel URL after deploy — see [Deployment](#deployment)_

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
| Frontend | React 19, Vite, deployed on Vercel |
| Data pipeline | Node.js script (`backend/scripts/buildChartData.js`) |
| Chart data | Static `frontend/public/songs.json` |
| Visualization | SVG scatter plot, CSS |
| Tests | Node built-in test runner (data pipeline + optional Express API) |

The live app loads chart data from a static JSON file. The **backend** folder holds the CSV → JSON build script and an optional Express server for local API development.

---

## Project structure

```
sound-mood-atlas/
├── frontend/
│   ├── public/
│   │   └── songs.json       # chart dataset (served in dev & production)
│   ├── src/
│   └── vercel.json          # SPA routing for deploy
├── backend/
│   ├── data/
│   │   └── dataset.csv      # source data (optional)
│   ├── scripts/
│   │   └── buildChartData.js
│   ├── src/server.js        # optional local API
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

The chart reads **`frontend/public/songs.json`**. A built file is included in the repo.

To regenerate from CSV (requires `backend/data/dataset.csv`):

```bash
cd backend
npm run build:data
```

This writes the **top 250 rows by popularity** to `frontend/public/songs.json` (and keeps a copy in `backend/data/songs.json` for reference).

### Run locally

**One terminal is enough:**

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite serves `public/songs.json` at `/songs.json`.

**Optional — Express API** (same data, for testing the API):

```bash
cd backend
npm start
```

Then use `http://localhost:3000/api/songs` (not used by the Vite app by default).

### Production build

```bash
cd frontend
npm run build
npm run preview
```

Output: `frontend/dist/`.

---

## Song data shape

Each item in `songs.json`:

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

Covers the chart data build script and optional Express API routes (`/api/songs`, `/api/health`).

---

## Deployment

### Vercel (recommended)

1. Push this repo to GitHub.
2. [vercel.com](https://vercel.com) → **Add New Project** → import `sound-mood-atlas`.
3. Set **Root Directory** to `frontend`.
4. Framework preset: **Vite** (defaults are usually fine).
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
5. Deploy → copy your URL (e.g. `https://sound-mood-atlas.vercel.app`).
6. Paste it into the **Live demo** line at the top of this README.

`frontend/vercel.json` rewrites routes to `index.html` so URL query params (genre, track, etc.) work on refresh.

**Before deploy:** ensure `frontend/public/songs.json` exists (run `npm run build:data` in `backend/` if needed).

### Regenerating data after deploy

Vercel serves whatever `songs.json` is in the repo. To update the chart:

1. Run `cd backend && npm run build:data`
2. Commit `frontend/public/songs.json`
3. Push → Vercel redeploys automatically

---

## Design notes

- **Valence** → horizontal axis (sad ↔ happy)
- **Energy** → vertical axis (chill ↔ intense)
- **Tempo** → dot radius
- Axis titles and a sidebar legend explain the map without cluttering the plot area
- The source dataset can list the same track multiple times with different genre tags; use the genre filter to explore subsets

---

## Roadmap

- [x] Static JSON + Vercel deploy path
- [ ] Live deployment URL in README
- [ ] Dedupe tracks (one dot per song) and tune dataset size
- [ ] Search by track or artist
- [ ] CSV upload or demo playlists for “Upload your songs”

---

## Author

[Jaclyn Barrera](https://github.com/jaclynnbarrera) — [Sound Mood Atlas](https://github.com/jaclynnbarrera/sound-mood-atlas)

---

## License

ISC
