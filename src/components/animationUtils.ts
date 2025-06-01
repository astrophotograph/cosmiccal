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

// Update the resetGrid function to properly handle removing the globe
export const resetGrid = (refs: GridRefs, onComplete: () => void): void => {
  if (!refs.grid.current) return;

  // If currently showing a month, hide its days and show the name
  if (refs.currentMonthIndex.current !== -1) {
    hideMonthDays(refs, refs.currentMonthIndex.current);
  }

  // Find and remove the Earth globe if it exists
  const septemberIndex = 8;
  if (refs.monthCells.current[septemberIndex]?.userData.earthGlobe) {
    const globe = refs.monthCells.current[septemberIndex].userData.earthGlobe;

    // Fade out and remove the globe
    gsap.to(globe.scale, {
      x: 0.001,
      y: 0.001,
      z: 0.001,
      duration: 1,
      ease: 'power2.in',
      onComplete: () => {
        if (refs.scene.current) {
          refs.scene.current.remove(globe);
        }
        delete refs.monthCells.current[septemberIndex].userData.earthGlobe;
      }
    });
  }

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

  // Rest of the existing resetGrid function...
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
