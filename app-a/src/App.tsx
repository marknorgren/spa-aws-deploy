import './App.css';
import { RouteViewer } from './RouteViewer';
import { useRef, useState } from 'react';

const appVersion = import.meta.env.VITE_APP_VERSION;
const buildTimestamp = import.meta.env.VITE_BUILD_TIMESTAMP;
const gitCommitHash = import.meta.env.VITE_GIT_COMMIT_HASH;
const buildId = import.meta.env.VITE_BUILD_ID;

function App() {
  const [showVersion, setShowVersion] = useState(false);
  const clickCount = useRef(0);
  const timer = useRef<number | null>(null);

  const handleFooterClick = () => {
    clickCount.current += 1;
    if (timer.current) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      clickCount.current = 0;
    }, 1000);
    if (clickCount.current === 4) {
      setShowVersion((v) => !v);
      clickCount.current = 0;
    }
  };

  return (
    <div
      className="app-container"
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <header
        style={{
          background: '#222',
          color: '#fff',
          padding: '1rem',
          textAlign: 'center',
          letterSpacing: 1,
          fontWeight: 600,
        }}
      >
        App A
      </header>
      <main style={{ flex: 1, padding: '2rem 0' }}>
        <RouteViewer />
      </main>
      <footer
        style={{
          position: 'fixed',
          right: 0,
          bottom: 0,
          background: 'rgba(34,34,34,0.9)',
          color: '#fff',
          fontSize: '0.8em',
          padding: '0.5rem 1rem',
          borderTopLeftRadius: 8,
          cursor: 'pointer',
          zIndex: 1000,
          userSelect: 'none',
        }}
        onClick={handleFooterClick}
        title="Quadruple click to show version info"
      >
        <span>© {new Date().getFullYear()} App A</span>
        {showVersion && (
          <div style={{ marginTop: 8, textAlign: 'right' }}>
            <div>Version: {appVersion}</div>
            <div>Build Timestamp: {buildTimestamp}</div>
            <div>Commit: {gitCommitHash}</div>
            <div>Build ID: {buildId}</div>
          </div>
        )}
      </footer>
    </div>
  );
}

export default App;
