import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cipher } from '../../shared/types/index.js';
import CipherCard from './CipherCard.js';
import CipherDetail from './CipherDetail.js';
import Leaderboard from './Leaderboard.js';
import Header from './Header.js';
import './Dashboard.css';

interface DashboardProps {
  username: string;
  postId: string; // Will be used in later tasks for post-specific data
}

const Dashboard: React.FC<DashboardProps> = ({ username }) => {
  const [ciphers, setCiphers] = useState<Cipher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCipherId, setSelectedCipherId] = useState<string | null>(null);

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

  // Show cipher detail page if a cipher is selected
  if (selectedCipherId) {
    return (
      <CipherDetail 
        cipherId={selectedCipherId} 
        onBack={() => setSelectedCipherId(null)} 
      />
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
            <motion.div 
              className="ciphers-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <AnimatePresence mode="popLayout">
                {ciphers.map((cipher, index) => (
                  <motion.div
                    key={cipher.id}
                    initial={{ opacity: 0, scale: 0.8, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -50 }}
                    transition={{ 
                      duration: 0.5,
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 300,
                      damping: 30
                    }}
                    layout
                  >
                    <CipherCard 
                      cipher={cipher}
                      onCipherClick={() => {
                        setSelectedCipherId(cipher.id);
                      }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
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
