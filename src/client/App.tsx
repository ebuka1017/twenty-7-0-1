import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard.js';
import { useAudio } from './hooks/useAudio.js';

export const App = () => {
  const [username, setUsername] = useState<string>('');
  const [postId, setPostId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize audio system
  useAudio();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const response = await fetch('/api/init');
      const data = await response.json();
      
      if (data.type === 'init') {
        setUsername(data.username || 'Anonymous');
        setPostId(data.postId || '');
      } else {
        setError('Failed to initialize application');
      }
    } catch (err) {
      console.error('App initialization error:', err);
      setError('Network error during initialization');
      // Set fallback values for development
      setUsername('DevUser');
      setPostId('dev-post-id');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: '#ffffff',
        fontFamily: 'JetBrains Mono, monospace'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #2d2d2d',
          borderTop: '3px solid #00ff88',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }}></div>
        <p>Initializing Vault System...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: '#ffffff',
        fontFamily: 'JetBrains Mono, monospace',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <h2 style={{ color: '#ff6b6b', marginBottom: '1rem' }}>System Error</h2>
        <p style={{ marginBottom: '1rem' }}>{error}</p>
        <button 
          onClick={initializeApp}
          style={{
            background: '#00ff88',
            color: '#1a1a1a',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return <Dashboard username={username} postId={postId} />;
};
