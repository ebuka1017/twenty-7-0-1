import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cipher, DIFFICULTY_CONFIG } from '../../shared/types/index.js';
import { ClientValidation } from '../utils/validation.js';
import { audioService } from '../services/audio.js';
import GuessesSection from './GuessesSection.js';
import './CipherDetail.css';

interface CipherDetailProps {
  cipherId: string;
  onBack: () => void;
}

const CipherDetail: React.FC<CipherDetailProps> = ({ cipherId, onBack }) => {
  const [cipher, setCipher] = useState<Cipher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [guess, setGuess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [guessCount, setGuessCount] = useState(0);

  useEffect(() => {
    fetchCipherDetails();
    
    // Listen for cipher expiration events
    const handleCipherExpired = (event: CustomEvent) => {
      const data = event.detail;
      if (data.type === 'cipher_expired' && data.cipherId === cipherId) {
        setWinner(data.winner);
        setResolutionType(data.winner ? 'solved' : 'unsolved');
        setShowResolutionAnimation(true);
        setTimeRemaining(0);
        
        // Show solution after animation delay
        setTimeout(() => {
          setShowSolution(true);
          setShowResolutionAnimation(false);
        }, 3000); // 3 second animation
      }
    };

    window.addEventListener('cipherExpired', handleCipherExpired as EventListener);
    
    return () => {
      window.removeEventListener('cipherExpired', handleCipherExpired as EventListener);
    };
  }, [cipherId]);

  useEffect(() => {
    if (!cipher) return;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, cipher.expiresAt - now);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [cipher]);

  const fetchCipherDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cipher/${cipherId}`);
      const data = await response.json();
      
      if (data.success) {
        setCipher(data.data.cipher);
        setGuessCount(data.data.guessCount || 0);
      } else {
        setError(data.error || 'Failed to load cipher');
      }
    } catch (err) {
      setError('Network error loading cipher');
      console.error('Error fetching cipher:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGuess(value);
    setSubmitError(null);
  };

  const handleSubmitGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cipher || timeRemaining === 0) return;

    // Client-side validation
    const validation = ClientValidation.validateGuess(guess);
    if (!validation.isValid) {
      setSubmitError(validation.error || 'Invalid guess');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const response = await fetch('/api/submit-guess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cipherId: cipher.id,
          content: guess.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Clear the guess input
        setGuess('');
        // Update guess count
        setGuessCount(prev => prev + 1);
        // Play success sound
        await audioService.playSuccess();
        console.log('Guess submitted successfully');
        
        // Trigger a refresh of the guesses list by dispatching a custom event
        window.dispatchEvent(new CustomEvent('guessSubmitted', { detail: { cipherId: cipher.id } }));
      } else {
        if (data.isRateLimited) {
          const resetTime = new Date(data.rateLimitReset).toLocaleTimeString();
          setSubmitError(`Rate limit exceeded. Try again at ${resetTime}`);
        } else {
          await audioService.playError();
          setSubmitError(data.error || 'Failed to submit guess');
        }
      }
    } catch (err) {
      await audioService.playError();
      setSubmitError('Network error submitting guess');
      console.error('Error submitting guess:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isExpired = timeRemaining === 0;
  const isUrgent = timeRemaining < 600000; // Less than 10 minutes
  const isLocked = timeRemaining < 10000; // Less than 10 seconds
  const [winner, setWinner] = useState<{ username: string; content: string; rallyCount: number } | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [showResolutionAnimation, setShowResolutionAnimation] = useState(false);
  const [resolutionType, setResolutionType] = useState<'solved' | 'unsolved' | null>(null);

  if (loading) {
    return (
      <div className="cipher-detail">
        <div className="cipher-detail-header">
          <div className="header-nav">
            <button onClick={onBack} className="back-button">
              ← Back
            </button>
            <div className="cipher-title-header">Loading...</div>
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #2d2d2d',
            borderTop: '3px solid #00ff88',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p>Loading cipher details...</p>
        </div>
      </div>
    );
  }

  if (error || !cipher) {
    return (
      <div className="cipher-detail">
        <div className="cipher-detail-header">
          <div className="header-nav">
            <button onClick={onBack} className="back-button">
              ← Back
            </button>
            <div className="cipher-title-header">Error</div>
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          flexDirection: 'column',
          gap: '1rem',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <h2 style={{ color: '#ff6b6b', marginBottom: '1rem' }}>Failed to Load Cipher</h2>
          <p>{error}</p>
          <button 
            onClick={fetchCipherDetails}
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
            Retry
          </button>
        </div>
      </div>
    );
  }

  const difficultyConfig = DIFFICULTY_CONFIG[cipher.difficulty];

  return (
    <div className="cipher-detail">
      <div className="cipher-detail-header">
        <div className="header-nav">
          <button onClick={onBack} className="back-button">
            ← Back to Vault
          </button>
          <div className="cipher-title-header">{cipher.title}</div>
        </div>
      </div>

      <main className="cipher-detail-main">
        <section className="cipher-content-section">
          <div className="cipher-info-header">
            <div className="cipher-meta">
              <h1 className="cipher-title">{cipher.title}</h1>
              <div className="cipher-hint">
                <span className="hint-label">Hint:</span>
                <span className="hint-text">{cipher.hint}</span>
              </div>
            </div>
            <div className="cipher-badges">
              <div 
                className="difficulty-badge"
                style={{ backgroundColor: difficultyConfig?.color || '#4ade80' }}
              >
                {cipher.difficulty}
              </div>
              <div className="format-badge">
                {cipher.format.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="cipher-content-display">
            <div className="content-label">Cipher Content</div>
            <div className="cipher-text-content">
              {cipher.format === 'text' && (
                <div className="cipher-text">{cipher.content}</div>
              )}
              {cipher.format === 'image' && (
                <div style={{ color: '#a0a0a0', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🖼️</div>
                  <div>Image cipher display will be implemented in a later task</div>
                </div>
              )}
              {cipher.format === 'audio' && (
                <div style={{ color: '#a0a0a0', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎵</div>
                  <div>Audio cipher display will be implemented in a later task</div>
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="cipher-actions-section">
          <div className="timer-section">
            <div className="timer-label">Time Remaining</div>
            <motion.div 
              className={`countdown-display ${isUrgent ? 'urgent' : ''} ${isExpired ? 'expired' : ''} ${isLocked ? 'locked' : ''}`}
              animate={{
                scale: isLocked ? [1, 1.02, 1] : (isUrgent ? [1, 1.05, 1] : 1),
                color: isLocked ? '#ff6b6b' : (isUrgent ? '#ff6b6b' : '#00ff88')
              }}
              transition={{
                duration: isLocked ? 0.5 : (isUrgent ? 1 : 0.3),
                repeat: (isLocked || isUrgent) ? Infinity : 0,
                repeatType: "reverse"
              }}
            >
              {isExpired ? 'EXPIRED' : isLocked ? 'LOCKED' : formatTime(timeRemaining)}
            </motion.div>
            <div className={`timer-status ${isUrgent ? 'urgent' : ''} ${isExpired ? 'expired' : ''} ${isLocked ? 'locked' : ''}`}>
              {isExpired ? 'Cipher Expired' : isLocked ? 'LOCKED - No More Actions' : isUrgent ? 'Final Minutes' : 'Active'}
            </div>
          </div>

          <div className={`guess-section ${isExpired || isLocked ? 'locked' : ''}`}>
            <div className="guess-section-title">Submit Your Guess</div>
            <form onSubmit={handleSubmitGuess} className="guess-form">
              <input
                type="text"
                value={guess}
                onChange={handleGuessChange}
                placeholder="Enter your solution..."
                className={`guess-input ${submitError ? 'error' : ''}`}
                maxLength={100}
                disabled={submitting || isExpired || isLocked}
              />
              <div className={`input-counter ${guess.length > 80 ? 'warning' : ''} ${guess.length > 95 ? 'error' : ''}`}>
                {guess.length}/100
              </div>
              <button 
                type="submit" 
                className="submit-button"
                disabled={submitting || !guess.trim() || isExpired || isLocked}
              >
                {submitting ? 'Submitting...' : isExpired ? 'Cipher Expired' : isLocked ? 'Locked' : 'Submit Guess'}
              </button>
              {submitError && (
                <div className="error-message">{submitError}</div>
              )}
            </form>
          </div>

          <div className="cipher-stats">
            <div className="stats-title">Cipher Stats</div>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{guessCount}</span>
                <span className="stat-label">Total Guesses</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{cipher.timeLimit}h</span>
                <span className="stat-label">Time Limit</span>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <AnimatePresence>
        {showResolutionAnimation && (
          <motion.div 
            className={`resolution-animation ${resolutionType}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="animation-container"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ 
                duration: 0.8,
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
            >
            {resolutionType === 'solved' ? (
              <>
                <div className="confetti-container">
                  {Array.from({ length: 50 }, (_, i) => (
                    <div key={i} className={`confetti confetti-${i % 5}`}></div>
                  ))}
                </div>
                <div className="resolution-message">
                  <h2 className="resolution-title">🎉 CIPHER SOLVED! 🎉</h2>
                  <p className="resolution-subtitle">The vault has been cracked!</p>
                </div>
              </>
            ) : (
              <div className="resolution-message">
                <h2 className="resolution-title">🔒 CIPHER EXPIRED</h2>
                <p className="resolution-subtitle">The vault remains sealed...</p>
                <div className="dramatic-reveal">
                  <div className="reveal-pulse"></div>
                </div>
              </div>
            )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showSolution && (
        <section className="solution-section">
          <div className="solution-container">
            <div className="solution-header">
              <h2 className="solution-title">
                {winner ? '🏆 Cipher Solved!' : '🔒 Cipher Expired'}
              </h2>
            </div>
            <div className="solution-content">
              <div className="solution-reveal">
                <span className="solution-label">Solution:</span>
                <span className="solution-text">{cipher.solution}</span>
              </div>
              {winner && (
                <div className="winner-announcement">
                  <div className="winner-info">
                    <span className="winner-label">Winner:</span>
                    <span className="winner-name">{winner.username}</span>
                  </div>
                  <div className="winning-guess">
                    <span className="guess-label">Winning Guess:</span>
                    <span className="guess-text">"{winner.content}"</span>
                  </div>
                  <div className="rally-info">
                    <span className="rally-label">Rally Count:</span>
                    <span className="rally-count">{winner.rallyCount}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="guesses-section-container">
        <GuessesSection 
          cipherId={cipher.id}
          isExpired={isExpired}
          isLocked={isLocked}
        />
      </section>
    </div>
  );
};

export default CipherDetail;
