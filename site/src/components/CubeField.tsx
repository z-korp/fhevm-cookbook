"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

const COLS = 44;
const ROWS = 58;
const CELL = 10;

// ---------------------------------------------------------------------------
// FHE glyph pattern (8×13 per letter, 2-cell thick strokes, 2-cell gap).
// 1 = cube is part of a letter stroke, 0 = negative space.
// ---------------------------------------------------------------------------
const GLYPH_W = 8;
const GLYPH_H = 13;
const GLYPH_GAP = 2;

const FHE_GLYPHS: ReadonlyArray<ReadonlyArray<string>> = [
  // F
  [
    "11111111",
    "11111111",
    "11000000",
    "11000000",
    "11000000",
    "11000000",
    "11111100",
    "11111100",
    "11000000",
    "11000000",
    "11000000",
    "11000000",
    "11000000",
  ],
  // H
  [
    "11000011",
    "11000011",
    "11000011",
    "11000011",
    "11000011",
    "11000011",
    "11111111",
    "11111111",
    "11000011",
    "11000011",
    "11000011",
    "11000011",
    "11000011",
  ],
  // E
  [
    "11111111",
    "11111111",
    "11000000",
    "11000000",
    "11000000",
    "11000000",
    "11111100",
    "11111100",
    "11000000",
    "11000000",
    "11000000",
    "11111111",
    "11111111",
  ],
];

const FHE_TOTAL_W = GLYPH_W * 3 + GLYPH_GAP * 2;
const FHE_START_X = Math.floor((COLS - FHE_TOTAL_W) / 2);
const FHE_START_Y = Math.floor((ROWS - GLYPH_H) / 2);

function isFheCell(x: number, y: number): boolean {
  const ly = y - FHE_START_Y;
  if (ly < 0 || ly >= GLYPH_H) return false;
  const lx = x - FHE_START_X;
  if (lx < 0 || lx >= FHE_TOTAL_W) return false;

  const step = GLYPH_W + GLYPH_GAP;
  const letterIdx = Math.floor(lx / step);
  if (letterIdx < 0 || letterIdx > 2) return false;

  const xInLetter = lx - letterIdx * step;
  if (xInLetter >= GLYPH_W) return false; // inside an inter-letter gap

  return FHE_GLYPHS[letterIdx][ly][xInLetter] === "1";
}

type Cube = {
  x: number;
  y: number;
  size: number;
  delayA: number; // drives the radial pulse (scale)
  delayB: number; // drives the diagonal breath (opacity)
  accent: boolean;
  still: boolean; // a few cubes stay quiet to anchor the field
  fhe: boolean; // FHE glyph cells — revealed on hover only
  revealDelay: number; // per-cell stagger for the hover reveal (s)
};

function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function buildCubes(): Cube[] {
  const cubes: Cube[] = [];
  const cx = (COLS - 1) / 2;
  const cy = (ROWS - 1) / 2;

  // Blob silhouette: cubes live inside an irregular radius whose boundary is
  // pushed in/out by noise, so the outer edge reads as organic — not a grid
  // masked to an ellipse. Aspect scaling matches the 44×58 rectangle.
  const baseRadius = Math.min(COLS, ROWS) * 0.48;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const dx = x - cx;
      const dy = y - cy;
      // Weighted distance so the blob is slightly taller than it is wide,
      // matching the field's aspect ratio without flattening into an ellipse.
      const ellDist = Math.hypot(dx * 1.22, dy * 0.92);
      const noise = hash(x, y);
      const edgeNoise = hash(x * 2.7 + 13, y * 1.9 + 7);

      const fhe = isFheCell(x, y);

      // Irregular boundary — bumped in/out per-cell for a ragged perimeter.
      const boundary = baseRadius + (edgeNoise - 0.5) * 8;
      const insideBlob = ellDist < boundary;

      // Scattered fragment cubes outside the main blob — they keep the same
      // pulse/breathe rhythm so they read as detached pieces, not debris.
      let fragment = false;
      if (!fhe && !insideBlob) {
        const falloff = Math.max(0, 1 - (ellDist - boundary) / 10);
        if (falloff > 0 && noise > 1 - 0.22 * falloff) {
          fragment = true;
        } else {
          continue;
        }
      }

      // Radial outgoing wave. Negative delay so every cube is already mid-cycle
      // on first paint — no ugly cold-start flash. FHE cubes use the same
      // natural phase as their neighbours so they're indistinguishable from
      // the surrounding pattern when not hovered.
      const delayA = -(ellDist * 0.14 + noise * 0.35);
      // Diagonal sweep, slower and out of phase with the pulse.
      const delayB = -((x + y) * 0.07 + noise * 0.25);

      // FHE cubes get no default color or size boost — they blend in until
      // hover triggers the reveal. Background sparkle + fragment accents are
      // kept as before.
      const accent = (!fhe && noise > 0.965) || (fragment && noise > 0.75);
      const still = !fhe && !fragment && noise > 0.4 && noise < 0.47;
      const size = fragment ? 3.4 + noise * 2.2 : 5 + noise * 2;

      // Left-to-right wipe when the reveal triggers — delay grows with the
      // cube's column across the FHE glyph band. Non-FHE cubes get 0.
      const revealDelay = fhe ? (x - FHE_START_X) * 0.018 : 0;

      cubes.push({ x, y, size, delayA, delayB, accent, still, fhe, revealDelay });
    }
  }
  return cubes;
}

export default function CubeField() {
  const cubes = useMemo(() => buildCubes(), []);
  const [revealed, setRevealed] = useState(false);
  const width = COLS * CELL;
  const height = ROWS * CELL;

  return (
    <div
      className={`cube-field-scene${revealed ? " is-revealed" : ""}`}
      role="img"
      aria-label="Animated field of encrypted data — hover to reveal FHE"
      onMouseEnter={() => setRevealed(true)}
      onMouseLeave={() => setRevealed(false)}
      style={
        {
          width,
          height,
          "--cell": `${CELL}px`,
        } as CSSProperties
      }
    >
      {cubes.map((c, i) => {
        const left = c.x * CELL + (CELL - c.size) / 2;
        const top = c.y * CELL + (CELL - c.size) / 2;
        const wrapClass = `cube-field-wrap${c.still ? " is-still" : ""}${c.fhe ? " is-fhe" : ""}`;
        const tileClass = `cube-field-tile${c.accent ? " is-accent" : ""}${c.still ? " is-still" : ""}${c.fhe ? " is-fhe" : ""}`;
        return (
          <span
            key={i}
            className={wrapClass}
            style={{
              left: `${left}px`,
              top: `${top}px`,
              width: `${c.size}px`,
              height: `${c.size}px`,
              animationDelay: `${c.delayA}s`,
            }}
          >
            <span
              className={tileClass}
              style={
                {
                  animationDelay: `${c.delayB}s`,
                  "--reveal-delay": `${c.revealDelay}s`,
                } as CSSProperties
              }
            />
          </span>
        );
      })}
    </div>
  );
}
