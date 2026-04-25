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
// DrawingCanvas v4
// - 15 tool renderers
// - Shape tools (line/rect/circle) preview while dragging
// - Fill bucket (scanline flood fill)
// - Sticker manipulation:
//     * Tap to select (hit-test in reverse z-order)
//     * Corner handle: resize (uniform scale)
//     * Rotation handle: rotate
//     * Two-finger pinch: resize
//     * Two-finger twist: rotate
//     * Delete button in overlay
//     * Bring-forward button in overlay
// ============================================================

export interface DrawingCanvasHandle {
  exportPNG: () => Promise<Blob>;
  exportDataURL: () => Promise<string>;
  getState: () => CanvasState;
  clear: () => void;
  undo: () => void;
  placeSticker: (emojiOrKey: string, src?: string) => void;
  hasContent: () => boolean;
  deselect: () => void;
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
const HANDLE_SIZE = 18;
const STICKER_BASE_SIZE = 100;

function seededRand(x: number, y: number, salt: number) {
  const v = Math.sin(x * 12.9898 + y * 78.233 + salt * 43.7) * 43758.5453;
  return v - Math.floor(v);
}

// --- flood fill helper ---
function floodFill(
  imageData: ImageData,
  startX: number,
  startY: number,
  fillR: number,
  fillG: number,
  fillB: number,
  tolerance = 30
) {
  const { data, width, height } = imageData;
  startX = Math.floor(startX);
  startY = Math.floor(startY);
  const idx = (startY * width + startX) * 4;
  const targetR = data[idx];
  const targetG = data[idx + 1];
  const targetB = data[idx + 2];
  const targetA = data[idx + 3];

  // Don't fill if target is already close to fill color
  if (
    Math.abs(targetR - fillR) < tolerance &&
    Math.abs(targetG - fillG) < tolerance &&
    Math.abs(targetB - fillB) < tolerance
  )
    return;

  const stack: [number, number][] = [[startX, startY]];
  const visited = new Uint8Array(width * height);

  while (stack.length) {
    const [x, y] = stack.pop()!;
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const pos = y * width + x;
    if (visited[pos]) continue;
    const p = pos * 4;
    const dr = Math.abs(data[p] - targetR);
    const dg = Math.abs(data[p + 1] - targetG);
    const db = Math.abs(data[p + 2] - targetB);
    const da = Math.abs(data[p + 3] - targetA);
    if (dr > tolerance || dg > tolerance || db > tolerance || da > tolerance)
      continue;
    visited[pos] = 1;
    data[p] = fillR;
    data[p + 1] = fillG;
    data[p + 2] = fillB;
    data[p + 3] = 255;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}

function hexToRGB(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return [r, g, b];
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
  const [selectedStickerIdx, setSelectedStickerIdx] = useState<number | null>(null);
  const currentStroke = useRef<Stroke | null>(null);
  const isDrawing = useRef(false);
  const shapeStart = useRef<{ x: number; y: number } | null>(null);
  const dpr = useRef(1);
  const imgCache = useRef<Map<string, HTMLImageElement>>(new Map());

  // Touch manipulation refs
  const stickerDragState = useRef<{
    mode: 'move' | 'resize' | 'rotate' | 'pinch' | null;
    stickerIdx: number;
    startX: number;
    startY: number;
    startScale: number;
    startRotation: number;
    startStickerX: number;
    startStickerY: number;
    initialPinchDist?: number;
    initialPinchAngle?: number;
  } | null>(null);
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());

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
  }, [strokes, stickers, referencePaths, ghostPaths, traceMode, selectedStickerIdx]);

  // ============================================================
  // Stroke renderers
  // ============================================================

  function renderSmooth(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    const meta = DRAWING_TOOLS[stroke.toolId || 'marker'];
    ctx.save();
    ctx.globalAlpha = meta.opacity;
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineWidth = stroke.width * meta.widthMultiplier;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawSmoothPath(ctx, stroke);
    ctx.restore();
  }

  function drawSmoothPath(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    if (stroke.points.length === 1) {
      const p = stroke.points[0];
      ctx.beginPath();
      ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length - 1; i++) {
      const p = stroke.points[i];
      const next = stroke.points[i + 1];
      ctx.quadraticCurveTo(p.x, p.y, (p.x + next.x) / 2, (p.y + next.y) / 2);
    }
    const last = stroke.points[stroke.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }

  function renderTextured(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    const meta = DRAWING_TOOLS[stroke.toolId || 'pencil'];
    const base = stroke.width * meta.widthMultiplier;
    const isCrayon = stroke.toolId === 'crayon';
    const passes = isCrayon ? 4 : 3;
    for (let pass = 0; pass < passes; pass++) {
      ctx.save();
      ctx.globalAlpha = meta.opacity * (isCrayon ? 0.35 : 0.45);
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = base * (isCrayon ? 1 : 0.7);
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

  function renderPaint(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    // Watercolor-y: soft wide translucent pass, slight color wash
    const meta = DRAWING_TOOLS.paintbrush;
    const baseW = stroke.width * meta.widthMultiplier;
    // Pass 1: wide soft halo
    ctx.save();
    ctx.globalAlpha = meta.opacity * 0.4;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = baseW * 1.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawSmoothPath(ctx, stroke);
    ctx.restore();
    // Pass 2: core
    ctx.save();
    ctx.globalAlpha = meta.opacity * 0.8;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = baseW * 0.7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawSmoothPath(ctx, stroke);
    ctx.restore();
  }

  function renderChalk(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    const meta = DRAWING_TOOLS.chalk;
    const baseW = stroke.width * meta.widthMultiplier;
    // Chalky dust: multiple scatter dots along the stroke path
    ctx.save();
    ctx.fillStyle = stroke.color;
    stroke.points.forEach((p, i) => {
      for (let d = 0; d < 6; d++) {
        const r = seededRand(p.x, p.y, i + d) * baseW;
        const theta = seededRand(p.y, p.x, i + d + 5) * Math.PI * 2;
        const dx = Math.cos(theta) * r;
        const dy = Math.sin(theta) * r;
        const size = 0.5 + seededRand(p.x + d, p.y, i) * 2;
        ctx.globalAlpha = meta.opacity * (0.2 + seededRand(p.x, p.y + d, i) * 0.5);
        ctx.beginPath();
        ctx.arc(p.x + dx, p.y + dy, size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  function renderPen(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    renderSmooth(ctx, stroke);
  }

  function renderNeon(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    // Glow effect: wide colored halo + white core
    const meta = DRAWING_TOOLS.neon;
    const baseW = stroke.width * meta.widthMultiplier;
    // Outer glow
    ctx.save();
    ctx.shadowColor = stroke.color;
    ctx.shadowBlur = 20;
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = baseW * 1.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawSmoothPath(ctx, stroke);
    ctx.restore();
    // Bright white core
    ctx.save();
    ctx.strokeStyle = '#FFFFFF';
    ctx.globalAlpha = 0.95;
    ctx.lineWidth = Math.max(1, baseW * 0.4);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawSmoothPath(ctx, stroke);
    ctx.restore();
  }

  function renderSpray(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    const meta = DRAWING_TOOLS.spray;
    const radius = (stroke.width * meta.widthMultiplier) / 2;
    ctx.save();
    ctx.fillStyle = stroke.color;
    stroke.points.forEach((p, i) => {
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
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width * meta.widthMultiplier * 0.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawSmoothPath(ctx, stroke);
    const sparkleColors = ['#FFD166', '#FFFBF4', '#E8A5D1', '#B8D4F5', '#FFB3A7'];
    stroke.points.forEach((p, i) => {
      for (let d = 0; d < 3; d++) {
        const theta = seededRand(p.x, p.y + d, i) * Math.PI * 2;
        const r = seededRand(p.y, p.x + d, i) * stroke.width * meta.widthMultiplier * 0.8;
        const dx = Math.cos(theta) * r;
        const dy = Math.sin(theta) * r;
        const size = 0.8 + seededRand(p.x + d, p.y, i) * 2;
        ctx.globalAlpha = 0.6 + seededRand(p.x, p.y + d, i + 2) * 0.4;
        ctx.fillStyle = sparkleColors[Math.floor(seededRand(p.x, p.y, i + d) * sparkleColors.length)];
        ctx.beginPath();
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
    } else {
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++)
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function renderShape(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    // Shape strokes have exactly 2 points: start + end
    if (stroke.points.length < 2) return;
    const [a, b] = stroke.points;
    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    if (stroke.toolId === 'line') {
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    } else if (stroke.toolId === 'rectangle') {
      const x = Math.min(a.x, b.x);
      const y = Math.min(a.y, b.y);
      const w = Math.abs(b.x - a.x);
      const h = Math.abs(b.y - a.y);
      ctx.strokeRect(x, y, w, h);
    } else if (stroke.toolId === 'circle') {
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      const rx = Math.abs(b.x - a.x) / 2;
      const ry = Math.abs(b.y - a.y) / 2;
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    if (!stroke.points.length) return;
    const t = stroke.toolId || 'marker';
    const meta = DRAWING_TOOLS[t];
    switch (meta.renderMode) {
      case 'smooth': renderSmooth(ctx, stroke); break;
      case 'textured': renderTextured(ctx, stroke); break;
      case 'paint': renderPaint(ctx, stroke); break;
      case 'chalk': renderChalk(ctx, stroke); break;
      case 'pen': renderPen(ctx, stroke); break;
      case 'neon': renderNeon(ctx, stroke); break;
      case 'spray': renderSpray(ctx, stroke); break;
      case 'glitter': renderGlitter(ctx, stroke); break;
      case 'erase': renderEraser(ctx, stroke); break;
      case 'line':
      case 'rectangle':
      case 'circle':
        renderShape(ctx, stroke);
        break;
      case 'fill':
        // Fill is rendered via canvas pixel manipulation outside drawStroke
        break;
    }
  }

  // ============================================================
  // Main redraw
  // ============================================================
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

    // Paper texture
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = '#2A1B3D';
    for (let x = 0; x < width; x += 14) {
      for (let y = 0; y < height; y += 14) ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();

    // Ghost / reference paths
    if (ghostPaths.length) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = '#2A1B3D';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.lineCap = 'round';
      ghostPaths.forEach((d) => { try { ctx.stroke(new Path2D(d)); } catch {} });
      ctx.restore();
    }
    if (referencePaths.length) {
      ctx.save();
      ctx.globalAlpha = traceMode ? 0.35 : 0.22;
      ctx.strokeStyle = '#5B4A6E';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      referencePaths.forEach((d) => { try { ctx.stroke(new Path2D(d)); } catch {} });
      ctx.restore();
    }

    // Strokes (including fill, which stores its color + start point; applied separately below)
    strokes.forEach((s) => {
      if (s.toolId === 'fill' && s.points.length) {
        // Apply flood fill in-place using imageData
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const [r, g, b] = hexToRGB(s.color);
        floodFill(
          imgData,
          s.points[0].x * dpr.current,
          s.points[0].y * dpr.current,
          r,
          g,
          b
        );
        ctx.putImageData(imgData, 0, 0);
      } else {
        drawStroke(ctx, s);
      }
    });
    if (currentStroke.current) drawStroke(ctx, currentStroke.current);

    // Stickers
    stickers.forEach((s, i) => {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate((s.rotation * Math.PI) / 180);
      ctx.scale(s.scale, s.scale);

      if (s.src) {
        let img = imgCache.current.get(s.src);
        if (!img) {
          img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => setStickers((prev) => [...prev]);
          img.src = s.src;
          imgCache.current.set(s.src, img);
        }
        if (img.complete && img.naturalWidth) {
          const maxDim = STICKER_BASE_SIZE;
          const ratio = img.naturalWidth / img.naturalHeight;
          const w = ratio >= 1 ? maxDim : maxDim * ratio;
          const h = ratio >= 1 ? maxDim / ratio : maxDim;
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
        }
      } else {
        ctx.font = '64px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.key, 0, 0);
      }
      ctx.restore();

      // Selection UI for selected sticker
      if (i === selectedStickerIdx) {
        const halfSize = (STICKER_BASE_SIZE / 2) * s.scale;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate((s.rotation * Math.PI) / 180);
        // Dashed selection box
        ctx.strokeStyle = '#FF6B5B';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(-halfSize, -halfSize, halfSize * 2, halfSize * 2);
        ctx.setLineDash([]);
        // Corner resize handle (bottom-right)
        ctx.fillStyle = '#FF6B5B';
        ctx.beginPath();
        ctx.arc(halfSize, halfSize, HANDLE_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Rotation handle (top-center, extended)
        ctx.beginPath();
        ctx.moveTo(0, -halfSize);
        ctx.lineTo(0, -halfSize - 28);
        ctx.strokeStyle = '#FF6B5B';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#8FB8E8';
        ctx.beginPath();
        ctx.arc(0, -halfSize - 28, HANDLE_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, strokes, stickers, referencePaths, ghostPaths, traceMode, selectedStickerIdx]);

  // ============================================================
  // Pointer event handling
  // ============================================================
  function canvasCoords(clientX: number, clientY: number) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * width,
      y: ((clientY - rect.top) / rect.height) * height,
    };
  }

  // Hit-test sticker, returns the highest (topmost) sticker index under point
  function stickerAt(x: number, y: number): number | null {
    for (let i = stickers.length - 1; i >= 0; i--) {
      const s = stickers[i];
      const half = (STICKER_BASE_SIZE / 2) * s.scale;
      // Rotate point into sticker's local space
      const dx = x - s.x;
      const dy = y - s.y;
      const rad = (-s.rotation * Math.PI) / 180;
      const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
      const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
      if (Math.abs(lx) <= half && Math.abs(ly) <= half) return i;
    }
    return null;
  }

  // Detect if a point hits a selected sticker's handle
  function handleHitTest(
    x: number,
    y: number
  ): 'resize' | 'rotate' | null {
    if (selectedStickerIdx === null) return null;
    const s = stickers[selectedStickerIdx];
    if (!s) return null;
    const half = (STICKER_BASE_SIZE / 2) * s.scale;
    const dx = x - s.x;
    const dy = y - s.y;
    const rad = (-s.rotation * Math.PI) / 180;
    const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
    // Corner resize handle at (half, half)
    if (
      Math.hypot(lx - half, ly - half) < HANDLE_SIZE
    )
      return 'resize';
    // Rotation handle at (0, -half - 28)
    if (Math.hypot(lx, ly - (-half - 28)) < HANDLE_SIZE) return 'rotate';
    return null;
  }

  // ============================================================
  // iOS Safari pointer resilience
  // ============================================================
  // Problem: on iOS Safari, the canvas can lose pointer capture mid-stroke
  // (browser gesture detection, edge swipe, etc), causing strokes to "break"
  // and visually skip. We protect against this by:
  //   1. Adding pointermove/up/cancel listeners on `window` while a stroke
  //      is active. Even if Safari steals capture from the canvas, window
  //      events keep firing.
  //   2. Using getCoalescedEvents() to recover sub-frame points that would
  //      otherwise be dropped between rAF ticks.
  //   3. Preventing default on touchstart at the wrapper to disable Safari's
  //      edge-swipe-back and pull-to-refresh.

  // Process a single pointer event into stroke points (called from both
  // React handler and window listener)
  const processPointerMove = useCallback(
    (e: PointerEvent | React.PointerEvent) => {
      const { x, y } = canvasCoords(e.clientX, e.clientY);
      activePointers.current.set(e.pointerId, { x, y });

      const state = stickerDragState.current;
      if (state) {
        // (sticker logic continues to live in the React handler — stickers
        //  don't suffer the iOS break bug because they don't need sub-frame
        //  precision and the React handler is sufficient there)
        return false; // not a drawing event
      }

      if (!isDrawing.current || !currentStroke.current) return false;

      // Shape tools: just update second point
      if (DRAWING_TOOLS[currentStroke.current.toolId || 'marker'].isShape) {
        currentStroke.current.points[1] = { x, y };
        redraw();
        return true;
      }

      // ===== STROKE TOOLS WITH COALESCED EVENT RECOVERY =====
      // iOS may fire one pointermove that covers 4-8 actual touch points.
      // getCoalescedEvents returns each underlying point so the line is smooth.
      const native = (e as any).nativeEvent || e;
      let points: Array<{ x: number; y: number; pressure: number }> = [];
      if (typeof (native as any).getCoalescedEvents === 'function') {
        try {
          const sub = (native as any).getCoalescedEvents();
          if (sub && sub.length > 1) {
            for (const sevt of sub) {
              const sc = canvasCoords(sevt.clientX, sevt.clientY);
              points.push({ x: sc.x, y: sc.y, pressure: sevt.pressure || 0.5 });
            }
          }
        } catch {}
      }
      if (points.length === 0) {
        points = [{ x, y, pressure: (e as any).pressure || 0.5 }];
      }

      const pts = currentStroke.current.points;
      const threshold = tool === 'spray' ? 2.5 : 1.2;
      let added = 0;
      for (const p of points) {
        const last = pts[pts.length - 1];
        if (Math.hypot(p.x - last.x, p.y - last.y) < threshold) continue;
        pts.push(p);
        added++;
      }
      if (added > 0) redraw();
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tool]
  );

  // Window-level handlers attached during active strokes. They survive
  // even if Safari yanks pointer capture from the canvas.
  useEffect(() => {
    function onWinMove(e: PointerEvent) {
      // Only process if this pointerId is one we started tracking
      if (!activePointers.current.has(e.pointerId)) return;
      // Sticker drags continue to be handled by the React handler (it's
      // already attached to a child element so it won't lose capture for
      // simple drag operations)
      if (stickerDragState.current) return;
      if (!isDrawing.current || !currentStroke.current) return;
      processPointerMove(e);
    }
    function onWinUp(e: PointerEvent) {
      if (!activePointers.current.has(e.pointerId)) return;
      activePointers.current.delete(e.pointerId);
      if (!isDrawing.current || !currentStroke.current) return;
      // Finalize stroke
      isDrawing.current = false;
      const finished = currentStroke.current;
      currentStroke.current = null;
      shapeStart.current = null;
      setStrokes((prev) => {
        const next = [...prev, finished];
        return next.length > UNDO_CAP ? next.slice(-UNDO_CAP) : next;
      });
      onStroke?.();
    }
    function onWinCancel(e: PointerEvent) {
      // Important: on iOS Safari, pointercancel fires when the OS thinks the
      // touch became a system gesture. We do NOT want to end the stroke here
      // — instead we just ignore it and rely on pointerup to end normally.
      // If the user really did lift their finger, pointerup fires too.
      // But we DO need to remove the pointer from the active set if it
      // was a stray touch (e.g. palm rest).
      if (e.pointerType === 'touch' && activePointers.current.size > 1) {
        activePointers.current.delete(e.pointerId);
      }
    }
    window.addEventListener('pointermove', onWinMove, { passive: false });
    window.addEventListener('pointerup', onWinUp);
    window.addEventListener('pointercancel', onWinCancel);
    return () => {
      window.removeEventListener('pointermove', onWinMove);
      window.removeEventListener('pointerup', onWinUp);
      window.removeEventListener('pointercancel', onWinCancel);
    };
  }, [processPointerMove, onStroke]);

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const { x, y } = canvasCoords(e.clientX, e.clientY);
    activePointers.current.set(e.pointerId, { x, y });

    // Two-finger gesture → start pinch on selected sticker
    if (activePointers.current.size === 2 && selectedStickerIdx !== null) {
      const [p1, p2] = Array.from(activePointers.current.values());
      const s = stickers[selectedStickerIdx];
      if (s) {
        stickerDragState.current = {
          mode: 'pinch',
          stickerIdx: selectedStickerIdx,
          startX: x,
          startY: y,
          startScale: s.scale,
          startRotation: s.rotation,
          startStickerX: s.x,
          startStickerY: s.y,
          initialPinchDist: Math.hypot(p2.x - p1.x, p2.y - p1.y),
          initialPinchAngle: Math.atan2(p2.y - p1.y, p2.x - p1.x),
        };
      }
      return;
    }

    try { (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId); } catch {}

    // Step 1: if a sticker is already selected, check if we hit its handles first
    const handle = handleHitTest(x, y);
    if (handle && selectedStickerIdx !== null) {
      const s = stickers[selectedStickerIdx];
      stickerDragState.current = {
        mode: handle,
        stickerIdx: selectedStickerIdx,
        startX: x,
        startY: y,
        startScale: s.scale,
        startRotation: s.rotation,
        startStickerX: s.x,
        startStickerY: s.y,
      };
      return;
    }

    // Step 2: check if we hit a sticker
    const hitIdx = stickerAt(x, y);
    if (hitIdx !== null) {
      setSelectedStickerIdx(hitIdx);
      const s = stickers[hitIdx];
      stickerDragState.current = {
        mode: 'move',
        stickerIdx: hitIdx,
        startX: x,
        startY: y,
        startScale: s.scale,
        startRotation: s.rotation,
        startStickerX: s.x,
        startStickerY: s.y,
      };
      return;
    }

    // Step 3: no sticker hit → deselect and start drawing
    if (selectedStickerIdx !== null) setSelectedStickerIdx(null);

    // ===== FILL BUCKET =====
    if (tool === 'fill') {
      setStrokes((prev) => [
        ...prev,
        {
          color,
          width: 0,
          toolId: 'fill',
          points: [{ x, y }],
        },
      ]);
      onStroke?.();
      return;
    }

    // ===== SHAPE TOOLS =====
    if (DRAWING_TOOLS[tool].isShape) {
      shapeStart.current = { x, y };
      currentStroke.current = {
        color,
        width: brushWidth,
        toolId: tool,
        points: [{ x, y }, { x, y }],
      };
      isDrawing.current = true;
      redraw();
      return;
    }

    // ===== NORMAL STROKE TOOLS =====
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
    const { x, y } = canvasCoords(e.clientX, e.clientY);
    activePointers.current.set(e.pointerId, { x, y });

    const state = stickerDragState.current;
    if (state) {
      const s = stickers[state.stickerIdx];
      if (!s) return;
      if (state.mode === 'move') {
        const dx = x - state.startX;
        const dy = y - state.startY;
        setStickers((prev) =>
          prev.map((st, i) =>
            i === state.stickerIdx
              ? { ...st, x: state.startStickerX + dx, y: state.startStickerY + dy }
              : st
          )
        );
      } else if (state.mode === 'resize') {
        const dist = Math.hypot(x - state.startStickerX, y - state.startStickerY);
        const startDist = Math.hypot(
          state.startX - state.startStickerX,
          state.startY - state.startStickerY
        );
        const ratio = startDist === 0 ? 1 : dist / startDist;
        const newScale = Math.max(0.3, Math.min(5, state.startScale * ratio));
        setStickers((prev) =>
          prev.map((st, i) =>
            i === state.stickerIdx ? { ...st, scale: newScale } : st
          )
        );
      } else if (state.mode === 'rotate') {
        const angle = Math.atan2(y - state.startStickerY, x - state.startStickerX);
        const startAngle = Math.atan2(
          state.startY - state.startStickerY,
          state.startX - state.startStickerX
        );
        const deg = ((angle - startAngle) * 180) / Math.PI;
        setStickers((prev) =>
          prev.map((st, i) =>
            i === state.stickerIdx
              ? { ...st, rotation: state.startRotation + deg }
              : st
          )
        );
      } else if (state.mode === 'pinch' && activePointers.current.size === 2) {
        const [p1, p2] = Array.from(activePointers.current.values());
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const ratio = dist / (state.initialPinchDist || 1);
        const deltaAngle = ((angle - (state.initialPinchAngle || 0)) * 180) / Math.PI;
        setStickers((prev) =>
          prev.map((st, i) =>
            i === state.stickerIdx
              ? {
                  ...st,
                  scale: Math.max(0.3, Math.min(5, state.startScale * ratio)),
                  rotation: state.startRotation + deltaAngle,
                }
              : st
          )
        );
      }
      return;
    }

    // For drawing strokes, delegate to processPointerMove which handles
    // coalesced events for iOS Safari resilience.
    processPointerMove(e);
  }

  function endStroke(e?: React.PointerEvent<HTMLCanvasElement>) {
    if (e) activePointers.current.delete(e.pointerId);

    // End sticker drag (stickers stay on React handler — no iOS issues there)
    if (stickerDragState.current) {
      if (
        stickerDragState.current.mode === 'pinch' &&
        activePointers.current.size >= 2
      ) {
        return;
      }
      stickerDragState.current = null;
      if (e) {
        try { (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId); } catch {}
      }
      return;
    }

    // Drawing strokes are ended by the window-level pointerup handler.
    // This React handler is just a fallback for non-touch cases.
    if (!isDrawing.current || !currentStroke.current) return;
    isDrawing.current = false;
    const finished = currentStroke.current;
    currentStroke.current = null;
    shapeStart.current = null;
    setStrokes((prev) => {
      const next = [...prev, finished];
      return next.length > UNDO_CAP ? next.slice(-UNDO_CAP) : next;
    });
    onStroke?.();
    if (e) {
      try { (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId); } catch {}
    }
  }

  // ============================================================
  // Imperative API
  // ============================================================
  useImperativeHandle(ref, () => ({
    async exportPNG() {
      // Gap 15: render to a scratch canvas without selection UI.
      // The on-screen canvas keeps its selection state visible to the user
      // throughout; the export is a separate buffer that never shows handles.
      const canvas = canvasRef.current!;
      const scratch = document.createElement('canvas');
      scratch.width = canvas.width;
      scratch.height = canvas.height;
      const ctx = scratch.getContext('2d')!;
      ctx.drawImage(canvas, 0, 0);

      // If selection is currently shown, the main canvas DID render handles.
      // Re-render from scratch without selection.
      if (selectedStickerIdx !== null) {
        // Temporarily deselect for one redraw, capture, restore.
        const prev = selectedStickerIdx;
        setSelectedStickerIdx(null);
        // Wait two frames to be safe that React+canvas have redrawn
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        ctx.clearRect(0, 0, scratch.width, scratch.height);
        ctx.drawImage(canvas, 0, 0);
        setSelectedStickerIdx(prev);
      }

      return await new Promise<Blob>((resolve, reject) => {
        scratch.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('No blob'))),
          'image/png'
        );
      });
    },
    async exportDataURL() {
      const canvas = canvasRef.current!;
      return canvas.toDataURL('image/png');
    },
    getState() { return { strokes, stickers }; },
    clear() { setStrokes([]); setStickers([]); setSelectedStickerIdx(null); },
    undo() { setStrokes((p) => p.slice(0, -1)); },
    placeSticker(emojiOrKey, src) {
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
      // Auto-select the new sticker so kid sees handles immediately
      setSelectedStickerIdx(stickers.length);
    },
    hasContent() { return strokes.length > 0 || stickers.length > 0; },
    deselect() { setSelectedStickerIdx(null); },
  }));

  // Delete selected sticker button
  function deleteSelected() {
    if (selectedStickerIdx === null) return;
    setStickers((prev) => prev.filter((_, i) => i !== selectedStickerIdx));
    setSelectedStickerIdx(null);
  }

  function bringForward() {
    if (selectedStickerIdx === null) return;
    setStickers((prev) => {
      if (selectedStickerIdx >= prev.length - 1) return prev;
      const next = [...prev];
      const tmp = next[selectedStickerIdx];
      next[selectedStickerIdx] = next[selectedStickerIdx + 1];
      next[selectedStickerIdx + 1] = tmp;
      return next;
    });
    setSelectedStickerIdx((i) => (i === null ? null : i + 1));
  }

  // iOS Safari: prevent native gestures (swipe-back, pull-to-refresh, double-tap-zoom)
  // by attaching a non-passive touchstart listener on the wrapper. React's
  // synthetic events default to passive: true on touch events, so we use a ref
  // and addEventListener directly.
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    function preventGesture(e: TouchEvent) {
      // Only prevent on touches that start INSIDE the canvas wrapper.
      // We don't want to break scrolling outside the canvas.
      if (e.touches.length > 0) {
        e.preventDefault();
      }
    }
    el.addEventListener('touchstart', preventGesture, { passive: false });
    el.addEventListener('touchmove', preventGesture, { passive: false });
    return () => {
      el.removeEventListener('touchstart', preventGesture);
      el.removeEventListener('touchmove', preventGesture);
    };
  }, []);

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
        }}
      />
      {/* Sticker action buttons (appear when sticker is selected) */}
      {selectedStickerIdx !== null && (
        <div className="absolute top-2 left-2 flex gap-2 z-10">
          <button
            onClick={deleteSelected}
            className="w-10 h-10 rounded-full bg-coral-500 text-white font-bold shadow-chunky hover:bg-coral-400 active:translate-y-1 transition-all"
            aria-label="Delete sticker"
          >
            🗑
          </button>
          <button
            onClick={bringForward}
            className="w-10 h-10 rounded-full bg-sparkle-400 text-ink-900 font-bold shadow-chunky hover:bg-sparkle-300 active:translate-y-1 transition-all"
            aria-label="Bring forward"
          >
            ⬆
          </button>
          <button
            onClick={() => setSelectedStickerIdx(null)}
            className="w-10 h-10 rounded-full bg-cream-100 text-ink-900 font-bold shadow-chunky hover:bg-cream-200 active:translate-y-1 transition-all"
            aria-label="Deselect"
          >
            ✓
          </button>
        </div>
      )}
    </div>
  );
});

export default DrawingCanvas;
