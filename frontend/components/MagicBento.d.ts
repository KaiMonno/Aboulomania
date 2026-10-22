import type { CSSProperties, ReactNode } from "react";

export interface MagicBentoItem {
  content?: ReactNode;
  background?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  label?: ReactNode;
  visual?: ReactNode;
  image?: string;
  href?: string;
  target?: string;
  rel?: string;
  colSpan?: number;
  rowSpan?: number;
  id?: string | number;
  onClick?: (event: unknown) => void;
}

export interface MagicBentoProps {
  items?: MagicBentoItem[];
  columns?: number;
  rowHeight?: number;
  gap?: number;
  radius?: number;
  theme?: "dark" | "light";
  glowColor?: string;
  textAutoHide?: boolean;
  enableBorderGlow?: boolean;
  enableSpotlight?: boolean;
  spotlightRadius?: number;
  enableStars?: boolean;
  particleCount?: number;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
  intro?: boolean;
  disableAnimations?: boolean;
  onItemClick?: (item: MagicBentoItem, index: number) => void;
  className?: string;
  style?: CSSProperties;
}

declare function MagicBento(props: MagicBentoProps): JSX.Element;
export default MagicBento;
