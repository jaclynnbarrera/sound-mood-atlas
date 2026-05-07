import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_URL = '/api/songs';

function App() {
  const [songs, setSongs] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [status, setStatus] = useState('Loading songs...');

  useEffect(() => {
    fetch(API_URL)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Could not load songs');
          }

          return response.json();
        })
        .then((data) => {
          setSongs(data);
          setStatus(`Loaded ${data.length} songs`);
        })
        .catch((error) => {
          console.error('Error loading songs:', error);
          setStatus('Could not load songs. Is the backend running?');
        });
  }, []);

  const genres = useMemo(() => {
    const uniqueGenres = new Set(songs.map((song) => song.genre).filter(Boolean));
    return Array.from(uniqueGenres).sort();
  }, [songs]);

  return (
      <main className="app-shell">
        <section className="hero">
          <p className="eyebrow">Prototype</p>
          <h1>Sound Mood Atlas</h1>
          <p className="subtitle">
            Explore songs by mood: happier tracks move right, higher-energy tracks move up.
          </p>
        </section>

        <section className="dashboard">
          <aside className="panel">
            <h2>Song details</h2>

            {selectedSong ? (
                <div className="song-card">
                  <h3>{selectedSong.track_name}</h3>
                  <p>{selectedSong.artist}</p>

                  <dl>
                    <div>
                      <dt>Genre</dt>
                      <dd>{selectedSong.genre || 'Unknown'}</dd>
                    </div>
                    <div>
                      <dt>Valence</dt>
                      <dd>{selectedSong.valence.toFixed(2)}</dd>
                    </div>
                    <div>
                      <dt>Energy</dt>
                      <dd>{selectedSong.energy.toFixed(2)}</dd>
                    </div>
                    <div>
                      <dt>Popularity</dt>
                      <dd>{selectedSong.popularity}</dd>
                    </div>
                  </dl>
                </div>
            ) : (
                <p className="muted">Hover over a point to inspect a song.</p>
            )}

            <div className="stats">
              <h2>Dataset</h2>
              <p>{status}</p>
              <p>{genres.length} genres found</p>
            </div>
          </aside>

          <MoodChart songs={songs} selectedSong={selectedSong} onSelectSong={setSelectedSong} />
        </section>
      </main>
  );
}

function MoodChart({ songs, selectedSong, onSelectSong }) {
  const width = 900;
  const height = 560;
  const padding = 56;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  function getX(song) {
    return padding + song.valence * plotWidth;
  }

  function getY(song) {
    return height - padding - song.energy * plotHeight;
  }

  return (
      <section className="chart-card">
        <div className="chart-header">
          <div>
            <h2>Mood map</h2>
            <p>Valence × Energy</p>
          </div>
          <span>{songs.length} tracks</span>
        </div>

        <svg className="mood-chart" viewBox={`0 0 ${width} ${height}`} role="img">
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} />

          <text x={padding} y={height - 18}>Low valence</text>
          <text x={width - padding - 86} y={height - 18}>High valence</text>
          <text x={16} y={padding + 8}>High energy</text>
          <text x={16} y={height - padding}>Low energy</text>

          <text className="quadrant-label" x={padding + 30} y={padding + 40}>
            intense / moody
          </text>
          <text className="quadrant-label" x={width - padding - 150} y={padding + 40}>
            joyful / energetic
          </text>
          <text className="quadrant-label" x={padding + 30} y={height - padding - 30}>
            calm / somber
          </text>
          <text className="quadrant-label" x={width - padding - 130} y={height - padding - 30}>
            warm / relaxed
          </text>

          {songs.map((song) => {
            const isSelected = selectedSong?.id === song.id;

            return (
                <circle
                    key={song.id}
                    cx={getX(song)}
                    cy={getY(song)}
                    r={isSelected ? 7 : 4}
                    className={isSelected ? 'song-dot selected' : 'song-dot'}
                    onMouseEnter={() => onSelectSong(song)}
                    onFocus={() => onSelectSong(song)}
                    tabIndex="0"
                />
            );
          })}
        </svg>
      </section>
  );
}

export default App;