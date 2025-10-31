import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Guess } from '../../shared/types/index.js';
import { realtimeService, RallyUpdateMessage, CipherExpiredMessage, CipherLockdownMessage } from '../services/realtime.js';
import { audioService } from '../services/audio.js';
import ConnectionStatus from './ConnectionStatus.js';
import './GuessesSection.css';

interface GuessesSectionProps {
  cipherId: string;
  isExpired: boolean;
  isLocked: boolean;
}

const GuessesSection: React.FC<GuessesSectionProps> = ({ cipherId, isExpired, isLocked }) => {
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rallyingGuess, setRallyingGuess] = useState<string | null>(null);

  const fetchGuesses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cipher/${cipherId}/guesses`);
      const data = await response.json();
      
      if (data.success) {
        setGuesses(data.data.guesses || []);
      } else {
        setError(data.error || 'Failed to load guesses');
      }
    } catch (err) {
      setError('Network error loading guesses');
      console.error('Error fetching guesses:', err);
    } finally {
      setLoading(false);
    }
  }, [cipherId]);

  useEffect(() => {
    fetchGuesses();
  }, [fetchGuesses]);

  useEffect(() => {
    // Connect to realtime for live rally updates
    realtimeService.connect(cipherId);

    // Listen for realtime rally updates, cipher expiration, and lockdown
    const unsubscribeRealtime = realtimeService.onMessage((message: RallyUpdateMessage | CipherExpiredMessage | CipherLockdownMessage) => {
      if (message.type === 'rally_update' && message.cipherId === cipherId) {
        // Update the specific guess rally count
        setGuesses(prev => prev.map(guess => 
          guess.id === message.guessId 
            ? { ...guess, rallyCount: message.newRallyCount }
            : guess
        ));
      } else if (message.type === 'cipher_expired' && message.cipherId === cipherId) {
        // Mark the winner and refresh the list
        if (message.winner) {
          setGuesses(prev => prev.map(guess => 
            guess.id === message.winner!.id 
              ? { ...guess, isWinner: true }
              : guess
          ));
        }
      } else if (message.type === 'cipher_lockdown' && message.cipherId === cipherId) {
        // Handle lockdown - the parent component will handle the UI changes
        console.log(`Cipher ${cipherId} is now locked down`);
      }
    });

    // Listen for new guess submissions to refresh the list
    const handleGuessSubmitted = (event: CustomEvent) => {
      if (event.detail.cipherId === cipherId) {
        fetchGuesses();
      }
    };

    window.addEventListener('guessSubmitted', handleGuessSubmitted as EventListener);
    
    return () => {
      unsubscribeRealtime();
      realtimeService.disconnect();
      window.removeEventListener('guessSubmitted', handleGuessSubmitted as EventListener);
    };
  }, [cipherId, fetchGuesses]);

  const handleRally = async (guessId: string) => {
    if (isExpired || isLocked || rallyingGuess) return;

    try {
      setRallyingGuess(guessId);
      
      const response = await fetch('/api/rally-guess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ guessId })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update the guess rally count locally
        setGuesses(prev => prev.map(guess => 
          guess.id === guessId 
            ? { ...guess, rallyCount: data.data.newRallyCount }
            : guess
        ));
        
        // Play rally click sound with haptic feedback
        await audioService.playRallyClick();
        console.log('Rally successful! New count:', data.data.newRallyCount);
        
      } else {
        if (data.isRateLimited) {
          const resetTime = new Date(data.rateLimitReset).toLocaleTimeString();
          alert(`Rate limit exceeded. Try again at ${resetTime}`);
        } else {
          // Play error sound for failed rally
          await audioService.playError();
          alert(data.error || 'Failed to rally guess');
        }
      }
    } catch (err) {
      console.error('Error rallying guess:', err);
      await audioService.playError();
      alert('Network error rallying guess');
    } finally {
      setRallyingGuess(null);
    }
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  if (loading) {
    return (
      <div className="guesses-section">
        <div className="guesses-header">
          <h3 className="guesses-title">Community Guesses</h3>
        </div>
        <div className="guesses-loading">
          <div className="loading-spinner"></div>
          <p>Loading guesses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="guesses-section">
        <div className="guesses-header">
          <h3 className="guesses-title">Community Guesses</h3>
        </div>
        <div className="guesses-error">
          <p>{error}</p>
          <button onClick={fetchGuesses} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="guesses-section">
      <div className="guesses-header">
        <div className="guesses-header-left">
          <h3 className="guesses-title">Community Guesses</h3>
          <div className="guesses-count">
            {guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'}
          </div>
        </div>
        <ConnectionStatus />
      </div>

      {guesses.length === 0 ? (
        <div className="no-guesses">
          <p>No guesses yet. Be the first to solve this cipher!</p>
        </div>
      ) : (
        <div className="guesses-list">
          <AnimatePresence mode="popLayout">
            {guesses.map((guess, index) => (
              <motion.div 
                key={guess.id} 
                className={`guess-item ${guess.isWinner ? 'winner' : ''}`}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ 
                  duration: 0.3,
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
                layout
              >
              <div className="guess-rank">
                #{index + 1}
              </div>
              
              <div className="guess-content">
                <div className="guess-text">{guess.content}</div>
                <div className="guess-meta">
                  <span className="guess-author">by {guess.username}</span>
                  <span className="guess-time">{formatTimeAgo(guess.createdAt)}</span>
                </div>
              </div>

              <div className="guess-actions">
                <motion.button
                  className={`rally-button ${rallyingGuess === guess.id ? 'rallying' : ''} ${isLocked ? 'locked' : ''}`}
                  onClick={() => handleRally(guess.id)}
                  disabled={isExpired || isLocked || rallyingGuess === guess.id}
                  title={isExpired ? 'Cipher expired' : isLocked ? 'LOCKED - No more rallies allowed' : 'Rally behind this guess'}
                  whileHover={{ 
                    scale: isExpired || isLocked ? 1 : 1.05,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ 
                    scale: isExpired || isLocked ? 1 : 1.02,
                    transition: { duration: 0.1 }
                  }}
                  animate={{
                    scale: rallyingGuess === guess.id ? [1, 1.1, 1.05] : 1,
                    boxShadow: rallyingGuess === guess.id 
                      ? '0 0 15px rgba(0, 255, 136, 0.5)'
                      : '0 0 0px rgba(0, 255, 136, 0)'
                  }}
                  transition={{
                    duration: rallyingGuess === guess.id ? 0.5 : 0.2,
                    repeat: rallyingGuess === guess.id ? 1 : 0,
                    repeatType: "reverse"
                  }}
                >
                  <span className="rally-icon">{isLocked ? '🔒' : '🚀'}</span>
                  <motion.span 
                    className="rally-count"
                    key={guess.rallyCount}
                    initial={{ scale: 1.2, color: '#00ff88' }}
                    animate={{ scale: 1, color: '#ffffff' }}
                    transition={{ duration: 0.3 }}
                  >
                    {guess.rallyCount}
                  </motion.span>
                </motion.button>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default GuessesSection;