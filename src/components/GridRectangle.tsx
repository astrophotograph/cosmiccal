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
  const monthCellsRef = useRef<THREE.Group[]>([]);
  const monthPositionsRef = useRef<{x: number, y: number, row: number}[]>([]);

  useEffect(() => {
    if (!mountRef.current) return;

    // Create scene, camera, and renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x1a202c); // Dark background

    // Use actual width and height
    const aspectRatio = 4/3;

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
      const totalWidth = 4.8;
      const totalHeight = 3.6;

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

      // Array to store the original positions of each month cell
      const monthPositions: {x: number, y: number, row: number}[] = [];
      const monthCells: THREE.Group[] = [];

      // Create rectangles with month labels
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const index = row * cols + col;
          if (index >= months.length) continue;

          // Calculate position
          const x = startX + (col * (cellWidth + spacing));
          const y = startY - (row * (cellHeight + spacing));

          // Store the position for later reference
          monthPositions[index] = { x, y, row };

          // Create a group for each month cell
          const monthCell = new THREE.Group();
          monthCell.position.set(x, y, 0);

          // Add cell to the main grid
          group.add(monthCell);
          monthCells.push(monthCell);

          // Create the cell rectangle
          const geometry = new THREE.PlaneGeometry(cellWidth, cellHeight);
          const material = new THREE.MeshBasicMaterial({
            color: 0x2d3748,
            side: THREE.DoubleSide,
            wireframe: false
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(0, 0, 0);
          monthCell.add(mesh);

          // Add normal border
          const borderMaterial = new THREE.LineBasicMaterial({ color: 0x4a5568 });
          const border = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry),
            borderMaterial
          );
          border.position.set(0, 0, 0.01); // Slightly in front of the cell
          monthCell.add(border);

          // Add glowing border (initially hidden) - Yellow color
          const glowMaterial = new THREE.LineBasicMaterial({
            color: 0xFFD700, // Yellowish gold color
            linewidth: 3,
            transparent: true,
            opacity: 0.8
          });

          const glowBorder = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry),
            glowMaterial
          );
          // Position further in front to avoid clipping
          glowBorder.position.set(0, 0, 0.05);
          // Scale slightly larger but not too much
          glowBorder.scale.set(1.03, 1.03, 1);
          glowBorder.visible = false; // Hidden by default
          glowBorder.userData.isGlowBorder = true; // Mark for identification
          monthCell.add(glowBorder);

          // Add month label in upper left corner
          const canvas = document.createElement('canvas');
          canvas.width = 1024 / 2;
          canvas.height = 512 / 2;
          const context = canvas.getContext('2d');
          if (context) {
            context.fillStyle = '#ffffff';
            context.font = '80px Arial';
            context.textAlign = 'left';
            context.textBaseline = 'top';
            context.fillText(months[index], 30, 20);

            const texture = new THREE.CanvasTexture(canvas);
            // Slightly smaller label to avoid overlaps
            const labelGeometry = new THREE.PlaneGeometry(cellWidth * 0.75, cellHeight * 0.3);
            const labelMaterial = new THREE.MeshBasicMaterial({
              map: texture,
              transparent: true,
              side: THREE.DoubleSide
            });

            const label = new THREE.Mesh(labelGeometry, labelMaterial);
            // Position label to avoid clipping with borders
            label.position.set(
              -cellWidth * 0.08, // Moved slightly to reduce overhang
              cellHeight * 0.28,  // Moved slightly to reduce overhang
              0.04 // Z-position between regular border and glow border
            );
            monthCell.add(label);
          }
        }
      }

      // Store the month positions and cells for later use
      monthPositionsRef.current = monthPositions;
      monthCellsRef.current = monthCells;

      return group;
    };

    const grid = createGrid();
    gridRef.current = grid;
    scene.add(grid);

    // Animation loop with pulsing glow effect
    const animate = () => {
      requestAnimationFrame(animate);

      // Pulse all visible glowing borders
      const time = Date.now() * 0.001; // Convert to seconds
      // Use a slower, more subtle pulsing
      const pulseFactor = Math.sin(time * 2) * 0.15 + 0.85; // Oscillate between 0.7 and 1.0

      monthCellsRef.current.forEach(monthCell => {
        monthCell.children.forEach(child => {
          if (child.userData.isGlowBorder && child.visible) {
            // Update the material opacity for a pulsing effect
            (child.material as THREE.LineBasicMaterial).opacity = pulseFactor;

            // Apply a slightly varied scale for extra effect - more subtle
            const pulseScale = 1.03 + pulseFactor * 0.02; // Between 1.03 and 1.05
            child.scale.set(pulseScale, pulseScale, 1);
          }
        });
      });

      renderer.render(scene, camera);
    };

    animate();

    // Helper to show/hide the glowing border for a specific month
    const setMonthGlowingBorder = (monthIndex: number, visible: boolean) => {
      // Hide all glowing borders first
      monthCellsRef.current.forEach(monthCell => {
        monthCell.children.forEach(child => {
          if (child.userData.isGlowBorder) {
            child.visible = false;
          }
        });
      });

      // Show the specific month's glowing border if requested
      if (visible && monthIndex >= 0 && monthIndex < monthCellsRef.current.length) {
        const monthCell = monthCellsRef.current[monthIndex];
        monthCell.children.forEach(child => {
          if (child.userData.isGlowBorder) {
            child.visible = true;
          }
        });
      }
    };

    // Event listener for button clicks
    const handleGridAction = (event: Event) => {
      if (animationInProgress || !gridRef.current) return;
      setAnimationInProgress(true);

      const { action, monthIndex } = (event as CustomEvent).detail;

      // Hide all glowing borders initially
      setMonthGlowingBorder(-1, false);

      if (action === 'initialZoom') {
        // Initial grid tilt angle in radians
        const tiltAngle = THREE.MathUtils.degToRad(-30);

        // Step 1: Initial zoom - move grid toward camera and tilt
        gsap.to(gridRef.current.position, {
          z: 2,
          duration: 1.5,
          ease: 'power2.out'
        });

        gsap.to(gridRef.current.rotation, {
          x: tiltAngle,
          duration: 1.5,
          ease: 'power2.out',
          onComplete: () => {
            setAnimationInProgress(false);
            // Notify button to update text
            window.dispatchEvent(new CustomEvent('gridStageComplete', {
              detail: { stage: 'initialZoom' }
            }));
          }
        });
      }
      else if (action === 'focusMonth') {
        const totalMonths = 12;
        const isLastMonth = monthIndex === totalMonths - 1;

        // Get the position of the target month
        const monthPosition = monthPositionsRef.current[monthIndex];

        if (!monthPosition || monthIndex >= monthCellsRef.current.length) {
          setAnimationInProgress(false);
          return;
        }

        // Get current tilt angle from grid rotation
        const tiltAngle = gridRef.current.rotation.x;

        // Calculate the row-based parameters to ensure consistent distance
        // For a tilted grid, we need to account for the perspective effect
        // as rows further from the camera appear smaller

        // Base zoom level for row 0 (first row)
        const baseZoom = 2.0;

        // Calculate zoom adjustment based on row and tilt angle
        // When the grid is tilted, rows further back need more zoom to appear the same size
        const perspectiveCompensation = 0.45; // Adjust based on testing

        // Calculate row-specific zoom factor that increases with row number
        // This compensates for the perspective effect making further rows appear smaller
        let zoomLevel = baseZoom + (monthPosition.row * perspectiveCompensation);

        // Z-offset to push the grid back for further rows
        // This helps maintain a consistent apparent distance
        const zOffset = monthPosition.row * 0.8;

        // X and Y offset adjustments for perspective
        // As we look further down the grid, we need to adjust the center point
        const yOffsetAdjustment = monthPosition.row * 0.3 * Math.sin(tiltAngle);

        // Move grid to center the month, with adjusted offsets for perspective
        gsap.to(gridRef.current.position, {
          x: -monthPosition.x * zoomLevel,
          y: -monthPosition.y * zoomLevel + yOffsetAdjustment,
          z: 2 - zOffset, // Move further back for further rows
          duration: 1.2,
          ease: 'power2.inOut'
        });

        // Scale up to zoom in on the month
        gsap.to(gridRef.current.scale, {
          x: zoomLevel,
          y: zoomLevel,
          z: zoomLevel,
          duration: 1.2,
          ease: 'power2.inOut',
          onComplete: () => {
            setAnimationInProgress(false);

            // Show the glowing border around the current month
            setMonthGlowingBorder(monthIndex, true);

            // If it's the last month, notify to change button to "Start Over"
            if (isLastMonth) {
              window.dispatchEvent(new CustomEvent('gridStageComplete', {
                detail: { stage: 'lastMonth' }
              }));
            }
          }
        });
      }
      else if (action === 'reset') {
        // Hide all glowing borders
        setMonthGlowingBorder(-1, false);

        // Reset position, rotation and scale
        gsap.to(gridRef.current.position, {
          x: 0,
          y: 0,
          z: 0,
          duration: 1.5,
          ease: 'power2.inOut'
        });

        gsap.to(gridRef.current.rotation, {
          x: 0,
          y: 0,
          z: 0,
          duration: 1.5,
          ease: 'power2.inOut'
        });

        gsap.to(gridRef.current.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 1.5,
          ease: 'power2.inOut',
          onComplete: () => {
            setAnimationInProgress(false);
            window.dispatchEvent(new CustomEvent('gridStageComplete', {
              detail: { stage: 'resetComplete' }
            }));
          }
        });
      }
    };

    window.addEventListener('gridAction', handleGridAction);

    // Cleanup
    return () => {
      window.removeEventListener('gridAction', handleGridAction);

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
