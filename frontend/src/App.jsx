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
        <div className="left-column">
          <section className="hero">
            <a href="https://github.com" className="github-icon" target="_blank" rel="noopener noreferrer">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
            </a>
            <h1>Sound Mood Atlas</h1>
            <p className="subtitle">
              Explore songs by mood. Happier tracks move right, higher-energy tracks move up. Visualize your music taste across two dimensions of emotional tone.
            </p>
          </section>

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

          <button className="upload-btn">Upload your songs</button>
        </div>

        <MoodChart songs={songs} selectedSong={selectedSong} onSelectSong={setSelectedSong} />
      </main>
  );
}

function MoodChart({ songs, selectedSong, onSelectSong }) {
  const width = 900;
  const height = 720;
  const padding = 56;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  const tempoValues = useMemo(
    () => songs.map((song) => Number(song.tempo)).filter((tempo) => Number.isFinite(tempo)),
    [songs]
  );

  const minTempo = tempoValues.length ? Math.min(...tempoValues) : 60;
  const maxTempo = tempoValues.length ? Math.max(...tempoValues) : 180;
  const tempoRange = Math.max(maxTempo - minTempo, 1);

  function getX(song) {
    return padding + song.valence * plotWidth;
  }

  function getY(song) {
    return height - padding - song.energy * plotHeight;
  }

  function getRadius(song) {
    const tempo = Number(song.tempo);
    const normalized = Number.isFinite(tempo) ? (tempo - minTempo) / tempoRange : 0.5;
    return 4 + Math.min(Math.max(normalized, 0), 1) * 10;
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
          {/* Y-axis (left vertical line) */}
          <line className="axis-line" x1={padding} y1={padding} x2={padding} y2={height - padding} />
          
          {/* X-axis (bottom horizontal line) */}
          <line className="axis-line" x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />

          {/* Axis tick marks */}
          {[0, 0.25, 0.5, 0.75, 1].map((value) => {
            const x = padding + value * plotWidth;
            const y = height - padding - value * plotHeight;
            return (
              <g key={`tick-${value}`}>
                <line className="axis-tick" x1={x} y1={height - padding} x2={x} y2={height - padding + 8} />
                <text className="axis-label" x={x} y={height - padding + 28} textAnchor="middle">
                  {value.toFixed(2)}
                </text>
                <line className="axis-tick" x1={padding - 8} y1={y} x2={padding} y2={y} />
                <text className="axis-label" x={padding - 12} y={y + 4} textAnchor="end">
                  {(1 - value).toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Optional light grid lines */}
          {[...Array(10)].map((_, i) => {
            const x = padding + ((i + 1) / 10) * plotWidth;
            const y = height - padding - ((i + 1) / 10) * plotHeight;
            return (
              <g key={`grid-${i}`}>
                <line x1={x} y1={padding} x2={x} y2={height - padding} className="grid-line" />
                <line x1={padding} y1={y} x2={width - padding} y2={y} className="grid-line" />
              </g>
            );
          })}

          {/* Axis labels */}
          <text x={padding} y={height - 18}>Sad</text>
          <text x={width - padding - 60} y={height - 18}>Happy</text>
          <text x={16} y={padding + 8}>Intense</text>
          <text x={16} y={height - padding}>Chill</text>
          <text className="axis-note" x={width - padding - 130} y={padding + 28}>
            dot size = tempo
          </text>

          {songs.map((song) => {
            const isSelected = selectedSong?.id === song.id;

            return (
                <circle
                    key={song.id}
                    cx={getX(song)}
                    cy={getY(song)}
                    r={isSelected ? Math.min(14, getRadius(song) + 2) : getRadius(song)}
                    className={isSelected ? 'song-dot selected' : 'song-dot'}
                    onMouseEnter={() => onSelectSong(song)}
                    onMouseLeave={() => onSelectSong(null)}
                    onFocus={() => onSelectSong(song)}
                    onBlur={() => onSelectSong(null)}
                    tabIndex="0"
                />
            );
          })}
        </svg>
      </section>
  );
}

export default App;