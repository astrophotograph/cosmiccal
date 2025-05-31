import { useRef, useEffect } from 'react';
import * as THREE from 'three';

type GridRectangleProps = {
  width?: number;
  height?: number;
};

const GridRectangle = ({ width = 800, height = 600 }: GridRectangleProps) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Create scene, camera, and renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a202c); // Dark background

    // Make the container square by using the smaller dimension
    const size = Math.min(width, height);

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000); // Aspect ratio of 1 for square view
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(size, size);

    // Clear any existing canvas to prevent duplication
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }

    mountRef.current.appendChild(renderer.domElement);

    // Create a 4x3 grid of rectangles
    const createGrid = () => {
      const group = new THREE.Group();

      // Grid dimensions
      const cols = 4;
      const rows = 3;
      const spacing = 0.05;

      // For a square overall appearance, we need to adjust the aspect ratio
      const totalWidth = 4; // Width of the entire grid
      const totalHeight = 4; // Height of the entire grid (making it square)

      const cellWidth = (totalWidth - (spacing * (cols - 1))) / cols;
      const cellHeight = (totalHeight - (spacing * (rows - 1))) / rows;

      // Grid starting position (top-left)
      const startX = -(totalWidth / 2) + (cellWidth / 2);
      const startY = (totalHeight / 2) - (cellHeight / 2);

      // Create rectangles
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const geometry = new THREE.PlaneGeometry(cellWidth, cellHeight);
          const material = new THREE.MeshBasicMaterial({
            color: 0x2d3748,
            side: THREE.DoubleSide,
            wireframe: false
          });

          // Add border
          const border = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry),
            new THREE.LineBasicMaterial({ color: 0x4a5568 })
          );

          const mesh = new THREE.Mesh(geometry, material);

          // Position
          const x = startX + (col * (cellWidth + spacing));
          const y = startY - (row * (cellHeight + spacing));

          mesh.position.set(x, y, 0);
          border.position.set(x, y, 0.01); // Slightly in front to avoid z-fighting

          group.add(mesh);
          group.add(border);
        }
      }

      return group;
    };

    const grid = createGrid();
    scene.add(grid);

    // Simple render function without animation
    const render = () => {
      renderer.render(scene, camera);
    };

    // Initial render
    render();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const containerWidth = mountRef.current.clientWidth;
      const containerHeight = mountRef.current.clientHeight;

      // Keep it square using the smaller dimension
      const size = Math.min(containerWidth, containerHeight);

      renderer.setSize(size, size);
      render(); // Re-render after resize
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }

      // Dispose of Three.js resources
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          } else if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          }
        }
      });

      renderer.dispose();
    };
  }, [width, height]);

  return (
    <div className="flex justify-center items-center">
      <div
        ref={mountRef}
        style={{
          width: '100%',
          maxWidth: `${Math.min(width, height)}px`,
          aspectRatio: '1/1'
        }}
        className="relative"
      />
    </div>
  );
};

export default GridRectangle;
