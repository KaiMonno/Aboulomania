"use client";

import { Slider } from "@/components/ui/slider";

// Pixel-art analog clock whose hand reflects a plain linear slider - after
// the hand-rolled circular drag slider (and later a react-clock +
// @fiojs/react-circular-slider composition) both felt janky, this swaps
// back to the one control that was never the problem: the existing
// base-ui-backed <Slider>, which every other filter in this form already
// uses. clock-face.png/clock-hand.png (frontend/public/) are both 32x32
// canvases centered on the same point (15.5, 15.5 - confirmed by pixel
// bounding box, not assumed), so layering them at identical size and
// rotating only the hand image around its own CSS center pivots it
// exactly on the face's center with no manual offset math.
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
  const angle = fraction * 360;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={disabled ? "relative opacity-50" : "relative"}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- local pixel art, no next/image config needed */}
        <img
          src="/clock-face.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          style={{ imageRendering: "pixelated" }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- local pixel art, no next/image config needed */}
        <img
          src="/clock-hand.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          style={{ imageRendering: "pixelated", transform: `rotate(${angle}deg)` }}
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
