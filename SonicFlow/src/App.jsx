import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Music, Video, Search, Loader2 } from 'lucide-react';
import ReactPlayer from 'react-player';
import SettingsBar from './components/SettingsBar';
import './App.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
          <h2>Something went wrong.</h2>
          <p className="error-msg">{this.state.error?.message}</p>
          <button className="search-btn" onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop';

const formatDuration = (val) => {
  if (typeof val === 'number') {
    return `${Math.floor(val / 60)}:${String(val % 60).padStart(2, '0')}`;
  }
  return val || '--:--';
};

const MusicRow = ({ item, activeVideoId, onPlay, onDownload }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [played, setPlayed] = useState(0);

  const videoId = React.useMemo(() => {
    try {
      if (!item.url) return null;
      const match = item.url.match(/(?:v=|\/)([\w-]{11})(?:\?|&|\/|$)/);
      return match ? match[1] : null;
    } catch (e) { return null; }
  }, [item.url]);

  React.useEffect(() => {
    if (activeVideoId && activeVideoId !== videoId) {
      setIsPlaying(false);
      setIsPaused(false);
      setIsLoading(false);
      setPlayed(0);
    }
  }, [activeVideoId, videoId]);

  const handlePlayClick = (e) => {
    e.stopPropagation();
    if (onPlay) onPlay(videoId);
    setIsPlaying(true);
    setIsPaused(false);
    setIsLoading(true);
    setPlayed(0);
  };

  const handleTogglePlay = (e) => {
    e.stopPropagation();
    setIsPaused(!isPaused);
  };

  const handleStopClick = (e) => {
    e.stopPropagation();
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoading(false);
    setPlayed(0);
  };

  return (
    <div className="pl-item" style={{ position: 'relative' }}>
      {isPlaying && videoId && (
        <div style={{ position: 'absolute', width: '0', height: '0', opacity: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <ReactPlayer
            url={`https://www.youtube.com/watch?v=${videoId}`}
            playing={isPlaying && !isPaused}
            controls={false}
            width="1px"
            height="1px"
            onProgress={(state) => setPlayed(state.played)}
            onEnded={handleStopClick}
            onBuffer={() => setIsLoading(true)}
            onBufferEnd={() => setIsLoading(false)}
            onReady={() => setIsLoading(false)}
            onError={() => {
              console.error('Player error for', videoId);
              setIsPlaying(false);
            }}
          />
        </div>
      )}

      {/* Left Thumbnail (Square) */}
      <div
        className={`preview-wrapper ${isPlaying ? 'playing' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: '80px', height: '80px', position: 'relative', borderRadius: '8px', overflow: 'hidden',
          flexShrink: 0, cursor: 'pointer',
          boxShadow: isPlaying ? '0 0 10px var(--primary)' : 'none',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%' }} onClick={!isPlaying ? handlePlayClick : undefined}>
          <img
            src={item.thumbnail || FALLBACK_IMAGE}
            alt={item.title || 'Video'}
            onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
            style={{
              width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease',
              transform: isPlaying ? 'scale(1.1)' : 'scale(1)',
              filter: isPlaying ? 'brightness(0.6) blur(2px)' : 'brightness(0.9)'
            }}
          />

          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '5px' }}>
            {isPlaying ? (
              <>
                {isLoading ? (
                  <Loader2 className="spin" size={20} color="#fff" />
                ) : (
                  <>
                    {!isPaused && (
                      <div className="audio-visualizer" style={{ transform: 'scale(0.7)', margin: 0 }}>
                        <span className="bar"></span><span className="bar"></span><span className="bar"></span>
                      </div>
                    )}
                    <button onClick={handleTogglePlay} style={{
                      width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(5px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.4)', color: 'white',
                      transition: 'all 0.2s', marginTop: isPaused ? '0' : '2px', fontSize: '10px'
                    }}>
                      {isPaused ? '▶' : '⏸'}
                    </button>
                  </>
                )}
                <button onClick={handleStopClick} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)', zIndex: 10 }}>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>✕</span>
                </button>
              </>
            ) : (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.4)', transform: isHovered ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s' }}>
                <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '7px solid white', marginLeft: '2px' }}></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle Info & Timeline */}
      <div className="pl-info" style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '4px', overflow: 'hidden' }}>
        <h4 style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.95rem' }}>{item.title || 'Unknown Title'}</h4>
        <span style={{ fontSize: '0.8rem', color: '#888' }}>{formatDuration(item.duration)}</span>

        {/* Progress Bar under song name */}
        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
          <div style={{
            height: '100%',
            background: 'var(--primary)',
            width: `${played * 100}%`,
            transition: 'width 0.1s linear'
          }}></div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="pl-actions" style={{ display: 'flex', gap: '8px' }}>
        <button className="icon-btn audio" title="Download MP3" onClick={() => onDownload(item.url, item.title, 'mp3')}>
          <Music size={16} />
        </button>
        <button className="icon-btn video" title="Download MP4" onClick={() => onDownload(item.url, item.title, 'mp4')}>
          <Video size={16} />
        </button>
      </div>

    </div>
  );
};

function AppContent() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [playlist, setPlaylist] = useState(null);
  const [error, setError] = useState('');
  const [downloadPath, setDownloadPath] = useState('');

  const [suggestions, setSuggestions] = useState([]);

  const [downloadingAll, setDownloadingAll] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTime, setSearchTime] = useState(null);

  // Track currently playing video ID to ensure only one plays at a time
  const [currentPlayingId, setCurrentPlayingId] = useState(null);

  // 'client' (Device) or 'server' (Host PC)
  const [downloadMode, setDownloadMode] = useState('server');
  const [isRemote, setIsRemote] = useState(false);

  // Auto-detect remote device on mount
  React.useEffect(() => {
    const hostname = window.location.hostname;
    // If not localhost, assume remote device (phone/friend)
    // ngrok domains, IPs, etc are considered remote
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      setIsRemote(true);
      setDownloadMode('client'); // Force client mode for remote
    }
  }, []);

  // Real-time Download Queue
  const [queue, setQueue] = useState([]);
  const [activeDownloads, setActiveDownloads] = useState(0);
  const [showQueue, setShowQueue] = useState(false);

  const CONCURRENCY_LIMIT = 2; // Up to 2 simultaneous downloads

  // Fetch config on mount
  React.useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data && data.downloadPath) setDownloadPath(data.downloadPath);
      })
      .catch(err => console.error('Failed to load config', err));
  }, []);

  const addToQueue = (itemsToAdd) => {
    const newItems = itemsToAdd.map(item => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      status: 'queued',
      addedAt: new Date(),
      targetPath: downloadPath, // Capture current path!
      mode: downloadMode // Capture current mode!
    }));
    setQueue(prev => [...prev, ...newItems]);
    setShowQueue(true);
  };

  // Background processor for the queue
  React.useEffect(() => {
    const processQueuedItems = async () => {
      if (activeDownloads >= CONCURRENCY_LIMIT) return;

      const nextItem = queue.find(item => item.status === 'queued');
      if (!nextItem) return;

      // Mark as downloading
      setQueue(prev => prev.map(q => q.id === nextItem.id ? { ...q, status: 'downloading' } : q));
      setActiveDownloads(prev => prev + 1);

      try {
        await downloadMedia(nextItem.url, nextItem.title, nextItem.format, nextItem.targetPath, nextItem.mode);
        setQueue(prev => prev.map(q => q.id === nextItem.id ? { ...q, status: 'completed' } : q));
      } catch (err) {
        console.error(`Queue error for ${nextItem.title}:`, err);
        setQueue(prev => prev.map(q => q.id === nextItem.id ? { ...q, status: 'failed', error: err.message } : q));
      } finally {
        setActiveDownloads(prev => prev - 1);
      }
    };



    processQueuedItems();
  }, [queue, activeDownloads]);

  const handleInputChange = async (e) => {
    const val = e.target.value;
    setUrl(val);

    if (val.length > 2) {
      try {
        const res = await fetch(`/api/suggestions?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data.slice(0, 8) : []);
      } catch { setSuggestions([]); }
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (s) => {
    setUrl(s);
    setSuggestions([]);
    // Use a timeout to ensure state update or call searching logic directly if possible
    // But since handleSearch relies on 'url' state, we might need to wait or pass arg.
    // For simplicity, we just set URL. User can press Enter or Search.
    // Actually better: trigger search.
    // We'll modify handleSearch to accept an optional argument.
    handleSearch(s);
  };

  const handleSearch = async (overrideUrl) => {
    // Clear suggestions immediately
    setSuggestions([]);

    // Determine the URL to search: arg > state
    const searchUrl = typeof overrideUrl === 'string' ? overrideUrl : url;

    if (!searchUrl) return;

    setLoading(true);
    setError('');
    setSuccessMsg('');
    setVideoInfo(null);
    setPlaylist(null);
    setSearchTime(null);

    const startTime = performance.now();
    const cleanInput = searchUrl.trim();
    const isUrl = /^(https?:\/\/)|(youtube\.com|youtu\.be|spotify\.com)/i.test(cleanInput);

    try {
      if (isUrl) {
        // Link logic (Individual or Playlist)
        if (cleanInput.includes('list=') || cleanInput.includes('spotify.com')) {
          const res = await fetch(`/api/playlist?url=${encodeURIComponent(cleanInput)}`);
          if (!res.ok) throw new Error('No se pudo cargar la lista/playlist');
          const data = await res.json();
          setPlaylist(data);
        } else {
          const res = await fetch(`/api/info?url=${encodeURIComponent(cleanInput)}`);
          if (!res.ok) throw new Error('Video no encontrado o URL inválida');
          const data = await res.json();
          setVideoInfo(data);
        }
      } else {
        // Artist logic
        const res = await fetch(`/api/artist-hits?artist=${encodeURIComponent(cleanInput)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se encontraron éxitos para este artista');
        setPlaylist(data);
      }
    } catch (err) {
      setError(err.message || 'Error en la búsqueda');
    } finally {
      const endTime = performance.now();
      setSearchTime(((endTime - startTime) / 1000).toFixed(2));
      setLoading(false);
    }
  };

  const downloadMedia = async (downloadUrl, title, type, specificPath = null, mode = 'client') => {
    let apiUrl = `/api/download?url=${encodeURIComponent(downloadUrl)}&type=${type}`;

    // Server Mode logic
    if (mode === 'server') {
      if (specificPath) {
        apiUrl += `&path=${encodeURIComponent(specificPath)}`;
      }
      // No 'mode=client' param means server behavior by default in our API
      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      const data = await response.json();
      return data.path; // API returns path on server success
    }

    // Client Mode logic (Browser Stream)
    apiUrl += `&mode=client`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      let errorText = 'Download failed';
      try {
        const errData = await response.json();
        errorText = errData.error || errorText;
      } catch (e) { }
      throw new Error(errorText);
    }

    // Handle Blob for Client Download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.${type}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return 'Device Download Folder';
  };

  const handleDownload = (downloadUrl, title, specificFormat = 'mp3') => {
    addToQueue([{ url: downloadUrl, title, format: specificFormat }]);
  };

  const handleDownloadAll = (targetFormat) => {
    if (!playlist || !playlist.items) return;
    const items = playlist.items.map(item => ({
      url: item.url,
      title: item.title,
      format: targetFormat
    }));
    addToQueue(items);
  };

  return (
    <div className="container">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="header"
      >
        <h1>Sonic<span className="gradient-text">Flow</span></h1>

        {/* Mode Toggle & Settings */}
        {/* Mode Toggle & Settings - Only visible for Local Server Host */}
        {!isRemote && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>

            {/* Mode Switcher */}
            <div style={{
              background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.6rem', borderRadius: '30px',
              display: 'flex', gap: '0.5rem', border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <button
                onClick={() => setDownloadMode('client')}
                style={{
                  background: downloadMode === 'client' ? 'var(--primary)' : 'transparent',
                  border: 'none', borderRadius: '20px', padding: '0.4rem 1rem', color: 'white', cursor: 'pointer', fontWeight: '500'
                }}
              >
                📱 Dispositivo
              </button>
              <button
                onClick={() => setDownloadMode('server')}
                style={{
                  background: downloadMode === 'server' ? 'var(--primary)' : 'transparent',
                  border: 'none', borderRadius: '20px', padding: '0.4rem 1rem', color: 'white', cursor: 'pointer', fontWeight: '500'
                }}
              >
                💻 Servidor (PC)
              </button>
            </div>

          </div>
        )}

        {/* Settings Bar - Only visible in Server Mode */}
        {downloadMode === 'server' && (
          <SettingsBar downloadPath={downloadPath} setDownloadPath={setDownloadPath} />
        )}

        <p>Download your favorite music and videos instantly.</p>
      </motion.header>

      <main style={{ width: '100%' }}>
        <motion.div
          className="search-box"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="input-wrapper" style={{ position: 'relative' }}>
            <Search className="icon" />
            <input
              type="text"
              placeholder="Pega un link o escribe un artista..."
              value={url}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSuggestions([]);
                  handleSearch();
                }
              }}
              onFocus={() => { if (url.length > 2) handleInputChange({ target: { value: url } }); }}
              onBlur={() => setTimeout(() => setSuggestions([]), 200)}
            />
            {suggestions.length > 0 && (
              <div className="suggestions-list" style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: '#1a1a1a', border: '1px solid #333', borderRadius: '0 0 8px 8px',
                zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.5)', overflow: 'hidden'
              }}>
                {suggestions.map((s, i) => (
                  <div key={i} className="suggestion-item"
                    onClick={() => selectSuggestion(s)}
                    style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #222', color: '#eee', fontSize: '0.9rem', textAlign: 'left' }}
                    onMouseEnter={(e) => e.target.style.background = '#333'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="search-btn" onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="spin" /> : <Search size={20} />}
          </button>
        </motion.div>

        {searchTime && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="search-time"
            style={{ textAlign: 'center', marginTop: '0.5rem', color: '#888', fontSize: '0.9rem' }}
          >
            Search completed in {searchTime}s
          </motion.div>
        )}



        <AnimatePresence>
          {error && (
            <motion.div
              className="error-msg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              className="success-msg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {successMsg}
            </motion.div>
          )}

          {videoInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <MusicRow
                item={{ ...videoInfo, duration: videoInfo.lengthSeconds, url: url || videoInfo.url }}
                activeVideoId={currentPlayingId}
                onPlay={setCurrentPlayingId}
                onDownload={handleDownload}
              />
            </motion.div>
          )}

          {/* ... playlist section remains similarly update to not use local downloading state ... */}

          {playlist && playlist.items && (
            <motion.div
              className="playlist-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="playlist-header">
                <img
                  src={playlist.thumbnail || FALLBACK_IMAGE}
                  alt={playlist.title || 'Playlist'}
                  className="pl-thumb"
                  onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                />
                <div style={{ flex: 1 }}>
                  <h3>{playlist.title || 'Playlist'}</h3>
                  <p>{playlist.items.length} {playlist.title?.toLowerCase().includes('songs') || playlist.title?.toLowerCase().includes('hits') ? 'canciones' : 'videos'}</p>
                </div>
                <div className="pl-actions">
                  <button
                    className="download-all-btn audio"
                    onClick={() => handleDownloadAll('mp3')}
                  >
                    <Music size={18} /> All MP3
                  </button>
                  <button
                    className="download-all-btn video"
                    onClick={() => handleDownloadAll('mp4')}
                  >
                    <Video size={18} /> All MP4
                  </button>
                </div>
              </div>
              <div className="playlist-items">
                {playlist.items.map((item, idx) => (
                  <MusicRow
                    key={idx}
                    item={item}
                    activeVideoId={currentPlayingId}
                    onPlay={setCurrentPlayingId}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Queue Button */}
        <button className={`queue-toggle ${queue.length > 0 ? 'visible' : ''}`} onClick={() => setShowQueue(!showQueue)}>
          <Download size={24} />
          {queue.filter(q => q.status === 'queued' || q.status === 'downloading').length > 0 && (
            <span className="badge">{queue.filter(q => q.status === 'queued' || q.status === 'downloading').length}</span>
          )}
        </button>

        {/* Queue Side Panel */}
        <AnimatePresence>
          {showQueue && (
            <motion.div
              className="queue-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
            >
              <div className="queue-header">
                <h3>Cola de Descargas</h3>
                <button onClick={() => setShowQueue(false)}><Search size={20} style={{ transform: 'rotate(45deg)' }} /></button>
              </div>
              <div className="queue-list">
                {queue.length === 0 && <p className="empty-queue">No hay descargas activas</p>}
                {[...queue].reverse().map(item => (
                  <div key={item.id} className={`queue-item ${item.status}`}>
                    <div className="q-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className="q-title" style={{ fontSize: '0.9rem', color: 'white' }}>{item.title}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', opacity: 0.8 }}>

                        {/* Status Label */}
                        {item.status === 'queued' && <span style={{ color: '#a5b4fc' }}>⏳ En cola...</span>}
                        {item.status === 'downloading' && <span style={{ color: '#8b5cf6' }}>⬇️ Descargando...</span>}
                        {item.status === 'completed' && <span style={{ color: '#34d399', fontWeight: 'bold' }}>✅ Completado</span>}
                        {item.status === 'failed' && <span style={{ color: '#f87171' }}>❌ Error</span>}

                        {/* Format Badge */}
                        <span style={{
                          background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem'
                        }}>
                          {item.format.toUpperCase()}
                        </span>

                      </div>
                    </div>
                    {item.status === 'downloading' && <Loader2 className="spin" size={18} color="var(--primary)" />}
                  </div>
                ))}
              </div>
              {queue.some(q => q.status === 'completed' || q.status === 'failed') && (
                <button className="clear-btn" onClick={() => setQueue(prev => prev.filter(q => q.status !== 'completed' && q.status !== 'failed'))}>
                  Limpiar historial
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
