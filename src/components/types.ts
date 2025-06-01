import * as THREE from 'three';

export type DateImageEntry = {
  date: Date;
  imageUrl: string;
  text?: string; // Add text field for markdown content
};

export type GridRectangleProps = {
  width: number;
  height: number;
  dateImages?: DateImageEntry[];
};

export type MonthPosition = {
  x: number;
  y: number;
  row: number;
};

export type GridRefs = {
  scene: React.MutableRefObject<THREE.Scene | null>;
  camera: React.MutableRefObject<THREE.PerspectiveCamera | null>;
  renderer: React.MutableRefObject<THREE.WebGLRenderer | null>;
  grid: React.MutableRefObject<THREE.Group | null>;
  monthCells: React.MutableRefObject<THREE.Group[]>;
  monthPositions: React.MutableRefObject<MonthPosition[]>;
  monthLabels: React.MutableRefObject<THREE.Mesh[]>;
  dayGroups: React.MutableRefObject<THREE.Group[]>;
  raycaster: React.MutableRefObject<THREE.Raycaster>;
  mouse: React.MutableRefObject<THREE.Vector2>;
  currentMonthIndex: React.MutableRefObject<number>;
};

// types.ts addition
export type GridAction =
  | 'initialZoom'
  | 'focusMonth'
  | 'focusDecemberSecondHalf'
  | 'focusDecember31WithHours'
  | 'focusHour23WithMinutes'
  | 'focusMinute59WithSeconds'
  | 'reset';

export interface GridActionEventDetail {
  action: GridAction;
  monthIndex?: number;
}

export type GridActionEvent = CustomEvent<GridActionEventDetail>;
