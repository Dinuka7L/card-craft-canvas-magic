import React, { useEffect, useState } from "react";

// Use Vite's import.meta.glob to grab all images in the templates directory
const imageMap: Record<string, string> = {};
const imgRequire = import.meta.glob('../templates/*.{jpg,png,jpeg,gif,webp,avif,svg}', { eager: true, as: 'url' });
Object.entries(imgRequire).forEach(([key, value]) => {
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
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 rounded-lg scrollbar-hide">
        {templates.map(tpl => (
          <button
            key={tpl.id}
            className={`rounded-xl overflow-hidden shadow-md relative group border-2 transition-all duration-200 flex-shrink-0 hover:scale-105 ${
              selected === tpl.id ? "border-primary scale-105 shadow-lg" : "border-transparent hover:border-primary/30"
            }`}
            style={{
              width: 140,
              minWidth: 140,
              height: 160,
              background: "#f8f9fa",
            }}
            onClick={() => onSelect(tpl.id)}
          >
            <img
              src={imageMap[tpl.img] || ""}
              alt={tpl.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <span className={`absolute bottom-2 left-2 right-2 text-white rounded-md px-2 py-1 text-xs font-medium text-center transition-all duration-200 ${
              selected === tpl.id 
                ? "bg-primary shadow-sm" 
                : "bg-black/60 group-hover:bg-primary/90"
            }`}>
              {tpl.name}
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs mt-2 text-muted-foreground">
        Scroll horizontally to see more templates
      </p>
    </div>
  );
};