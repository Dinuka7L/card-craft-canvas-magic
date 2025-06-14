
import React from "react";
import { TextOverlay } from "./CanvasEditor";
import { Progress } from "./ui/progress";

// Stylish color palette
const COLORS = [
  "#fff", "#FFD166", "#EF476F", "#06D6A0", "#118AB2", "#222", "#7D5FFF"
];
const FONTS = [
  { name: "Playfair Display", css: "Playfair Display, serif" },
  { name: "Inter", css: "Inter, sans-serif" },
];

interface Props {
  textOverlay: TextOverlay;
  onChange: (patch: Partial<TextOverlay>) => void;
}

export const TextOverlayControls: React.FC<Props> = ({ textOverlay, onChange }) => {
  if (!textOverlay) return null;

  const minFont = 12, maxFont = 72;

  return (
    <div className="flex flex-col gap-1 mb-1">
      <input
        type="text"
        className="border rounded px-2 py-1 text-sm mb-1"
        value={textOverlay.text}
        onChange={e => onChange({ text: e.target.value })}
        placeholder="Edit text"
      />
      <div className="flex gap-2 mb-1">
        <select
          className="border rounded p-1 text-sm"
          value={textOverlay.font}
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
          value={textOverlay.color}
          onChange={e => onChange({ color: e.target.value })}
          className="rounded w-7 h-7 p-0 border"
          title="Text color"
        />
      </div>
      <div className="flex gap-2 items-center">
        <label htmlFor="font-progress" className="text-xs text-muted-foreground">Font Size</label>
        <Progress
          className="h-2 w-20 bg-muted"
          value={((textOverlay.size - minFont) / (maxFont - minFont)) * 100}
        />
        <input
          id="font-progress"
          type="range"
          min={minFont}
          max={maxFont}
          step={1}
          value={textOverlay.size}
          onChange={e => onChange({ size: Number(e.target.value) })}
          className="w-16 accent-primary"
        />
        <span className="text-xs font-mono">{textOverlay.size}px</span>
      </div>
    </div>
  );
};
