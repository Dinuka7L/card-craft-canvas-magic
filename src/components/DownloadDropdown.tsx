
import React, { useState } from "react";
import { Download } from "lucide-react";

interface Props {
  onDownload: (format: "png" | "jpeg") => void;
}
const OPTIONS = [
  { value: "png", label: "PNG (Transparent, Best Quality)" },
  { value: "jpeg", label: "JPEG (High Quality)" },
];

export const DownloadDropdown: React.FC<Props> = ({ onDownload }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(OPTIONS[0].value);

  const handleFormatChange = (format: string) => {
    setSelected(format);
    setOpen(false);
    onDownload(format as "png" | "jpeg");
  };

  return (
    <div className="relative mt-2">
      <button
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold shadow-lg hover-scale transition"
        onClick={() => setOpen(o => !o)}
      >
        <Download size={18} />
        Download
      </button>
      {open && (
        <div className="absolute z-30 bg-white border border-gray-200 rounded-lg top-12 left-0 min-w-[230px] shadow-lg animate-fade-in">
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              className="w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground font-inter transition"
              onClick={() => handleFormatChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
