import * as THREE from 'three';
import { gsap } from 'gsap';
import type { GridRefs } from './types';

const INITIAL_CAMERA_DISTANCE = 5;
const MONTH_CAMERA_DISTANCE = 3.3;
const DAY_CAMERA_DISTANCE = 2.7;
const HOUR_CAMERA_DISTANCE = 2.4
const MINUTE_CAMERA_DISTANCE = 2.4
const INITIAL_TILT = -30
const CLOSEUP_TILT = -10
const VERY_CLOSEUP_TILT = -5

const setTilt = (refs: GridRefs, tiltAngle: number, onComplete?: () => void): void => {
  if (!refs.grid.current) return;

  gsap.to(refs.grid.current.rotation, {
    x: THREE.MathUtils.degToRad(tiltAngle),
    duration: 1.5,
    ease: 'power2.out',
    onComplete: () => {
      if (onComplete) onComplete();
    }
  });


}

const moveCamera = (refs: GridRefs, target: THREE.Group<THREE.Object3DEventMap> | THREE.Object3D, distance: number, onComplete?: () => void): void => {
  if (!refs.camera.current) return;

  // Create a new vector to track the target world position of the month
  const targetPosition = new THREE.Vector3();
  target.getWorldPosition(targetPosition);

  // Animate camera to new position
  gsap.to(refs.camera.current.position, {
    x: targetPosition.x,
    y: targetPosition.y,
    z: distance,
    duration: 1.5,
    ease: 'power2.inOut',
    onComplete: () => {
      if (onComplete) onComplete();
    }
  });
}


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

  // Set the grid position
  gsap.to(refs.grid.current.position, {
    z: 2,
    duration: 1.5,
    ease: 'power2.out'
  });

  // Tilt the grid
  setTilt(refs, INITIAL_TILT, () => {
    // Find the September month index (month 8, zero-based)
    const septemberIndex = 8;

    // Create and animate the Earth globe over September
    createAndAnimateEarthGlobe(refs, septemberIndex);

    // Call the original completion handler
    onComplete();
  })
};

// Fixed focusOnMonth function with consistent camera positioning
export const focusOnMonth = (
  refs: GridRefs,
  monthIndex: number,
  onComplete: () => void
): void => {
  if (!refs.grid.current || !refs.camera.current || monthIndex < 0 || monthIndex >= refs.monthPositions.current.length) return;

  // Hide the Earth globe if it exists
  const septemberIndex = 8;
  if (refs.monthCells.current[septemberIndex]?.userData.earthGlobe) {
    const globe = refs.monthCells.current[septemberIndex].userData.earthGlobe;
    globe.visible = false;
    // todo : fade out!
  }

  // If we're changing from another month, hide its days first
  if (refs.currentMonthIndex.current !== -1 && refs.currentMonthIndex.current !== monthIndex) {
    hideMonthDays(refs, refs.currentMonthIndex.current);
  }

  const monthCell = refs.monthCells.current[monthIndex];


  moveCamera(refs, monthCell, MONTH_CAMERA_DISTANCE);

  setTilt(refs, CLOSEUP_TILT)

  // Use an onUpdate callback to continually update the lookAt during animation
  gsap.to({ progress: 0 }, {
    progress: 1,
    duration: 1.5,
    ease: 'power2.inOut',
    onComplete: () => {
      // Call completion handler
      onComplete();
    }
  });
};

// Updated resetGrid function with smoother transition
export const resetGrid = (refs: GridRefs, onComplete: () => void): void => {
  if (!refs.grid.current || !refs.camera.current) return;

  // If currently showing a month, hide its days and show the name
  if (refs.currentMonthIndex.current !== -1) {
    hideMonthDays(refs, refs.currentMonthIndex.current);
  }

  // Hide all glowing borders
  refs.monthCells.current.forEach(monthCell => {
    monthCell.children.forEach(child => {
      if (child.userData.isGlowBorder) {
        child.visible = false;
      }
    });
  });

  // Reset camera position to initial state with a smoother transition
  gsap.to(refs.camera.current.position, {
    x: 0,
    y: 0,
    z: INITIAL_CAMERA_DISTANCE, // Original camera distance
    duration: 1.8, // Slightly longer for smoother transition
    ease: 'power2.inOut'
  });

  // Make sure all month labels are visible
  refs.monthLabels.current.forEach(label => {
    label.visible = true;
    gsap.to(label.material as THREE.MeshBasicMaterial, {
      opacity: 1,
      duration: 0.8
    });
  });

  // Reset grid position
  gsap.to(refs.grid.current.position, {
    x: 0,
    y: 0,
    z: 0,
    duration: 1.5,
    ease: 'power2.inOut'
  });

  // Reset grid rotation to initial tilt
  setTilt(refs, 0);

  // Reset grid scale
  gsap.to(refs.grid.current.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: 1.5,
    ease: 'power2.inOut',
    onComplete: () => {
      // Reset camera's rotation
      if (refs.camera.current) {
        refs.camera.current.lookAt(0, 0, 0);
      }

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

// Fixed focusOnDecember31WithHours with closer camera view
export const focusOnDecember31WithHours = (
  refs: GridRefs,
  onComplete: () => void
): void => {
  if (!refs.grid.current || !refs.camera.current) return;

  // First, ensure we're focused on December
  const decemberIndex = 11;
  refs.currentMonthIndex.current = decemberIndex;

  const dayGroup = refs.dayGroups.current[decemberIndex];
  if (!dayGroup) return;

  // December 31st (index 30)
  const dec31Index = 30;
  if (dayGroup.children.length <= dec31Index) return;

  const dec31Cell = dayGroup.children[dec31Index];

  moveCamera(refs, dec31Cell, DAY_CAMERA_DISTANCE);

  setTilt(refs, VERY_CLOSEUP_TILT);

  // Use an onUpdate callback to continually update the lookAt during animation
  gsap.to({ progress: 0 }, {
    progress: 1,
    duration: 1.5,
    ease: 'power2.inOut',
    onComplete: () => {
      // Fade out the 31st day cell and its label, but not completely
      if (dec31Cell.userData.dayMaterial && dec31Cell.userData.labelMaterial) {
        gsap.to(dec31Cell.userData.dayMaterial, {
          opacity: 0.1, // More transparent to give focus to the hours
          duration: 0.5,
          ease: 'power1.out'
        });

        gsap.to(dec31Cell.userData.labelMaterial, {
          opacity: 0.1, // More transparent to give focus to the hours
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

// Modified createHourRectangles function with separators
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
  let cellWidth = 2;
  let cellHeight = 2;

  // Try to get actual dimensions from the day cell
  if (dayCell.children && dayCell.children[0] && dayCell.children[0].geometry) {
    const geometry = dayCell.children[0].geometry as THREE.PlaneGeometry;
    if (geometry.parameters) {
      cellWidth = geometry.parameters.width * 1.4;
      cellHeight = geometry.parameters.height * 1.4;
    }
  }

  // Number of rows and columns for hours layout (4x6 grid)
  const rows = 4;
  const cols = 6;

  // Increase the scaling factor to completely fill the day cell
  // Using 1.0 means no gap between cells
  const hourWidth = cellWidth / cols;
  const hourHeight = cellHeight / rows;

  // Small gap for separators
  const separatorWidth = 0.005;
  const separatorHeight = hourHeight * 0.9;
  const separatorColor = 0x888888;

  // Small z-offset to ensure hours appear in front of the day cell
  const zOffset = 0.02;

  // Create 24 hour rectangles
  for (let hour = 0; hour < 24; hour++) {
    // Calculate row and column
    const row = Math.floor(hour / cols);
    const col = hour % cols;

    // Calculate position - evenly distributed across the day cell
    // Position calculated to fill the entire cell with no gaps
    const x = (col - (cols - 1) / 2) * hourWidth;
    const y = ((rows - 1) / 2 - row) * hourHeight;

    // Create hour cell
    const hourGeometry = new THREE.PlaneGeometry(hourWidth * 0.95, hourHeight * 0.95);
    const hourMaterial = new THREE.MeshBasicMaterial({
      color: 0x3a86ff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });

    const hourMesh = new THREE.Mesh(hourGeometry, hourMaterial);
    hourMesh.position.set(x, y, zOffset);

    // All hour rectangles should have the same height
    // No rotation to ensure consistent appearance
    hourMesh.rotation.x = 0;
    hourMesh.rotation.y = 0;
    hourMesh.rotation.z = 0;

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

    // Add separators (except for the rightmost column)
    if (col < cols - 1) {
      const rightSeparatorGeometry = new THREE.PlaneGeometry(separatorWidth, separatorHeight);
      const rightSeparatorMaterial = new THREE.MeshBasicMaterial({
        color: separatorColor,
        transparent: true,
        opacity: 0
      });

      const rightSeparator = new THREE.Mesh(rightSeparatorGeometry, rightSeparatorMaterial);
      rightSeparator.position.set(x + hourWidth/2, y, zOffset + 0.001);
      hoursGroup.add(rightSeparator);

      // Animate separator appearance
      gsap.to(rightSeparatorMaterial, {
        opacity: 0.6,
        duration: 0.4,
        delay: 0.5 + hour * 0.03,
        ease: 'power1.inOut'
      });
    }

    // Add bottom separators (except for the bottom row)
    if (row < rows - 1) {
      const bottomSeparatorGeometry = new THREE.PlaneGeometry(hourWidth * 0.9, separatorWidth);
      const bottomSeparatorMaterial = new THREE.MeshBasicMaterial({
        color: separatorColor,
        transparent: true,
        opacity: 0
      });

      const bottomSeparator = new THREE.Mesh(bottomSeparatorGeometry, bottomSeparatorMaterial);
      bottomSeparator.position.set(x, y - hourHeight/2, zOffset + 0.001);
      hoursGroup.add(bottomSeparator);

      // Animate separator appearance
      gsap.to(bottomSeparatorMaterial, {
        opacity: 0.6,
        duration: 0.4,
        delay: 0.5 + hour * 0.03,
        ease: 'power1.inOut'
      });
    }
  }

  // Store reference to hours group in day cell's userData
  dayCell.userData.hoursGroup = hoursGroup;

  // Animate hours appearing sequentially
  hoursGroup.children.forEach((child, idx) => {
    // Only animate the hour cells, not the separators
    if (child.userData && child.userData.hourMaterial && child.userData.labelMaterial) {
      // Start with a smaller scale
      child.scale.set(0.4, 0.4, 0.4);

      gsap.to(child.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.4,
        delay: idx * 0.03,
        ease: 'back.out(1.5)'
      });

      gsap.to(child.userData.hourMaterial, {
        opacity: 0.8,
        duration: 0.4,
        delay: idx * 0.03,
        ease: 'power1.inOut'
      });

      gsap.to(child.userData.labelMaterial, {
        opacity: 1,
        duration: 0.4,
        delay: idx * 0.03 + 0.1,
        ease: 'power1.inOut',
        onComplete: idx === 23 ? onComplete : undefined
      });
    }
  });
};

// Fixed focusOnHour function
export const focusOnHour = (
  refs: GridRefs,
  hourMesh: THREE.Mesh,
  onComplete: () => void
): void => {
  if (!refs.grid.current || !refs.camera.current) return;

  moveCamera(refs, hourMesh, HOUR_CAMERA_DISTANCE);

  // Adjust tilt for better visibility
  setTilt(refs, VERY_CLOSEUP_TILT);

  // Use an onUpdate callback to continually update the lookAt during animation
  gsap.to({ progress: 0 }, {
    progress: 1,
    duration: 1.5,
    ease: 'power2.inOut',
    onComplete: () => {
      // Highlight this hour
      if (hourMesh.userData.hourMaterial) {
        gsap.to(hourMesh.userData.hourMaterial, {
          color: 0x56ccf2, // Bright blue
          opacity: 0.8,
          duration: 0.3
        });
      }

      // Create and show 60 minute rectangles
      createMinuteRectangles(refs, hourMesh, onComplete);
    }
  });
};

// Updated focusOnHour23WithMinutes to use focusOnHour
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
  const hour23Cell = hoursGroup.children[23] as THREE.Mesh;

  // Use the focusOnHour function instead of reimplementing the logic
  focusOnHour(refs, hour23Cell, onComplete);
};

// Updated focusOnMinute59WithSeconds to use focusOnMinute
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
  const minute59Cell = minutesGroup.children[59] as THREE.Mesh;

  // Use the focusOnMinute function instead of reimplementing the logic
  focusOnMinute(refs, minute59Cell, onComplete);
};

// Modified createMinuteRectangles function
const createMinuteRectangles = (
  refs: GridRefs,
  hourCell: THREE.Object3D,
  onComplete: () => void
): void => {
  if (!refs.scene.current) return;

  // Create a group to hold all minute rectangles
  const minutesGroup = new THREE.Group();

  // Get the world position of the hour cell to properly position minutes
  const hourPosition = new THREE.Vector3();
  hourCell.getWorldPosition(hourPosition);
  minutesGroup.position.copy(hourPosition);

  // Add a small offset to ensure minutes appear in front of the hour cell
  minutesGroup.position.z += 0.05;

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
    minuteMesh.position.set(x, y, 0.1);

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

  // Add minutes group to the scene, not as a child of the hour cell
  refs.scene.current.add(minutesGroup);

  // Store reference to minutes group
  hourCell.userData.minutesGroup = minutesGroup;

  // Animate minutes appearing sequentially
  minutesGroup.children.forEach((minuteCell, idx) => {
    if (minuteCell.userData.minuteMaterial && minuteCell.userData.labelMaterial) {
      // Start with a smaller scale for better appearance animation
      minuteCell.scale.set(0.4, 0.4, 0.4);

      gsap.to(minuteCell.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.4,
        delay: idx * 0.01,
        ease: 'back.out(1.5)'
      });

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

// Fixed focusOnMinute function with closer camera view
export const focusOnMinute = (
  refs: GridRefs,
  minuteMesh: THREE.Mesh,
  onComplete: () => void
): void => {
  if (!refs.grid.current || !refs.camera.current) return;

  moveCamera(refs, minuteMesh, MINUTE_CAMERA_DISTANCE);

  gsap.to({ progress: 0 }, {
    progress: 1,
    duration: 1.5,
    ease: 'power2.inOut',
    onComplete: () => {
      // Highlight this minute
      if (minuteMesh.userData.minuteMaterial) {
        gsap.to(minuteMesh.userData.minuteMaterial, {
          color: 0x56ccf2, // Bright blue
          opacity: 0.8,
          duration: 0.3
        });
      }

      // Create and show 60 second rectangles
      createSecondRectangles(refs, minuteMesh, onComplete);
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
