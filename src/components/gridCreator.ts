import * as THREE from 'three';
import type { GridRefs, DateImageEntry } from './types';

// Helper function to get the number of days in a month
export const getDaysInMonth = (monthIndex: number): number => {
  const year = new Date().getFullYear();
  // The day 0 of the next month is the last day of the current month
  return new Date(year, monthIndex + 1, 0).getDate();
};

// Add to the createMonthCell function - add a glowing border
export const createMonthCell = (
  monthIndex: number,
  name: string,
  width: number,
  height: number,
  x: number,
  y: number,
  row: number
): THREE.Group => {
  const group = new THREE.Group();
  group.position.set(x, y, 0);

  // Create the cell background
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({
    color: 0x2d3748,
    side: THREE.DoubleSide
  });

  const background = new THREE.Mesh(geometry, material);
  background.position.set(0, 0, 0);
  group.add(background);

  // Create regular border
  const borderGeometry = new THREE.EdgesGeometry(geometry);
  const borderMaterial = new THREE.LineBasicMaterial({
    color: 0x4a5568,
    transparent: true,
    opacity: 0.7
  });

  const border = new THREE.LineSegments(borderGeometry, borderMaterial);
  border.position.set(0, 0, 0.01);
  group.add(border);

  // Create glowing border - initially hidden
  const glowBorderGeometry = new THREE.EdgesGeometry(geometry);
  const glowBorderMaterial = new THREE.LineBasicMaterial({
    color: 0x38b2ff, // Bright blue color
    transparent: true,
    opacity: 0.9,
    linewidth: 2
  });

  const glowBorder = new THREE.LineSegments(glowBorderGeometry, glowBorderMaterial);
  glowBorder.position.set(0, 0, 0.02); // Slightly in front of regular border
  glowBorder.visible = false; // Initially hidden
  glowBorder.userData.isGlowBorder = true; // Mark this as a glow border for animation
  group.add(glowBorder);

  // Store data for this month
  group.userData = {
    monthIndex,
    monthName: name,
    row,
    glowBorder,
    borderMaterial
  };

  return group;
};

// Create a text label for a month
export const createMonthLabel = (
  name: string,
  cellWidth: number,
  cellHeight: number
): THREE.Mesh => {
  // Create a canvas for the month name
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');

  if (context) {
    context.fillStyle = '#ffffff';
    context.font = 'bold 70px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(name, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const geometry = new THREE.PlaneGeometry(cellWidth * 0.8, cellHeight * 0.2);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 1
    });

    const label = new THREE.Mesh(geometry, material);
    label.position.set(0, 0, 0.02);
    return label;
  }

  // Fallback if context fails
  const geometry = new THREE.PlaneGeometry(0.1, 0.1);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  return new THREE.Mesh(geometry, material);
};

export const createGrid = (refs: GridRefs, dateImages: DateImageEntry[] = []): THREE.Group => {
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
      const dayGroup = createDaysForMonth(index, months[index], cellWidth, cellHeight, dateImages);
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

export const createDaysForMonth = (
  monthIndex: number,
  monthName: string,
  cellWidth: number,
  cellHeight: number,
  dateImages: DateImageEntry[] = []
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

  // Get current year
  const currentYear = new Date().getFullYear();

  // In the createDaysForMonth function, modify the daysWithImages map
  // to include text data

  // Create a map of days with images and text for this month
  const daysWithImages = new Map<number, { imageUrl: string, text?: string }>();
  dateImages.forEach(item => {
    const date = item.date;
    if (date.getMonth() === monthIndex) {
      daysWithImages.set(date.getDate(), {
        imageUrl: item.imageUrl,
        text: item.text
      });
    }
  });

  // Create days
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    // Calculate position (0-indexed, starting from top-left corner)
    const dayCol = (dayNum - 1) % dayCols;
    const dayRow = Math.floor((dayNum - 1) / dayCols);

    const dayX = dayStartX + (dayCol * dayWidth);
    const dayY = dayStartY - (dayRow * dayHeight);

    // Check if this day has an image
    const hasImage = daysWithImages.has(dayNum);

    // Create day cell with highlight if it has an image
    const dayGeometry = new THREE.PlaneGeometry(dayWidth * 0.9, dayHeight * 0.9);
    const dayMaterial = new THREE.MeshBasicMaterial({
      color: hasImage ? 0x4a9cff : 0x3a4a5c, // Highlight color for days with images
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

      // Add a small indicator for days with images
      if (hasImage) {
        dayContext.fillStyle = '#ffcc00';
        dayContext.beginPath();
        dayContext.arc(64, 100, 8, 0, Math.PI * 2);
        dayContext.fill();
      }

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

    // Then later when setting userData, include the text field:

    // Store data for this day, including image URL and text if available
    const imageData = daysWithImages.get(dayNum);
    dayMesh.userData = {
      monthIndex,
      monthName,
      day: dayNum,
      isDay: true,
      dayMaterial,
      labelMaterial: dayMesh.children[0]?.material as THREE.MeshBasicMaterial,
      hasImage: !!imageData,
      imageUrl: imageData?.imageUrl,
      text: imageData?.text // Pass the text data
    };

    dayGroup.add(dayMesh);
  }

  return dayGroup;
};
