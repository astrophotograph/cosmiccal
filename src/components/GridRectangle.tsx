import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import {type GridRectangleProps, type GridRefs, type DateImageEntry, INITIAL_Z} from './types'
import { createGrid } from './gridCreator';
import { updateGlowingBorders } from './animationUtils';
import { handleMouseClick, handleGridAction } from './eventHandlers';

const GridRectangle = ({ width, height, dateImages = [] }: GridRectangleProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [animationInProgress, setAnimationInProgress] = useState(false);
  const dateImagesRef = useRef<DateImageEntry[]>(dateImages);

  // Create all the refs needed for the grid
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const gridRef = useRef<THREE.Group | null>(null);
  const monthCellsRef = useRef<THREE.Group[]>([]);
  const monthPositionsRef = useRef<{x: number, y: number, row: number}[]>([]);
  const monthLabelsRef = useRef<THREE.Mesh[]>([]);
  const dayGroupsRef = useRef<THREE.Group[]>([]);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const currentMonthIndexRef = useRef<number>(-1);

  // Update dateImagesRef when dateImages prop changes
  useEffect(() => {
    dateImagesRef.current = dateImages;
  }, [dateImages]);

  // Collect all refs into a single object for easier passing to functions
  const refs: GridRefs = {
    scene: sceneRef,
    camera: cameraRef,
    renderer: rendererRef,
    grid: gridRef,
    monthCells: monthCellsRef,
    monthPositions: monthPositionsRef,
    monthLabels: monthLabelsRef,
    dayGroups: dayGroupsRef,
    raycaster: raycasterRef,
    mouse: mouseRef,
    currentMonthIndex: currentMonthIndexRef
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // Calculate dimensions to maintain aspect ratio
    const targetAspectRatio = 4/3;
    let renderWidth = width;
    let renderHeight = height;

    const currentAspectRatio = width / height;

    if (currentAspectRatio > targetAspectRatio) {
      // Too wide, constrain by height
      renderWidth = height * targetAspectRatio;
    } else {
      // Too tall, constrain by width
      renderHeight = width / targetAspectRatio;
    }

    // Create scene, camera, and renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x010101); // Dark background
    // scene.background = new THREE.Color(0x1a202c); // Dark background

    const camera = new THREE.PerspectiveCamera(15, targetAspectRatio, 0.01, 1000);
    cameraRef.current = camera;
    camera.position.z = INITIAL_Z;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(renderWidth, renderHeight);

    // Center the renderer in the container
    const containerStyle = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    };
    Object.assign(renderer.domElement.style, containerStyle);

    // Clear any existing canvas to prevent duplication
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }

    mountRef.current.appendChild(renderer.domElement);

    // Create the grid
    const grid = createGrid(refs, dateImagesRef.current);
    gridRef.current = grid;
    scene.add(grid);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Update glowing borders
      if (monthCellsRef.current.length > 0) {
        updateGlowingBorders(monthCellsRef.current);
      }

      if (renderer && camera) {
        renderer.render(scene, camera);
      }
    };

    animate();

    // Event listeners
    const clickHandler = (event: MouseEvent) => handleMouseClick(event, refs);
    renderer.domElement.addEventListener('click', clickHandler);

    const gridActionHandler = (event: Event) => handleGridAction(event, refs, setAnimationInProgress);
    window.addEventListener('gridAction', gridActionHandler);

    // Cleanup
    return () => {
      window.removeEventListener('gridAction', gridActionHandler);
      renderer.domElement.removeEventListener('click', clickHandler);

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
