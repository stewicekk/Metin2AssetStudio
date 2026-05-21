import { useEffect, useRef } from 'react';

interface MinimapDot {
  px: number;
  py: number;
  pz: number;
  name: string;
  color?: string;
}

interface MinimapCamera {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
}

const SIZE = 120;
const HALF = SIZE / 2;
const WORLD_SIZE = 10;
const SCALE = HALF / WORLD_SIZE;

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  if (!hex || hex === 'none') return { r: 128, g: 128, b: 128 };
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function Minimap({
  emitters,
  camera,
}: {
  emitters: MinimapDot[];
  camera?: MinimapCamera;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, SIZE, SIZE);

    // Background
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Grid
    ctx.strokeStyle = 'rgba(60,80,100,0.25)';
    ctx.lineWidth = 0.5;
    for (let i = -WORLD_SIZE; i <= WORLD_SIZE; i++) {
      const x = HALF + i * SCALE;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, SIZE);
      ctx.stroke();
      const y = HALF + i * SCALE;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(SIZE, y);
      ctx.stroke();
    }

    // Origin crosshair
    ctx.strokeStyle = 'rgba(200,155,60,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(HALF - 6, HALF);
    ctx.lineTo(HALF + 6, HALF);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(HALF, HALF - 6);
    ctx.lineTo(HALF, HALF + 6);
    ctx.stroke();

    // Origin dot
    ctx.fillStyle = '#c89b3c';
    ctx.beginPath();
    ctx.arc(HALF, HALF, 2, 0, Math.PI * 2);
    ctx.fill();

    // Emitter dots
    for (const e of emitters) {
      const x = HALF + e.px * SCALE;
      const y = HALF - e.pz * SCALE;
      if (x < 0 || x > SIZE || y < 0 || y > SIZE) continue;

      const c = e.color ? parseHexColor(e.color) : { r: 200, g: 155, b: 60 };
      ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},0.85)`;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},0.4)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Camera triangle
    if (camera) {
      const cx = HALF + camera.position.x * SCALE;
      const cy = HALF - camera.position.z * SCALE;

      const tx = HALF + camera.target.x * SCALE;
      const ty = HALF - camera.target.z * SCALE;

      if (cx >= 0 && cx <= SIZE && cy >= 0 && cy <= SIZE) {
        const angle = Math.atan2(ty - cy, tx - cx);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.fillStyle = 'rgba(200,220,255,0.7)';
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-4, -4);
        ctx.lineTo(-4, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
  }, [emitters, camera]);

  return (
    <div className="minimap-wrap">
      <canvas ref={canvasRef} style={{ width: SIZE, height: SIZE }} />
    </div>
  );
}
