import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

/**
 * CountdownTimer Component - Displays countdown for reservations
 */
const CountdownTimer = ({ expiryTime, onExpire, showWarning = true }) => {
  const [timeLeft, setTimeLeft] = useState({
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      if (!expiryTime) return;

      const now = new Date();
      const diff = new Date(expiryTime) - now;

      if (diff <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, isExpired: true });
        onExpire?.();
        clearInterval(timer);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft({ minutes, seconds, isExpired: false });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryTime, onExpire]);

  const isWarning = timeLeft.minutes === 0 && timeLeft.seconds <= 60;

  return (
    <div className={`text-center p-4 rounded-lg border-2 ${
      timeLeft.isExpired
        ? 'bg-error-50 border-error-200'
        : isWarning && showWarning
          ? 'bg-warning-50 border-warning-200'
          : 'bg-primary-50 border-primary-200'
    }`}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <Clock className={`w-5 h-5 ${
          timeLeft.isExpired
            ? 'text-error-600'
            : isWarning && showWarning
              ? 'text-warning-600'
              : 'text-primary-600'
        }`} />
        <span className={`text-sm font-semibold ${
          timeLeft.isExpired
            ? 'text-error-800'
            : isWarning && showWarning
              ? 'text-warning-800'
              : 'text-primary-800'
        }`}>
          Reservation Expires In
        </span>
      </div>
      <p className={`text-3xl font-bold font-mono ${
        timeLeft.isExpired
          ? 'text-error-600'
          : isWarning && showWarning
            ? 'text-warning-600'
            : 'text-primary-600'
      }`}>
        {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </p>

      {timeLeft.isExpired && (
        <div className="mt-3 flex items-center justify-center gap-2 text-error-700 text-sm">
          <AlertTriangle className="w-4 h-4" />
          Your reservation has expired
        </div>
      )}
    </div>
  );
};

export default CountdownTimer;
