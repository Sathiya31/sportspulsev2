import React, { useEffect, useState } from "react";

interface CountdownTimerProps {
  target: string;
}

function getCountdown(target: string) {
  const now = new Date();
  const eventDate = new Date(target);
  const diff = eventDate.getTime() - now.getTime();
  if (diff <= 0) return "Event Started!";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return `${days}d ${hours}h ${minutes}m ${seconds}s to go`;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ target }) => {
  const [countdown, setCountdown] = useState(getCountdown(target));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown(target));
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return (
    <div
      className="absolute top-4 right-4 px-4 py-2 rounded-lg text-lg font-bold shadow-lg flex items-center justify-center"
      style={{
        background: "#111",
        color: "#fff",
        border: "2px solid #222",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        fontFamily: "'Roboto Slab', serif",
        minWidth: "180px",
        textAlign: "center"
      }}
    >
      <span>{countdown}</span>
    </div>
  );
};

export default CountdownTimer;
