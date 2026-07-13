"use client";

import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";

export function PointerGlowSection({
  as: Component = "section",
  children,
  className,
}: {
  as?: "aside" | "section";
  children: ReactNode;
  className?: string;
}) {
  const glowRef = useRef<HTMLSpanElement>(null);
  const boundsRef = useRef<DOMRect | null>(null);
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const positionRef = useRef<{ x: number; y: number } | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  function renderGlow() {
    frameRef.current = null;

    const glow = glowRef.current;
    const position = positionRef.current;
    if (!glow || !position) return;

    const origin = originRef.current ?? position;
    if (!originRef.current) {
      originRef.current = origin;
      glow.style.left = `${origin.x}px`;
      glow.style.top = `${origin.y}px`;
    }

    glow.style.transform = `translate3d(${position.x - origin.x}px, ${position.y - origin.y}px, 0) translate(-50%, -50%)`;
  }

  function moveGlow(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") return;

    const bounds = boundsRef.current ?? event.currentTarget.getBoundingClientRect();
    boundsRef.current = bounds;
    positionRef.current = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };

    if (frameRef.current === null) frameRef.current = requestAnimationFrame(renderGlow);
  }

  function startGlow(event: PointerEvent<HTMLElement>) {
    boundsRef.current = event.currentTarget.getBoundingClientRect();
  }

  function resetGlow() {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);

    frameRef.current = null;
    boundsRef.current = null;
    originRef.current = null;
    positionRef.current = null;

    const glow = glowRef.current;
    glow?.style.removeProperty("left");
    glow?.style.removeProperty("top");
    glow?.style.removeProperty("transform");
  }

  return (
    <Component className={className} onPointerEnter={startGlow} onPointerMove={moveGlow} onPointerLeave={resetGlow}>
      <span ref={glowRef} className="pointer-glow-orb" aria-hidden="true" />
      {children}
    </Component>
  );
}
