'use client';

import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import type { GameEvent } from '@/lib/gameTypes';
import { safeUUID } from '@/lib/utils';

// ============================================================
// GameCanvas
//   Simplified canvas for multiplayer pictionary. Only marker + eraser.
//   Streams strokes outbound when drawer; renders incoming when guesser.
// ============================================================

export interface GameCanvasHandle {
  clear: () => void;
  exportDataURL: () => string;
}

interface Props {
  width: number;
  height: number;
  color: string;
  brushWidth: number;
  isEraser: boolean;
  // True when this player is the drawer (can interact), false when guesser
  canDraw: boolean;
  // Incoming events from the realtime channel
  incomingEvents: GameEvent[];
  // Callbacks for outgoing
  onStrokeBatch: (payload: {
    pts: Array<{ x: number; y: number }>;
    color: string;
    width: number;
    strokeId: string;
    isLast?: boolean;
  }) => void;
  onClear: () => void;
  className?: string;
}

interface DrawnStroke {
  id: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
  isEraser: boolean;
}

const BATCH_MS = 50; // flush at 20Hz

const GameCanvas = forwardRef<GameCanvasHandle, Props>(function GameCanvas(
  {
    width,
    height,
    color,
    brushWidth,
    isEraser,
    canDraw,
    incomingEvents,
    onStrokeBatch,
    onClear,
    className = '',
  },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<DrawnStroke[]>([]);
  const currentStroke = useRef<DrawnStroke | null>(null);
  const pendingBatch = useRef<{ pts: Array<{ x: number; y: number }>; strokeId: string } | null>(
    null
  );
  const flushTimer = useRef<NodeJS.Timeout | null>(null);
  const isDrawing = useRef(false);
  const dpr = useRef(1);
  const processedEventIdx = useRef(0);

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

  // Process incoming events
  useEffect(() => {
    // Only process events we haven't seen yet
    const newEvents = incomingEvents.slice(processedEventIdx.current);
    if (!newEvents.length) return;
    let changed = false;
    let newStrokes = strokes;

    for (const ev of newEvents) {
      if (ev.type === 'stroke_point') {
        // Find or create stroke with matching id
        const existingIdx = newStrokes.findIndex((s) => s.id === ev.strokeId);
        if (existingIdx >= 0) {
          // Append points
          const updated = {
            ...newStrokes[existingIdx],
            points: [...newStrokes[existingIdx].points, ...ev.pts],
          };
          newStrokes = [
            ...newStrokes.slice(0, existingIdx),
            updated,
            ...newStrokes.slice(existingIdx + 1),
          ];
        } else {
          // New incoming stroke
          newStrokes = [
            ...newStrokes,
            {
              id: ev.strokeId,
              points: [...ev.pts],
              color: ev.color,
              width: ev.width,
              isEraser: ev.color === '__eraser__',
            },
          ];
        }
        changed = true;
      } else if (ev.type === 'canvas_clear') {
        newStrokes = [];
        changed = true;
      }
    }

    processedEventIdx.current = incomingEvents.length;
    if (changed) setStrokes(newStrokes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingEvents]);

  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr.current, dpr.current);

    ctx.fillStyle = '#FFFBF4';
    ctx.fillRect(0, 0, width, height);

    [...strokes, ...(currentStroke.current ? [currentStroke.current] : [])].forEach((s) => {
      if (!s.points.length) return;
      ctx.save();
      if (s.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = '#000';
      } else {
        ctx.strokeStyle = s.color;
      }
      ctx.lineWidth = s.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (s.points.length === 1) {
        const p = s.points[0];
        ctx.beginPath();
        ctx.arc(p.x, p.y, s.width / 2, 0, Math.PI * 2);
        if (s.isEraser) {
          ctx.fillStyle = '#000';
        } else {
          ctx.fillStyle = s.color;
        }
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        for (let i = 1; i < s.points.length - 1; i++) {
          const p = s.points[i];
          const next = s.points[i + 1];
          ctx.quadraticCurveTo(p.x, p.y, (p.x + next.x) / 2, (p.y + next.y) / 2);
        }
        const last = s.points[s.points.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
      }
      ctx.restore();
    });
  }, [width, height, strokes]);

  // Batch flusher
  function scheduleFlush() {
    if (flushTimer.current) return;
    flushTimer.current = setTimeout(() => {
      flushTimer.current = null;
      flushBatch();
    }, BATCH_MS);
  }

  function flushBatch(isLast = false) {
    const batch = pendingBatch.current;
    if (!batch || !batch.pts.length || !currentStroke.current) {
      if (isLast && pendingBatch.current) {
        pendingBatch.current = null;
      }
      return;
    }
    const ptsToSend = batch.pts;
    pendingBatch.current = { pts: [], strokeId: batch.strokeId };
    onStrokeBatch({
      pts: ptsToSend,
      color: currentStroke.current.isEraser ? '__eraser__' : currentStroke.current.color,
      width: currentStroke.current.width,
      strokeId: batch.strokeId,
      isLast,
    });
  }

  function canvasCoords(clientX: number, clientY: number) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * width,
      y: ((clientY - rect.top) / rect.height) * height,
    };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!canDraw) return;
    e.preventDefault();
    try {
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    } catch {}
    const { x, y } = canvasCoords(e.clientX, e.clientY);
    const strokeId = safeUUID();
    currentStroke.current = {
      id: strokeId,
      color,
      width: brushWidth,
      isEraser,
      points: [{ x, y }],
    };
    pendingBatch.current = { pts: [{ x, y }], strokeId };
    isDrawing.current = true;
    scheduleFlush();
    redraw();
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!canDraw) return;
    if (!isDrawing.current || !currentStroke.current || !pendingBatch.current) return;
    const { x, y } = canvasCoords(e.clientX, e.clientY);
    const pts = currentStroke.current.points;
    const last = pts[pts.length - 1];
    if (Math.hypot(x - last.x, y - last.y) < 1.5) return;
    pts.push({ x, y });
    pendingBatch.current.pts.push({ x, y });
    scheduleFlush();
    redraw();
  }

  function endStroke(e?: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current || !currentStroke.current) return;
    isDrawing.current = false;
    // Final flush with isLast=true
    flushBatch(true);
    setStrokes((prev) => [...prev, currentStroke.current!]);
    currentStroke.current = null;
    pendingBatch.current = null;
    if (e) {
      try {
        (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  }

  useImperativeHandle(ref, () => ({
    clear() {
      setStrokes([]);
      currentStroke.current = null;
      pendingBatch.current = null;
      onClear();
    },
    exportDataURL() {
      return canvasRef.current?.toDataURL('image/png') || '';
    },
  }));

  // iOS Safari touch resilience for game canvas - same protections as DrawingCanvas
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || !canDraw) return;
    function preventGesture(e: TouchEvent) {
      if (e.touches.length > 0) e.preventDefault();
    }
    el.addEventListener('touchstart', preventGesture, { passive: false });
    el.addEventListener('touchmove', preventGesture, { passive: false });
    return () => {
      el.removeEventListener('touchstart', preventGesture);
      el.removeEventListener('touchmove', preventGesture);
    };
  }, [canDraw]);

  return (
    <div
      ref={wrapperRef}
      className={`relative touch-none select-none ${className}`}
      style={{
        width,
        height,
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        overscrollBehavior: 'contain',
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endStroke(e)}
        onPointerCancel={(e) => endStroke(e)}
        className="block rounded-squircle shadow-float bg-cream-50"
        style={{
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          cursor: canDraw ? 'crosshair' : 'not-allowed',
        }}
      />
      {!canDraw && (
        <div className="absolute top-2 left-2 bg-cream-50/90 rounded-2xl px-3 py-1 shadow-float text-sm font-bold text-ink-700">
          👀 Watching
        </div>
      )}
    </div>
  );
});

export default GameCanvas;
