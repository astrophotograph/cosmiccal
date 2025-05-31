import { useState, useEffect } from 'react';

const BeginButton = () => {
  const [isPulsing, setPulsing] = useState(true);

  // Toggle pulsing state for animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPulsing(prev => !prev);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      className={`fixed bottom-16 right-16 px-10 py-5 bg-gradient-to-r from-pink-500 to-purple-600 
                text-white font-bold rounded-full shadow-lg text-2xl z-[100]
                ${isPulsing ? 'animate-pulse scale-105' : 'scale-100'}`}
      style={{
        transition: 'all 0.5s ease',
        boxShadow: '0 0 30px rgba(236, 72, 153, 0.8)'
      }}
    >
      Begin
    </button>
  );
};

export default BeginButton;
