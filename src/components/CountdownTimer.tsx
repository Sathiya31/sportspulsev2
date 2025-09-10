import React, { useState, useEffect } from 'react';

const CountdownTimer = ({target}) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetDate = new Date(target);
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        
        setTimeLeft({ days, hours, minutes, seconds });
        setIsExpired(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(timer);
  }, [target]);

  const formatNumber = (num) => {
    return num.toString().padStart(2, '0');
  };

  const TimeUnit = ({ value, label, delay }) => {
    return (
      <div 
        className="flex flex-col items-center transform transition-all duration-300 hover:scale-105"
        style={{ animationDelay: delay + 'ms' }}
      >
        <div className="relative">
          <div className="bg-gradient-to-br from-white/25 to-white/10 backdrop-blur-lg border border-white/30 rounded-xl w-16 h-16 flex items-center justify-center shadow-xl">
            <div className="text-xl font-bold text-white font-mono">
              {formatNumber(value)}
            </div>
          </div>
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400/40 to-purple-600/40 rounded-xl blur opacity-20 -z-10"></div>
        </div>
        <div className="text-white/90 text-xs font-medium mt-1 uppercase tracking-wider">
          {label}
        </div>
      </div>
    );
  };

  // Compact overlay timer component
  return (
    <div className="inline-flex items-center">
      {!isExpired ? (
        <div className="bg-black/30 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20">
          <div className="flex items-center gap-4">
            <TimeUnit value={timeLeft.days} label="Days" delay={0} />
            <div className="text-white/60 text-xl font-light">:</div>
            <TimeUnit value={timeLeft.hours} label="Hours" delay={50} />
            <div className="text-white/60 text-xl font-light">:</div>
            <TimeUnit value={timeLeft.minutes} label="Mins" delay={100} />
            <div className="text-white/60 text-xl font-light">:</div>
            <TimeUnit value={timeLeft.seconds} label="Secs" delay={150} />
          </div>
        </div>
      ) : (
        <div className="bg-red-500/20 backdrop-blur-md rounded-2xl px-6 py-4 border border-red-400/30">
          <div className="text-red-200 font-bold text-lg animate-pulse">
            EVENT OVER
          </div>
        </div>
      )}
      
      {/* Removed demo controls as they are no longer needed */}
    </div>
  );
};

export default CountdownTimer;