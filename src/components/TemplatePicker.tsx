
import React from "react";

const templates = [
  {
    id: "template1",
    name: "Starry Night",
    img: "/photo-1470813740244-df37b8c1edcb", // blue starry night
  },
  {
    id: "template2",
    name: "Sunlit Forest",
    img: "/photo-1500673922987-e212871fec22", // yellow lights between trees
  },
  {
    id: "template3",
    name: "Orange Blossoms",
    img: "/photo-1465146344425-f00d5f5c8f07", // orange flowers
  },
  {
    id: "template4",
    name: "Living Room",
    img: "/photo-1721322800607-8c38375eef04", // living room
  },
];

interface TemplatePickerProps {
  selected: string;
  onSelect: (id: string) => void;
}

export const TemplatePicker: React.FC<TemplatePickerProps> = ({
  selected,
  onSelect,
}) => (
  <div className="grid grid-cols-2 gap-6">
    {templates.map(tpl => (
      <button
        key={tpl.id}
        className={`rounded-lg overflow-hidden shadow-md relative group border-2 transition-all duration-200 ${
          selected === tpl.id ? "border-primary scale-105" : "border-card"
        }`}
        style={{
          width: 180,
          height: 260,
          background: "#f8f9fa",
        }}
        onClick={() => onSelect(tpl.id)}
      >
        <img
          src={tpl.img}
          alt={tpl.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <span className="absolute bottom-2 left-2 bg-black/60 text-white rounded px-2 py-1 text-xs font-inter pointer-events-none select-none group-hover:bg-primary/80 transition">
          {tpl.name}
        </span>
      </button>
    ))}
  </div>
);
