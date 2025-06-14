
/**
 * Shared type for text overlay control.
 * Update if you expand properties in overlays!
 */
export interface TextOverlay {
  text: string;
  color: string;
  font: string;
  size: number;
  x: number; // 0-1 normalized position
  y: number; // 0-1 normalized position
  z: number; // integer for z-index/layer ordering
}
