"use client";

import { useEffect, useRef, useState } from "react";

// book-flip-sheet.png (frontend/public/) - "Pixel Book (Animated)" by
// Gokhan Solak, opengameart.org/content/pixel-book-animated, CC-BY 3.0.
// 9 frames, 64x64 each, laid out left to right in one row (confirmed by
// slicing the sheet, not assumed - the page's own description says "8
// frames" but frame 8 is a byte-identical duplicate of frame 0, there to
// close the loop seamlessly). Frames 0-7 are the actual page-turn motion;
// stepping through to 8 and then holding on 0 (same pixels) avoids a snap
// the same way the hand-rolled CSS flip's full 360deg rotation did.
const FRAME_SIZE = 64;
const FRAME_COUNT = 9;
const STEP_MS = 55;
// Frame 8 is a duplicate of frame 0 (see note below), so both sequences
// land back on 0 rather than visiting the redundant 8th frame. Forward
// (slider increasing) plays the page-turn motion in its recorded order;
// reverse (slider decreasing) plays the same frames in reverse temporal
// order, so the page visibly turns back the other way instead of just
// replaying the same lift-and-drop regardless of which way the slider moved.
const FORWARD_SEQUENCE = [1, 2, 3, 4, 5, 6, 7, 0];
const REVERSE_SEQUENCE = [7, 6, 5, 4, 3, 2, 1, 0];

export default function PixelBookFlip({ tick, size = 96 }: { tick: number; size?: number }) {
  const [frame, setFrame] = useState(0);
  const lastTick = useRef(tick);

  useEffect(() => {
    if (lastTick.current === tick) return;
    const sequence = tick > lastTick.current ? FORWARD_SEQUENCE : REVERSE_SEQUENCE;
    lastTick.current = tick;
    let i = 0;
    const id = setInterval(() => {
      setFrame(sequence[i]);
      i += 1;
      if (i >= sequence.length) clearInterval(id);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [tick]);

  const scale = size / FRAME_SIZE;

  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        backgroundImage: "url(/book-flip-sheet.png)",
        backgroundRepeat: "no-repeat",
        backgroundSize: `${FRAME_SIZE * FRAME_COUNT * scale}px ${FRAME_SIZE * scale}px`,
        backgroundPosition: `${-frame * FRAME_SIZE * scale}px 0px`,
        imageRendering: "pixelated",
      }}
    />
  );
}
