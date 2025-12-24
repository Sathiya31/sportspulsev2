import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  target: string | Date;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ target }) => {
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

  const formatNumber = (num: { toString: () => string; }) => {
    return num.toString().padStart(2, '0');
  };

  interface TimeUnitProps {
    value: number;
    label: string;
    delay: number;
  }

  const TimeUnit: React.FC<TimeUnitProps> = ({ value, label, delay }) => {
    return (
      <div 
        className="flex flex-col items-center transform transition-all duration-300 hover:scale-105"
        style={{ animationDelay: delay + 'ms' }}
      >
        <div className="relative">
          <div className="bg-gradient-to-br from-white/25 to-white/10 backdrop-blur-lg border border-white/30 rounded-lg sm:rounded-xl w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center shadow-xl">
            <div className="text-base sm:text-lg md:text-xl font-bold text-white font-mono">
              {formatNumber(value)}
            </div>
          </div>
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400/40 to-purple-600/40 rounded-lg sm:rounded-xl blur opacity-20 -z-10"></div>
        </div>
        <div className="text-white/90 text-[10px] sm:text-xs font-medium mt-1 uppercase tracking-wider">
          {label}
        </div>
      </div>
    );
  };

  return (
    <div className="inline-flex items-center w-full sm:w-auto justify-center sm:justify-start">
      {!isExpired ? (
        <div className="bg-black/30 backdrop-blur-md rounded-xl sm:rounded-2xl px-3 py-3 sm:px-4 sm:py-3 md:px-6 md:py-4 border border-white/20 w-full sm:w-auto">
          <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 md:gap-4">
            <TimeUnit value={timeLeft.days} label="Days" delay={0} />
            <div className="text-white/60 text-base sm:text-lg md:text-xl font-light">:</div>
            <TimeUnit value={timeLeft.hours} label="Hours" delay={50} />
            <div className="text-white/60 text-base sm:text-lg md:text-xl font-light">:</div>
            <TimeUnit value={timeLeft.minutes} label="Mins" delay={100} />
            <div className="text-white/60 text-base sm:text-lg md:text-xl font-light">:</div>
            <TimeUnit value={timeLeft.seconds} label="Secs" delay={150} />
          </div>
          
          {/* Mobile-only compact seconds display */}
          {/* <div className="flex xs:hidden justify-center mt-2 pt-2 border-t border-white/20">
            <div className="flex items-center gap-2">
              <TimeUnit value={timeLeft.minutes} label="Min" delay={100} />
              <div className="text-white/60 text-sm font-light">:</div>
              <TimeUnit value={timeLeft.seconds} label="Sec" delay={150} />
            </div>
          </div> */}
        </div>
      ) : (
        <div className="bg-red-500/20 backdrop-blur-md rounded-xl sm:rounded-2xl px-4 py-3 sm:px-6 sm:py-4 border border-red-400/30 w-full sm:w-auto">
          <div className="text-red-200 font-bold text-sm sm:text-base md:text-lg animate-pulse text-center">
            EVENT OVER
          </div>
        </div>
      )}
    </div>
  );
};

export default CountdownTimer;