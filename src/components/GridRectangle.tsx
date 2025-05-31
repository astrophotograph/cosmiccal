import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

type GridRectangleProps = {
  width: number;
  height: number;
};

const GridRectangle = ({ width, height }: GridRectangleProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const gridRef = useRef<THREE.Group | null>(null);
  const [animationInProgress, setAnimationInProgress] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    // Create scene, camera, and renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x1a202c); // Dark background

    // Use actual width and height
    const aspectRatio = 4/3; // width / height;

    const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);

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
      const spacing = 0.03; // Further reduced spacing to make rectangles larger

      // Size based on aspect ratio to fill the screen
      const totalWidth = 4.8; // Increased from 4.2
      const totalHeight = 3.6; // Increased from 3.2

      const cellWidth = (totalWidth - (spacing * (cols - 1))) / cols;
      const cellHeight = (totalHeight - (spacing * (rows - 1))) / rows;

      // Grid starting position (top-left)
      const startX = -(totalWidth / 2) + (cellWidth / 2);
      const startY = (totalHeight / 2) - (cellHeight / 2);

      // Month names
      const months = [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
      ];

      // Create rectangles with month labels
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const index = row * cols + col;
          if (index >= months.length) continue;

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

          // Add month label in upper left corner - MUCH LARGER TEXT
          const canvas = document.createElement('canvas');
          canvas.width = 1024 / 2; // Much higher resolution
          canvas.height = 512 / 2;
          const context = canvas.getContext('2d');
          if (context) {
            context.fillStyle = '#ffffff'; // Brighter white for better visibility
            context.font = '80px Arial'; // Much larger font size
            context.textAlign = 'left';
            context.textBaseline = 'top';
            context.fillText(months[index], 30, 20);

            const texture = new THREE.CanvasTexture(canvas);
            // Larger label size
            const labelGeometry = new THREE.PlaneGeometry(cellWidth * 0.8, cellHeight * 0.35);
            const labelMaterial = new THREE.MeshBasicMaterial({
              map: texture,
              transparent: true,
              side: THREE.DoubleSide
            });

            const label = new THREE.Mesh(labelGeometry, labelMaterial);
            // Position label in the upper left of the cell
            label.position.set(
              x - (cellWidth * 0.1), // Move left from center (less to make it more visible)
              y + (cellHeight * 0.3), // Move up from center
              0.02 // Slightly in front of the border
            );
            group.add(label);
          }
        }
      }

      return group;
    };

    const grid = createGrid();
    gridRef.current = grid;
    scene.add(grid);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();

    // Event listener for button clicks
    const handleToggleAnimation = (event: Event) => {
      if (animationInProgress || !gridRef.current) return;
      setAnimationInProgress(true);

      // Get the detail to determine if we're resetting or starting
      const detail = (event as CustomEvent).detail;
      const isResetting = detail?.isResetting;

      if (isResetting) {
        // Reset the grid to its original position and rotation
        gsap.to(gridRef.current.position, {
          z: 0, // Original z position
          duration: 1.5,
          ease: 'power2.out'
        });

        gsap.to(gridRef.current.rotation, {
          x: 0, // Original rotation
          duration: 1.5,
          ease: 'power2.out',
          onComplete: () => {
            setAnimationInProgress(false);
          }
        });
      } else {
        // Animate the grid to move toward camera and tilt by 30 degrees
        gsap.to(gridRef.current.position, {
          z: 2, // Move closer to camera
          duration: 1.5,
          ease: 'power2.out'
        });

        // Rotate the grid to tilt the top away from camera at 30 degrees
        gsap.to(gridRef.current.rotation, {
          x: THREE.MathUtils.degToRad(-30), // Negative angle to tilt top away
          duration: 1.5,
          ease: 'power2.out',
          onComplete: () => {
            setAnimationInProgress(false);
          }
        });
      }
    };

    window.addEventListener('toggleGridAnimation', handleToggleAnimation);

    // Cleanup
    return () => {
      window.removeEventListener('toggleGridAnimation', handleToggleAnimation);

      if (mountRef.current && rendererRef.current && mountRef.current.contains(rendererRef.current.domElement)) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }

      // Dispose of Three.js resources
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (object.material instanceof THREE.Material) {
              object.material.dispose();
            } else if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            }
          }
        });
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [width, height]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%'
      }}
    />
  );
};

export default GridRectangle;
