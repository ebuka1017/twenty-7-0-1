import React, { useState, useEffect } from 'react';
import { realtimeService, ConnectionStatus as Status } from '../services/realtime.js';
import './ConnectionStatus.css';

const ConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState<Status>(realtimeService.getConnectionStatus());

  useEffect(() => {
    const unsubscribe = realtimeService.onStatusChange(setStatus);
    return unsubscribe;
  }, []);

  const getStatusText = (): string => {
    if (status.isReconnecting) return 'Reconnecting...';
    if (status.isConnected) return 'Live Updates';
    return 'Offline Mode';
  };

  const getStatusClass = (): string => {
    if (status.isReconnecting) return 'reconnecting';
    if (status.isConnected) return 'connected';
    return 'disconnected';
  };

  return (
    <div className={`connection-status ${getStatusClass()}`}>
      <div className="status-indicator"></div>
      <span className="status-text">{getStatusText()}</span>
    </div>
  );
};

export default ConnectionStatus;