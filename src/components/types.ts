import * as THREE from 'three';

export const INITIAL_Z = 30
export const DARK_GRAY = 0x2d3748
export const LIGHT_GRAY = 0x3a4a5c
export const BLUE = 0x4a9cff
export const OTHER_BLUE = 0x3a86ff

export const RECTANGLE_RATIO = 2.5
export const Z_SEPARATION = 0.00005

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
  hourGroups: React.MutableRefObject<THREE.Group[]>;
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
