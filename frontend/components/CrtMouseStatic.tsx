"use client";

import { useEffect, useRef } from "react";

// A patch of TV static that follows the cursor, masked to a soft circle
// so only the area right around the pointer ever shows noise - everywhere
// else the canvas is just never drawn into, which also keeps the per-frame
// cost bounded to that one small region regardless of viewport size (no
// reason to redraw noise for pixels nothing will reveal).
//
// Lives inside CrtFrame's own -z-10 layer, not in front of the page, for
// the same reason every other piece of CrtFrame does: every real UI
// surface here (card backgrounds, the bookshelf's shelf art) is opaque, so
// a -z-10 layer can never show through them - the static only appears when
// the cursor is actually over genuine background (page margins, the gaps
// around cards), the same place the rest of CrtFrame's texture lives. It
// never has to be taught to avoid cards; it's already behind them.
//
// CELL is the noise grain size in real pixels - the canvas is rendered at
// 1/CELL resolution and scaled up with imageRendering: pixelated, matching
// every other pixel-art asset in this app (logo, platform badges, the
// bookshelf) instead of a smooth 1px-grain static texture that would look
// out of place next to them.
const CELL = 3;
const RADIUS = 110;

export default function CrtMouseStatic() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const pointer = { x: -9999, y: -9999 };
    let raf = 0;

    const resize = () => {
      width = Math.ceil(window.innerWidth / CELL);
      height = Math.ceil(window.innerHeight / CELL);
      canvas.width = width;
      canvas.height = height;
      canvas.style.setProperty("--static-x", "-9999px");
      canvas.style.setProperty("--static-y", "-9999px");
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      canvas.style.setProperty("--static-x", `${pointer.x}px`);
      canvas.style.setProperty("--static-y", `${pointer.y}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // Purple-tinted grain, not grayscale static - a random lightness per
    // cell blended toward the app's --primary hue so it reads as "this
    // app's CRT" rather than a generic black-and-white TV snow texture.
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const cellX = Math.round(pointer.x / CELL);
      const cellY = Math.round(pointer.y / CELL);
      const cellRadius = Math.ceil(RADIUS / CELL) + 2;
      const x0 = Math.max(0, cellX - cellRadius);
      const x1 = Math.min(width, cellX + cellRadius);
      const y0 = Math.max(0, cellY - cellRadius);
      const y1 = Math.min(height, cellY + cellRadius);
      if (x1 <= x0 || y1 <= y0) return;
      ctx.clearRect(x0, y0, x1 - x0, y1 - y0);
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const v = Math.random();
          const l = 30 + v * 55;
          ctx.fillStyle = `hsl(316 45% ${l}% / ${0.12 + v * 0.22})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      style={{
        imageRendering: "pixelated",
        maskImage: `radial-gradient(${RADIUS}px circle at var(--static-x, -9999px) var(--static-y, -9999px), black 0%, black 55%, transparent 100%)`,
        WebkitMaskImage: `radial-gradient(${RADIUS}px circle at var(--static-x, -9999px) var(--static-y, -9999px), black 0%, black 55%, transparent 100%)`,
      }}
    />
  );
}
