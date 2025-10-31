import React, { useState, useEffect } from 'react';
import { UserService } from '../services/user.js';
import { audioService } from '../services/audio.js';
import './Header.css';

interface HeaderProps {
  username: string;
}

const Header: React.FC<HeaderProps> = ({ username }) => {
  const [audioMuted, setAudioMuted] = useState(() => {
    return audioService.isMutedState();
  });
  const [userTitle, setUserTitle] = useState('APPRENTICE');
  const [titleColor, setTitleColor] = useState('#a0a0a0');

  useEffect(() => {
    fetchUserProfile();
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      
      if (data.success && data.data.profile) {
        const title = UserService.getHighestTitle(data.data.profile);
        const color = UserService.getTitleColor(title);
        setUserTitle(title);
        setTitleColor(color);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Keep default values
    }
  };

  const toggleAudio = () => {
    const newMuted = audioService.toggleMute();
    setAudioMuted(newMuted);
    
    // Play a subtle click sound when toggling (if unmuting)
    if (!newMuted) {
      audioService.playSound('rally-click');
    }
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
            <div className="user-badge" style={{ borderColor: titleColor }}>
              <span className="badge-text" style={{ color: titleColor }}>{userTitle}</span>
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
