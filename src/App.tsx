import { useEffect, useState } from 'react';
import GridRectangle from './components/GridRectangle';
import BeginButton from './components/BeginButton';

function App() {
  const currentYear = new Date().getFullYear();
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 50 // Reserve space for footer
  });

  // Update dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 50 // Reserve space for footer
      });
    };

    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900">
      <div className="absolute inset-0" style={{ bottom: '50px' }}>
        <GridRectangle
          width={dimensions.width}
          height={dimensions.height}
        />
      </div>
      <BeginButton />
      <footer className="fixed bottom-0 left-0 w-full h-[50px] py-3 bg-gray-800 text-gray-400 text-center text-sm z-50">
        <p>© {currentYear} the authors. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
