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
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const monthLabelsRef = useRef<THREE.Mesh[]>([]);
  const dayGroupsRef = useRef<THREE.Group[]>([]);
  const currentMonthIndexRef = useRef<number>(-1);

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
    scene.background = new THREE.Color(0x1a202c); // Dark background

    const camera = new THREE.PerspectiveCamera(75, targetAspectRatio, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.z = 5;

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

    // Helper to get days in a month
    const getDaysInMonth = (month: number, year = new Date().getFullYear()) => {
      return new Date(year, month + 1, 0).getDate();
    };

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

      // Arrays for references
      const monthPositions: {x: number, y: number, row: number}[] = [];
      const monthCells: THREE.Group[] = [];
      const monthLabels: THREE.Mesh[] = [];
      const dayGroups: THREE.Group[] = [];

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

          // Add month label
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
              side: THREE.DoubleSide,
              opacity: 1
            });

            const label = new THREE.Mesh(labelGeometry, labelMaterial);
            // Position label to avoid clipping with borders
            label.position.set(
              -cellWidth * 0.08, // Moved slightly to reduce overhang
              cellHeight * 0.28,  // Moved slightly to reduce overhang
              0.04 // Z-position between regular border and glow border
            );
            monthCell.add(label);
            monthLabels.push(label);
          }

          // Create a group for days of the month (initially hidden)
          const dayGroup = new THREE.Group();
          dayGroup.visible = false;
          monthCell.add(dayGroup);
          dayGroups.push(dayGroup);

          // Get days in this month (using index as 0-based month)
          const daysInMonth = getDaysInMonth(index);

          // Calculate day cell size based on the month cell size
          // Now using 5 rows (max) and 7 columns for days
          const dayRows = 5; // Maximum 5 rows needed
          const dayCols = 7; // 7 days in a week

          const dayWidth = cellWidth / dayCols;
          const dayHeight = cellHeight / dayRows;

          // Calculate starting position for days (top-left corner of the month cell)
          const dayStartX = -cellWidth / 2 + dayWidth / 2;
          const dayStartY = cellHeight / 2 - dayHeight / 2;

          // Create days for this month - starting with 1 in upper left
          for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
            // Calculate position (0-indexed, starting from top-left corner)
            const dayCol = (dayNum - 1) % dayCols;
            const dayRow = Math.floor((dayNum - 1) / dayCols);

            const dayX = dayStartX + (dayCol * dayWidth);
            const dayY = dayStartY - (dayRow * dayHeight);

            // Create day cell
            const dayGeometry = new THREE.PlaneGeometry(dayWidth * 0.9, dayHeight * 0.9);
            const dayMaterial = new THREE.MeshBasicMaterial({
              color: 0x3a4a5c,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0 // Start fully transparent for fade-in effect
            });

            const dayMesh = new THREE.Mesh(dayGeometry, dayMaterial);
            dayMesh.position.set(dayX, dayY, 0.03);

            // Add day number as text
            const dayCanvas = document.createElement('canvas');
            dayCanvas.width = 128;
            dayCanvas.height = 128;
            const dayContext = dayCanvas.getContext('2d');

            if (dayContext) {
              dayContext.fillStyle = '#ffffff';
              dayContext.font = '60px Arial';
              dayContext.textAlign = 'center';
              dayContext.textBaseline = 'middle';
              dayContext.fillText(dayNum.toString(), 64, 64);

              const dayTexture = new THREE.CanvasTexture(dayCanvas);
              const dayLabelGeometry = new THREE.PlaneGeometry(dayWidth * 0.6, dayHeight * 0.6);
              const dayLabelMaterial = new THREE.MeshBasicMaterial({
                map: dayTexture,
                transparent: true,
                opacity: 0 // Start fully transparent
              });

              const dayLabel = new THREE.Mesh(dayLabelGeometry, dayLabelMaterial);
              dayLabel.position.set(0, 0, 0.01); // Slightly in front of the day cell
              dayMesh.add(dayLabel);
            }

            // Store month and day data for click events
            dayMesh.userData = {
              monthIndex: index,
              monthName: months[index],
              day: dayNum,
              isDay: true, // Tag for raycaster
              dayMaterial: dayMaterial,
              labelMaterial: dayMesh.children[0]?.material as THREE.MeshBasicMaterial
            };

            dayGroup.add(dayMesh);
          }
        }
      }

      // Store references for later use
      monthPositionsRef.current = monthPositions;
      monthCellsRef.current = monthCells;
      monthLabelsRef.current = monthLabels;
      dayGroupsRef.current = dayGroups;

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

    // Helper to show a month's days and hide its label
    const showMonthDays = (monthIndex: number) => {
      if (monthIndex < 0 || monthIndex >= monthCellsRef.current.length) return;

      // Hide the month label with a fade out
      if (monthLabelsRef.current[monthIndex]) {
        gsap.to(monthLabelsRef.current[monthIndex].material as THREE.MeshBasicMaterial, {
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            monthLabelsRef.current[monthIndex].visible = false;
          }
        });
      }

      // Show the days for this month
      if (dayGroupsRef.current[monthIndex]) {
        const dayGroup = dayGroupsRef.current[monthIndex];
        dayGroup.visible = true;

        // Animate the days to fade in sequentially
        dayGroup.children.forEach((day, dayIdx) => {
          if (day.userData.dayMaterial && day.userData.labelMaterial) {
            // Stagger the animation of each day - slower fade in
            gsap.to(day.userData.dayMaterial, {
              opacity: 0.8,
              duration: 0.8, // Slower fade in
              delay: dayIdx * 0.04, // Slower stagger effect
              ease: 'power1.inOut'
            });

            gsap.to(day.userData.labelMaterial, {
              opacity: 1,
              duration: 0.8, // Slower fade in
              delay: dayIdx * 0.04 + 0.1, // Slightly delayed from the cell
              ease: 'power1.inOut'
            });
          }
        });
      }
    };

    // Helper to hide a month's days and show its label
    const hideMonthDays = (monthIndex: number) => {
      if (monthIndex < 0 || monthIndex >= monthCellsRef.current.length) return;

      // Hide all days with fade out
      if (dayGroupsRef.current[monthIndex]) {
        const dayGroup = dayGroupsRef.current[monthIndex];

        // Create a timeline to handle all day animations
        const timeline = gsap.timeline({
          onComplete: () => {
            dayGroup.visible = false;
            // Show the month label after days are hidden
            if (monthLabelsRef.current[monthIndex]) {
              monthLabelsRef.current[monthIndex].visible = true;
              gsap.fromTo(monthLabelsRef.current[monthIndex].material as THREE.MeshBasicMaterial,
                { opacity: 0 },
                { opacity: 1, duration: 0.5, ease: 'power1.inOut' }
              );
            }
          }
        });

        // Fade out all days together
        dayGroup.children.forEach((day) => {
          if (day.userData.dayMaterial && day.userData.labelMaterial) {
            timeline.to(day.userData.labelMaterial, {
              opacity: 0,
              duration: 0.3,
              ease: 'power1.out'
            }, 0);

            timeline.to(day.userData.dayMaterial, {
              opacity: 0,
              duration: 0.4,
              ease: 'power1.out'
            }, 0.1);
          }
        });
      }
    };

    // Helper to show/hide the glowing border for a specific month
    const setMonthGlowingBorder = (monthIndex: number, visible: boolean) => {
      // If we're changing months, handle the transition
      if (currentMonthIndexRef.current !== -1 && currentMonthIndexRef.current !== monthIndex) {
        hideMonthDays(currentMonthIndexRef.current);
      }

      // Update current month reference
      currentMonthIndexRef.current = visible ? monthIndex : -1;

      // Hide all glowing borders first
      monthCellsRef.current.forEach((monthCell) => {
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

        // Show days for the focused month
        showMonthDays(monthIndex);
      }
    };

    // Event listener for mouse clicks
    const handleMouseClick = (event: MouseEvent) => {
      // Convert to normalized device coordinates
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Update the picking ray with the camera and mouse position
      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      // Find all intersected objects
      const intersects = raycasterRef.current.intersectObjects(scene.children, true);

      // Check if we clicked on a day
      for (let i = 0; i < intersects.length; i++) {
        const object = intersects[i].object;
        // Check if the object or its parent has day data
        const dayData = object.userData.isDay ? object.userData :
                      (object.parent && object.parent.userData.isDay ? object.parent.userData : null);

        if (dayData) {
          console.log(`Clicked on ${dayData.monthName} ${dayData.day}`);
          break;
        }
      }
    };

    // Add click event listener
    renderer.domElement.addEventListener('click', handleMouseClick);

    // Event listener for button clicks
    const handleGridAction = (event: Event) => {
      if (animationInProgress || !gridRef.current) return;
      setAnimationInProgress(true);

      const { action, monthIndex } = (event as CustomEvent).detail;

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
        // Base zoom level for row 0 (first row)
        const baseZoom = 2.0;

        // Calculate zoom adjustment based on row and tilt angle
        const perspectiveCompensation = 0.45; // Adjusted based on testing

        // Calculate row-specific zoom factor that increases with row number
        let zoomLevel = baseZoom + (monthPosition.row * perspectiveCompensation);

        // Z-offset to push the grid back for further rows
        const zOffset = monthPosition.row * 0.8;

        // Y offset adjustment for perspective
        const yOffsetAdjustment = monthPosition.row * 0.3 * Math.sin(tiltAngle);

        // Move grid to center the month
        gsap.to(gridRef.current.position, {
          x: -monthPosition.x * zoomLevel, // Multiply by zoom level to counteract scaling
          y: -monthPosition.y * zoomLevel + yOffsetAdjustment,
          z: 2 - zOffset, // Adjust z position based on row
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

            // Show the glowing border around the current month and show days
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
        // If currently showing a month, hide its days and show the name
        if (currentMonthIndexRef.current !== -1) {
          hideMonthDays(currentMonthIndexRef.current);
        }

        // Hide all glowing borders
        monthCellsRef.current.forEach(monthCell => {
          monthCell.children.forEach(child => {
            if (child.userData.isGlowBorder) {
              child.visible = false;
            }
          });
        });

        // Make sure all month labels are visible
        monthLabelsRef.current.forEach(label => {
          label.visible = true;
          (label.material as THREE.MeshBasicMaterial).opacity = 1;
        });

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
            currentMonthIndexRef.current = -1;
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
      renderer.domElement.removeEventListener('click', handleMouseClick);

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
