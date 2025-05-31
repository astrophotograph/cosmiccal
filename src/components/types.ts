import * as THREE from 'three';

export type DateImageEntry = {
  date: Date;
  imageUrl: string;
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

export type GridAction = 'initialZoom' | 'focusMonth' | 'reset';

export type GridActionEvent = CustomEvent<{
  action: GridAction;
  monthIndex?: number;
}>;
