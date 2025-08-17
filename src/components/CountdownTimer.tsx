import React from 'react';
import { useCountdown } from '../lib/hooks/useCountdown';

interface CountdownTimerProps {
  initialHours: number;
  onExpired?: () => void;
  showSeconds?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function CountdownTimer({ 
  initialHours, 
  onExpired, 
  showSeconds = true,
  size = 'medium' 
}: CountdownTimerProps) {
  const countdown = useCountdown(initialHours);

  // Call expiration callback when timer hits zero
  React.useEffect(() => {
    if (countdown.isExpired && onExpired) {
      onExpired();
    }
  }, [countdown.isExpired, onExpired]);

  const formatTime = () => {
    if (countdown.isExpired) {
      return 'ENDED';
    }

    if (countdown.totalHours >= 24) {
      const days = Math.floor(countdown.totalHours / 24);
      const hours = countdown.hours % 24;
      return `${days}d ${hours}h`;
    }

    if (countdown.totalHours >= 1) {
      if (showSeconds && countdown.totalHours < 3) {
        return `${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`;
      }
      return `${countdown.hours}h ${countdown.minutes}m`;
    }

    // Under 1 hour - always show seconds
    return `${countdown.minutes}m ${countdown.seconds}s`;
  };

  const getTimerClass = () => {
    const baseClass = `countdown-timer countdown-${size}`;
    const urgencyClass = `countdown-${countdown.urgencyLevel}`;
    const expiredClass = countdown.isExpired ? 'countdown-expired' : '';
    
    return `${baseClass} ${urgencyClass} ${expiredClass}`.trim();
  };

  const getUrgencyIcon = () => {
    if (countdown.isExpired) return '⏰';
    
    switch (countdown.urgencyLevel) {
      case 'critical': return '🚨';
      case 'high': return '⚡';
      case 'medium': return '⏰';
      case 'low': return '🕐';
      default: return '⏰';
    }
  };

  return (
    <div className={getTimerClass()}>
      <span className="countdown-icon">{getUrgencyIcon()}</span>
      <span className="countdown-text">{formatTime()}</span>
      {countdown.urgencyLevel === 'critical' && !countdown.isExpired && (
        <span className="pulse-dot"></span>
      )}
    </div>
  );
}