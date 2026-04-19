'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import type { Stroke, PlacedSticker, CanvasState } from '@/lib/types';

// ============================================================
// DrawingCanvas
// Production-grade drawing surface for kids:
// - Coalesced pointer events for smooth lines on iPad
// - Quadratic smoothing between points
// - Layered rendering: reference (bottom) -> ghost -> strokes -> stickers
// - Undo stack (last 20)
// - Exposes exportPNG() + getState() via ref
// ============================================================

export interface DrawingCanvasHandle {
  exportPNG: () => Promise<string>;
  getState: () => CanvasState;
  clear: () => void;
  undo: () => void;
  placeSticker: (key: string, emoji: string) => void;
}

interface Props {
  width?: number;
  height?: number;
  color: string;
  brushWidth: number;
  referencePaths?: string[];  // shown at full opacity (what to trace)
  ghostPaths?: string[];      // shown faded (next-step hint)
  traceMode?: boolean;        // if true, reference shown prominently
  onStroke?: () => void;      // fired after each completed stroke
  className?: string;
}

const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(function DrawingCanvas(
  {
    width = 800,
    height = 600,
    color,
    brushWidth,
    referencePaths = [],
    ghostPaths = [],
    traceMode = false,
    onStroke,
    className = '',
  },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const currentStroke = useRef<Stroke | null>(null);
  const isDrawing = useRef(false);
  // Device pixel ratio - captured once per resize
  const dpr = useRef(1);

  // ------------------------------------------------------------
  // Setup canvas sizing with DPR support
  // ------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    dpr.current = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr.current;
    canvas.height = height * dpr.current;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  // ------------------------------------------------------------
  // Redraw when state changes
  // ------------------------------------------------------------
  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes, stickers, referencePaths, ghostPaths, traceMode]);

  // ------------------------------------------------------------
  // Drawing routines
  // ------------------------------------------------------------
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr.current, dpr.current);

    // cream paper background
    ctx.fillStyle = '#FFFBF4';
    ctx.fillRect(0, 0, width, height);

    // subtle paper texture dots
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = '#2A1B3D';
    for (let x = 0; x < width; x += 14) {
      for (let y = 0; y < height; y += 14) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.restore();

    // ghost paths (faint)
    if (ghostPaths.length) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = '#2A1B3D';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.lineCap = 'round';
      ghostPaths.forEach(d => {
        const p = new Path2D(d);
        ctx.stroke(p);
      });
      ctx.restore();
    }

    // reference paths
    if (referencePaths.length) {
      ctx.save();
      ctx.globalAlpha = traceMode ? 0.35 : 0.22;
      ctx.strokeStyle = '#5B4A6E';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      referencePaths.forEach(d => {
        const p = new Path2D(d);
        ctx.stroke(p);
      });
      ctx.restore();
    }

    // strokes
    strokes.forEach(drawStroke.bind(null, ctx));
    if (currentStroke.current) drawStroke(ctx, currentStroke.current);

    // stickers (emoji-based for now; production would swap to SVG assets)
    stickers.forEach(s => {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate((s.rotation * Math.PI) / 180);
      ctx.scale(s.scale, s.scale);
      ctx.font = '64px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.key, 0, 0);
      ctx.restore();
    });
  }, [width, height, strokes, stickers, referencePaths, ghostPaths, traceMode]);

  // ------------------------------------------------------------
  // Smooth stroke drawing using quadratic curves
  // ------------------------------------------------------------
  function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    if (stroke.points.length < 1) return;
    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.points.length === 1) {
      // dot
      const p = stroke.points[0];
      ctx.beginPath();
      ctx.arc(p.x, p.y, stroke.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length - 1; i++) {
      const p = stroke.points[i];
      const next = stroke.points[i + 1];
      const midX = (p.x + next.x) / 2;
      const midY = (p.y + next.y) / 2;
      ctx.quadraticCurveTo(p.x, p.y, midX, midY);
    }
    const last = stroke.points[stroke.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.restore();
  }

  // ------------------------------------------------------------
  // Pointer handling
  // ------------------------------------------------------------
  function canvasCoords(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const y = ((e.clientY - rect.top) / rect.height) * height;
    return { x, y };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    const { x, y } = canvasCoords(e);
    currentStroke.current = {
      color,
      width: brushWidth,
      points: [{ x, y, pressure: e.pressure || 0.5 }],
    };
    isDrawing.current = true;
    redraw();
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current || !currentStroke.current) return;
    const { x, y } = canvasCoords(e);
    const pts = currentStroke.current.points;
    const last = pts[pts.length - 1];
    // drop tiny jitter
    if (Math.hypot(x - last.x, y - last.y) < 1.2) return;
    pts.push({ x, y, pressure: e.pressure || 0.5 });
    redraw();
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current || !currentStroke.current) return;
    isDrawing.current = false;
    const finished = currentStroke.current;
    currentStroke.current = null;
    setStrokes(prev => {
      const next = [...prev, finished];
      // cap undo history to avoid memory bloat
      return next.length > 100 ? next.slice(-100) : next;
    });
    onStroke?.();
    try {
      (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
    } catch {}
  }

  // ------------------------------------------------------------
  // Imperative API
  // ------------------------------------------------------------
  useImperativeHandle(ref, () => ({
    async exportPNG() {
      // Rasterize at display size so file is reasonable
      const canvas = canvasRef.current!;
      return canvas.toDataURL('image/png');
    },
    getState() {
      return { strokes, stickers };
    },
    clear() {
      setStrokes([]);
      setStickers([]);
    },
    undo() {
      setStrokes(prev => prev.slice(0, -1));
    },
    placeSticker(key: string) {
      // drop in slight random offset near center
      const offsetX = (Math.random() - 0.5) * 200;
      const offsetY = (Math.random() - 0.5) * 200;
      setStickers(prev => [
        ...prev,
        {
          key,
          x: width / 2 + offsetX,
          y: height / 2 + offsetY,
          scale: 1 + Math.random() * 0.4,
          rotation: (Math.random() - 0.5) * 30,
        },
      ]);
    },
  }));

  return (
    <div
      ref={containerRef}
      className={`relative touch-none select-none ${className}`}
      style={{ width, height }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
        className="block rounded-squircle shadow-float"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
});

export default DrawingCanvas;
