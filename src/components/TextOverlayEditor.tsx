
import React from "react";
import { TextOverlay } from "./types/TextOverlay";
import { Progress } from "./ui/progress";

const COLORS = [
  "#fff", "#FFD166", "#EF476F", "#06D6A0", "#118AB2", "#222", "#7D5FFF"
];
const FONTS = [
  { name: "Playfair Display", css: "Playfair Display, serif" },
  { name: "Inter", css: "Inter, sans-serif" },
];

interface Props {
  overlay: TextOverlay;
  onChange: (patch: Partial<TextOverlay>) => void;
  onDelete?: () => void;
  isSelected?: boolean;
  maxOverlays?: number;
  overlays?: TextOverlay[];
  idx?: number;
  setOverlays?: React.Dispatch<React.SetStateAction<TextOverlay[]>>;
}

export const TextOverlayEditor: React.FC<Props> = ({
  overlay,
  onChange,
  onDelete,
  isSelected,
  overlays,
  idx,
  setOverlays
}) => {
  if (!overlay) return null;
  const minFont = 12, maxFont = 72;
  const minZ = 0;
  const maxZ = overlays ? overlays.length - 1 : 5;

  return (
    <div className={`flex flex-col gap-1 mb-2 p-2 rounded-lg border ${isSelected ? "border-primary bg-accent" : "border-muted"}`}>
      <input
        type="text"
        className="border rounded px-2 py-1 text-sm mb-1"
        value={overlay.text}
        onChange={e => onChange({ text: e.target.value })}
        placeholder="Edit text"
      />
      <div className="flex gap-2 mb-1">
        <select
          className="border rounded p-1 text-sm"
          value={overlay.font}
          onChange={e => onChange({ font: e.target.value })}
        >
          {FONTS.map(f => (
            <option key={f.name} value={f.name} style={{ fontFamily: f.css }}>
              {f.name}
            </option>
          ))}
        </select>
        <input
          type="color"
          value={overlay.color}
          onChange={e => onChange({ color: e.target.value })}
          className="rounded w-7 h-7 p-0 border"
          title="Text color"
        />
      </div>
      {/* X Position Slider */}
      <div className="flex gap-2 items-center">
        <label className="text-xs text-muted-foreground min-w-[40px]">X</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={overlay.x}
          onChange={e => onChange({ x: Math.max(0, Math.min(1, Number(e.target.value))) })}
          className="w-24 accent-primary"
        />
        <span className="text-xs font-mono">{Number(overlay.x).toFixed(2)}</span>
      </div>
      {/* Y Position Slider */}
      <div className="flex gap-2 items-center">
        <label className="text-xs text-muted-foreground min-w-[40px]">Y</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={overlay.y}
          onChange={e => onChange({ y: Math.max(0, Math.min(1, Number(e.target.value))) })}
          className="w-24 accent-primary"
        />
        <span className="text-xs font-mono">{Number(overlay.y).toFixed(2)}</span>
      </div>
      {/* Z Order Slider */}
      <div className="flex gap-2 items-center">
        <label className="text-xs text-muted-foreground min-w-[40px]">Z</label>
        <input
          type="range"
          min={minZ}
          max={maxZ}
          step={1}
          value={overlay.z}
          onChange={e => {
            const newZ = Number(e.target.value);
            if (typeof idx === "number" && overlays && setOverlays) {
              // Move the overlay to the new z position
              let newArr = [...overlays];
              const [item] = newArr.splice(idx, 1);
              newArr.splice(newZ, 0, { ...item, z: newZ });
              // Reassign all z to their order
              newArr = newArr.map((o, i) => ({ ...o, z: i }));
              setOverlays(newArr);
            } else {
              onChange({ z: newZ });
            }
          }}
          className="w-24 accent-primary"
        />
        <span className="text-xs font-mono">{overlay.z}</span>
      </div>
      {/* Font Size */}
      <div className="flex gap-2 items-center">
        <label htmlFor="font-progress" className="text-xs text-muted-foreground">Font Size</label>
        <Progress
          className="h-2 w-20 bg-muted"
          value={((overlay.size - minFont) / (maxFont - minFont)) * 100}
        />
        <input
          id="font-progress"
          type="range"
          min={minFont}
          max={maxFont}
          step={1}
          value={overlay.size}
          onChange={e => onChange({ size: Number(e.target.value) })}
          className="w-16 accent-primary"
        />
        <span className="text-xs font-mono">{overlay.size}px</span>
      </div>
      {onDelete && (
        <button
          className="text-xs text-red-500 mt-1 underline self-end"
          onClick={onDelete}
        >Delete</button>
      )}
    </div>
  );
};
