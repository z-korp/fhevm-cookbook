"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HeroBust = dynamic(() => import("@/components/HeroBust"), { ssr: false });

export default function HeroBustWrapper() {
  const [canvasKey, setCanvasKey] = useState(0);

  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      // Page restored from BFCache — the WebGPU device is dead.
      // Bump key to force full Canvas + renderer re-creation.
      if (e.persisted) setCanvasKey((k) => k + 1);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return <HeroBust key={canvasKey} />;
}
