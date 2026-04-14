"use client";

import { useEffect } from "react";

export default function ScrollToSkill({ skillId }: { skillId?: string }) {
  useEffect(() => {
    if (!skillId) return;
    const element = document.getElementById(skillId);
    if (!element) return;
    element.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [skillId]);

  return null;
}
