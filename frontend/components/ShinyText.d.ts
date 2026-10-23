import type { CSSProperties, ReactNode } from "react";

export interface ShinyTextProps {
  text?: string;
  children?: ReactNode;
  color?: string;
  shineColor?: string;
  speed?: number;
  delay?: number;
  angle?: number;
  shineWidth?: number;
  softness?: number;
  bands?: number;
  glow?: number;
  direction?: "left" | "right";
  easing?: "linear" | "smooth" | "snappy";
  trigger?: "loop" | "hover" | "view";
  yoyo?: boolean;
  followPointer?: boolean;
  pauseOnHover?: boolean;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

declare function ShinyText(props: ShinyTextProps): JSX.Element;
export default ShinyText;
