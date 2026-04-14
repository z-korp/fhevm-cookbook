'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/* Seeded PRNG — deterministic across renders so particles don't jump on HMR. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PARTICLE_COUNT = 14;

interface Particle {
  /** Horizontal offset from beam centre (px) */
  x: number;
  /** Starting vertical position (% of beam height) */
  y: number;
  /** Dot diameter (px) */
  size: number;
  /** Total animation cycle (s) */
  duration: number;
  /** Negative delay so particles start mid-cycle (s) */
  delay: number;
  /** Horizontal drift amplitude (px) */
  drift: number;
}

export default function GlowBeam() {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<string>('100%');

  useEffect(() => {
    const update = () => {
      const beam = ref.current;
      if (!beam) return;
      const card = document.querySelector(
        '#install .bg-foreground.rounded-2xl',
      ) as HTMLElement | null;
      if (!card) return;
      const beamRect = beam.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      setHeight(`${cardRect.top - beamRect.top}px`);
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const particles = useMemo<Particle[]>(() => {
    const rng = mulberry32(42);
    return Array.from({ length: PARTICLE_COUNT }, () => ({
      x: (rng() - 0.5) * 120,
      y: rng() * 100,
      size: 1 + rng() * 1.5,
      duration: 4 + rng() * 5,
      delay: -(rng() * 8),
      drift: 6 + rng() * 18,
    }));
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="glow-beam"
      style={{ height }}
    >
      <div className="glow-beam-halo" />
      <div className="glow-beam-inner" />
      <div className="glow-beam-core" />

      {particles.map((p, i) => (
        <span
          key={i}
          className="glow-beam-particle"
          style={
            {
              '--p-x': `${p.x}px`,
              '--p-y': `${p.y}%`,
              '--p-size': `${p.size}px`,
              '--p-dur': `${p.duration}s`,
              '--p-delay': `${p.delay}s`,
              '--p-drift': `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
