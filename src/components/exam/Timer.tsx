import React from 'react';

interface TimerProps {
  timeRemaining: number;
}

export default function Timer({ timeRemaining }: TimerProps) {
  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;
  const display = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

  let className = 'timer';
  if (timeRemaining <= 300) {
    className += ' critical';
  } else if (timeRemaining <= 600) {
    className += ' warning';
  }

  return <div className={className}>{display}</div>;
}
