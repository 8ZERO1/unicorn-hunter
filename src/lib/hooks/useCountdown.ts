import { useState, useEffect } from 'react';

export interface CountdownData {
  hours: number;
  minutes: number;
  seconds: number;
  totalHours: number;
  isExpired: boolean;
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
}

export function useCountdown(initialHours: number): CountdownData {
  const [timeLeft, setTimeLeft] = useState(initialHours);

  useEffect(() => {
    // Don't run timer for expired auctions
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - (1 / 3600); // Subtract 1 second (in hours)
        return newTime > 0 ? newTime : 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const hours = Math.floor(timeLeft);
  const minutes = Math.floor((timeLeft - hours) * 60);
  const seconds = Math.floor(((timeLeft - hours) * 60 - minutes) * 60);

  const getUrgencyLevel = (hours: number): 'critical' | 'high' | 'medium' | 'low' => {
    if (hours < 1) return 'critical';
    if (hours < 3) return 'high';
    if (hours < 12) return 'medium';
    return 'low';
  };

  return {
    hours,
    minutes,
    seconds,
    totalHours: timeLeft,
    isExpired: timeLeft <= 0,
    urgencyLevel: getUrgencyLevel(timeLeft)
  };
}