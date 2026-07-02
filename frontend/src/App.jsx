import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const SONGS_URL = '/songs.json';
const ALL_GENRES = '';
const FILTER_GENRES = ['dance', 'hip-hop', 'indie', 'latin', 'pop', 'reggae', 'rock'];

function formatGenreLabel(genre) {
  if (genre === 'hip-hop') {
    return 'hip hop';
  }

  return genre;
}

const DANCEABILITY_COLOR_LOW = [110, 158, 200];
const DANCEABILITY_COLOR_HIGH = [232, 168, 106];

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function danceabilityColor(danceability) {
  const t = clamp01(Number(danceability) || 0);
  const r = Math.round(
    DANCEABILITY_COLOR_LOW[0] + (DANCEABILITY_COLOR_HIGH[0] - DANCEABILITY_COLOR_LOW[0]) * t
  );
  const g = Math.round(
    DANCEABILITY_COLOR_LOW[1] + (DANCEABILITY_COLOR_HIGH[1] - DANCEABILITY_COLOR_LOW[1]) * t
  );
  const b = Math.round(
    DANCEABILITY_COLOR_LOW[2] + (DANCEABILITY_COLOR_HIGH[2] - DANCEABILITY_COLOR_LOW[2]) * t
  );

  return `rgb(${r}, ${g}, ${b})`;
}

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
  const [urlStateReady, setUrlStateReady] = useState(false);
  const hydratedFromUrlRef = useRef(false);

  useEffect(() => {
    fetch(SONGS_URL)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Could not load songs');
          }

          return response.json();
        })
        .then((data) => {
          setSongs(data);
        })
        .catch((error) => {
          console.error('Error loading songs:', error);
        });
  }, []);

  const filterGenres = useMemo(() => {
    const available = new Set(songs.map((song) => song.genre).filter(Boolean));
    return FILTER_GENRES.filter((genre) => available.has(genre));
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
    const validGenre = genre && filterGenres.includes(genre) ? genre : ALL_GENRES;

    setSelectedGenre(validGenre);

    const songFromUrl = findSongFromUrl(songs, { track, artist, songGenre });
    if (songFromUrl && (!validGenre || songFromUrl.genre === validGenre)) {
      setSelectedSong(songFromUrl);
    }

    setUrlStateReady(true);
  }, [songs, filterGenres]);

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
      const validGenre = genre && filterGenres.includes(genre) ? genre : ALL_GENRES;

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
  }, [songs, filterGenres]);

  const trackCountLabel =
    songs.length === 0
      ? 'Loading…'
      : selectedGenre && filteredSongs.length !== songs.length
        ? `${filteredSongs.length} of ${songs.length} tracks`
        : `${songs.length} tracks`;

  return (
      <main className="app-shell">
        <header className="page-header">
          <div className="page-header-brand">
            <h1>Sound Mood Atlas</h1>
            <p className="page-header-tagline">
              Mapping songs by <strong>mood, tempo &amp; danceability</strong>
            </p>
          </div>
          <a
            href="https://github.com/jaclynnbarrera/sound-mood-atlas"
            className="github-icon"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Sound Mood Atlas on GitHub — Naomi Barrera"
            title="GitHub — Naomi Barrera (@jaclynnbarrera)"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
          </a>
        </header>

        <GenreFilterBar
          genres={filterGenres}
          selectedGenre={selectedGenre}
          onGenreChange={setSelectedGenre}
          trackCountLabel={trackCountLabel}
        />

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
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });
  const axisDisplayMax = 2;
  const xTickFractions = [0, 0.25, 0.5, 0.75, 1];
  const yTickFractions = [0, 0.5, 1];
  const dotInset = 18;

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return undefined;
    }

    const updateSize = () => {
      const { width, height } = node.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setDimensions({ width: Math.round(width), height: Math.round(height) });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const width = dimensions.width;
  const height = dimensions.height;
  const margin = {
    top: 28,
    right: 24,
    bottom: 44,
    left: 40,
  };
  const plotLeft = margin.left;
  const plotRight = width - margin.right;
  const plotTop = margin.top;
  const plotBottom = height - margin.bottom;
  const plotWidth = Math.max(plotRight - plotLeft, 1);
  const plotHeight = Math.max(plotBottom - plotTop, 1);
  const innerPlotWidth = Math.max(plotWidth - dotInset * 2, 1);
  const innerPlotHeight = Math.max(plotHeight - dotInset * 2, 1);
  const plotCenterX = (plotLeft + plotRight) / 2;
  const plotCenterY = (plotTop + plotBottom) / 2;

  function formatAxisLabel(fraction) {
    return (fraction * axisDisplayMax).toFixed(1);
  }

  const tempoValues = useMemo(
    () => songs.map((song) => Number(song.tempo)).filter((tempo) => Number.isFinite(tempo)),
    [songs]
  );

  const minTempo = tempoValues.length ? Math.min(...tempoValues) : 60;
  const maxTempo = tempoValues.length ? Math.max(...tempoValues) : 180;
  const tempoRange = Math.max(maxTempo - minTempo, 1);

  function getX(song) {
    return plotLeft + dotInset + song.valence * innerPlotWidth;
  }

  function getY(song) {
    return plotBottom - dotInset - song.energy * innerPlotHeight;
  }

  function getRadius(song) {
    const tempo = Number(song.tempo);
    const normalized = Number.isFinite(tempo) ? (tempo - minTempo) / tempoRange : 0.5;
    return 4 + Math.min(Math.max(normalized, 0), 1) * 10;
  }

  function handleDotEnter(song) {
    onSelectSong(song);
  }

  function handleDotLeave() {
    onSelectSong(null);
  }

  return (
      <section className="chart-card">
        <div className="chart-body">
          {emptyMessage ? (
            <p className="chart-empty">{emptyMessage}</p>
          ) : null}
          <div className="chart-plot-wrap" ref={containerRef}>
        <svg
          className="mood-chart"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
        >
          {/* Y-axis (left vertical line) */}
          <line className="axis-line" x1={plotLeft} y1={plotTop} x2={plotLeft} y2={plotBottom} />

          {/* X-axis (bottom horizontal line) */}
          <line className="axis-line" x1={plotLeft} y1={plotBottom} x2={plotRight} y2={plotBottom} />

          {/* Sparse axis ticks (display 0–2 on valence, 0–2 on energy) */}
          {xTickFractions.map((fraction) => {
            const x = plotLeft + fraction * plotWidth;
            const tickLabel = formatAxisLabel(fraction);

            return (
              <g key={`x-tick-${fraction}`}>
                <line className="axis-tick" x1={x} y1={plotBottom} x2={x} y2={plotBottom + 8} />
                <text className="axis-label" x={x} y={plotBottom + 26} textAnchor="middle">
                  {tickLabel}
                </text>
              </g>
            );
          })}

          {yTickFractions.map((fraction) => {
            const y = plotBottom - fraction * plotHeight;
            const tickLabel = formatAxisLabel(fraction);

            return (
              <g key={`y-tick-${fraction}`}>
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
                    fill={danceabilityColor(song.danceability)}
                    className={isSelected ? 'song-dot selected' : 'song-dot'}
                    onMouseEnter={() => handleDotEnter(song)}
                    onMouseLeave={handleDotLeave}
                    onFocus={() => handleDotEnter(song)}
                    onBlur={handleDotLeave}
                    tabIndex="0"
                />
            );
          })}
        </svg>
            <SongTooltip song={selectedSong} centerX={plotCenterX} centerY={plotCenterY} />
          </div>
        </div>
      </section>
  );
}

function SongTooltip({ song, centerX, centerY }) {
  const visible = Boolean(song);

  return (
    <div
      className={`song-tooltip${visible ? ' is-visible' : ''}`}
      style={{ left: `${centerX}px`, top: `${centerY}px` }}
      role="tooltip"
      aria-hidden={!visible}
    >
      {song ? (
        <div className="song-tooltip-card" key={`${song.track_name}-${song.artist}-${song.genre}`}>
          <h3 className="song-tooltip-title">{song.track_name}</h3>
          <p className="song-tooltip-artist">{song.artist}</p>
          <dl className="song-tooltip-stats">
            <div>
              <dt>Genre</dt>
              <dd>{song.genre || 'Unknown'}</dd>
            </div>
            <div>
              <dt>Valence</dt>
              <dd>{song.valence.toFixed(2)}</dd>
            </div>
            <div>
              <dt>Energy</dt>
              <dd>{song.energy.toFixed(2)}</dd>
            </div>
            <div>
              <dt>Danceability</dt>
              <dd>{Number(song.danceability).toFixed(2)}</dd>
            </div>
            <div>
              <dt>Popularity</dt>
              <dd>{song.popularity}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}

function GenreFilterBar({ genres, selectedGenre, onGenreChange, trackCountLabel }) {
  return (
    <div className="chart-filter-bar">
      <div className="chart-filter-genre">
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
                {formatGenreLabel(genre)}
              </button>
            ))}
          </div>
        </div>
        <span className="chart-filter-meta">{trackCountLabel}</span>
      </div>

      <div className="chart-filter-legend-area">
        <EncodingLegend />
        <MapGuide />
      </div>
    </div>
  );
}

function MapGuide() {
  return (
    <div className="map-guide" aria-label="How to read the mood map">
      <p className="map-guide-intro">
        Each dot is a song. Position shows mood; size shows tempo; color shows danceability.
      </p>
      <div className="map-guide-axes">
        <div className="map-guide-axis-row">
          <span className="map-guide-axis-arrow" aria-hidden="true">←</span>
          <span className="map-guide-axis-name">Valence</span>
          <span className="map-guide-axis-scale">sad ········· happy</span>
          <span className="map-guide-axis-arrow" aria-hidden="true">→</span>
        </div>
        <div className="map-guide-axis-row">
          <span className="map-guide-axis-arrow" aria-hidden="true">↑</span>
          <span className="map-guide-axis-name">Energy</span>
          <span className="map-guide-axis-scale">chill ········· intense</span>
        </div>
      </div>
    </div>
  );
}

function EncodingLegend() {
  return (
    <div className="encoding-legend" aria-label="Dot encoding legend">
      <p className="encoding-legend-label">Dot color = danceability</p>
      <p className="encoding-legend-label">Dot size = tempo</p>

      <div
        className="encoding-legend-colorbar"
        role="img"
        aria-label="Danceability color scale from low cool blue to high warm gold"
      />

      <div className="encoding-legend-tempo-dots" aria-hidden="true">
        {[
          { r: 4, label: 'Slower' },
          { r: 9, label: 'Mid' },
          { r: 14, label: 'Faster' },
        ].map(({ r, label }) => (
          <svg key={label} className="encoding-legend-dot" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r={r} fill="rgba(255, 255, 255, 0.85)" />
          </svg>
        ))}
      </div>

      <div className="encoding-legend-colorbar-labels">
        <span>Low</span>
        <span>High</span>
      </div>

      <div className="encoding-legend-tempo-labels">
        <span>Slower</span>
        <span>Mid</span>
        <span>Faster</span>
      </div>
    </div>
  );
}

export default App;