"use client";

import { useEffect, useRef, useState } from "react";

// "FHE" rendered as a 3D extrusion, rotated and shaded with the same donut.c
// pipeline as AsciiTorus: each filled glyph cell becomes a 1×1×DEPTH cube,
// surface points are projected with a z-buffer, Lambert dot product with a
// fixed light direction picks an ASCII luminance ramp character.
//
// Internal cube faces (those touching another filled cell) are skipped — only
// the silhouette + front/back contribute points, which keeps the geometry
// sparse without compromising the shape.

const WIDTH = 56;
const HEIGHT = 28;

// 8×13 glyphs lifted from the existing CubeField pattern so the F/H/E
// silhouette stays consistent across the site.
const LETTER_W = 8;
const LETTER_H = 13;
const LETTER_GAP = 2;
const NUM_LETTERS = 3;
const TOTAL_W = LETTER_W * NUM_LETTERS + LETTER_GAP * (NUM_LETTERS - 1);
const DEPTH = 2.4;
const SAMPLES_PER_FACE = 3;

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

// Camera: K2 is the distance from camera, K1 the projection scale. Tuned so
// the "FHE" word fills most of the WIDTH/HEIGHT viewport without clipping at
// the most aggressive rotation angles.
const K1 = 28;
const K2 = 22;

// Same 5-step luminance ramp as the torus.
const LUMINANCE = "·:+#█";

// Light direction (unit vector) — upper-right-front. Picked so the front of
// the letters is lit when they face the camera, and side walls reveal as the
// shape rotates.
const L_NORM = 1 / Math.sqrt(3);
const LX = L_NORM;
const LY = L_NORM;
const LZ = L_NORM;

type Point = {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
};

function isFilled(li: number, col: number, row: number): boolean {
  if (li < 0 || li >= NUM_LETTERS) return false;
  if (col < 0 || col >= LETTER_W) return false;
  if (row < 0 || row >= LETTER_H) return false;
  return FHE_GLYPHS[li][row][col] === "1";
}

// Generate sample points on each visible cube face for every filled cell.
// Computed once at module load — geometry never changes.
function generatePoints(): Point[] {
  const pts: Point[] = [];
  const half = 0.5;
  const halfD = DEPTH / 2;
  const step = 1 / SAMPLES_PER_FACE;

  for (let li = 0; li < NUM_LETTERS; li++) {
    const xBase = li * (LETTER_W + LETTER_GAP) - TOTAL_W / 2;

    for (let row = 0; row < LETTER_H; row++) {
      for (let col = 0; col < LETTER_W; col++) {
        if (FHE_GLYPHS[li][row][col] !== "1") continue;

        const cx = xBase + col + 0.5;
        // y axis is up; row 0 is the top of the glyph.
        const cy = -(row - LETTER_H / 2 + 0.5);
        const cz = 0;

        // Front face (always visible — no z-neighbor).
        for (let i = 0; i < SAMPLES_PER_FACE; i++) {
          for (let j = 0; j < SAMPLES_PER_FACE; j++) {
            const fx = (i + 0.5) * step - 0.5;
            const fy = (j + 0.5) * step - 0.5;
            pts.push({ x: cx + fx, y: cy + fy, z: cz + halfD, nx: 0, ny: 0, nz: 1 });
          }
        }
        // Back face.
        for (let i = 0; i < SAMPLES_PER_FACE; i++) {
          for (let j = 0; j < SAMPLES_PER_FACE; j++) {
            const fx = (i + 0.5) * step - 0.5;
            const fy = (j + 0.5) * step - 0.5;
            pts.push({ x: cx + fx, y: cy + fy, z: cz - halfD, nx: 0, ny: 0, nz: -1 });
          }
        }
        // Right face — only emit if the right neighbor is empty.
        if (!isFilled(li, col + 1, row)) {
          for (let i = 0; i < SAMPLES_PER_FACE; i++) {
            for (let j = 0; j < SAMPLES_PER_FACE; j++) {
              const fy = (i + 0.5) * step - 0.5;
              const fz = ((j + 0.5) * step - 0.5) * DEPTH;
              pts.push({ x: cx + half, y: cy + fy, z: cz + fz, nx: 1, ny: 0, nz: 0 });
            }
          }
        }
        // Left face.
        if (!isFilled(li, col - 1, row)) {
          for (let i = 0; i < SAMPLES_PER_FACE; i++) {
            for (let j = 0; j < SAMPLES_PER_FACE; j++) {
              const fy = (i + 0.5) * step - 0.5;
              const fz = ((j + 0.5) * step - 0.5) * DEPTH;
              pts.push({ x: cx - half, y: cy + fy, z: cz + fz, nx: -1, ny: 0, nz: 0 });
            }
          }
        }
        // Top face — row 0 is top, so the top neighbor is row - 1.
        if (!isFilled(li, col, row - 1)) {
          for (let i = 0; i < SAMPLES_PER_FACE; i++) {
            for (let j = 0; j < SAMPLES_PER_FACE; j++) {
              const fx = (i + 0.5) * step - 0.5;
              const fz = ((j + 0.5) * step - 0.5) * DEPTH;
              pts.push({ x: cx + fx, y: cy + half, z: cz + fz, nx: 0, ny: 1, nz: 0 });
            }
          }
        }
        // Bottom face.
        if (!isFilled(li, col, row + 1)) {
          for (let i = 0; i < SAMPLES_PER_FACE; i++) {
            for (let j = 0; j < SAMPLES_PER_FACE; j++) {
              const fx = (i + 0.5) * step - 0.5;
              const fz = ((j + 0.5) * step - 0.5) * DEPTH;
              pts.push({ x: cx + fx, y: cy - half, z: cz + fz, nx: 0, ny: -1, nz: 0 });
            }
          }
        }
      }
    }
  }

  return pts;
}

const POINTS = generatePoints();

// Index in the LUMINANCE ramp at/above which a cell is considered a "peak"
// highlight and is rendered in the Zama yellow accent layer instead of the
// base foreground layer.
const PEAK_LUMINANCE_INDEX = LUMINANCE.length - 1;

type Frame = {
  base: string;
  peak: string;
};

function renderFrame(A: number, B: number): Frame {
  const cosA = Math.cos(A);
  const sinA = Math.sin(A);
  const cosB = Math.cos(B);
  const sinB = Math.sin(B);

  const output = new Array<string>(WIDTH * HEIGHT).fill(" ");
  const isPeak = new Array<boolean>(WIDTH * HEIGHT).fill(false);
  const zbuffer = new Array<number>(WIDTH * HEIGHT).fill(0);

  for (const p of POINTS) {
    // Rotate around X by A: (y, z) → (y·cosA − z·sinA, y·sinA + z·cosA)
    const y1 = p.y * cosA - p.z * sinA;
    const z1 = p.y * sinA + p.z * cosA;
    const x1 = p.x;
    // Rotate around Y by B: (x, z) → (x·cosB + z·sinB, −x·sinB + z·cosB)
    const x2 = x1 * cosB + z1 * sinB;
    const z2 = -x1 * sinB + z1 * cosB;
    const y2 = y1;

    const z = z2 + K2;
    if (z <= 0) continue;
    const ooz = 1 / z;

    const xp = Math.floor(WIDTH / 2 + K1 * ooz * x2);
    const yp = Math.floor(HEIGHT / 2 - (K1 * ooz * y2) / 2);
    if (xp < 0 || xp >= WIDTH || yp < 0 || yp >= HEIGHT) continue;

    const idx = xp + WIDTH * yp;
    if (ooz <= zbuffer[idx]) continue;

    // Rotate the normal through the same transforms.
    const ny1 = p.ny * cosA - p.nz * sinA;
    const nz1 = p.ny * sinA + p.nz * cosA;
    const nx1 = p.nx;
    const nx2 = nx1 * cosB + nz1 * sinB;
    const nz2 = -nx1 * sinB + nz1 * cosB;
    const ny2 = ny1;

    // Lambert: only lit if the surface points toward the light.
    const L = nx2 * LX + ny2 * LY + nz2 * LZ;
    if (L <= 0) continue;

    zbuffer[idx] = ooz;
    const lIdx = Math.min(
      LUMINANCE.length - 1,
      Math.max(0, Math.floor(L * LUMINANCE.length * 0.95))
    );
    output[idx] = LUMINANCE[lIdx];
    isPeak[idx] = lIdx >= PEAK_LUMINANCE_INDEX;
  }

  // Split into two layers: peak chars go to the yellow layer, everything else
  // to the base layer. Each layer holds spaces where the other layer has the
  // glyph so widths line up across both <pre> elements.
  const baseLines: string[] = [];
  const peakLines: string[] = [];
  for (let y = 0; y < HEIGHT; y++) {
    let baseRow = "";
    let peakRow = "";
    for (let x = 0; x < WIDTH; x++) {
      const i = y * WIDTH + x;
      if (isPeak[i]) {
        baseRow += " ";
        peakRow += output[i];
      } else {
        baseRow += output[i];
        peakRow += " ";
      }
    }
    baseLines.push(baseRow);
    peakLines.push(peakRow);
  }
  return {
    base: baseLines.join("\n"),
    peak: peakLines.join("\n"),
  };
}

const LAYER_CLASS =
  "font-mono text-[14px] leading-[1] tracking-[0.05em] select-none whitespace-pre";

export default function AsciiFhe() {
  // SSR-safe: deterministic first frame.
  const [frame, setFrame] = useState<Frame>(() => renderFrame(0, 0));
  const bRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      // Y-axis spin only (turntable) — letters stay upright and rotate
      // left/right, keeping "FHE" readable through the cycle.
      bRef.current += 0.55 * dt;
      setFrame(renderFrame(0, bRef.current));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div aria-hidden="true" className="relative">
      <pre className={`${LAYER_CLASS} text-foreground`}>{frame.base}</pre>
      {/* Peak-luminance highlights — only the top step of the ramp lights up
          in Zama yellow, so the accent stays sparse and follows the surface
          most aligned with the light direction. */}
      <pre
        className={`${LAYER_CLASS} text-zama-yellow absolute inset-0`}
      >
        {frame.peak}
      </pre>
    </div>
  );
}
