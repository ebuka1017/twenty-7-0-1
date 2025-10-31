import { useState, useEffect } from 'react';
import { audioService } from '../services/audio.js';

/**
 * Hook for managing audio initialization and state
 */
export const useAudio = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMuted, setIsMuted] = useState(() => audioService.isMutedState());

  useEffect(() => {
    // Initialize audio on first user interaction
    const handleFirstInteraction = async () => {
      if (!isInitialized) {
        try {
          await audioService.initialize();
          setIsInitialized(true);
          console.log('Audio system initialized');
          
          // Remove event listeners after first interaction
          document.removeEventListener('click', handleFirstInteraction);
          document.removeEventListener('touchstart', handleFirstInteraction);
          document.removeEventListener('keydown', handleFirstInteraction);
        } catch (error) {
          console.error('Failed to initialize audio:', error);
        }
      }
    };

    // Listen for first user interaction
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [isInitialized]);

  const toggleMute = () => {
    const newMuted = audioService.toggleMute();
    setIsMuted(newMuted);
    return newMuted;
  };

  const playSound = async (soundName: string) => {
    if (isInitialized) {
      await audioService.playSound(soundName);
    }
  };

  const playRallyClick = async () => {
    if (isInitialized) {
      await audioService.playRallyClick();
    }
  };

  const playSuccess = async () => {
    if (isInitialized) {
      await audioService.playSuccess();
    }
  };

  const playError = async () => {
    if (isInitialized) {
      await audioService.playError();
    }
  };

  return {
    isInitialized,
    isMuted,
    toggleMute,
    playSound,
    playRallyClick,
    playSuccess,
    playError
  };
};