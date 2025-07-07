import React from "react";
import { TextOverlay } from "./types/TextOverlay";
import { Progress } from "./ui/progress";
import { Trash2 } from "lucide-react";

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
    <div className={`flex flex-col gap-3 mb-3 p-3 rounded-lg border transition-all ${isSelected ? "border-primary bg-accent shadow-sm" : "border-muted hover:border-border"}`}>
      {/* Text Input */}
      <div>
        <label className="text-xs font-medium mb-1 block text-gray-600">Text</label>
        <input
          type="text"
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          value={overlay.text}
          onChange={e => onChange({ text: e.target.value })}
          placeholder="Enter your text"
        />
      </div>

      {/* Font and Color Row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium mb-1 block text-gray-600">Font</label>
          <select
            className="w-full border rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            value={overlay.font}
            onChange={e => onChange({ font: e.target.value })}
          >
            {FONTS.map(f => (
              <option key={f.name} value={f.name} style={{ fontFamily: f.css }}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block text-gray-600">Color</label>
          <input
            type="color"
            value={overlay.color}
            onChange={e => onChange({ color: e.target.value })}
            className="w-full h-9 rounded-md border cursor-pointer"
            title="Text color"
          />
        </div>
      </div>

      {/* Position Controls */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium mb-1 block text-gray-600">X Position</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={overlay.x}
              onChange={e => onChange({ x: Math.max(0, Math.min(1, Number(e.target.value))) })}
              className="flex-1 accent-primary"
            />
            <span className="text-xs font-mono w-12 text-gray-500">{Number(overlay.x).toFixed(2)}</span>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block text-gray-600">Y Position</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={overlay.y}
              onChange={e => onChange({ y: Math.max(0, Math.min(1, Number(e.target.value))) })}
              className="flex-1 accent-primary"
            />
            <span className="text-xs font-mono w-12 text-gray-500">{Number(overlay.y).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Font Size and Layer */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium mb-1 block text-gray-600">Font Size</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={minFont}
              max={maxFont}
              step={1}
              value={overlay.size}
              onChange={e => onChange({ size: Number(e.target.value) })}
              className="flex-1 accent-primary"
            />
            <span className="text-xs font-mono w-12 text-gray-500">{overlay.size}px</span>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block text-gray-600">Layer</label>
          <div className="flex items-center gap-2">
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
              className="flex-1 accent-primary"
            />
            <span className="text-xs font-mono w-12 text-gray-500">{overlay.z}</span>
          </div>
        </div>
      </div>

      {/* Delete Button */}
      {onDelete && (
        <button
          className="flex items-center justify-center gap-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 py-2 px-3 rounded-md transition-colors self-start"
          onClick={onDelete}
        >
          <Trash2 size={14} />
          Delete Text
        </button>
      )}
    </div>
  );
};