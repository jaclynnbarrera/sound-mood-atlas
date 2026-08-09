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

function isSameSong(a, b) {
  if (!a || !b) {
    return false;
  }

  return a.track_name === b.track_name && a.artist === b.artist && a.genre === b.genre;
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
  const [pinnedSong, setPinnedSong] = useState(null);
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
    if (!pinnedSong) {
      return;
    }

    const stillVisible = filteredSongs.some((song) => isSameSong(song, pinnedSong));

    if (!stillVisible) {
      setPinnedSong(null);
    }
  }, [filteredSongs, pinnedSong]);

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
      setPinnedSong(songFromUrl);
    }

    setUrlStateReady(true);
  }, [songs, filterGenres]);

  useEffect(() => {
    if (!urlStateReady) {
      return;
    }

    writeUrlState({ genre: selectedGenre, selectedSong: pinnedSong });
  }, [selectedGenre, pinnedSong, urlStateReady]);

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
        setPinnedSong(songFromUrl);
      } else {
        setPinnedSong(null);
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
          pinnedSong={pinnedSong}
          onPinSong={setPinnedSong}
          emptyMessage={
            selectedGenre && filteredSongs.length === 0
              ? `No tracks found for “${selectedGenre}”.`
              : null
          }
        />

      </main>
  );
}

function MoodChart({ songs, pinnedSong, onPinSong, emptyMessage }) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });
  const [hoveredSong, setHoveredSong] = useState(null);
  const displaySong = hoveredSong ?? pinnedSong;
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

  useEffect(() => {
    setHoveredSong(null);
  }, [songs]);

  const width = dimensions.width;
  const height = dimensions.height;
  const margin = {
    top: 32,
    right: 44,
    bottom: 40,
    left: 48,
  };
  const plotLeft = margin.left;
  const plotRight = width - margin.right;
  const plotTop = margin.top;
  const plotBottom = height - margin.bottom;
  const plotWidth = Math.max(plotRight - plotLeft, 1);
  const plotHeight = Math.max(plotBottom - plotTop, 1);
  const innerPlotWidth = Math.max(plotWidth - dotInset * 2, 1);
  const innerPlotHeight = Math.max(plotHeight - dotInset * 2, 1);
  // Neutral (0.5, 0.5) point in plot coordinates — where the perceptual map's
  // crosshair axes cross, matching how songs themselves are positioned.
  const neutralX = plotLeft + dotInset + 0.5 * innerPlotWidth;
  const neutralY = plotBottom - dotInset - 0.5 * innerPlotHeight;

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

  // Stable per-song ids in a fixed render order — dots never get reordered or
  // remounted on hover/pin, which is what made hovering feel laggy before.
  // The active dot is instead drawn on top via a single overlay circle below.
  const idsBySong = useMemo(
    () => songs.map((song, index) => `${song.track_name}-${song.artist}-${song.genre}-${index}`),
    [songs]
  );

  function handleDotEnter(song) {
    setHoveredSong(song);
  }

  function handleDotLeave() {
    setHoveredSong(null);
  }

  function handleDotClick(event, song) {
    event.stopPropagation();
    onPinSong(isSameSong(pinnedSong, song) ? null : song);
  }

  function handleDotKeyDown(event, song) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    onPinSong(isSameSong(pinnedSong, song) ? null : song);
  }

  function handleBackgroundClick() {
    onPinSong(null);
  }

  // Anchor the card beside the pinned dot instead of the plot center: flip to
  // whichever side has more room, and keep it clear of the top/bottom edges.
  const cardHalfHeightEstimate = 115;
  const tooltipAnchor = pinnedSong
    ? {
        x: getX(pinnedSong),
        y: Math.min(
          Math.max(getY(pinnedSong), plotTop + cardHalfHeightEstimate),
          plotBottom - cardHalfHeightEstimate
        ),
        gap: getRadius(pinnedSong) + 16,
        align: getX(pinnedSong) <= plotLeft + plotWidth / 2 ? 'right' : 'left',
      }
    : null;

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
          onClick={handleBackgroundClick}
        >
          {/* Perceptual map crosshair — axes cross at the neutral midpoint
              rather than the plot corner, with directional labels at each end
              instead of numeric ticks. */}
          <line
            className="quadrant-line"
            x1={plotLeft}
            y1={neutralY}
            x2={plotRight}
            y2={neutralY}
          />
          <line
            className="quadrant-line"
            x1={neutralX}
            y1={plotTop}
            x2={neutralX}
            y2={plotBottom}
          />

          <text className="axis-end-label" x={plotLeft} y={neutralY - 12} textAnchor="start">
            ← Sad
          </text>
          <text className="axis-end-label" x={plotRight} y={neutralY - 12} textAnchor="end">
            Happy →
          </text>
          <text className="axis-end-label" x={neutralX} y={plotTop - 14} textAnchor="middle">
            ↑ Intense
          </text>
          <text className="axis-end-label" x={neutralX} y={plotBottom + 24} textAnchor="middle">
            ↓ Chill
          </text>

          {songs.map((song, index) => {
            const isSelected = isSameSong(displaySong, song);
            const isPinned = isSameSong(pinnedSong, song);

            return (
                <circle
                    key={idsBySong[index]}
                    cx={getX(song)}
                    cy={getY(song)}
                    r={getRadius(song)}
                    fill={danceabilityColor(song.danceability)}
                    className={isSelected ? 'song-dot is-active' : 'song-dot'}
                    onMouseEnter={() => handleDotEnter(song)}
                    onMouseLeave={handleDotLeave}
                    onFocus={() => handleDotEnter(song)}
                    onBlur={handleDotLeave}
                    onClick={(event) => handleDotClick(event, song)}
                    onKeyDown={(event) => handleDotKeyDown(event, song)}
                    role="button"
                    aria-pressed={isPinned}
                    aria-label={`${song.track_name} by ${song.artist}${isPinned ? ', pinned' : ''}`}
                    tabIndex="0"
                />
            );
          })}

          {/* Single overlay for the active dot's glow — avoids reordering/animating
              every dot's own filter, which is what caused the hover lag. */}
          {displaySong ? (
            <circle
                className="song-dot-highlight"
                cx={getX(displaySong)}
                cy={getY(displaySong)}
                r={getRadius(displaySong)}
                fill={danceabilityColor(displaySong.danceability)}
                pointerEvents="none"
            />
          ) : null}
        </svg>
            <div className={`chart-dim-overlay${pinnedSong ? ' is-active' : ''}`} aria-hidden="true" />
            <SongTooltip song={pinnedSong} anchor={tooltipAnchor} onClose={() => onPinSong(null)} />
          </div>
        </div>
      </section>
  );
}

function SongTooltip({ song, anchor, onClose }) {
  const visible = Boolean(song);
  // Keep rendering the last song's content (and position) through the exit
  // transition — without this, the card would vanish/jump instead of
  // animating out in place.
  const [renderedSong, setRenderedSong] = useState(song);
  const [renderedAnchor, setRenderedAnchor] = useState(anchor);

  useEffect(() => {
    if (song && anchor) {
      setRenderedSong(song);
      setRenderedAnchor(anchor);
    }
  }, [song, anchor]);

  function handleTransitionEnd(event) {
    if (event.target === event.currentTarget && !visible) {
      setRenderedSong(null);
    }
  }

  const align = renderedAnchor?.align ?? 'right';
  const gap = renderedAnchor?.gap ?? 0;
  const anchorX = renderedAnchor?.x ?? 0;
  const anchorY = renderedAnchor?.y ?? 0;
  const left = align === 'left' ? anchorX - gap : anchorX + gap;
  const tooltipTx = align === 'left' ? '-100%' : '0%';

  return (
    <div
      className={`song-tooltip${visible ? ' is-visible' : ''}`}
      style={{ left: `${left}px`, top: `${anchorY}px`, '--tooltip-tx': tooltipTx }}
      role="tooltip"
      aria-hidden={!visible}
      onTransitionEnd={handleTransitionEnd}
    >
      {renderedSong ? (
        <div className="song-tooltip-card" key={`${renderedSong.track_name}-${renderedSong.artist}-${renderedSong.genre}`}>
          <button
            type="button"
            className="song-tooltip-close"
            onClick={onClose}
            aria-label="Close song details"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" />
            </svg>
          </button>
          <h3 className="song-tooltip-title">{renderedSong.track_name}</h3>
          <p className="song-tooltip-artist">{renderedSong.artist}</p>
          <dl className="song-tooltip-stats">
            <div>
              <dt>Genre</dt>
              <dd>{renderedSong.genre || 'Unknown'}</dd>
            </div>
            <div>
              <dt>Valence</dt>
              <dd>{renderedSong.valence.toFixed(2)}</dd>
            </div>
            <div>
              <dt>Energy</dt>
              <dd>{renderedSong.energy.toFixed(2)}</dd>
            </div>
            <div>
              <dt>Danceability</dt>
              <dd>{Number(renderedSong.danceability).toFixed(2)}</dd>
            </div>
            <div>
              <dt>Popularity</dt>
              <dd>{renderedSong.popularity}</dd>
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