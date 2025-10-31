// Audio service for managing background music and sound effects
export class AudioService {
  private static instance: AudioService;
  private backgroundMusic: HTMLAudioElement | null = null;
  private soundEffects: Map<string, HTMLAudioElement> = new Map();
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  private constructor() {
    // Load mute state from localStorage
    this.isMuted = localStorage.getItem('2701_audio_muted') === 'true';
  }

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  /**
   * Initialize audio system - must be called after user interaction
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize background music
      this.backgroundMusic = new Audio();
      this.backgroundMusic.src = '/assets/vault-synth.mp3'; // Placeholder - will be added to assets
      this.backgroundMusic.loop = true;
      this.backgroundMusic.volume = this.isMuted ? 0 : 0.2;
      
      // Preload sound effects
      const rallyClickAudio = new Audio();
      rallyClickAudio.src = '/assets/rally-click.mp3'; // Placeholder - will be added to assets
      rallyClickAudio.volume = this.isMuted ? 0 : 0.5;
      this.soundEffects.set('rally-click', rallyClickAudio);

      // Additional sound effects for future use
      const successAudio = new Audio();
      successAudio.src = '/assets/success.mp3'; // Placeholder
      successAudio.volume = this.isMuted ? 0 : 0.4;
      this.soundEffects.set('success', successAudio);

      const errorAudio = new Audio();
      errorAudio.src = '/assets/error.mp3'; // Placeholder
      errorAudio.volume = this.isMuted ? 0 : 0.3;
      this.soundEffects.set('error', errorAudio);

      this.isInitialized = true;
      console.log('Audio service initialized');

      // Start background music if not muted
      if (!this.isMuted) {
        await this.playBackgroundMusic();
      }

    } catch (error) {
      console.error('Failed to initialize audio service:', error);
      // Don't throw - audio is not critical for functionality
    }
  }

  /**
   * Play background music
   */
  async playBackgroundMusic(): Promise<void> {
    if (!this.backgroundMusic || this.isMuted) return;

    try {
      await this.backgroundMusic.play();
      console.log('Background music started');
    } catch (error) {
      console.warn('Failed to play background music:', error);
      // Browser may block autoplay - this is expected
    }
  }

  /**
   * Stop background music
   */
  stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
  }

  /**
   * Play a sound effect
   */
  async playSound(soundName: string): Promise<void> {
    if (this.isMuted) return;

    const audio = this.soundEffects.get(soundName);
    if (!audio) {
      console.warn(`Sound effect not found: ${soundName}`);
      return;
    }

    try {
      // Reset audio to beginning and play
      audio.currentTime = 0;
      await audio.play();
    } catch (error) {
      console.warn(`Failed to play sound effect ${soundName}:`, error);
      // Don't throw - sound effects are not critical
    }
  }

  /**
   * Toggle mute state
   */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('2701_audio_muted', this.isMuted.toString());

    // Update all audio volumes
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.isMuted ? 0 : 0.2;
    }

    this.soundEffects.forEach(audio => {
      const baseVolume = audio === this.soundEffects.get('rally-click') ? 0.5 : 
                        audio === this.soundEffects.get('success') ? 0.4 : 0.3;
      audio.volume = this.isMuted ? 0 : baseVolume;
    });

    // Start or stop background music based on mute state
    if (this.isMuted) {
      this.stopBackgroundMusic();
    } else if (this.isInitialized) {
      this.playBackgroundMusic();
    }

    console.log(`Audio ${this.isMuted ? 'muted' : 'unmuted'}`);
    return this.isMuted;
  }

  /**
   * Get current mute state
   */
  isMutedState(): boolean {
    return this.isMuted;
  }

  /**
   * Set volume for background music
   */
  setBackgroundVolume(volume: number): void {
    if (this.backgroundMusic && !this.isMuted) {
      this.backgroundMusic.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Trigger haptic feedback on mobile devices
   */
  triggerHapticFeedback(pattern: number | number[] = 100): void {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        // Vibration API might not be supported or allowed
        console.debug('Haptic feedback not available:', error);
      }
    }
  }

  /**
   * Play rally click sound with haptic feedback
   */
  async playRallyClick(): Promise<void> {
    // Play sound effect
    await this.playSound('rally-click');
    
    // Trigger haptic feedback on mobile
    this.triggerHapticFeedback([100]);
  }

  /**
   * Play success sound with celebration haptic pattern
   */
  async playSuccess(): Promise<void> {
    await this.playSound('success');
    this.triggerHapticFeedback([200, 100, 200]);
  }

  /**
   * Play error sound with single haptic pulse
   */
  async playError(): Promise<void> {
    await this.playSound('error');
    this.triggerHapticFeedback([300]);
  }

  /**
   * Cleanup audio resources
   */
  cleanup(): void {
    this.stopBackgroundMusic();
    
    if (this.backgroundMusic) {
      this.backgroundMusic.src = '';
      this.backgroundMusic = null;
    }

    this.soundEffects.forEach(audio => {
      audio.src = '';
    });
    this.soundEffects.clear();
    
    this.isInitialized = false;
  }
}

// Export singleton instance
export const audioService = AudioService.getInstance();