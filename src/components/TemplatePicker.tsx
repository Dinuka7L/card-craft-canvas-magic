
import React, { useEffect, useState } from "react";

// Use Vite's import.meta.glob to grab all images in the templates directory
// The keys are paths like '/src/templates/starry-night.jpg'
const imageMap: Record<string, string> = {};
const imgRequire = import.meta.glob('../templates/*.{jpg,png,jpeg,gif,webp,avif,svg}', { eager: true, as: 'url' });
Object.entries(imgRequire).forEach(([key, value]) => {
  // Extract filename: '../templates/starry-night.jpg' => 'starry-night.jpg'
  const fileName = key.split('/').pop()!;
  imageMap[fileName] = value as string;
});

interface TemplateMeta {
  id: string;
  name: string;
  img: string;
}
interface TemplatePickerProps {
  selected: string;
  onSelect: (id: string) => void;
}

export const TemplatePicker: React.FC<TemplatePickerProps> = ({
  selected,
  onSelect,
}) => {
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);

  useEffect(() => {
    import("../templates/templates.json").then(json => {
      setTemplates(json.default ?? json);
    });
  }, []);

  return (
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
              src={imageMap[tpl.img] || ""}
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
};
