import * as THREE from 'three';
import type { GridRefs } from './types';

// Helper to get days in a month
export const getDaysInMonth = (month: number, year = new Date().getFullYear()): number => {
  return new Date(year, month + 1, 0).getDate();
};

// Create a month cell with its label
export const createMonthCell = (
  monthIndex: number,
  monthName: string,
  cellWidth: number,
  cellHeight: number,
  x: number,
  y: number,
  row: number
): THREE.Group => {
  const monthCell = new THREE.Group();
  monthCell.position.set(x, y, 0);

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

  // Add glowing border (initially hidden)
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
  glowBorder.position.set(0, 0, 0.05);
  glowBorder.scale.set(1.03, 1.03, 1);
  glowBorder.visible = false;
  glowBorder.userData.isGlowBorder = true;
  monthCell.add(glowBorder);

  return monthCell;
};

// Create month label
export const createMonthLabel = (
  monthName: string,
  cellWidth: number,
  cellHeight: number
): THREE.Mesh => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024 / 2;
  canvas.height = 512 / 2;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not get canvas context');
  }

  context.fillStyle = '#ffffff';
  context.font = '80px Arial';
  context.textAlign = 'left';
  context.textBaseline = 'top';
  context.fillText(monthName, 30, 20);

  const texture = new THREE.CanvasTexture(canvas);
  const labelGeometry = new THREE.PlaneGeometry(cellWidth * 0.75, cellHeight * 0.3);
  const labelMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    opacity: 1
  });

  const label = new THREE.Mesh(labelGeometry, labelMaterial);
  label.position.set(
    -cellWidth * 0.08,
    cellHeight * 0.28,
    0.04
  );

  return label;
};

// Create days for a month
export const createDaysForMonth = (
  monthIndex: number,
  monthName: string,
  cellWidth: number,
  cellHeight: number
): THREE.Group => {
  const dayGroup = new THREE.Group();
  dayGroup.visible = false;

  // Get days in this month
  const daysInMonth = getDaysInMonth(monthIndex);

  // 5 rows max and 7 columns for days
  const dayRows = 5;
  const dayCols = 7;

  const dayWidth = cellWidth / dayCols;
  const dayHeight = cellHeight / dayRows;

  // Starting position (top-left corner)
  const dayStartX = -cellWidth / 2 + dayWidth / 2;
  const dayStartY = cellHeight / 2 - dayHeight / 2;

  // Create days
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
      opacity: 0
    });

    const dayMesh = new THREE.Mesh(dayGeometry, dayMaterial);
    dayMesh.position.set(dayX, dayY, 0.03);

    // Add day number
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
        opacity: 0
      });

      const dayLabel = new THREE.Mesh(dayLabelGeometry, dayLabelMaterial);
      dayLabel.position.set(0, 0, 0.01);
      dayMesh.add(dayLabel);
    }

    // Store month and day data
    dayMesh.userData = {
      monthIndex,
      monthName,
      day: dayNum,
      isDay: true,
      dayMaterial,
      labelMaterial: dayMesh.children[0]?.material as THREE.MeshBasicMaterial
    };

    dayGroup.add(dayMesh);
  }

  return dayGroup;
};

// Create the entire grid
export const createGrid = (refs: GridRefs): THREE.Group => {
  const group = new THREE.Group();

  // Grid dimensions
  const cols = 4;
  const rows = 3;
  const spacing = 0.03;

  // Size based on aspect ratio
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
  const monthPositions: { x: number; y: number; row: number }[] = [];
  const monthCells: THREE.Group[] = [];
  const monthLabels: THREE.Mesh[] = [];
  const dayGroups: THREE.Group[] = [];

  // Create month cells
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col;
      if (index >= months.length) continue;

      // Calculate position
      const x = startX + (col * (cellWidth + spacing));
      const y = startY - (row * (cellHeight + spacing));

      // Store position
      monthPositions[index] = { x, y, row };

      // Create month cell
      const monthCell = createMonthCell(
        index,
        months[index],
        cellWidth,
        cellHeight,
        x,
        y,
        row
      );

      // Add to grid
      group.add(monthCell);
      monthCells.push(monthCell);

      // Create and add month label
      const label = createMonthLabel(months[index], cellWidth, cellHeight);
      monthCell.add(label);
      monthLabels.push(label);

      // Create and add days
      const dayGroup = createDaysForMonth(index, months[index], cellWidth, cellHeight);
      monthCell.add(dayGroup);
      dayGroups.push(dayGroup);
    }
  }

  // Store references
  refs.monthPositions.current = monthPositions;
  refs.monthCells.current = monthCells;
  refs.monthLabels.current = monthLabels;
  refs.dayGroups.current = dayGroups;

  return group;
};
