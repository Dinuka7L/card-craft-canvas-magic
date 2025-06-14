
import React from "react";

const templates = [
  {
    id: "template1",
    name: "Starry Night",
    img: "/photo-1470813740244-df37b8c1edcb",
  },
  {
    id: "template2",
    name: "Sunlit Forest",
    img: "/photo-1500673922987-e212871fec22",
  },
  {
    id: "template3",
    name: "Orange Blossoms",
    img: "/photo-1465146344425-f00d5f5c8f07",
  },
  {
    id: "template4",
    name: "Living Room",
    img: "/photo-1721322800607-8c38375eef04",
  },
  // Add more for demonstration if needed!
];

interface TemplatePickerProps {
  selected: string;
  onSelect: (id: string) => void;
}

export const TemplatePicker: React.FC<TemplatePickerProps> = ({
  selected,
  onSelect,
}) => (
  <div className="w-full">
    <div className="flex gap-4 overflow-x-auto pb-2 rounded-lg">
      {templates.map(tpl => (
        <button
          key={tpl.id}
          className={`rounded-lg overflow-hidden shadow-md relative group border-2 transition-all duration-200 flex-shrink-0 ${
            selected === tpl.id ? "border-primary scale-105" : "border-card"
          }`}
          style={{
            width: 150,
            minWidth: 150,
            maxWidth: 180,
            height: 180,
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
    <p className="text-xs mt-1 text-muted-foreground">
      Scroll to see more templates
    </p>
  </div>
);
