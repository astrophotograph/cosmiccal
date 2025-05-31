import { useState, useEffect, MouseEvent } from 'react';

interface RipplePosition {
  x: number;
  y: number;
  size: number;
  id: number;
}

const BeginButton = () => {
  const [isPulsing, setPulsing] = useState(true);
  const [ripples, setRipples] = useState<RipplePosition[]>([]);
  const [rippleCount, setRippleCount] = useState(0);
  const [isStarted, setIsStarted] = useState(false);

  // Toggle pulsing state for animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPulsing(prev => !prev);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Remove ripples after animation completes
  useEffect(() => {
    if (ripples.length === 0) return;

    const timeoutId = setTimeout(() => {
      setRipples(ripples => ripples.slice(1));
    }, 800); // Duration of ripple animation

    return () => clearTimeout(timeoutId);
  }, [ripples]);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    createRipple(e);

    // Toggle the state and dispatch the appropriate event
    setIsStarted(prevState => {
      const newState = !prevState;

      // Dispatch custom event to signal grid animation with the current state
      window.dispatchEvent(new CustomEvent('toggleGridAnimation', {
        detail: { isResetting: newState }
      }));

      return newState;
    });
  };

  const createRipple = (e: MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();

    // Get click position relative to button
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate ripple size based on button dimensions
    const size = Math.max(rect.width, rect.height) * 2;

    // Add new ripple
    const newRipple = {
      x,
      y,
      size,
      id: rippleCount
    };

    setRipples([...ripples, newRipple]);
    setRippleCount(prev => prev + 1);
  };

  return (
    <button
      className={`fixed bottom-16 right-16 px-10 py-5 bg-gradient-to-r from-pink-500 to-purple-600 
                text-white font-bold rounded-full shadow-lg text-2xl z-[100] overflow-hidden
                ${isPulsing ? 'animate-pulse scale-105' : 'scale-100'}`}
      style={{
        transition: 'all 0.5s ease',
        boxShadow: '0 0 30px rgba(236, 72, 153, 0.8)',
      }}
      onClick={handleClick}
    >
      {/* Ripple elements */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute block rounded-full bg-white opacity-70 animate-ripple"
          style={{
            top: ripple.y - ripple.size / 2,
            left: ripple.x - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
            transform: 'scale(0)',
            animation: 'ripple 800ms linear'
          }}
        />
      ))}
      {isStarted ? 'Start Over' : 'Begin'}
    </button>
  );
};

export default BeginButton;
