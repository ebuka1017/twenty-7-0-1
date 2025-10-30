import React, { useState } from 'react';
import './Header.css';

interface HeaderProps {
  username: string;
}

const Header: React.FC<HeaderProps> = ({ username }) => {
  const [audioMuted, setAudioMuted] = useState(() => {
    return localStorage.getItem('2701_audio_muted') === 'true';
  });

  const toggleAudio = () => {
    const newMuted = !audioMuted;
    setAudioMuted(newMuted);
    localStorage.setItem('2701_audio_muted', newMuted.toString());
    
    // TODO: Implement actual audio control in later task
    console.log('Audio toggled:', newMuted ? 'muted' : 'unmuted');
  };

  return (
    <header className="vault-header">
      <div className="header-content">
        <div className="header-left">
          <div className="vault-logo">
            <span className="logo-text">2701</span>
            <span className="logo-subtitle">VAULT SYSTEM</span>
          </div>
        </div>

        <div className="header-center">
          <div className="system-status">
            <div className="status-indicator online"></div>
            <span className="status-text">VAULT ONLINE</span>
          </div>
        </div>

        <div className="header-right">
          <div className="user-profile">
            <span className="username">{username}</span>
            <div className="user-badge">
              <span className="badge-text">APPRENTICE</span>
            </div>
          </div>
          
          <button 
            className={`audio-toggle ${audioMuted ? 'muted' : 'active'}`}
            onClick={toggleAudio}
            title={audioMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {audioMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
