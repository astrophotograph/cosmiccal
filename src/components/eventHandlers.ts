// eventHandlers.ts
import type { GridRefs, GridActionEvent } from './types';
import {
  setMonthGlowingBorder,
  performInitialZoom,
  focusOnMonth,
  resetGrid,
  focusOnDecemberSecondHalf,
  focusOnDecember31WithHours,
  focusOnHour23WithMinutes,
  focusOnMinute59WithSeconds
} from './animationUtils';

// Handle mouse clicks on days
export const handleMouseClick = (
  event: MouseEvent,
  refs: GridRefs
): void => {
  // Existing code - no changes needed
  // ...
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

      // If it's the last month, notify to change button to zoom December
      if (isLastMonth) {
        window.dispatchEvent(new CustomEvent('gridStageComplete', {
          detail: { stage: 'lastMonth' }
        }));
      }
    });
  }
  else if (action === 'focusDecemberSecondHalf') {
    focusOnDecemberSecondHalf(refs, () => {
      setAnimationInProgress(false);
      window.dispatchEvent(new CustomEvent('gridStageComplete', {
        detail: { stage: 'decemberSecondHalf' }
      }));
    });
  }
  else if (action === 'focusDecember31WithHours') {
    focusOnDecember31WithHours(refs, () => {
      setAnimationInProgress(false);
      window.dispatchEvent(new CustomEvent('gridStageComplete', {
        detail: { stage: 'december31' }
      }));
    });
  }
  else if (action === 'focusHour23WithMinutes') {
    focusOnHour23WithMinutes(refs, () => {
      setAnimationInProgress(false);
      window.dispatchEvent(new CustomEvent('gridStageComplete', {
        detail: { stage: 'hour23' }
      }));
    });
  }
  else if (action === 'focusMinute59WithSeconds') {
    focusOnMinute59WithSeconds(refs, () => {
      setAnimationInProgress(false);
      window.dispatchEvent(new CustomEvent('gridStageComplete', {
        detail: { stage: 'minute59' }
      }));
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
