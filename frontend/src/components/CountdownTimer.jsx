import { useState, useEffect } from 'react';

const CountdownTimer = ({ expiresAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = new Date(expiresAt) - new Date();
      if (diff <= 0) {
        setTimeLeft('00:00');
        onExpire?.();
        return null;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    setTimeLeft(calculateTimeLeft() || '00:00');

    const interval = setInterval(() => {
      const result = calculateTimeLeft();
      if (result === null) {
        clearInterval(interval);
      } else {
        setTimeLeft(result);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  return (
    <div>
      <p className="muted" style={{ textAlign: 'center' }}>
        Reservation expires in
      </p>
      <div className="timer">{timeLeft}</div>
    </div>
  );
};

export default CountdownTimer;
