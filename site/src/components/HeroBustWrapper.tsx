"use client";

import dynamic from "next/dynamic";

const HeroBust = dynamic(() => import("@/components/HeroBust"), { ssr: false });

export default function HeroBustWrapper() {
  return <HeroBust />;
}
