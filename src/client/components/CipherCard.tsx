import React, { useState, useEffect } from 'react';
import { Cipher, DIFFICULTY_CONFIG } from '../../shared/types/index.js';
import './CipherCard.css';

interface CipherCardProps {
  cipher: Cipher;
  onCipherClick: () => void;
}

const CipherCard: React.FC<CipherCardProps> = ({ cipher, onCipherClick }) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, cipher.expiresAt - now);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [cipher.expiresAt]);

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

  const difficultyConfig = DIFFICULTY_CONFIG[cipher.difficulty];
  const isExpired = timeRemaining === 0;
  const isUrgent = timeRemaining < 600000; // Less than 10 minutes

  return (
    <div 
      className={`cipher-card ${isExpired ? 'expired' : ''} ${isUrgent ? 'urgent' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onCipherClick}
      style={{
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isHovered ? '0 8px 25px rgba(0, 255, 136, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div className="cipher-card-header">
        <div className="cipher-title">{cipher.title}</div>
        <div 
          className="difficulty-badge"
          style={{ backgroundColor: difficultyConfig.color }}
        >
          {cipher.difficulty}
        </div>
      </div>

      <div className="cipher-content">
        <div className="cipher-hint">
          <span className="hint-label">Hint:</span>
          <span className="hint-text">{cipher.hint}</span>
        </div>

        <div className="cipher-preview">
          {cipher.format === 'text' && (
            <div className="text-cipher">
              <code>{cipher.content.substring(0, 50)}{cipher.content.length > 50 ? '...' : ''}</code>
            </div>
          )}
          {cipher.format === 'image' && (
            <div className="image-cipher">
              <span className="format-icon">🖼️</span>
              <span>Image Cipher</span>
            </div>
          )}
          {cipher.format === 'audio' && (
            <div className="audio-cipher">
              <span className="format-icon">🎵</span>
              <span>Audio Cipher</span>
            </div>
          )}
        </div>
      </div>

      <div className="cipher-card-footer">
        <div className="timer-section">
          <div className={`countdown-timer ${isUrgent ? 'urgent' : ''} ${isExpired ? 'expired' : ''}`}>
            {isExpired ? 'EXPIRED' : formatTime(timeRemaining)}
          </div>
          <div className="timer-label">
            {isExpired ? 'Cipher Locked' : 'Time Remaining'}
          </div>
        </div>

        <div className="stats-section">
          <div className="guess-count">
            <span className="stat-number">0</span>
            <span className="stat-label">Guesses</span>
          </div>
        </div>
      </div>

      {!isExpired && (
        <div className="card-overlay">
          <div className="enter-button">
            Enter Cipher
          </div>
        </div>
      )}
    </div>
  );
};

export default CipherCard;
