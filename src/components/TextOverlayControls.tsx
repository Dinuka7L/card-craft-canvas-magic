
import React from "react";
import { TextOverlay } from "./CanvasEditor";

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
        <input
          type="number"
          min={12}
          max={100}
          value={textOverlay.size}
          onChange={e => onChange({ size: Number(e.target.value) })}
          className="w-14 border rounded px-1 text-sm"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
      </div>
    </div>
  );
};
