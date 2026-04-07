// ============================================================================
// SENDA — Confetti Burst Animation (canvas-based, zero dependencies)
// Fires a burst of colorful confetti particles from center-top of viewport.
// Usage: <ConfettiBurst active={true} onComplete={() => {}} />
// ============================================================================
import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'rect' | 'circle' | 'star';
}

const COLORS = [
  '#4c6ef5', '#7c3aed', '#f59e0b', '#10b981', '#ef4444',
  '#ec4899', '#06b6d4', '#8b5cf6', '#f97316', '#14b8a6',
];

const PARTICLE_COUNT = 120;
const GRAVITY = 0.12;
const FRICTION = 0.99;
const FADE_RATE = 0.008;
const DURATION_MS = 3000;

function createParticles(cx: number, cy: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.5;
    const speed = 4 + Math.random() * 8;
    const shapes: Particle['shape'][] = ['rect', 'circle', 'star'];
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3 - Math.random() * 4,
      w: 4 + Math.random() * 6,
      h: 3 + Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      opacity: 1,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    });
  }
  return particles;
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const method = i === 0 ? 'moveTo' : 'lineTo';
    ctx[method](x + Math.cos(a) * r, y + Math.sin(a) * r);
    const aInner = a + Math.PI / 5;
    ctx.lineTo(x + Math.cos(aInner) * r * 0.4, y + Math.sin(aInner) * r * 0.4);
  }
  ctx.closePath();
  ctx.fill();
}

interface ConfettiBurstProps {
  active: boolean;
  onComplete?: () => void;
}

export default function ConfettiBurst({ active, onComplete }: ConfettiBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const startRef = useRef(0);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const elapsed = Date.now() - startRef.current;
    if (elapsed > DURATION_MS) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onComplete?.();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const particles = particlesRef.current;
    let alive = 0;

    for (const p of particles) {
      if (p.opacity <= 0) continue;
      alive++;

      p.vy += GRAVITY;
      p.vx *= FRICTION;
      p.vy *= FRICTION;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.opacity -= FADE_RATE;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        drawStar(ctx, 0, 0, p.w / 2);
      }

      ctx.restore();
    }

    if (alive > 0) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      onComplete?.();
    }
  }, [onComplete]);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Size canvas to viewport
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Burst from top-center
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.25;

    particlesRef.current = createParticles(cx, cy);
    startRef.current = Date.now();
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, animate]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
      aria-hidden="true"
    />
  );
}
