
import { useRef, useState } from "react";

type Position = { x: number; y: number };
type UseDraggableReturn = {
  bind: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    style: React.CSSProperties;
  };
  isDragging: boolean;
};

export function useDraggableOverlay(
  pos: Position,
  setPos: (p: Position) => void,
  bounds?: { minX?: number; maxX?: number; minY?: number; maxY?: number },
  scale: number = 1
): UseDraggableReturn {
  const [dragging, setDragging] = useState(false);
  const startPos = useRef<Position>({ x: 0, y: 0 });
  const startMouse = useRef<Position>({ x: 0, y: 0 });

  const onDown = (clientX: number, clientY: number) => {
    setDragging(true);
    startMouse.current = { x: clientX, y: clientY };
    startPos.current = { ...pos };
    window.addEventListener("mousemove", onMoveWin);
    window.addEventListener("mouseup", onUpWin);
    window.addEventListener("touchmove", onTouchMoveWin, { passive: false });
    window.addEventListener("touchend", onTouchEndWin);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDown(e.clientX, e.clientY);
  };
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      e.stopPropagation();
      onDown(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const onMove = (clientX: number, clientY: number) => {
    if (!dragging) return;
    let dx = (clientX - startMouse.current.x) / scale;
    let dy = (clientY - startMouse.current.y) / scale;
    let newX = startPos.current.x + dx;
    let newY = startPos.current.y + dy;
    if (bounds) {
      newX = Math.max(bounds.minX ?? 0, Math.min(bounds.maxX ?? 1, newX));
      newY = Math.max(bounds.minY ?? 0, Math.min(bounds.maxY ?? 1, newY));
    }
    setPos({ x: newX, y: newY });
  };

  const onMoveWin = (e: MouseEvent) => {
    onMove(e.clientX, e.clientY);
  };
  const onUpWin = () => {
    setDragging(false);
    window.removeEventListener("mousemove", onMoveWin);
    window.removeEventListener("mouseup", onUpWin);
  };
  const onTouchMoveWin = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      onMove(e.touches[0].clientX, e.touches[0].clientY);
      e.preventDefault();
    }
  };
  const onTouchEndWin = () => {
    setDragging(false);
    window.removeEventListener("touchmove", onTouchMoveWin);
    window.removeEventListener("touchend", onTouchEndWin);
  };

  return {
    bind: {
      onMouseDown,
      onTouchStart,
      style: { cursor: dragging ? "grabbing" : "grab" },
    },
    isDragging: dragging,
  };
}
