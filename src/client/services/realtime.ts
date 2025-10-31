import { connectRealtime } from '@devvit/web/client';

export interface RallyUpdateMessage {
  type: 'rally_update';
  guessId: string;
  newRallyCount: number;
  cipherId: string;
  timestamp: number;
}

export interface CipherExpiredMessage {
  type: 'cipher_expired';
  cipherId: string;
  winner: {
    id: string;
    username: string;
    content: string;
    rallyCount: number;
  } | null;
  solution: string;
  timestamp: number;
}

export interface CipherLockdownMessage {
  type: 'cipher_lockdown';
  cipherId: string;
  timestamp: number;
  timeRemaining: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  isReconnecting: boolean;
  lastConnected?: number;
}

export class RealtimeService {
  private connection: any = null;
  private connectionStatus: ConnectionStatus = {
    isConnected: false,
    isReconnecting: false
  };
  private statusCallbacks: ((status: ConnectionStatus) => void)[] = [];
  private messageCallbacks: ((message: RallyUpdateMessage | CipherExpiredMessage | CipherLockdownMessage) => void)[] = [];
  private fallbackInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect(cipherId: string): Promise<void> {
    try {
      this.setConnectionStatus({
        isConnected: false,
        isReconnecting: true
      });

      this.connection = await connectRealtime({
        channel: `cipher_${cipherId}`,
        onConnect: (channel) => {
          console.log(`Connected to realtime channel: ${channel}`);
          this.reconnectAttempts = 0;
          this.setConnectionStatus({
            isConnected: true,
            isReconnecting: false,
            lastConnected: Date.now()
          });
          this.stopFallbackPolling();
        },
        onDisconnect: (channel) => {
          console.log(`Disconnected from realtime channel: ${channel}`);
          this.setConnectionStatus({
            isConnected: false,
            isReconnecting: false
          });
          this.startFallbackPolling(cipherId);
          this.scheduleReconnect(cipherId);
        },
        onMessage: (data: any) => {
          console.log('Received realtime message:', data);
          // Validate the message structure
          if (data && typeof data === 'object') {
            if (data.type === 'rally_update') {
              this.notifyMessageCallbacks(data as RallyUpdateMessage);
            } else if (data.type === 'cipher_expired') {
              this.notifyMessageCallbacks(data as CipherExpiredMessage);
              // Also dispatch a custom event for components that need it
              window.dispatchEvent(new CustomEvent('cipherExpired', { detail: data }));
            } else if (data.type === 'cipher_lockdown') {
              this.notifyMessageCallbacks(data as CipherLockdownMessage);
              // Also dispatch a custom event for components that need it
              window.dispatchEvent(new CustomEvent('cipherLockdown', { detail: data }));
            }
          }
        }
      });

    } catch (error) {
      console.error('Failed to connect to realtime:', error);
      this.setConnectionStatus({
        isConnected: false,
        isReconnecting: false
      });
      this.startFallbackPolling(cipherId);
      this.scheduleReconnect(cipherId);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.disconnect();
      this.connection = null;
    }
    
    this.stopFallbackPolling();
    this.clearReconnectTimeout();
    
    this.setConnectionStatus({
      isConnected: false,
      isReconnecting: false
    });
  }

  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  onMessage(callback: (message: RallyUpdateMessage | CipherExpiredMessage | CipherLockdownMessage) => void): () => void {
    this.messageCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.messageCallbacks.indexOf(callback);
      if (index > -1) {
        this.messageCallbacks.splice(index, 1);
      }
    };
  }

  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  private setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = { ...status };
    this.statusCallbacks.forEach(callback => callback(this.connectionStatus));
  }

  private notifyMessageCallbacks(message: RallyUpdateMessage | CipherExpiredMessage | CipherLockdownMessage): void {
    this.messageCallbacks.forEach(callback => callback(message));
  }

  private startFallbackPolling(cipherId: string): void {
    if (this.fallbackInterval) return;

    console.log('Starting fallback polling for rally updates');
    
    this.fallbackInterval = setInterval(async () => {
      try {
        // Poll for rally updates every 5 seconds
        const response = await fetch(`/api/cipher/${cipherId}/rally-updates`);
        const data = await response.json();
        
        if (data.success && data.data.updates) {
          data.data.updates.forEach((update: RallyUpdateMessage) => {
            this.notifyMessageCallbacks(update);
          });
        }
      } catch (error) {
        console.error('Fallback polling error:', error);
      }
    }, 5000);
  }

  private stopFallbackPolling(): void {
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
      console.log('Stopped fallback polling');
    }
  }

  private scheduleReconnect(cipherId: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }

    this.clearReconnectTimeout();
    
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 16000);
    
    console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(cipherId);
    }, delay);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

// Singleton instance
export const realtimeService = new RealtimeService();