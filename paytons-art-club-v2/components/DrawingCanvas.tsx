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
import { DRAWING_TOOLS, type DrawingToolId } from '@/lib/drawingTools';

// ============================================================
// DrawingCanvas v2 — multi-tool engine
// Each stroke carries a `toolId` so on redraw each stroke uses
// its own renderer. Tools: marker, pencil, crayon, highlighter,
// spray, glitter, eraser.
// ============================================================

export interface DrawingCanvasHandle {
  exportPNG: () => Promise<Blob>;
  exportDataURL: () => Promise<string>;
  getState: () => CanvasState;
  clear: () => void;
  undo: () => void;
  placeSticker: (emojiOrKey: string, src?: string) => void;
  hasContent: () => boolean;
}

interface Props {
  width?: number;
  height?: number;
  color: string;
  brushWidth: number;
  tool?: DrawingToolId;
  referencePaths?: string[];
  ghostPaths?: string[];
  traceMode?: boolean;
  onStroke?: () => void;
  className?: string;
}

const UNDO_CAP = 100;

// Deterministic pseudo-random based on (x, y) so textured strokes don't
// shimmer on redraw.
function seededRand(x: number, y: number, salt: number) {
  const v = Math.sin(x * 12.9898 + y * 78.233 + salt * 43.7) * 43758.5453;
  return v - Math.floor(v);
}

const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(function DrawingCanvas(
  {
    width = 800,
    height = 600,
    color,
    brushWidth,
    tool = 'marker',
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
  // Cache loaded sticker images so we don't reload on every redraw
  const imgCache = useRef<Map<string, HTMLImageElement>>(new Map());

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

  // --------------------------------------------------------------
  // Stroke renderers — one per tool
  // --------------------------------------------------------------

  function renderSmooth(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    const meta = DRAWING_TOOLS[stroke.toolId || 'marker'];
    ctx.save();
    ctx.globalAlpha = meta.opacity;
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineWidth = stroke.width * meta.widthMultiplier;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.points.length === 1) {
      const p = stroke.points[0];
      ctx.beginPath();
      ctx.arc(p.x, p.y, (stroke.width * meta.widthMultiplier) / 2, 0, Math.PI * 2);
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

  function renderTextured(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    // Pencil/crayon: multiple slightly-offset strokes with reduced alpha.
    const meta = DRAWING_TOOLS[stroke.toolId || 'pencil'];
    const baseWidth = stroke.width * meta.widthMultiplier;
    const isCrayon = stroke.toolId === 'crayon';
    const passes = isCrayon ? 4 : 3;

    for (let pass = 0; pass < passes; pass++) {
      ctx.save();
      ctx.globalAlpha = meta.opacity * (isCrayon ? 0.35 : 0.45);
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = baseWidth * (isCrayon ? 1 : 0.7);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      stroke.points.forEach((p, i) => {
        const jitter = isCrayon ? 1.2 : 0.5;
        const jx = (seededRand(p.x, p.y, pass) - 0.5) * jitter;
        const jy = (seededRand(p.y, p.x, pass + 7) - 0.5) * jitter;
        if (i === 0) ctx.moveTo(p.x + jx, p.y + jy);
        else ctx.lineTo(p.x + jx, p.y + jy);
      });
      ctx.stroke();
      ctx.restore();
    }
  }

  function renderSpray(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    const meta = DRAWING_TOOLS.spray;
    const radius = (stroke.width * meta.widthMultiplier) / 2;
    ctx.save();
    ctx.globalAlpha = meta.opacity;
    ctx.fillStyle = stroke.color;

    stroke.points.forEach((p, i) => {
      // 18 dots around each stroke point
      for (let d = 0; d < 18; d++) {
        const r = Math.sqrt(seededRand(p.x + d, p.y, i)) * radius;
        const theta = seededRand(p.y + d, p.x, i + 11) * Math.PI * 2;
        const dx = Math.cos(theta) * r;
        const dy = Math.sin(theta) * r;
        const size = 0.8 + seededRand(p.x + d, p.y + d, i + 3) * 1.5;
        ctx.globalAlpha = meta.opacity * (0.3 + seededRand(p.x, p.y + d, i) * 0.5);
        ctx.beginPath();
        ctx.arc(p.x + dx, p.y + dy, size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  function renderGlitter(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    const meta = DRAWING_TOOLS.glitter;
    ctx.save();
    // First pass: a soft base line in the user's color
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width * meta.widthMultiplier * 0.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    stroke.points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Sparkle dots in pastel rainbow along the path
    const sparkleColors = ['#FFD166', '#FFFBF4', '#E8A5D1', '#B8D4F5', '#FFB3A7'];
    stroke.points.forEach((p, i) => {
      for (let d = 0; d < 3; d++) {
        const theta = seededRand(p.x, p.y + d, i) * Math.PI * 2;
        const r = seededRand(p.y, p.x + d, i) * stroke.width * meta.widthMultiplier * 0.8;
        const dx = Math.cos(theta) * r;
        const dy = Math.sin(theta) * r;
        const size = 0.8 + seededRand(p.x + d, p.y, i) * 2;
        ctx.globalAlpha = 0.6 + seededRand(p.x, p.y + d, i + 2) * 0.4;
        const c = sparkleColors[Math.floor(seededRand(p.x, p.y, i + d) * sparkleColors.length)];
        ctx.fillStyle = c;
        ctx.beginPath();
        // Draw a tiny 4-point star
        ctx.moveTo(p.x + dx, p.y + dy - size);
        ctx.lineTo(p.x + dx + size * 0.3, p.y + dy - size * 0.3);
        ctx.lineTo(p.x + dx + size, p.y + dy);
        ctx.lineTo(p.x + dx + size * 0.3, p.y + dy + size * 0.3);
        ctx.lineTo(p.x + dx, p.y + dy + size);
        ctx.lineTo(p.x + dx - size * 0.3, p.y + dy + size * 0.3);
        ctx.lineTo(p.x + dx - size, p.y + dy);
        ctx.lineTo(p.x + dx - size * 0.3, p.y + dy - size * 0.3);
        ctx.closePath();
        ctx.fill();
      }
    });
    ctx.restore();
  }

  function renderEraser(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    const meta = DRAWING_TOOLS.eraser;
    ctx.save();
    // destination-out removes pixels where we draw
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#000';
    ctx.lineWidth = stroke.width * meta.widthMultiplier;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.points.length === 1) {
      const p = stroke.points[0];
      ctx.beginPath();
      ctx.arc(p.x, p.y, (stroke.width * meta.widthMultiplier) / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    if (!stroke.points.length) return;
    const t = stroke.toolId || 'marker';
    const meta = DRAWING_TOOLS[t];
    switch (meta.renderMode) {
      case 'smooth':
        renderSmooth(ctx, stroke);
        break;
      case 'textured':
        renderTextured(ctx, stroke);
        break;
      case 'spray':
        renderSpray(ctx, stroke);
        break;
      case 'glitter':
        renderGlitter(ctx, stroke);
        break;
      case 'erase':
        renderEraser(ctx, stroke);
        break;
    }
  }

  // --------------------------------------------------------------
  // Main redraw
  // --------------------------------------------------------------
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr.current, dpr.current);

    // Paper
    ctx.fillStyle = '#FFFBF4';
    ctx.fillRect(0, 0, width, height);

    // Paper texture
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = '#2A1B3D';
    for (let x = 0; x < width; x += 14) {
      for (let y = 0; y < height; y += 14) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.restore();

    // Ghost paths
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
        } catch {}
      });
      ctx.restore();
    }

    // Reference paths
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
        } catch {}
      });
      ctx.restore();
    }

    // Strokes
    strokes.forEach((s) => drawStroke(ctx, s));
    if (currentStroke.current) drawStroke(ctx, currentStroke.current);

    // Stickers
    stickers.forEach((s) => {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate((s.rotation * Math.PI) / 180);
      ctx.scale(s.scale, s.scale);

      if (s.src) {
        // Image sticker (uploaded or SVG from url)
        let img = imgCache.current.get(s.src);
        if (!img) {
          img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            // Trigger redraw once loaded
            setStickers((prev) => [...prev]);
          };
          img.src = s.src;
          imgCache.current.set(s.src, img);
        }
        if (img.complete && img.naturalWidth) {
          const maxDim = 100;
          const ratio = img.naturalWidth / img.naturalHeight;
          const w = ratio >= 1 ? maxDim : maxDim * ratio;
          const h = ratio >= 1 ? maxDim / ratio : maxDim;
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
        }
      } else {
        // Emoji sticker
        ctx.font =
          '64px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.key, 0, 0);
      }
      ctx.restore();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, strokes, stickers, referencePaths, ghostPaths, traceMode]);

  // --------------------------------------------------------------
  // Pointer
  // --------------------------------------------------------------
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
    } catch {}
    const { x, y } = canvasCoords(e.clientX, e.clientY);
    currentStroke.current = {
      color,
      width: brushWidth,
      toolId: tool,
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
    // Spray tool gets lots of samples even close together
    const threshold = tool === 'spray' ? 2.5 : 1.2;
    if (Math.hypot(x - last.x, y - last.y) < threshold) return;
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
      return canvasRef.current!.toDataURL('image/png');
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
    placeSticker(emojiOrKey: string, src?: string) {
      const offsetX = (Math.random() - 0.5) * 200;
      const offsetY = (Math.random() - 0.5) * 200;
      setStickers((prev) => [
        ...prev,
        {
          key: emojiOrKey,
          src,
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
        className="block rounded-squircle shadow-float bg-cream-50"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
});

export default DrawingCanvas;
