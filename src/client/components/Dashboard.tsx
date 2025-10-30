import React, { useState, useEffect } from 'react';
import { Cipher } from '../../shared/types/index.js';
import CipherCard from './CipherCard.js';
import Leaderboard from './Leaderboard.js';
import Header from './Header.js';
import './Dashboard.css';

interface DashboardProps {
  username: string;
  postId: string;
}

const Dashboard: React.FC<DashboardProps> = ({ username, postId }) => {
  const [ciphers, setCiphers] = useState<Cipher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveCiphers();
  }, []);

  const fetchActiveCiphers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ciphers');
      const data = await response.json();
      
      if (data.success) {
        setCiphers(data.data.ciphers || []);
      } else {
        setError(data.error || 'Failed to load ciphers');
      }
    } catch (err) {
      setError('Network error loading ciphers');
      console.error('Error fetching ciphers:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Initializing Vault...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error-container">
          <h2>Connection Error</h2>
          <p>{error}</p>
          <button onClick={fetchActiveCiphers} className="retry-button">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Header username={username} />
      
      <main className="dashboard-main">
        <section className="ciphers-section">
          <h2 className="section-title">Active Ciphers</h2>
          {ciphers.length === 0 ? (
            <div className="no-ciphers">
              <p>No active ciphers found.</p>
              <p className="hint">New ciphers drop every hour...</p>
            </div>
          ) : (
            <div className="ciphers-grid">
              {ciphers.map((cipher) => (
                <CipherCard 
                  key={cipher.id} 
                  cipher={cipher}
                  onCipherClick={() => {
                    // Navigate to cipher detail - will implement in later task
                    console.log('Navigate to cipher:', cipher.id);
                  }}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="sidebar">
          <Leaderboard />
        </aside>
      </main>
    </div>
  );
};

export default Dashboard;
