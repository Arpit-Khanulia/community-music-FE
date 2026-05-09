import { useState, useEffect } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function App() {
  const [url, setUrl] = useState('');
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState('mp3');
  const [quality, setQuality] = useState('320');

  useEffect(() => {
    fetchDownloads();
    const interval = setInterval(fetchDownloads, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchDownloads = async () => {
    try {
      const res = await fetch(`${API_URL}/downloads`);
      const data = await res.json();
      if (data.success) {
        setDownloads(data.downloads);
      }
    } catch (err) {
      console.error('Failed to fetch downloads');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, format, quality })
      });
      const data = await res.json();
      if (data.success) {
        setUrl('');
        fetchDownloads();
      }
    } catch (err) {
      console.error('Download failed');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await fetch(`${API_URL}/downloads/${id}`, { method: 'DELETE' });
    fetchDownloads();
  };

  const handleDownload = async (id, title, format) => {
    try {
      const response = await fetch(`${API_URL}/download/${id}/file`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${title}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('File download failed:', err);
    }
  };

  return (
    <div className="app">
      <div className="noise"></div>

      <header className="header">
        <div className="logo">
          <span className="logo-icon">♫</span>
          <span className="logo-text">Wave</span>
        </div>
      </header>

      <main className="main">
        <section className="hero">
          <h1 className="hero-title">Download your favorite music</h1>
          <p className="hero-subtitle">Paste a link from YouTube or SoundCloud</p>

          <form onSubmit={handleSubmit} className="search-form">
            <div className="input-wrapper">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste URL here..."
                className="search-input"
              />
              <button
                type="submit"
                className="search-btn"
                disabled={loading || !url.trim()}
              >
                {loading ? (
                  <span className="spinner"></span>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                )}
              </button>
            </div>

            <div className="options">
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="select"
              >
                <option value="mp3">MP3</option>
                <option value="opus">Opus</option>
                <option value="flac">FLAC</option>
              </select>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="select"
              >
                <option value="320">320 kbps</option>
                <option value="128">128 kbps</option>
              </select>
            </div>
          </form>
        </section>

        <section className="downloads-section">
          {downloads.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">♪</div>
              <p>No downloads yet</p>
              <span>Paste a URL above to get started</span>
            </div>
          ) : (
            <div className="downloads-grid">
              {downloads.slice().reverse().map((item) => (
                <div key={item.id} className={`download-card ${item.status}`}>
                  {item.thumbnail ? (
                    <div className="card-thumbnail">
                      <img src={item.thumbnail} alt="" />
                    </div>
                  ) : (
                    <div className="card-icon">
                      {item.status === 'completed' ? '✓' : item.status === 'downloading' ? '↓' : '!'}
                    </div>
                  )}
                  <div className="card-content">
                    <h3 className="card-title">{item.title || 'Downloading...'}</h3>
                    <p className="card-status">
                      {item.status === 'completed'
                        ? 'Ready to download'
                        : item.status === 'downloading'
                          ? `${item.progress.toFixed(0)}%`
                          : item.error}
                    </p>
                    {item.status === 'downloading' && (
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                  <div className="card-actions">
                    {item.status === 'completed' && (
                      <button
                        onClick={() => handleDownload(item.id, item.title, item.filePath?.split('.').pop())}
                        className="btn-download"
                      >
                        Download
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="btn-delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;