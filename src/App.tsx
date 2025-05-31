import { useEffect, useState } from 'react';
import GridRectangle from './components/GridRectangle';
import BeginButton from './components/BeginButton';
import type { DateImageEntry } from './components/types';

function App() {
  const currentYear = new Date().getFullYear();
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 50 // Reserve space for footer
  });

  // Create example array of dates and images
  const exampleDateImages: DateImageEntry[] = [
    {
      date: new Date(currentYear, 0, 15), // January 15
      imageUrl: 'https://picsum.photos/150/150?random=1'
    },
    {
      date: new Date(currentYear, 1, 14), // February 14
      imageUrl: 'https://picsum.photos/150/150?random=2'
    },
    {
      date: new Date(currentYear, 2, 17), // March 17
      imageUrl: 'https://picsum.photos/150/150?random=3'
    },
    {
      date: new Date(currentYear, 3, 1), // April 1
      imageUrl: 'https://picsum.photos/150/150?random=4'
    },
    {
      date: new Date(currentYear, 4, 25), // May 25
      imageUrl: 'https://picsum.photos/150/150?random=5'
    },
    {
      date: new Date(currentYear, 5, 10), // June 10
      imageUrl: 'https://picsum.photos/150/150?random=6'
    },
    {
      date: new Date(currentYear, 6, 4), // July 4
      imageUrl: 'https://picsum.photos/150/150?random=7'
    },
    {
      date: new Date(currentYear, 7, 8), // August 8
      imageUrl: 'https://picsum.photos/150/150?random=8'
    },
    {
      date: new Date(currentYear, 8, 21), // September 21
      imageUrl: 'https://picsum.photos/150/150?random=9'
    },
    {
      date: new Date(currentYear, 9, 31), // October 31
      imageUrl: 'https://picsum.photos/150/150?random=10'
    },
    {
      date: new Date(currentYear, 10, 24), // November 24
      imageUrl: 'https://picsum.photos/150/150?random=11'
    },
    {
      date: new Date(currentYear, 11, 25), // December 25
      imageUrl: 'https://picsum.photos/150/150?random=12'
    }
  ];

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
          dateImages={exampleDateImages}
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
