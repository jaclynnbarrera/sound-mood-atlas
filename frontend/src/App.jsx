import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const API_URL = '/api/songs';
const ALL_GENRES = '';

function readUrlState() {
  const params = new URLSearchParams(window.location.search);

  return {
    genre: params.get('genre') ?? '',
    track: params.get('track'),
    artist: params.get('artist'),
    songGenre: params.get('songGenre'),
  };
}

function writeUrlState({ genre, selectedSong }) {
  const params = new URLSearchParams();

  if (genre) {
    params.set('genre', genre);
  }

  if (selectedSong) {
    params.set('track', selectedSong.track_name);
    params.set('artist', selectedSong.artist);
    if (selectedSong.genre) {
      params.set('songGenre', selectedSong.genre);
    }
  }

  const search = params.toString();
  const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextUrl !== currentUrl) {
    window.history.replaceState(null, '', nextUrl);
  }
}

function findSongFromUrl(songs, { track, artist, songGenre }) {
  if (!track || !artist) {
    return null;
  }

  if (songGenre) {
    const exactMatch = songs.find(
      (song) =>
        song.track_name === track && song.artist === artist && song.genre === songGenre
    );

    if (exactMatch) {
      return exactMatch;
    }
  }

  return songs.find((song) => song.track_name === track && song.artist === artist) ?? null;
}

function App() {
  const [songs, setSongs] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState(ALL_GENRES);
  const [status, setStatus] = useState('Loading songs...');
  const [urlStateReady, setUrlStateReady] = useState(false);
  const hydratedFromUrlRef = useRef(false);

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

  const filteredSongs = useMemo(() => {
    if (!selectedGenre) {
      return songs;
    }

    return songs.filter((song) => song.genre === selectedGenre);
  }, [songs, selectedGenre]);

  useEffect(() => {
    if (!selectedSong) {
      return;
    }

    const stillVisible = filteredSongs.some(
      (song) =>
        song.track_name === selectedSong.track_name &&
        song.artist === selectedSong.artist &&
        song.genre === selectedSong.genre
    );

    if (!stillVisible) {
      setSelectedSong(null);
    }
  }, [filteredSongs, selectedSong]);

  useEffect(() => {
    if (!songs.length || hydratedFromUrlRef.current) {
      return;
    }

    hydratedFromUrlRef.current = true;

    const { genre, track, artist, songGenre } = readUrlState();
    const validGenre = genre && genres.includes(genre) ? genre : ALL_GENRES;

    setSelectedGenre(validGenre);

    const songFromUrl = findSongFromUrl(songs, { track, artist, songGenre });
    if (songFromUrl && (!validGenre || songFromUrl.genre === validGenre)) {
      setSelectedSong(songFromUrl);
    }

    setUrlStateReady(true);
  }, [songs, genres]);

  useEffect(() => {
    if (!urlStateReady) {
      return;
    }

    writeUrlState({ genre: selectedGenre, selectedSong });
  }, [selectedGenre, selectedSong, urlStateReady]);

  useEffect(() => {
    if (!songs.length) {
      return;
    }

    function handlePopState() {
      const { genre, track, artist, songGenre } = readUrlState();
      const validGenre = genre && genres.includes(genre) ? genre : ALL_GENRES;

      setSelectedGenre(validGenre);

      const songFromUrl = findSongFromUrl(songs, { track, artist, songGenre });
      if (songFromUrl && (!validGenre || songFromUrl.genre === validGenre)) {
        setSelectedSong(songFromUrl);
      } else {
        setSelectedSong(null);
      }
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [songs, genres]);

  const trackCountLabel =
    selectedGenre && filteredSongs.length !== songs.length
      ? `${filteredSongs.length} of ${songs.length} tracks`
      : `${songs.length} tracks`;

  return (
      <main className="app-shell">
        <header className="page-header page-header-left">
          <h1>Sound Mood Atlas</h1>
          <a
            href="https://github.com/jaclynnbarrera/sound-mood-atlas"
            className="github-icon"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View Sound Mood Atlas on GitHub"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
          </a>
        </header>

        <GenreFilterBar
          genres={genres}
          selectedGenre={selectedGenre}
          onGenreChange={setSelectedGenre}
          trackCountLabel={trackCountLabel}
        />

        <div className="left-column">
          <p className="subtitle">
            Explore songs by mood. Happier tracks move right, higher-energy tracks move up. Visualize your music taste across two dimensions of emotional tone.
          </p>

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

          <ChartLegend />

          <button className="upload-btn">Upload your songs</button>
        </div>

        <MoodChart
          songs={filteredSongs}
          selectedSong={selectedSong}
          onSelectSong={setSelectedSong}
          emptyMessage={
            selectedGenre && filteredSongs.length === 0
              ? `No tracks found for “${selectedGenre}”.`
              : null
          }
        />
      </main>
  );
}

function MoodChart({ songs, selectedSong, onSelectSong, emptyMessage }) {
  const width = 900;
  const height = 760;
  const margin = { top: 40, right: 40, bottom: 52, left: 36 };
  const sparseTicks = [0, 0.5, 1];
  const plotLeft = margin.left;
  const plotRight = width - margin.right;
  const plotTop = margin.top;
  const plotBottom = height - margin.bottom;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;

  const tempoValues = useMemo(
    () => songs.map((song) => Number(song.tempo)).filter((tempo) => Number.isFinite(tempo)),
    [songs]
  );

  const minTempo = tempoValues.length ? Math.min(...tempoValues) : 60;
  const maxTempo = tempoValues.length ? Math.max(...tempoValues) : 180;
  const tempoRange = Math.max(maxTempo - minTempo, 1);

  function getX(song) {
    return plotLeft + song.valence * plotWidth;
  }

  function getY(song) {
    return plotBottom - song.energy * plotHeight;
  }

  function getRadius(song) {
    const tempo = Number(song.tempo);
    const normalized = Number.isFinite(tempo) ? (tempo - minTempo) / tempoRange : 0.5;
    return 4 + Math.min(Math.max(normalized, 0), 1) * 10;
  }

  return (
      <section className="chart-card">
        <div className="chart-body">
          {emptyMessage ? (
            <p className="chart-empty">{emptyMessage}</p>
          ) : null}
          <div className="chart-frame">
            <p className="chart-axis-label chart-axis-label-y">Energy</p>
            <div className="chart-plot-wrap">
        <svg
          className="mood-chart"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMinYMin meet"
          role="img"
        >
          <defs>
            <radialGradient id="song-dot-gradient" cx="32%" cy="28%" r="72%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#f0ebff" />
              <stop offset="100%" stopColor="#b794ff" />
            </radialGradient>
          </defs>

          {/* Y-axis (left vertical line) */}
          <line className="axis-line" x1={plotLeft} y1={plotTop} x2={plotLeft} y2={plotBottom} />

          {/* X-axis (bottom horizontal line) */}
          <line className="axis-line" x1={plotLeft} y1={plotBottom} x2={plotRight} y2={plotBottom} />

          {/* Sparse axis ticks (0, 0.5, 1) */}
          {sparseTicks.map((value) => {
            const x = plotLeft + value * plotWidth;
            const y = plotBottom - value * plotHeight;
            const tickLabel = value.toFixed(1);

            return (
              <g key={`tick-${value}`}>
                <line className="axis-tick" x1={x} y1={plotBottom} x2={x} y2={plotBottom + 8} />
                <text className="axis-label" x={x} y={plotBottom + 26} textAnchor="middle">
                  {tickLabel}
                </text>
                <line className="axis-tick" x1={plotLeft - 8} y1={y} x2={plotLeft} y2={y} />
                <text className="axis-label" x={plotLeft - 20} y={y + 4} textAnchor="end">
                  {tickLabel}
                </text>
              </g>
            );
          })}

          {/* Optional light grid lines */}
          {[...Array(10)].map((_, i) => {
            const x = plotLeft + ((i + 1) / 10) * plotWidth;
            const y = plotBottom - ((i + 1) / 10) * plotHeight;
            return (
              <g key={`grid-${i}`}>
                <line x1={x} y1={plotTop} x2={x} y2={plotBottom} className="grid-line" />
                <line x1={plotLeft} y1={y} x2={plotRight} y2={y} className="grid-line" />
              </g>
            );
          })}

          {[...songs]
            .sort((a, b) => {
              const aSelected =
                selectedSong?.track_name === a.track_name &&
                selectedSong?.artist === a.artist &&
                selectedSong?.genre === a.genre;
              const bSelected =
                selectedSong?.track_name === b.track_name &&
                selectedSong?.artist === b.artist &&
                selectedSong?.genre === b.genre;

              if (aSelected === bSelected) {
                return 0;
              }

              return aSelected ? 1 : -1;
            })
            .map((song, index) => {
            const isSelected =
              selectedSong?.track_name === song.track_name &&
              selectedSong?.artist === song.artist &&
              selectedSong?.genre === song.genre;

            return (
                <circle
                    key={`${song.track_name}-${song.artist}-${song.genre}-${index}`}
                    cx={getX(song)}
                    cy={getY(song)}
                    r={getRadius(song)}
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
            </div>
          </div>
          <p className="chart-axis-label chart-axis-label-x">Valence</p>
        </div>
      </section>
  );
}

function GenreFilterBar({ genres, selectedGenre, onGenreChange, trackCountLabel }) {
  return (
    <div className="chart-filter-bar">
      <span className="chart-filter-label">Genre</span>
      <div className="chart-filter-scroll">
        <div className="chart-filter-options" role="group" aria-label="Filter by genre">
          <button
            type="button"
            className={`chart-filter-chip${selectedGenre === ALL_GENRES ? ' is-active' : ''}`}
            aria-pressed={selectedGenre === ALL_GENRES}
            onClick={() => onGenreChange(ALL_GENRES)}
          >
            All
          </button>
          {genres.map((genre) => (
            <button
              key={genre}
              type="button"
              className={`chart-filter-chip${selectedGenre === genre ? ' is-active' : ''}`}
              aria-pressed={selectedGenre === genre}
              onClick={() => onGenreChange(genre)}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>
      <span className="chart-filter-meta">{trackCountLabel}</span>
    </div>
  );
}

function ChartLegend() {
  return (
    <div className="chart-legend" aria-label="How to read the mood map">
      <h3 className="chart-legend-heading">How to read this map</h3>
      <p className="chart-legend-intro">
        Each dot is a song. Position shows mood; size shows tempo.
      </p>

      <div className="chart-legend-axes">
        <div className="chart-legend-axis-row">
          <span className="chart-legend-axis-arrow" aria-hidden="true">←</span>
          <span className="chart-legend-axis-name">Valence</span>
          <span className="chart-legend-axis-scale">sad ········· happy</span>
          <span className="chart-legend-axis-arrow" aria-hidden="true">→</span>
        </div>
        <div className="chart-legend-axis-row">
          <span className="chart-legend-axis-arrow" aria-hidden="true">↑</span>
          <span className="chart-legend-axis-name">Energy</span>
          <span className="chart-legend-axis-scale">chill ········· intense</span>
        </div>
      </div>

      <div className="chart-legend-tempo">
        <p className="chart-legend-subheading">Dot size = tempo</p>
        <div className="chart-legend-scale">
          {[
            { r: 4, label: 'Slower' },
            { r: 9, label: 'Mid' },
            { r: 14, label: 'Faster' },
          ].map(({ r, label }) => (
            <div key={label} className="chart-legend-item">
              <svg className="chart-legend-dot" viewBox="0 0 40 40" aria-hidden="true">
                <defs>
                  <radialGradient id={`legend-dot-gradient-${r}`} cx="32%" cy="28%" r="72%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="45%" stopColor="#f0ebff" />
                    <stop offset="100%" stopColor="#b794ff" />
                  </radialGradient>
                </defs>
                <circle cx="20" cy="20" r={r} fill={`url(#legend-dot-gradient-${r})`} />
              </svg>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;