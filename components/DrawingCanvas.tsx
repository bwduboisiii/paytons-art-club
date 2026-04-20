'use client';

import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import type { Stroke, PlacedSticker, CanvasState } from '@/lib/types';

// ============================================================
// DrawingCanvas — production-grade
// - Single-argument placeSticker (fixes prior signature mismatch)
// - Ignores pointerLeave (no more lost strokes when pointer briefly exits)
// - iOS-safe: touchAction none, preventDefault on touch, passive listeners
// - Async PNG export via Blob (won't freeze UI on large canvases)
// - Undo cap so memory stays bounded
// ============================================================

export interface DrawingCanvasHandle {
  exportPNG: () => Promise<Blob>;
  exportDataURL: () => Promise<string>;
  getState: () => CanvasState;
  clear: () => void;
  undo: () => void;
  placeSticker: (emojiOrKey: string) => void;
  hasContent: () => boolean;
}

interface Props {
  width?: number;
  height?: number;
  color: string;
  brushWidth: number;
  referencePaths?: string[];
  ghostPaths?: string[];
  traceMode?: boolean;
  onStroke?: () => void;
  className?: string;
}

const UNDO_CAP = 100;

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
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const currentStroke = useRef<Stroke | null>(null);
  const isDrawing = useRef(false);
  const dpr = useRef(1);

  // ------------------------------------------------------------
  // Size & DPR
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

  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes, stickers, referencePaths, ghostPaths, traceMode]);

  // ------------------------------------------------------------
  // Rendering
  // ------------------------------------------------------------
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr.current, dpr.current);

    // Paper background
    ctx.fillStyle = '#FFFBF4';
    ctx.fillRect(0, 0, width, height);

    // Paper texture dots
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = '#2A1B3D';
    for (let x = 0; x < width; x += 14) {
      for (let y = 0; y < height; y += 14) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.restore();

    // Ghost (next-step hint)
    if (ghostPaths.length) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = '#2A1B3D';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.lineCap = 'round';
      ghostPaths.forEach((d) => {
        try {
          ctx.stroke(new Path2D(d));
        } catch {
          // malformed path — skip, never crash
        }
      });
      ctx.restore();
    }

    // Reference paths (what to trace/copy)
    if (referencePaths.length) {
      ctx.save();
      ctx.globalAlpha = traceMode ? 0.35 : 0.22;
      ctx.strokeStyle = '#5B4A6E';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      referencePaths.forEach((d) => {
        try {
          ctx.stroke(new Path2D(d));
        } catch {
          // skip malformed path
        }
      });
      ctx.restore();
    }

    // Completed strokes + in-progress stroke
    strokes.forEach((s) => drawStroke(ctx, s));
    if (currentStroke.current) drawStroke(ctx, currentStroke.current);

    // Stickers (emoji glyphs for now — can swap to SVG assets later)
    stickers.forEach((s) => {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate((s.rotation * Math.PI) / 180);
      ctx.scale(s.scale, s.scale);
      ctx.font =
        '64px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.key, 0, 0);
      ctx.restore();
    });
  }, [width, height, strokes, stickers, referencePaths, ghostPaths, traceMode]);

  function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    if (stroke.points.length < 1) return;
    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.points.length === 1) {
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
  function canvasCoords(clientX: number, clientY: number) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * width;
    const y = ((clientY - rect.top) / rect.height) * height;
    return { x, y };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    try {
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    } catch {
      /* some browsers throw; fine */
    }
    const { x, y } = canvasCoords(e.clientX, e.clientY);
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
    const { x, y } = canvasCoords(e.clientX, e.clientY);
    const pts = currentStroke.current.points;
    const last = pts[pts.length - 1];
    if (Math.hypot(x - last.x, y - last.y) < 1.2) return;
    pts.push({ x, y, pressure: e.pressure || 0.5 });
    redraw();
  }

  function endStroke(e?: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current || !currentStroke.current) return;
    isDrawing.current = false;
    const finished = currentStroke.current;
    currentStroke.current = null;
    setStrokes((prev) => {
      const next = [...prev, finished];
      return next.length > UNDO_CAP ? next.slice(-UNDO_CAP) : next;
    });
    onStroke?.();
    if (e) {
      try {
        (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  }

  // ------------------------------------------------------------
  // Imperative API
  // ------------------------------------------------------------
  useImperativeHandle(ref, () => ({
    async exportPNG() {
      const canvas = canvasRef.current!;
      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Could not export PNG'));
        }, 'image/png');
      });
    },
    async exportDataURL() {
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
      setStrokes((prev) => prev.slice(0, -1));
    },
    placeSticker(emojiOrKey: string) {
      const offsetX = (Math.random() - 0.5) * 200;
      const offsetY = (Math.random() - 0.5) * 200;
      setStickers((prev) => [
        ...prev,
        {
          key: emojiOrKey,
          x: width / 2 + offsetX,
          y: height / 2 + offsetY,
          scale: 1 + Math.random() * 0.4,
          rotation: (Math.random() - 0.5) * 30,
        },
      ]);
    },
    hasContent() {
      return strokes.length > 0 || stickers.length > 0;
    },
  }));

  return (
    <div
      className={`relative touch-none select-none ${className}`}
      style={{ width, height }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endStroke(e)}
        onPointerCancel={(e) => endStroke(e)}
        /* IMPORTANT: do NOT end stroke on pointer-leave; it causes premature
           stroke cutoff when the finger/pen briefly crosses the edge. Pointer
           capture + pointerUp/pointerCancel are sufficient. */
        className="block rounded-squircle shadow-float bg-cream-50"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
});

export default DrawingCanvas;
