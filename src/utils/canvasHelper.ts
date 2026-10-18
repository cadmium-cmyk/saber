import { getStroke } from 'perfect-freehand';
import { Stroke, BackgroundPattern } from '../types/note';

export function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return '';

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q']
  );

  d.push('Z');
  return d.join(' ');
}

export interface FreehandOptions {
  size: number;
  thinning?: number;
  smoothing?: number;
  streamline?: number;
  easing?: (t: number) => number;
  simulatePressure?: boolean;
}

export function getStrokeOptionsForTool(tool: Stroke['tool'], baseSize: number): FreehandOptions {
  switch (tool) {
    case 'fountain':
      return {
        size: baseSize,
        thinning: 0.65,
        smoothing: 0.55,
        streamline: 0.4,
        simulatePressure: true,
      };
    case 'ballpoint':
      return {
        size: baseSize,
        thinning: 0.15,
        smoothing: 0.45,
        streamline: 0.35,
        simulatePressure: false,
      };
    case 'pencil':
      return {
        size: baseSize * 0.9,
        thinning: 0.35,
        smoothing: 0.3,
        streamline: 0.25,
        simulatePressure: true,
      };
    case 'highlighter':
      return {
        size: baseSize * 2.8,
        thinning: 0,
        smoothing: 0.4,
        streamline: 0.45,
        simulatePressure: false,
      };
    default:
      return {
        size: baseSize,
        thinning: 0.3,
        smoothing: 0.5,
        streamline: 0.4,
      };
  }
}

/**
 * Saber Dark Mode Inversion algorithm:
 * In dark mode, if invert is enabled:
 * - Pure/dark black (#000000, #111827, #1c1917, #262626) maps to crisp white (#f8fafc)
 * - Near whites map to dark
 * - Saturated colors (blue, red, green, yellow, purple) are adjusted for luminance contrast
 *   so they pop beautifully on dark paper without glare.
 */
export function getAdjustedColor(originalColor: string, isDarkMode: boolean, invertNotes: boolean): string {
  if (!isDarkMode || !invertNotes) return originalColor;

  // Check if it's black or very dark
  const lower = originalColor.toLowerCase();
  if (
    lower === '#000000' ||
    lower === '#000' ||
    lower === '#111827' ||
    lower === '#18181b' ||
    lower === '#1e293b' ||
    lower === '#0f172a' ||
    lower === 'black'
  ) {
    return '#f8fafc'; // Crisp off-white
  }

  if (lower === '#ffffff' || lower === '#fff' || lower === 'white') {
    return '#18181b';
  }

  // Parse hex
  if (originalColor.startsWith('#') && originalColor.length >= 7) {
    const r = parseInt(originalColor.slice(1, 3), 16);
    const g = parseInt(originalColor.slice(3, 5), 16);
    const b = parseInt(originalColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // If it's quite dark (< 0.25), boost luminance
    if (luminance < 0.25) {
      return `rgb(${Math.min(255, r + 180)}, ${Math.min(255, g + 180)}, ${Math.min(255, b + 180)})`;
    }
  }

  return originalColor;
}

/**
 * Detect geometric shapes from points (straight line, rectangle, circle)
 */
export function detectShape(points: number[][]): {
  type: 'line' | 'rectangle' | 'circle';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  radius?: number;
} | null {
  if (points.length < 5) return null;

  const first = points[0];
  const last = points[points.length - 1];
  const totalLength = points.reduce((acc, p, i) => {
    if (i === 0) return 0;
    const prev = points[i - 1];
    return acc + Math.hypot(p[0] - prev[0], p[1] - prev[1]);
  }, 0);

  const directDist = Math.hypot(last[0] - first[0], last[1] - first[1]);

  // 1. Line detection: ratio of direct distance to curve length is near 1
  if (directDist > 30 && directDist / totalLength > 0.88) {
    return {
      type: 'line',
      startX: first[0],
      startY: first[1],
      endX: last[0],
      endY: last[1],
    };
  }

  // 2. Closed loop check (circle or rectangle)
  const isClosed = directDist < 45 || directDist / totalLength < 0.2;
  if (isClosed && points.length >= 10) {
    // Calculate bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(([x, y]) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });

    const width = maxX - minX;
    const height = maxY - minY;
    if (width < 25 || height < 25) return null;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const avgRadius = (width + height) / 4;

    // Check if points are roughly equidistant from center (circle)
    let radiusDiffSum = 0;
    points.forEach(([x, y]) => {
      const dist = Math.hypot(x - centerX, y - centerY);
      radiusDiffSum += Math.abs(dist - avgRadius);
    });
    const avgRadiusDiff = radiusDiffSum / points.length;

    // If points are fairly circular
    if (avgRadiusDiff / avgRadius < 0.22 && Math.abs(width - height) / Math.max(width, height) < 0.35) {
      return {
        type: 'circle',
        startX: centerX,
        startY: centerY,
        endX: centerX + avgRadius,
        endY: centerY,
        radius: avgRadius,
      };
    }

    // Otherwise check for rectangle
    return {
      type: 'rectangle',
      startX: minX,
      startY: minY,
      endX: maxX,
      endY: maxY,
    };
  }

  return null;
}

/**
 * Check if a point hits near a stroke (for eraser)
 */
export function isPointNearStroke(
  px: number,
  py: number,
  stroke: Stroke,
  threshold = 12
): boolean {
  if (stroke.shapeType) {
    // Check bounding box or shape
    const data = stroke.shapeData;
    if (!data) return false;
    if (stroke.shapeType === 'line') {
      const d = distToSegment(px, py, data.startX, data.startY, data.endX, data.endY);
      return d <= threshold + stroke.size / 2;
    } else if (stroke.shapeType === 'circle' && data.radius) {
      const dist = Math.hypot(px - data.startX, py - data.startY);
      return Math.abs(dist - data.radius) <= threshold + stroke.size / 2;
    } else if (stroke.shapeType === 'rectangle') {
      const withinX = px >= Math.min(data.startX, data.endX) - threshold && px <= Math.max(data.startX, data.endX) + threshold;
      const withinY = py >= Math.min(data.startY, data.endY) - threshold && py <= Math.max(data.startY, data.endY) + threshold;
      return withinX && withinY;
    }
  }

  const effectiveThreshold = threshold + stroke.size / 2;
  for (let i = 0; i < stroke.points.length; i++) {
    const [x, y] = stroke.points[i];
    if (Math.hypot(px - x, py - y) <= effectiveThreshold) {
      return true;
    }
  }
  return false;
}

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

/**
 * Draw background pattern on canvas context
 */
export function drawBackgroundPattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pattern: BackgroundPattern,
  isDarkMode: boolean,
  spacing = 28
) {
  // Clear and fill base paper color
  ctx.fillStyle = isDarkMode ? '#1a1a1a' : '#ffffff';
  ctx.fillRect(0, 0, width, height);

  if (pattern === 'blank') return;

  const lineColor = isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 70, 150, 0.14)';
  const redMarginColor = isDarkMode ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.35)';

  ctx.save();
  ctx.lineWidth = 1;

  if (pattern === 'ruled') {
    ctx.strokeStyle = lineColor;
    // Draw top margin
    const topMargin = 60;
    for (let y = topMargin; y < height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    // Vertical left margin line
    ctx.strokeStyle = redMarginColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(70, 0);
    ctx.lineTo(70, height);
    ctx.stroke();
  } else if (pattern === 'grid') {
    ctx.strokeStyle = lineColor;
    for (let x = 0; x < width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  } else if (pattern === 'dotted') {
    ctx.fillStyle = isDarkMode ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.22)';
    for (let x = spacing; x < width; x += spacing) {
      for (let y = spacing; y < height; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1.25, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (pattern === 'isometric') {
    ctx.strokeStyle = lineColor;
    const isoSpacing = spacing * 1.5;
    // Diagonal lines 30 and 150 degrees
    for (let x = -height; x < width + height; x += isoSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height * Math.tan(Math.PI / 6), height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - height * Math.tan(Math.PI / 6), height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += isoSpacing * Math.sin(Math.PI / 3)) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  ctx.restore();
}
