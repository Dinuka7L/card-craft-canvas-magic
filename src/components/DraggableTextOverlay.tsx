
import React from "react";
import { useDraggableOverlay } from "./useDraggableOverlay";
import { TextOverlay } from "./types/TextOverlay";

interface DraggableTextOverlayProps {
  overlay: TextOverlay & { x: number; y: number };
  idx: number;
  previewW: number;
  previewH: number;
  tplDims: { width: number; height: number };
  selected: boolean;
  onDrag: (idx: number, x: number, y: number) => void;
  onClick: (idx: number) => void;
}

export const DraggableTextOverlay: React.FC<DraggableTextOverlayProps> = ({
  overlay,
  idx,
  previewW,
  previewH,
  tplDims,
  selected,
  onDrag,
  onClick
}) => {
  const { bind, isDragging } = useDraggableOverlay(
    { x: overlay.x, y: overlay.y },
    ({ x, y }) => onDrag(idx, x, y),
    { minX: 0, maxX: 1, minY: 0, maxY: 1 },
    previewW
  );
  // Compute px location within preview (bounds: previewW x previewH)
  const px = overlay.x * previewW;
  const py = overlay.y * previewH;
  return (
    <div
      {...bind}
      style={{
        position: "absolute",
        left: px,
        top: py,
        zIndex: 10,
        transform: "translate(0,0)",
        color: overlay.color,
        fontFamily: `${overlay.font}, Inter, Playfair Display, serif`,
        fontSize: overlay.size * Math.min(
          previewW / (tplDims.width || 1),
          previewH / (tplDims.height || 1)
        ),
        fontWeight: 700,
        WebkitTextStroke: selected ? "1px #0af2" : "none",
        textShadow: "0 0 8px #000a",
        cursor: isDragging ? "grabbing" : "grab",
        background: "none",
        userSelect: "none",
        touchAction: "none",
        outline: selected ? "2px solid #4f63ff" : undefined,
        pointerEvents: "auto",
        padding: "4px 8px"
      }}
      tabIndex={0}
      aria-label={`Text overlay: ${overlay.text}`}
      onClick={e => {
        e.stopPropagation();
        onClick(idx);
      }}
    >
      {overlay.text}
    </div>
  );
};
