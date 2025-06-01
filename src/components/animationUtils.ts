import * as THREE from 'three';
import { gsap } from 'gsap';
import type { GridRefs } from './types';

export const createAndAnimateEarthGlobe = (refs: GridRefs, monthIndex: number): void => {
  if (!refs.scene.current || !refs.monthCells.current[monthIndex]) return;

  // Get the September month cell position
  const sepCell = refs.monthCells.current[monthIndex];
  const sepPosition = sepCell.position.clone();

  // Create Earth globe
  const textureLoader = new THREE.TextureLoader();

  // Load Earth textures
  const earthTexture = textureLoader.load('/textures/earth_daymap.jpg');
  const cloudsTexture = textureLoader.load('/textures/earth_clouds.png');
  const nightTexture = textureLoader.load('/textures/earth_night_4096.jpg');

  // Create Earth sphere with realistic material - increased size for better visibility
  const earthGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const earthMaterial = new THREE.MeshPhongMaterial({
    map: earthTexture,
    specular: new THREE.Color(0x777777), // Brighter specular color for more shininess
    shininess: 25, // Increased from 5 to 25 for more reflectivity
    transparent: true,
    opacity: 0,
    // Add bump mapping for more realistic surface detail
    bumpMap: textureLoader.load('/textures/earth_bumpmap.jpg'),
    bumpScale: 0.05,
    // Optional: add specular map if available
    // specularMap: textureLoader.load('/textures/02_earthspec1k.jpg'),
  });

  const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);

  // Create clouds layer
  const cloudsGeometry = new THREE.SphereGeometry(0.53, 32, 32);
  const cloudsMaterial = new THREE.MeshPhongMaterial({
    map: cloudsTexture,
    transparent: true,
    opacity: 0
  });

  const cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);

  // Create a group to hold earth and clouds
  const earthGroup = new THREE.Group();
  earthGroup.add(earthMesh);
  earthGroup.add(cloudsMesh);

  // Calculate the z position to ensure it's visible after the grid is tilted
  // September is in the 3rd row (row=2), so we need to position it accordingly
  // We need to account for the grid's tilted position
  const gridTiltAngle = refs.grid.current ? refs.grid.current.rotation.x : 0;
  const zOffset = 2.5; // Change to negative value to position in front of the grid
  const yOffset = 0.2; // Adjust vertical position to account for the tilt

  // Position the globe above September and in front of the grid
  earthGroup.position.set(sepPosition.x, sepPosition.y + yOffset, zOffset);

  // Tilt the globe slightly to match the grid's perspective
  earthGroup.rotation.x = gridTiltAngle * 0.5;

  // Add lighting for the globe - position above and to the right
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.5); // Increased intensity from 1.2 to 1.5
  sunLight.position.set(3, 5, 2); // Repositioned to be above and to the right of the viewer
  earthGroup.add(sunLight);

  // Add a subtle highlight with a second light
  const highlightLight = new THREE.DirectionalLight(0xffffdd, 0.6);
  highlightLight.position.set(4, 3, -2);
  earthGroup.add(highlightLight);

  // Slightly brighter ambient light to enhance overall visibility
  const ambientLight = new THREE.AmbientLight(0x666666); // Brightened from 0x555555 to 0x666666
  earthGroup.add(ambientLight);

  // Add the globe to the scene
  refs.scene.current.add(earthGroup);

  // Set initial state - scale to zero but keep visible
  earthGroup.visible = true;
  earthGroup.scale.set(0.001, 0.001, 0.001);

  // Animation for earth rotation
  const animateEarth = () => {
    earthMesh.rotation.y += 0.002;
    cloudsMesh.rotation.y += 0.0015;
    requestAnimationFrame(animateEarth);
  };

  animateEarth();

  // Fade in animation with improved sequencing
  gsap.to(earthGroup.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: 2,
    ease: "elastic.out(1, 0.7)",
    delay: 0.5
  });

  gsap.to(earthMaterial, {
    opacity: 1,
    duration: 2,
    ease: "power2.out",
    delay: 0.8
  });

  gsap.to(cloudsMaterial, {
    opacity: 0.4,
    duration: 2.5,
    ease: "power2.out",
    delay: 1
  });

  // Add a subtle floating animation for better visibility
  // gsap.to(earthGroup.position, {
  //   y: earthGroup.position.y + 0.1,
  //   duration: 3,
  //   yoyo: true,
  //   repeat: -1,
  //   ease: "sine.inOut"
  // });

  // Store reference to remove later if needed
  sepCell.userData.earthGlobe = earthGroup;
};

// Update glowing border animation
export const updateGlowingBorders = (monthCells: THREE.Group[]): void => {
  const time = Date.now() * 0.001;
  const pulseFactor = Math.sin(time * 2) * 0.15 + 0.85;

  monthCells.forEach(monthCell => {
    monthCell.children.forEach(child => {
      if (child.userData.isGlowBorder && child.visible) {
        (child.material as THREE.LineBasicMaterial).opacity = pulseFactor;
        const pulseScale = 1.03 + pulseFactor * 0.02;
        child.scale.set(pulseScale, pulseScale, 1);
      }
    });
  });
};

// Show a month's days and hide its label
export const showMonthDays = (refs: GridRefs, monthIndex: number): void => {
  if (monthIndex < 0 || monthIndex >= refs.monthCells.current.length) return;

  // Hide the month label with a fade out
  if (refs.monthLabels.current[monthIndex]) {
    gsap.to(refs.monthLabels.current[monthIndex].material as THREE.MeshBasicMaterial, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        refs.monthLabels.current[monthIndex].visible = false;
      }
    });
  }

  // Show the days for this month
  if (refs.dayGroups.current[monthIndex]) {
    const dayGroup = refs.dayGroups.current[monthIndex];
    dayGroup.visible = true;

    // Animate the days to fade in sequentially
    dayGroup.children.forEach((day, dayIdx) => {
      if (day.userData.dayMaterial && day.userData.labelMaterial) {
        // Stagger the animation of each day - slower fade in
        gsap.to(day.userData.dayMaterial, {
          opacity: 0.8,
          duration: 0.8,
          delay: dayIdx * 0.04,
          ease: 'power1.inOut'
        });

        gsap.to(day.userData.labelMaterial, {
          opacity: 1,
          duration: 0.8,
          delay: dayIdx * 0.04 + 0.1,
          ease: 'power1.inOut'
        });
      }
    });
  }
};

// Hide a month's days and show its label
export const hideMonthDays = (refs: GridRefs, monthIndex: number): void => {
  if (monthIndex < 0 || monthIndex >= refs.monthCells.current.length) return;

  // Hide all days with fade out
  if (refs.dayGroups.current[monthIndex]) {
    const dayGroup = refs.dayGroups.current[monthIndex];

    // Create a timeline to handle all day animations
    const timeline = gsap.timeline({
      onComplete: () => {
        dayGroup.visible = false;
        // Show the month label after days are hidden
        if (refs.monthLabels.current[monthIndex]) {
          refs.monthLabels.current[monthIndex].visible = true;
          gsap.fromTo(refs.monthLabels.current[monthIndex].material as THREE.MeshBasicMaterial,
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

// Show/hide the glowing border for a specific month
export const setMonthGlowingBorder = (refs: GridRefs, monthIndex: number, visible: boolean): void => {
  // If we're changing months, handle the transition
  if (refs.currentMonthIndex.current !== -1 && refs.currentMonthIndex.current !== monthIndex) {
    hideMonthDays(refs, refs.currentMonthIndex.current);
  }

  // Update current month reference
  refs.currentMonthIndex.current = visible ? monthIndex : -1;

  // Hide all glowing borders first
  refs.monthCells.current.forEach((monthCell) => {
    monthCell.children.forEach(child => {
      if (child.userData.isGlowBorder) {
        child.visible = false;
      }
    });
  });

  // Show the specific month's glowing border if requested
  if (visible && monthIndex >= 0 && monthIndex < refs.monthCells.current.length) {
    const monthCell = refs.monthCells.current[monthIndex];
    monthCell.children.forEach(child => {
      if (child.userData.isGlowBorder) {
        child.visible = true;
      }
    });

    // Show days for the focused month
    showMonthDays(refs, monthIndex);
  }
};

// Update the performInitialZoom function
export const performInitialZoom = (refs: GridRefs, onComplete: () => void): void => {
  if (!refs.grid.current || !refs.camera.current) return;

  const tiltAngle = THREE.MathUtils.degToRad(-30);

  // Adjust camera position to better see the globe
  if (refs.camera.current) {
    gsap.to(refs.camera.current.position, {
      z: 6, // Move the camera back slightly for a better view
      duration: 1.5,
      ease: 'power2.out'
    });
  }

  gsap.to(refs.grid.current.position, {
    z: 2,
    duration: 1.5,
    ease: 'power2.out'
  });

  gsap.to(refs.grid.current.rotation, {
    x: tiltAngle,
    duration: 1.5,
    ease: 'power2.out',
    onComplete: () => {
      // Find the September month index (month 8, zero-based)
      const septemberIndex = 8;

      // Create and animate the Earth globe over September
      createAndAnimateEarthGlobe(refs, septemberIndex);

      // Call the original completion handler
      onComplete();
    }
  });
};

// Perform focus on a specific month
export const focusOnMonth = (
  refs: GridRefs,
  monthIndex: number,
  onComplete: () => void
): void => {
  if (!refs.grid.current || monthIndex < 0 || monthIndex >= refs.monthPositions.current.length) return;

  // Hide the Earth globe if it exists
  const septemberIndex = 8;
  if (refs.monthCells.current[septemberIndex]?.userData.earthGlobe) {
    const globe = refs.monthCells.current[septemberIndex].userData.earthGlobe;
    globe.visible = false;
  }

  const monthPosition = refs.monthPositions.current[monthIndex];
  const tiltAngle = refs.grid.current.rotation.x;

  // Calculate zoom level with perspective compensation
  const baseZoom = 2.0;
  const perspectiveCompensation = 0.45;
  const zoomLevel = baseZoom + (monthPosition.row * perspectiveCompensation);

  // Z-offset to push the grid back for further rows
  const zOffset = monthPosition.row * 0.8;

  // Y offset adjustment for perspective
  const yOffsetAdjustment = monthPosition.row * 0.3 * Math.sin(tiltAngle);

  // Move grid to center the month
  gsap.to(refs.grid.current.position, {
    x: -monthPosition.x * zoomLevel,
    y: -monthPosition.y * zoomLevel + yOffsetAdjustment,
    z: 2 - zOffset,
    duration: 1.2,
    ease: 'power2.inOut'
  });

  // Scale up to zoom in on the month
  gsap.to(refs.grid.current.scale, {
    x: zoomLevel,
    y: zoomLevel,
    z: zoomLevel,
    duration: 1.2,
    ease: 'power2.inOut',
    onComplete
  });
};

// Update the resetGrid function to properly handle the globe visibility
export const resetGrid = (refs: GridRefs, onComplete: () => void): void => {
  if (!refs.grid.current) return;

  // If currently showing a month, hide its days and show the name
  if (refs.currentMonthIndex.current !== -1) {
    hideMonthDays(refs, refs.currentMonthIndex.current);
  }

  // Find the Earth globe if it exists and make it visible again
  // const septemberIndex = 8;
  // if (refs.monthCells.current[septemberIndex]?.userData.earthGlobe) {
  //   const globe = refs.monthCells.current[septemberIndex].userData.earthGlobe;
  //   globe.visible = true;
  // }

  // Hide all glowing borders
  refs.monthCells.current.forEach(monthCell => {
    monthCell.children.forEach(child => {
      if (child.userData.isGlowBorder) {
        child.visible = false;
      }
    });
  });

  // Reset camera position
  if (refs.camera.current) {
    gsap.to(refs.camera.current.position, {
      z: 5, // Return to original position
      duration: 1.5,
      ease: 'power2.inOut'
    });
  }

  // Make sure all month labels are visible
  refs.monthLabels.current.forEach(label => {
    label.visible = true;
    (label.material as THREE.MeshBasicMaterial).opacity = 1;
  });

  // Reset position, rotation and scale
  gsap.to(refs.grid.current.position, {
    x: 0,
    y: 0,
    z: 0,
    duration: 1.5,
    ease: 'power2.inOut'
  });

  gsap.to(refs.grid.current.rotation, {
    x: 0,
    y: 0,
    z: 0,
    duration: 1.5,
    ease: 'power2.inOut'
  });

  gsap.to(refs.grid.current.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: 1.5,
    ease: 'power2.inOut',
    onComplete: () => {
      refs.currentMonthIndex.current = -1;
      onComplete();
    }
  });
};

// Zoom in on December second half, centered on December 25th
export const focusOnDecemberSecondHalf = (
  refs: GridRefs,
  onComplete: () => void
): void => {
  if (!refs.grid.current) return;

  // December index (11 in zero-based indexing)
  const decemberIndex = 11;
  const dayGroup = refs.dayGroups.current[decemberIndex];
  if (!dayGroup) return;

  // Target December 25th (index 24 in a zero-based array)
  const dec25Index = 24;
  if (dayGroup.children.length <= dec25Index) return;

  // Get the December 25th cell
  const dec25Cell = dayGroup.children[dec25Index];

  // Directly get its position
  const dec25Position = dec25Cell.position.clone();

  // Apply a subtle zoom
  const additionalZoom = 1.5;
  const currentZoom = refs.grid.current.scale.x;
  const newZoom = currentZoom * additionalZoom;

  // Log positions for debugging
  console.log('December 25 position:', dec25Position);
  console.log('Current grid position:', refs.grid.current.position);

  // Center on December 25th
  gsap.to(refs.grid.current.position, {
    // For y-position, we need to move down to center on Dec 25
    y: refs.grid.current.position.y - dec25Position.y * additionalZoom * 0.5,
    duration: 1.2,
    ease: 'power2.inOut'
  });

  // Apply the zoom
  gsap.to(refs.grid.current.scale, {
    // x: newZoom,
    y: newZoom,
    z: newZoom,
    duration: 1.2,
    ease: 'power2.inOut',
    onComplete
  });
};

// Perform a more substantial zoom on December 31st
export const focusOnDecember31WithHours = (
  refs: GridRefs,
  onComplete: () => void
): void => {
  if (!refs.grid.current) return;

  // First, ensure we're focused on December
  const decemberIndex = 11;
  refs.currentMonthIndex.current = decemberIndex;

  const dayGroup = refs.dayGroups.current[decemberIndex];
  if (!dayGroup) return;

  // December 31st (index 30)
  const dec31Index = 30;
  if (dayGroup.children.length <= dec31Index) return;

  const dec31Cell = dayGroup.children[dec31Index];

  // Get the Dec 31 position
  const dec31Position = new THREE.Vector3();
  dec31Cell.getWorldPosition(dec31Position);

  // Get grid position
  const gridPosition = new THREE.Vector3();
  refs.grid.current.getWorldPosition(gridPosition);

  // Increase the zoom factor to get a closer view
  const zoomFactor = 1.7;
  const currentZoom = refs.grid.current.scale.x;
  const newZoom = currentZoom * zoomFactor;

  // Calculate grid position to center on Dec 31
  const worldOffset = dec31Position.clone().sub(gridPosition);

  // Calculate the target position that centers Dec 31
  gsap.to(refs.grid.current.position, {
    // Move the grid in the opposite direction of the offset
    x: refs.grid.current.position.x - worldOffset.x * (zoomFactor - 1),
    y: refs.grid.current.position.y - worldOffset.y * (zoomFactor - 1),
    duration: 1.5,
    ease: 'power2.inOut'
  });

  // Apply the zoom
  gsap.to(refs.grid.current.scale, {
    x: newZoom,
    y: newZoom,
    z: newZoom,
    duration: 1.5,
    ease: 'power2.inOut',
    onComplete: () => {
      // Fade out the 31st day cell and its label, but make it more transparent
      if (dec31Cell.userData.dayMaterial && dec31Cell.userData.labelMaterial) {
        gsap.to(dec31Cell.userData.dayMaterial, {
          opacity: 0.1,  // More transparent to give focus to the hours
          duration: 0.5,
          ease: 'power1.out'
        });

        gsap.to(dec31Cell.userData.labelMaterial, {
          opacity: 0.1,  // More transparent to give focus to the hours
          duration: 0.5,
          ease: 'power1.out',
          onComplete: () => {
            // Create and show 24 rectangles representing hours
            createHourRectangles(refs, dec31Cell, onComplete);
          }
        });
      }
    }
  });
};

// Modified createHourRectangles function to better fill the day cell
const createHourRectangles = (
  refs: GridRefs,
  dayCell: THREE.Object3D,
  onComplete: () => void
): void => {
  if (!refs.scene.current) return;

  // Create a group to hold all hour rectangles
  // Make the hours group a child of the day cell
  const hoursGroup = new THREE.Group();
  dayCell.add(hoursGroup);

  // Get the actual width and height of the day cell
  let cellWidth = 1;
  let cellHeight = 1;

  // Try to get actual dimensions from the day cell
  if (dayCell.children && dayCell.children[0] && dayCell.children[0].geometry) {
    const geometry = dayCell.children[0].geometry as THREE.PlaneGeometry;
    if (geometry.parameters) {
      cellWidth = geometry.parameters.width;
      cellHeight = geometry.parameters.height;
    }
  }

  // Number of rows and columns for hours layout (4x6 grid)
  const rows = 4;
  const cols = 6;

  // Increase the scaling factor to better fill the day cell
  // Using 1.0 means virtually no gap between cells
  const hourWidth = cellWidth / cols * 0.99;
  const hourHeight = cellHeight / rows * 0.99;

  // Reduce spacing between cells for a more packed layout
  const spacingFactor = 1.0; // Reduced from 1.2 to make cells closer together

  // Small z-offset to ensure hours appear in front of the day cell
  const zOffset = 0.05;

  // Create 24 hour rectangles
  for (let hour = 0; hour < 24; hour++) {
    // Calculate row and column
    const row = Math.floor(hour / cols);
    const col = hour % cols;

    // Calculate position - evenly distributed across the day cell
    // Use spacingFactor to control spacing between cells
    const x = (col - (cols - 1) / 2) * (hourWidth * spacingFactor);
    const y = ((rows - 1) / 2 - row) * (hourHeight * spacingFactor);

    // Create hour cell
    const hourGeometry = new THREE.PlaneGeometry(hourWidth, hourHeight);
    const hourMaterial = new THREE.MeshBasicMaterial({
      color: 0x3a86ff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });

    const hourMesh = new THREE.Mesh(hourGeometry, hourMaterial);
    hourMesh.position.set(x, y, zOffset);

    // Remove the random rotation to keep a cleaner grid appearance
    hourMesh.rotation.x = THREE.MathUtils.degToRad(1); // Minimal tilt
    // hourMesh.rotation.y = 0; // No random rotation for cleaner appearance

    // Create hour label
    const textGeometry = new THREE.PlaneGeometry(hourWidth * 0.7, hourHeight * 0.7);
    const textMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });

    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, 0, 0.005); // Slightly in front of hour rectangle

    // Store hour number as user data
    hourMesh.userData = {
      hour,
      hourMaterial,
      labelMaterial: textMaterial
    };

    // Create text canvas for the hour number
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = 'white';
      context.font = 'bold 36px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(hour.toString(), 32, 32);

      const texture = new THREE.CanvasTexture(canvas);
      textMaterial.map = texture;
      textMaterial.needsUpdate = true;
    }

    hourMesh.add(textMesh);
    hoursGroup.add(hourMesh);
  }

  // Store reference to hours group in day cell's userData
  dayCell.userData.hoursGroup = hoursGroup;

  // Animate hours appearing sequentially
  hoursGroup.children.forEach((hourCell, idx) => {
    if (hourCell.userData.hourMaterial && hourCell.userData.labelMaterial) {
      // Start with a smaller scale
      hourCell.scale.set(0.4, 0.4, 0.4);

      gsap.to(hourCell.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.4,
        delay: idx * 0.03,
        ease: 'back.out(1.5)'
      });

      gsap.to(hourCell.userData.hourMaterial, {
        opacity: 0.8,
        duration: 0.4,
        delay: idx * 0.03,
        ease: 'power1.inOut'
      });

      gsap.to(hourCell.userData.labelMaterial, {
        opacity: 1,
        duration: 0.4,
        delay: idx * 0.03 + 0.1,
        ease: 'power1.inOut',
        onComplete: idx === 23 ? onComplete : undefined
      });
    }
  });
};

// Zoom in on hour 23 and show minutes
export const focusOnHour23WithMinutes = (
  refs: GridRefs,
  onComplete: () => void
): void => {
  if (!refs.grid.current) return;

  const decemberIndex = 11;
  const dayGroup = refs.dayGroups.current[decemberIndex];
  if (!dayGroup || !dayGroup.children[30]) return;

  const dec31Cell = dayGroup.children[30];
  const hoursGroup = dec31Cell.userData.hoursGroup;
  if (!hoursGroup) return;

  // Get the hour 23 cell (last one)
  const hour23Cell = hoursGroup.children[23];
  const hour23Position = hour23Cell.position.clone();
  hour23Position.add(hoursGroup.position);

  // Calculate zoom for hour 23
  const additionalZoom = 0.2;
  const currentZoom = refs.grid.current.scale.x;
  const newZoom = currentZoom * additionalZoom;

  // Center on hour 23
  gsap.to(refs.grid.current.position, {
    x: refs.grid.current.position.x - hour23Position.x * additionalZoom,
    y: refs.grid.current.position.y - hour23Position.y * additionalZoom,
    duration: 1.2,
    ease: 'power2.inOut'
  });

  // Zoom in further
  gsap.to(refs.grid.current.scale, {
    x: newZoom,
    y: newZoom,
    z: newZoom,
    duration: 1.2,
    ease: 'power2.inOut',
    onComplete: () => {
      // Fade out the hour 23 cell
      if (hour23Cell.userData.hourMaterial && hour23Cell.userData.labelMaterial) {
        gsap.to(hour23Cell.userData.hourMaterial, {
          opacity: 0,
          duration: 0.5,
          ease: 'power1.out'
        });

        gsap.to(hour23Cell.userData.labelMaterial, {
          opacity: 0,
          duration: 0.5,
          ease: 'power1.out',
          onComplete: () => {
            // Create and show 60 rectangles representing minutes
            createMinuteRectangles(refs, hour23Cell, onComplete);
          }
        });
      }
    }
  });
};

// Create 60 rectangles representing minutes
const createMinuteRectangles = (
  refs: GridRefs,
  hourCell: THREE.Object3D,
  onComplete: () => void
): void => {
  if (!refs.scene.current) return;

  // Create a group to hold all minute rectangles
  const minutesGroup = new THREE.Group();
  minutesGroup.position.copy(hourCell.position);

  // Size of the original hour cell
  const cellWidth = hourCell.children[0].geometry.parameters.width * 1.5;
  const cellHeight = hourCell.children[0].geometry.parameters.height * 1.5;

  // Number of rows and columns for minutes layout (6x10 grid)
  const rows = 6;
  const cols = 10;

  // Size for each minute rectangle
  const minuteWidth = cellWidth / cols * 0.85;
  const minuteHeight = cellHeight / rows * 0.85;

  // Create 60 minute rectangles
  for (let minute = 0; minute < 60; minute++) {
    // Calculate row and column
    const row = Math.floor(minute / cols);
    const col = minute % cols;

    // Calculate position
    const x = (col - (cols - 1) / 2) * (minuteWidth * 1.2);
    const y = ((rows - 1) / 2 - row) * (minuteHeight * 1.2);

    // Create minute cell
    const minuteGeometry = new THREE.PlaneGeometry(minuteWidth, minuteHeight);
    const minuteMaterial = new THREE.MeshBasicMaterial({
      color: 0x4cc9f0,
      transparent: true,
      opacity: 0
    });

    const minuteMesh = new THREE.Mesh(minuteGeometry, minuteMaterial);
    minuteMesh.position.set(x, y, 0.05);

    // Create minute label
    const textGeometry = new THREE.PlaneGeometry(minuteWidth * 0.7, minuteHeight * 0.7);
    const textMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0
    });

    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, 0, 0.01);

    // Store minute number as user data
    minuteMesh.userData = {
      minute,
      minuteMaterial,
      labelMaterial: textMaterial
    };

    // Create text canvas for the minute number
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = 'white';
      context.font = 'bold 30px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(minute.toString(), 32, 32);

      const texture = new THREE.CanvasTexture(canvas);
      textMaterial.map = texture;
      textMaterial.needsUpdate = true;
    }

    minuteMesh.add(textMesh);
    minutesGroup.add(minuteMesh);
  }

  // Add minutes group to the scene
  refs.scene.current.add(minutesGroup);

  // Store reference to minutes group
  hourCell.userData.minutesGroup = minutesGroup;

  // Animate minutes appearing sequentially
  minutesGroup.children.forEach((minuteCell, idx) => {
    if (minuteCell.userData.minuteMaterial && minuteCell.userData.labelMaterial) {
      gsap.to(minuteCell.userData.minuteMaterial, {
        opacity: 0.8,
        duration: 0.4,
        delay: idx * 0.01,
        ease: 'power1.inOut'
      });

      gsap.to(minuteCell.userData.labelMaterial, {
        opacity: 1,
        duration: 0.4,
        delay: idx * 0.01 + 0.05,
        ease: 'power1.inOut',
        onComplete: idx === 59 ? onComplete : undefined
      });
    }
  });
};


// Zoom in on minute 59 and show seconds
export const focusOnMinute59WithSeconds = (
  refs: GridRefs,
  onComplete: () => void
): void => {
  if (!refs.grid.current) return;

  const decemberIndex = 11;
  const dayGroup = refs.dayGroups.current[decemberIndex];
  if (!dayGroup || !dayGroup.children[30]) return;

  const dec31Cell = dayGroup.children[30];
  const hoursGroup = dec31Cell.userData.hoursGroup;
  if (!hoursGroup) return;

  const hour23Cell = hoursGroup.children[23];
  const minutesGroup = hour23Cell.userData.minutesGroup;
  if (!minutesGroup) return;

  // Get the minute 59 cell (last one)
  const minute59Cell = minutesGroup.children[59];
  const minute59Position = minute59Cell.position.clone();
  minute59Position.add(minutesGroup.position);
  minute59Position.add(hoursGroup.position);

  // Calculate zoom for minute 59
  const additionalZoom = 2.2;
  const currentZoom = refs.grid.current.scale.x;
  const newZoom = currentZoom * additionalZoom;

  // Center on minute 59
  gsap.to(refs.grid.current.position, {
    x: refs.grid.current.position.x - minute59Position.x * additionalZoom,
    y: refs.grid.current.position.y - minute59Position.y * additionalZoom,
    duration: 1.2,
    ease: 'power2.inOut'
  });

  // Zoom in further
  gsap.to(refs.grid.current.scale, {
    x: newZoom,
    y: newZoom,
    z: newZoom,
    duration: 1.2,
    ease: 'power2.inOut',
    onComplete: () => {
      // Fade out the minute 59 cell
      if (minute59Cell.userData.minuteMaterial && minute59Cell.userData.labelMaterial) {
        gsap.to(minute59Cell.userData.minuteMaterial, {
          opacity: 0,
          duration: 0.5,
          ease: 'power1.out'
        });

        gsap.to(minute59Cell.userData.labelMaterial, {
          opacity: 0,
          duration: 0.5,
          ease: 'power1.out',
          onComplete: () => {
            // Create and show 60 rectangles representing seconds
            createSecondRectangles(refs, minute59Cell, onComplete);
          }
        });
      }
    }
  });
};

// Create 60 rectangles representing seconds
const createSecondRectangles = (
  refs: GridRefs,
  minuteCell: THREE.Object3D,
  onComplete: () => void
): void => {
  if (!refs.scene.current) return;

  // Create a group to hold all second rectangles
  const secondsGroup = new THREE.Group();
  secondsGroup.position.copy(minuteCell.position);

  // Size of the original minute cell
  const cellWidth = minuteCell.children[0].geometry.parameters.width * 1.5;
  const cellHeight = minuteCell.children[0].geometry.parameters.height * 1.5;

  // Number of rows and columns for seconds layout (6x10 grid)
  const rows = 6;
  const cols = 10;

  // Size for each second rectangle
  const secondWidth = cellWidth / cols * 0.85;
  const secondHeight = cellHeight / rows * 0.85;

  // Create 60 second rectangles
  for (let second = 0; second < 60; second++) {
    // Calculate row and column
    const row = Math.floor(second / cols);
    const col = second % cols;

    // Calculate position
    const x = (col - (cols - 1) / 2) * (secondWidth * 1.2);
    const y = ((rows - 1) / 2 - row) * (secondHeight * 1.2);

    // Create second cell
    const secondGeometry = new THREE.PlaneGeometry(secondWidth, secondHeight);
    const secondMaterial = new THREE.MeshBasicMaterial({
      color: 0xf72585,
      transparent: true,
      opacity: 0
    });

    const secondMesh = new THREE.Mesh(secondGeometry, secondMaterial);
    secondMesh.position.set(x, y, 0.01);

    // Create second label
    const textGeometry = new THREE.PlaneGeometry(secondWidth * 0.7, secondHeight * 0.7);
    const textMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0
    });

    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, 0, 0.01);

    // Store second number as user data
    secondMesh.userData = {
      second,
      secondMaterial,
      labelMaterial: textMaterial
    };

    // Create text canvas for the second number
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = 'white';
      context.font = 'bold 30px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(second.toString(), 32, 32);

      const texture = new THREE.CanvasTexture(canvas);
      textMaterial.map = texture;
      textMaterial.needsUpdate = true;
    }

    secondMesh.add(textMesh);
    secondsGroup.add(secondMesh);
  }

  // Add seconds group to the scene
  refs.scene.current.add(secondsGroup);

  // Store reference to seconds group
  minuteCell.userData.secondsGroup = secondsGroup;

  // Animate seconds appearing sequentially
  secondsGroup.children.forEach((secondCell, idx) => {
    if (secondCell.userData.secondMaterial && secondCell.userData.labelMaterial) {
      gsap.to(secondCell.userData.secondMaterial, {
        opacity: 0.8,
        duration: 0.3,
        delay: idx * 0.01,
        ease: 'power1.inOut'
      });

      gsap.to(secondCell.userData.labelMaterial, {
        opacity: 1,
        duration: 0.3,
        delay: idx * 0.01 + 0.05,
        ease: 'power1.inOut',
        onComplete: idx === 59 ? onComplete : undefined
      });
    }
  });
};
