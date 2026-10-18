import React, { useRef, useEffect, useState, useCallback } from 'react';
import { getStroke } from 'perfect-freehand';
import { Page, Stroke, ToolType, AppSettings } from '../types/note';
import {
  getSvgPathFromStroke,
  getStrokeOptionsForTool,
  getAdjustedColor,
  detectShape,
  isPointNearStroke,
  drawBackgroundPattern,
} from '../utils/canvasHelper';

interface NoteCanvasProps {
  page: Page;
  currentTool: ToolType;
  currentColor: string;
  currentSize: number;
  settings: AppSettings;
  isDarkMode: boolean;
  onPageUpdate: (updatedPage: Page) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  scale?: number;
}

export const NoteCanvas: React.FC<NoteCanvasProps> = ({
  page,
  currentTool,
  currentColor,
  currentSize,
  settings,
  isDarkMode,
  onPageUpdate,
  scale = 1,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const currentPointsRef = useRef<number[][]>([]);

  const [isHovering, setIsHovering] = useState(false);

  // Inversion flag
  const invertActive = isDarkMode && settings.invertInDarkMode;

  // Redraw canvas whenever page strokes, tool, theme or pattern change
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const width = page.width;
    const height = page.height;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Draw Paper & Background Pattern
    drawBackgroundPattern(
      ctx,
      width,
      height,
      page.backgroundPattern,
      invertActive,
      settings.gridSpacing
    );

    // Group strokes into highlighter layer and pen/ink layer
    // Saber Feature: Highlighters render BELOW ink, and overlapping highlighter
    // strokes of identical or mixed colors blend consistently without dark "muddy" multiplying!
    const highlighterStrokes = page.strokes.filter((s) => s.tool === 'highlighter');
    const inkStrokes = page.strokes.filter((s) => s.tool !== 'highlighter');

    // 2. Render Highlighter Layer
    if (highlighterStrokes.length > 0) {
      ctx.save();
      // Offscreen layer for highlighters to ensure flat composite blending
      const hlCanvas = document.createElement('canvas');
      hlCanvas.width = width * dpr;
      hlCanvas.height = height * dpr;
      const hlCtx = hlCanvas.getContext('2d');

      if (hlCtx) {
        hlCtx.scale(dpr, dpr);
        // Using lighter/screen or flat opacity union so overlapping passes don't multiply into mud
        hlCtx.globalCompositeOperation = 'source-over';

        for (const stroke of highlighterStrokes) {
          const adjColor = getAdjustedColor(stroke.color, isDarkMode, invertActive);
          hlCtx.fillStyle = adjColor;
          hlCtx.strokeStyle = adjColor;

          if (stroke.points.length >= 2) {
            const outlinePoints = getStroke(
              stroke.points,
              getStrokeOptionsForTool('highlighter', stroke.size)
            );
            const pathData = getSvgPathFromStroke(outlinePoints);
            const path = new Path2D(pathData);
            hlCtx.fill(path);
          }
        }

        // Composite highlighter layer onto paper with balanced transparency
        ctx.globalAlpha = invertActive ? 0.6 : 0.42;
        ctx.globalCompositeOperation = invertActive ? 'screen' : 'multiply';
        ctx.drawImage(hlCanvas, 0, 0, width, height);
      }
      ctx.restore();
    }

    // 3. Render Ink Strokes (Fountain, Ballpoint, Pencil, Shape)
    ctx.save();
    for (const stroke of inkStrokes) {
      const strokeColor = getAdjustedColor(stroke.color, isDarkMode, invertActive);
      ctx.fillStyle = strokeColor;
      ctx.strokeStyle = strokeColor;

      if (stroke.shapeType && stroke.shapeData) {
        const { startX, startY, endX, endY, radius } = stroke.shapeData;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();

        if (stroke.shapeType === 'line') {
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        } else if (stroke.shapeType === 'rectangle') {
          ctx.strokeRect(
            Math.min(startX, endX),
            Math.min(startY, endY),
            Math.abs(endX - startX),
            Math.abs(endY - startY)
          );
        } else if (stroke.shapeType === 'circle' && radius) {
          ctx.arc(startX, startY, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (stroke.points.length > 0) {
        if (stroke.tool === 'pencil') {
          ctx.globalAlpha = 0.8;
        } else {
          ctx.globalAlpha = 1.0;
        }

        const outlinePoints = getStroke(
          stroke.points,
          getStrokeOptionsForTool(stroke.tool, stroke.size)
        );
        const pathData = getSvgPathFromStroke(outlinePoints);
        const path = new Path2D(pathData);
        ctx.fill(path);
      }
    }
    ctx.restore();

    // 4. Render Active Live Stroke being drawn right now
    if (activeStrokeRef.current) {
      const active = activeStrokeRef.current;
      const strokeColor = getAdjustedColor(active.color, isDarkMode, invertActive);
      ctx.save();
      ctx.fillStyle = strokeColor;
      ctx.strokeStyle = strokeColor;

      if (active.tool === 'highlighter') {
        ctx.globalAlpha = invertActive ? 0.6 : 0.45;
        ctx.globalCompositeOperation = invertActive ? 'screen' : 'multiply';
      } else if (active.tool === 'pencil') {
        ctx.globalAlpha = 0.8;
      }

      if (active.points.length >= 2) {
        const outlinePoints = getStroke(
          active.points,
          getStrokeOptionsForTool(active.tool, active.size)
        );
        const pathData = getSvgPathFromStroke(outlinePoints);
        const path = new Path2D(pathData);
        ctx.fill(path);
      }
      ctx.restore();
    }

    ctx.restore();
  }, [page, isDarkMode, invertActive, settings]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Pointer event coordinate translation to canvas local coords
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): [number, number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0, 0.5];
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * page.width;
    const y = ((e.clientY - rect.top) / rect.height) * page.height;
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10, pressure];
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const [x, y, pressure] = getCanvasPoint(e);

    // If Eraser tool is active, erase strokes at contact point
    if (currentTool === 'eraser') {
      const remainingStrokes = page.strokes.filter(
        (s) => !isPointNearStroke(x, y, s, currentSize * 1.5)
      );
      if (remainingStrokes.length !== page.strokes.length) {
        onPageUpdate({ ...page, strokes: remainingStrokes });
      }
      return;
    }

    currentPointsRef.current = [[x, y, pressure]];

    activeStrokeRef.current = {
      id: 'stroke_' + Math.random().toString(36).substring(2, 9),
      tool: currentTool,
      color: currentColor,
      size: currentSize,
      points: [[x, y, pressure]],
      createdAt: Date.now(),
    };

    renderCanvas();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();

    const [x, y, pressure] = getCanvasPoint(e);

    // Eraser dragging
    if (currentTool === 'eraser') {
      const remainingStrokes = page.strokes.filter(
        (s) => !isPointNearStroke(x, y, s, currentSize * 1.5)
      );
      if (remainingStrokes.length !== page.strokes.length) {
        onPageUpdate({ ...page, strokes: remainingStrokes });
      }
      return;
    }

    if (!activeStrokeRef.current) return;

    currentPointsRef.current.push([x, y, pressure]);
    activeStrokeRef.current.points = [...currentPointsRef.current];

    renderCanvas();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    isDrawingRef.current = false;

    if (currentTool === 'eraser') {
      return;
    }

    if (activeStrokeRef.current && activeStrokeRef.current.points.length > 0) {
      let finalStroke = { ...activeStrokeRef.current };

      // Shape detection if Shape Pen tool is active
      if (currentTool === 'shape') {
        const detected = detectShape(finalStroke.points);
        if (detected) {
          finalStroke = {
            ...finalStroke,
            shapeType: detected.type,
            shapeData: {
              startX: detected.startX,
              startY: detected.startY,
              endX: detected.endX,
              endY: detected.endY,
              radius: detected.radius,
            },
            points: [],
          };
        }
      }

      onPageUpdate({
        ...page,
        strokes: [...page.strokes, finalStroke],
      });
    }

    activeStrokeRef.current = null;
    currentPointsRef.current = [];
    renderCanvas();
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center p-4 md:p-8 overflow-auto select-none"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        className="relative transition-shadow duration-200"
        style={{
          boxShadow: isDarkMode
            ? '0 20px 40px -15px rgba(0, 0, 0, 0.7)'
            : '0 10px 30px -10px rgba(0, 0, 0, 0.15)',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: `${page.width * scale}px`,
            height: `${page.height * scale}px`,
            touchAction: 'none',
            cursor:
              currentTool === 'eraser'
                ? 'crosshair'
                : currentTool === 'highlighter'
                ? 'cell'
                : 'default',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="rounded-lg block"
        />

        {/* Page number badge */}
        <div className="absolute bottom-3 right-4 px-3 py-1 text-xs rounded-full bg-[var(--ink)] text-[var(--bg)] font-display font-medium pointer-events-none opacity-70 shadow-sm">
          Page {page.pageNumber}
        </div>
      </div>
    </div>
  );
};
