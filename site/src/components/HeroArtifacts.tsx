import type { CSSProperties } from "react";

// Sparse scatter of small cubes that drift across the whole hero section —
// outside the main CubeField blob — so the cube field reads as bleeding into
// the surrounding copy rather than sitting in its own box. Reuses the exact
// `.cube-field-*` pulse + breathe animations so the rhythm is unified.

type Artifact = {
  left: number; // percent of hero width
  top: number; // percent of hero height
  size: number; // px
  delayA: number;
  delayB: number;
  accent: boolean;
  still: boolean;
};

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// Deterministic so SSR and client agree — no hydration drift.
function buildArtifacts(count: number): Artifact[] {
  const out: Artifact[] = [];
  for (let i = 0; i < count; i++) {
    const r1 = hash(i * 1.17 + 3.1);
    const r2 = hash(i * 2.31 + 7.7);
    const r3 = hash(i * 0.93 + 19.3);
    const r4 = hash(i * 3.57 + 41.9);
    out.push({
      left: r1 * 100,
      top: r2 * 100,
      size: 2.6 + r3 * 3.4,
      delayA: -r1 * 3.6,
      delayB: -r2 * 5.2,
      // Rare yellow flecks so the scatter feels connected to the FHE accents.
      accent: r4 > 0.9,
      // A few still cubes to keep the scatter from feeling uniformly noisy.
      still: r4 > 0.35 && r4 < 0.42,
    });
  }
  return out;
}

const ARTIFACTS = buildArtifacts(62);

export default function HeroArtifacts() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {ARTIFACTS.map((a, i) => (
        <span
          key={i}
          className={`cube-field-wrap${a.still ? " is-still" : ""}`}
          style={
            {
              left: `${a.left}%`,
              top: `${a.top}%`,
              width: `${a.size}px`,
              height: `${a.size}px`,
              animationDelay: `${a.delayA}s`,
              opacity: a.still ? 0.35 : 0.55,
            } as CSSProperties
          }
        >
          <span
            className={`cube-field-tile${a.accent ? " is-accent" : ""}${a.still ? " is-still" : ""}`}
            style={{ animationDelay: `${a.delayB}s` }}
          />
        </span>
      ))}
    </div>
  );
}
