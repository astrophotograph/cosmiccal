import type { GridRefs, GridActionEvent } from './types';
import { setMonthGlowingBorder, performInitialZoom, focusOnMonth, resetGrid } from './animationUtils';

// Handle mouse clicks on days
export const handleMouseClick = (
  event: MouseEvent,
  refs: GridRefs
): void => {
  if (!refs.camera.current || !refs.scene.current || !refs.renderer.current) return;

  // Convert to normalized device coordinates
  const rect = refs.renderer.current.domElement.getBoundingClientRect();
  refs.mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  refs.mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // Update the picking ray with the camera and mouse position
  refs.raycaster.current.setFromCamera(refs.mouse.current, refs.camera.current);

  // Find all intersected objects
  const intersects = refs.raycaster.current.intersectObjects(refs.scene.current.children, true);

  // Check if we clicked on a day
  for (let i = 0; i < intersects.length; i++) {
    const object = intersects[i].object;
    // Check if the object or its parent has day data
    const dayData = object.userData.isDay ? object.userData :
                  (object.parent && object.parent.userData.isDay ? object.parent.userData : null);

    if (dayData) {
      console.log(`Clicked on ${dayData.monthName} ${dayData.day}`);

      // If the day has an image, show the popup
      if (dayData.hasImage && dayData.imageUrl) {
        // Dispatch a custom event with the image URL
        window.dispatchEvent(new CustomEvent('showImagePopup', {
          detail: {
            imageUrl: dayData.imageUrl,
            date: `${dayData.monthName} ${dayData.day}`,
            text: dayData.text,
          }
        }));
      }

      break;
    }
  }
};

// Handle grid action events (from button clicks)
export const handleGridAction = (
  event: Event,
  refs: GridRefs,
  setAnimationInProgress: (value: boolean) => void
): void => {
  if (!refs.grid.current) return;

  const { action, monthIndex } = (event as GridActionEvent).detail;

  // Animation is already in progress, ignore this event
  if (refs.currentMonthIndex.current !== -1 && action === 'initialZoom') return;

  setAnimationInProgress(true);

  if (action === 'initialZoom') {
    performInitialZoom(refs, () => {
      setAnimationInProgress(false);
      // Notify button to update text
      window.dispatchEvent(new CustomEvent('gridStageComplete', {
        detail: { stage: 'initialZoom' }
      }));
    });
  }
  else if (action === 'focusMonth' && typeof monthIndex === 'number') {
    const totalMonths = 12;
    const isLastMonth = monthIndex === totalMonths - 1;

    focusOnMonth(refs, monthIndex, () => {
      setAnimationInProgress(false);

      // Show the glowing border around the current month and show days
      setMonthGlowingBorder(refs, monthIndex, true);

      // If it's the last month, notify to change button to "Start Over"
      if (isLastMonth) {
        window.dispatchEvent(new CustomEvent('gridStageComplete', {
          detail: { stage: 'lastMonth' }
        }));
      }
    });
  }
  else if (action === 'reset') {
    resetGrid(refs, () => {
      setAnimationInProgress(false);
      window.dispatchEvent(new CustomEvent('gridStageComplete', {
        detail: { stage: 'resetComplete' }
      }));
    });
  }
};
