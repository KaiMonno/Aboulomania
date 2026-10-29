"use client";

import { useEffect, useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";

// Blades in the Dark-style gauge (frontend/public/clock/clock-face.webp) -
// sourced from the 11-pose "10er clock" PNG set at the repo root, which
// baked the hand directly into each of its 11 rasters rather than shipping
// a separable hand layer. An earlier version of this component cross-faded
// between the two nearest of those 11 frames to fake smoothness as the
// value changed, but blending two different baked hand positions reads as
// a double-exposure ghost, not motion - it's the two whole-gauge frames
// dissolving into each other, not a hand sweeping. clock-face.webp is a
// hand-free reconstruction instead (median-stacked across all 11 source
// frames per pixel, so the one thing that moved between them - the hand -
// averages out and only the static dial/bezel/numerals survive), paired
// with HAND_PATH below: a small hand-authored needle, not extracted from
// the art, since isolating the drawn hand's ink from its own
// drop-shadow/anti-aliasing per frame proved too noisy to get a clean
// silhouette. This restores genuine continuous rotation (identical
// technique to this component's original clock-face.png/clock-hand.png
// pair) rather than faking it across discrete poses. Both the face and the
// needle are drawn together on one low-res <canvas> (see PIXEL_RES) rather
// than an <img> + <svg> pair, so the needle picks up the same deliberate
// pixel-art blockiness as the face instead of floating over it as a smooth
// vector.
//
// PIVOT_X/Y and the two angle constants were measured empirically off the
// source frames, not guessed: PIVOT is the bezel's screw/rivet center
// (confirmed by cropping and eyeballing concentric alignment); START_ANGLE/
// END_ANGLE came from masking each frame against the reconstructed face to
// isolate that frame's hand pixels, taking the masked region's centroid
// angle from the pivot (robust to the hand's asymmetric arrow-shaped tip,
// unlike a naive "farthest pixel" angle which that asymmetry threw off by
// up to ~15deg), then fitting a line through all 11 frames' centroid
// angles vs. frame index - frame 0 (the "0" numeral, bottom-left) and
// frame 10 (the "10" numeral, bottom-right) anchor the sweep. All angles
// are plain CSS rotate() degrees (0 = pointing along +x/right, increasing
// clockwise), so the live needle angle is a one-line lerp with no further
// conversion.
const PIVOT_X = 49.6; // percent of the 500x500 source canvas
const PIVOT_Y = 49.0;
const START_ANGLE = 120.92; // needle angle at value = min (frame 0, "0")
const END_ANGLE = 411.13; // needle angle at value = max (frame 10, "10") - unwrapped, ~290deg of sweep

// A thin tapered pointer + small tail counterweight, drawn pointing along
// +x (angle 0) with its pivot at the origin, in the same 500-unit space as
// PIVOT_X/Y above - matches a traditional gauge needle's silhouette without
// depending on the source art's own hand-drawn ink, which this component
// intentionally no longer uses (see above). Inset from the origin by 16
// units so it starts just past the radius covered by the face art's own
// screw/rivet graphic, instead of overlapping it. Drawn via Path2D onto the
// pixel-art canvas below rather than as an SVG - see PIXEL_RES.
const HAND_PATH = "M -20 0 L -8 -6 L -8 6 Z M 16 -3 L 165 -1 L 182 0 L 165 1 L 16 3 Z";

// Pixel-art resolution the whole clock (face + needle) is actually drawn
// at - deliberately low and fixed, regardless of the `size` prop or the
// viewer's device pixel ratio, the same idea as the bookshelf's native-
// resolution sprite art (components/Bookshelf.tsx): the canvas's backing
// store is PIXEL_RES x PIXEL_RES, CSS scales it up to `size` with
// image-rendering: pixelated, so each native pixel becomes a visible flat
// block instead of being smoothed back out by a DPR-aware backing store.
// Needs the needle drawn on this SAME low-res canvas (not as a separate
// full-resolution SVG layer, which an earlier version of this component
// used) so its edges share the identical pixel grid as the face instead of
// looking like a smooth vector floating over a blocky background. 56 was
// picked by rendering the dial at several resolutions (32-72) and
// eyeballing the tradeoff: low enough that the bezel/needle edges read as
// a deliberate pixel grid, high enough that the gauge is still
// recognizable rather than a gray blob. clock-face.webp is pre-downsampled
// to exactly this resolution offline (Lanczos, for quality) rather than
// relying on the browser to shrink a higher-res source at draw time.
const PIXEL_RES = 56;

export default function PlaytimeClockSlider({
  value,
  min,
  max,
  step = 1,
  disabled = false,
  onValueChange,
  size = 96,
  "aria-label": ariaLabel,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  onValueChange: (value: number) => void;
  size?: number;
  "aria-label"?: string;
}) {
  const fraction = (value - min) / (max - min);
  const angle = START_ANGLE + (END_ANGLE - START_ANGLE) * fraction;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceImgRef = useRef<HTMLImageElement | null>(null);
  const [faceLoaded, setFaceLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setFaceLoaded(true);
    img.src = "/clock/clock-face.webp";
    faceImgRef.current = img;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const face = faceImgRef.current;
    if (!canvas || !face || !faceLoaded) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, PIXEL_RES, PIXEL_RES);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(face, 0, 0, PIXEL_RES, PIXEL_RES);

    ctx.save();
    ctx.translate((PIVOT_X / 100) * PIXEL_RES, (PIVOT_Y / 100) * PIXEL_RES);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.scale(PIXEL_RES / 500, PIXEL_RES / 500);
    ctx.fillStyle = "#171717";
    ctx.fill(new Path2D(HAND_PATH));
    ctx.restore();
  }, [angle, faceLoaded]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={disabled ? "relative opacity-50" : "relative"}
        style={{ width: size, height: size }}
      >
        <canvas
          ref={canvasRef}
          width={PIXEL_RES}
          height={PIXEL_RES}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
      <Slider
        aria-label={ariaLabel}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={(next) => onValueChange(Array.isArray(next) ? next[0] : next)}
        className="w-full"
      />
    </div>
  );
}
