"use client";

import type { CSSProperties } from "react";
import { useMemo } from "react";

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
};

function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function buildCubes(): Cube[] {
  const cubes: Cube[] = [];
  const cx = (COLS - 1) / 2;
  const cy = (ROWS - 1) / 2;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);
      const noise = hash(x, y);

      // Radial outgoing wave. Negative delay so every cube is already mid-cycle
      // on first paint — no ugly cold-start flash.
      const delayA = -(dist * 0.14 + noise * 0.35);
      // Diagonal sweep, slower and out of phase with the pulse.
      const delayB = -((x + y) * 0.07 + noise * 0.25);

      const fhe = isFheCell(x, y);

      // FHE cubes are always yellow, always animated, and a touch larger
      // so they read as letters through the background noise.
      const accent = fhe || noise > 0.965;
      const still = !fhe && noise > 0.4 && noise < 0.47;
      const size = fhe ? 6.8 + noise * 0.6 : 5 + noise * 2;

      cubes.push({ x, y, size, delayA, delayB, accent, still });
    }
  }
  return cubes;
}

export default function CubeField() {
  const cubes = useMemo(() => buildCubes(), []);
  const width = COLS * CELL;
  const height = ROWS * CELL;

  return (
    <div
      className="cube-field-scene"
      role="img"
      aria-label="Animated field of encrypted data with FHE inscribed in yellow"
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
        const wrapClass = `cube-field-wrap${c.still ? " is-still" : ""}`;
        const tileClass = `cube-field-tile${c.accent ? " is-accent" : ""}${c.still ? " is-still" : ""}`;
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
              style={{ animationDelay: `${c.delayB}s` }}
            />
          </span>
        );
      })}
    </div>
  );
}
