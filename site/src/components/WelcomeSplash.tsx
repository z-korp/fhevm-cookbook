"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";
import WebGPURenderer from "three/src/renderers/webgpu/WebGPURenderer.js";
import MeshBasicNodeMaterial from "three/src/materials/nodes/MeshBasicNodeMaterial.js";
import { viewportMipTexture } from "three/src/nodes/display/ViewportTextureNode.js";
import { screenUV, screenSize, screenCoordinate } from "three/src/nodes/display/ScreenNode.js";
import { float, vec2, vec3, Fn, uniform } from "three/src/nodes/tsl/TSLBase.js";
import { dot, mix, smoothstep, length, floor, fract, sin, abs } from "three/src/nodes/math/MathNode.js";
import { Loop } from "three/src/nodes/utils/LoopNode.js";
import { hash } from "three/src/nodes/math/Hash.js";
import { vec4 } from "three/src/nodes/tsl/TSLBase.js";
import type TextureNode from "three/src/nodes/accessors/TextureNode.js";
import { useState, useCallback, useMemo, useEffect, useRef, Suspense } from "react";

const MODEL_URL = "/sculpture_bust_of_roza_loewenfeld.glb";

// ── Bust model ──

function Bust() {
  const gltf = useGLTF(MODEL_URL);
  const ref = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.6;
    }
  });

  return (
    <primitive ref={ref} object={gltf.scene} scale={0.003} position={[0, 0, 0]} />
  );
}

useGLTF.preload(MODEL_URL);

// ── Env intensity ──

function EnvIntensity() {
  const { scene } = useThree();
  scene.environmentIntensity = 0.5;
  return null;
}

// ── Halftone post-process with mouse blob + duotone reveal ──

function HalftonePass() {
  const { viewport } = useThree();

  const mouseUV = useMemo(() => uniform(new THREE.Vector2(0.05, 0.95)), []);
  const mouseVel = useMemo(() => uniform(new THREE.Vector2(0, 0)), []);
  const prevTarget = useRef(new THREE.Vector2(0.05, 0.95));
  const lastPointer = useRef(new THREE.Vector2(0, 0));
  const hasEntered = useRef(false);

  useFrame((state, dt) => {
    // Only start tracking once the mouse actually moves on the canvas
    const px = state.pointer.x;
    const py = state.pointer.y;
    if (!hasEntered.current) {
      if (Math.abs(px - lastPointer.current.x) > 0.001 || Math.abs(py - lastPointer.current.y) > 0.001) {
        hasEntered.current = true;
      }
      lastPointer.current.set(px, py);
      return;
    }
    lastPointer.current.set(px, py);

    const clampedDt = Math.max(dt, 0.001);
    const tx = px * 0.5 + 0.5;
    const ty = 1.0 - (py * 0.5 + 0.5);

    const rawVx = (tx - prevTarget.current.x) / clampedDt * 0.012;
    const rawVy = (ty - prevTarget.current.y) / clampedDt * 0.012;
    prevTarget.current.set(tx, ty);

    mouseVel.value.x = THREE.MathUtils.damp(mouseVel.value.x, rawVx, 4, dt);
    mouseVel.value.y = THREE.MathUtils.damp(mouseVel.value.y, rawVy, 4, dt);
    mouseUV.value.x = THREE.MathUtils.damp(mouseUV.value.x, tx, 6, dt);
    mouseUV.value.y = THREE.MathUtils.damp(mouseUV.value.y, ty, 6, dt);
  });

  const material = useMemo(() => {
    const sceneTexture = viewportMipTexture() as unknown as TextureNode;

    const inkC = new THREE.Color("#000000");
    const ir = inkC.r, ig = inkC.g, ib = inkC.b;
    const paperC = new THREE.Color("#f7ca0a");
    const pr = paperC.r, pg = paperC.g, pb = paperC.b;

    const halftoneNode = Fn(() => {
      const dotSize = float(1.5);
      const inkColor = vec3(ir, ig, ib);
      const paperColor = vec3(pr, pg, pb);

      const gridPos = screenCoordinate.div(dotSize);
      const cellIndex = floor(gridPos);
      const cellCenterUV = cellIndex.add(0.5).mul(dotSize).div(screenSize);
      const cellColor = sceneTexture.sample(cellCenterUV).xyz;
      const lum = dot(cellColor, vec3(0.299, 0.587, 0.114));

      // Aspect-corrected blob distance
      const aspect = screenSize.x.div(screenSize.y);
      const toMouse = vec2(
        screenUV.x.sub(mouseUV.x).mul(aspect),
        screenUV.y.sub(mouseUV.y)
      );

      // Velocity-based blob deformation
      const velLen = length(mouseVel);
      const stretch = velLen.mul(8.0).add(1.0);
      const velDir = mouseVel.div(velLen.add(float(0.0001)));
      const proj = dot(toMouse, velDir);
      const perpVec = toMouse.sub(velDir.mul(proj));
      const perpDist = length(perpVec);
      const blobDist = length(vec2(perpDist, proj.div(stretch)));

      const influence = smoothstep(float(0.22), float(0), blobDist).mul(0.5);
      const finalScale = float(0.48).add(influence);
      const darkness = float(1.0).sub(lum);
      const dotRadius = darkness.sqrt().mul(finalScale);

      const cellPos = fract(gridPos).sub(0.5);
      const dist = length(cellPos);
      const dotMask = smoothstep(dotRadius, dotRadius.sub(0.08), dist);
      const halftoneColor = mix(paperColor, inkColor, dotMask);

      // Duotone reveal near mouse
      const revealStrength = smoothstep(float(0.16), float(0.02), blobDist);
      const originalColor = sceneTexture.sample(screenUV).xyz;
      const revealLum = dot(originalColor, vec3(0.299, 0.587, 0.114));
      const filteredColor = mix(inkColor, paperColor, revealLum);
      const revealed = mix(halftoneColor, filteredColor, revealStrength.mul(0.85));

      return revealed;
    })();

    const mat = new MeshBasicNodeMaterial();
    mat.transparent = true;
    mat.colorNode = halftoneNode;
    mat.opacityNode = float(1.0);
    mat.depthWrite = false;
    mat.depthTest = false;
    return mat;
  }, []);

  const cam = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const halfFov = (cam.fov * Math.PI) / 360;
  const planeDist = 1;
  const planeH = 2 * planeDist * Math.tan(halfFov) * 1.15;
  const planeW = planeH * viewport.aspect;

  return (
    <mesh position={[0, 0, -planeDist]} renderOrder={100}>
      <planeGeometry args={[planeW, planeH]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

// ── Fluted glass blur plane (thin strip) ──

function FlutedGlassPlane() {
  const material = useMemo(() => {
    const sceneTexture = viewportMipTexture() as unknown as TextureNode;
    const columns = float(80);
    const refractionStrength = float(0.015);
    const verticalSmear = float(0.005);
    const ridgeGap = float(0.15);
    const ridgeShape = float(0.7);
    const smearSamples = 4;

    const glassNode = Fn(() => {
      const columnPos = screenUV.x.mul(columns);
      const columnIndex = floor(columnPos);
      const withinColumn = fract(columnPos);
      const sharpOffset = withinColumn.sub(0.5).mul(2.0);
      const smoothOffset = sin(withinColumn.mul(float(Math.PI)));
      const ridgeOffset = mix(sharpOffset, smoothOffset, ridgeShape);
      const colNoise = hash(columnIndex.mul(127.1)).sub(0.5).mul(2.0).mul(0.005);
      const hOffset = ridgeOffset.mul(refractionStrength).add(colNoise);

      const accumulated = vec4(0, 0, 0, 0).toVar();
      Loop(smearSamples, ({ i }) => {
        const t = float(i).div(float(smearSamples).sub(1.0)).sub(0.5);
        const sampleUV = vec2(
          screenUV.x.add(hOffset),
          screenUV.y.add(t.mul(verticalSmear))
        );
        accumulated.addAssign(sceneTexture.sample(sampleUV));
      });
      const refracted = accumulated.div(float(smearSamples)).xyz;
      const edgeDist = abs(withinColumn.sub(0.5)).mul(2.0);
      const gapDarken = smoothstep(float(0.8), float(1.0), edgeDist).mul(ridgeGap);
      return refracted.mul(float(1.0).sub(gapDarken));
    })();

    const mat = new MeshBasicNodeMaterial();
    mat.transparent = true;
    mat.colorNode = glassNode;
    mat.opacityNode = float(1.0);
    return mat;
  }, []);

  return (
    <mesh position={[0, 0.3, -1.5]} renderOrder={50}>
      <planeGeometry args={[0.4, 0.1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

// Camera-attached group
function CameraAttached({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.copy(camera.position);
    g.quaternion.copy(camera.quaternion);
  });

  return <group ref={groupRef}>{children}</group>;
}

// ── Overlay text ──

function SplashOverlay({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-20 pointer-events-none select-none">
      <button
        onClick={onEnter}
        className="pointer-events-auto text-sm tracking-widest uppercase text-black/50 animate-pulse cursor-pointer hover:text-black/80 transition-colors"
      >
        Click to enter
      </button>
    </div>
  );
}

// ── Scene root ──

function Scene() {
  const [ready, setReady] = useState(false);

  const handleCreated = useCallback((stateGl: { gl: THREE.WebGLRenderer }) => {
    const gl = stateGl.gl as unknown as WebGPURenderer;
    gl.init().then(() => {
      setReady(true);
    });
  }, []);

  return (
    <Canvas
      frameloop={ready ? "always" : "never"}
      camera={{ position: [0, 0.5, 3], fov: 40 }}
      gl={(defaultProps) => {
        const renderer = new WebGPURenderer({
          canvas: defaultProps.canvas as HTMLCanvasElement,
          antialias: true,
          powerPreference: "high-performance",
        });
        renderer.toneMapping = THREE.NoToneMapping;
        return renderer;
      }}
      onCreated={handleCreated}
    >
      <color attach="background" args={["#ffffff"]} />

      <Suspense fallback={null}>
        <Bust />
        <Environment preset="studio" />
        <EnvIntensity />
      </Suspense>

      <CameraAttached>
        <FlutedGlassPlane />
        <HalftonePass />
      </CameraAttached>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 2}
        maxPolarAngle={Math.PI / 2}
        rotateSpeed={5}
      />
    </Canvas>
  );
}

// ── Main export — splash screen with fade-out transition ──

export default function WelcomeSplash({ onEnter }: { onEnter: () => void }) {
  const [fading, setFading] = useState(false);

  const handleClick = () => {
    setFading(true);
    setTimeout(onEnter, 800);
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-700 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <Scene />
      <SplashOverlay onEnter={handleClick} />
    </div>
  );
}
