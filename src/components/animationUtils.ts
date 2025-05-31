import * as THREE from 'three';
import { gsap } from 'gsap';
import type { GridRefs } from './types';

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

// Perform initial zoom animation
export const performInitialZoom = (refs: GridRefs, onComplete: () => void): void => {
  if (!refs.grid.current) return;

  const tiltAngle = THREE.MathUtils.degToRad(-30);

  gsap.to(refs.grid.current.position, {
    z: 2,
    duration: 1.5,
    ease: 'power2.out'
  });

  gsap.to(refs.grid.current.rotation, {
    x: tiltAngle,
    duration: 1.5,
    ease: 'power2.out',
    onComplete
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

// Reset the grid to initial state
export const resetGrid = (refs: GridRefs, onComplete: () => void): void => {
  if (!refs.grid.current) return;

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
