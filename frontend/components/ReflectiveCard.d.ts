import type { CSSProperties, ReactNode } from "react";

export interface ReflectiveCardProps {
  children?: ReactNode;
  theme?: "dark" | "light";
  videoSrc?: string;
  webcam?: boolean;
  onWebcamError?: (error: Error) => void;
  tint?: string;
  metalness?: number;
  roughness?: number;
  blurStrength?: number;
  grayscale?: number;
  warp?: number;
  warpScale?: number;
  shine?: number;
  bevel?: number;
  glare?: number;
  enableTilt?: boolean;
  tiltStrength?: number;
  intro?: boolean;
  width?: number | string;
  height?: number | string;
  radius?: number;
  className?: string;
  style?: CSSProperties;
}

declare function ReflectiveCard(props: ReflectiveCardProps): JSX.Element;
export default ReflectiveCard;
