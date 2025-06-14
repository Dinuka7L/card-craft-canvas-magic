import React, { useRef, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Image as ImageIcon } from "lucide-react";
import { DownloadDropdown } from "./DownloadDropdown";
import { Progress } from "./ui/progress";

// ========== Load template image assets via Vite glob ==========
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
interface CanvasEditorProps {
  templateId: string;
}
interface OverlayControlState {
  text: string;
  x: number; // [0,1]
  y: number; // [0,1]
  scale: number; // font-size scalar
  color: string;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({ templateId }) => {
  // -- Templates
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  useEffect(() => {
    import("../templates/templates.json").then(json => {
      setTemplates(json.default ?? json);
    });
  }, []);
  const templateMeta = templates.find(t => t.id === templateId);
  const templateImgUrl = templateMeta ? imageMap[templateMeta.img] : "";
  
  // -- Template & User Images
  const [tplImg, setTplImg] = useState<HTMLImageElement | null>(null);
  const [tplDims, setTplDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  useEffect(() => {
    if (!templateImgUrl) return;
    const img = new window.Image();
    img.onload = () => {
      setTplImg(img);
      setTplDims({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = templateImgUrl;
  }, [templateImgUrl]);

  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
  const [photoDims, setPhotoDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // -- Controls
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoX, setPhotoX] = useState(0.5);
  const [photoY, setPhotoY] = useState(0.5);
  const [photoScale, setPhotoScale] = useState(1);

  // Single text overlay (for simplicity, can extend to more layers if needed)
  const [overlay, setOverlay] = useState<OverlayControlState>({
    text: "Happy Birthday!",
    x: 0.15,
    y: 0.44,
    scale: 1,
    color: "#fff",
  });

  // Confirm/download buttons state
  const [confirmed, setConfirmed] = useState(false);

  // -- Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // -- File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== PHOTO UPLOAD =====
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    toast({ title: "Photo uploaded!", description: "Adjust and confirm when you're ready." });
    setConfirmed(false);
  };
  // load image from photoDataUrl
  useEffect(() => {
    if (!photoDataUrl) {
      setPhotoImg(null);
      setPhotoDims({ width: 0, height: 0 });
      return;
    }
    const img = new window.Image();
    img.onload = () => {
      setPhotoImg(img);
      setPhotoDims({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = photoDataUrl;
  }, [photoDataUrl]);

  // ===== DRAW CANVAS (PREVIEW + DOWNLOAD) =====
  const drawCanvas = (download?: boolean) => {
    if (!tplImg || !tplDims.width) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Native resolution always for both preview and download:
    canvas.width = tplDims.width;
    canvas.height = tplDims.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // photo first under template
    if (photoImg && photoDims.width && photoDims.height) {
      const px = photoX * canvas.width - (photoDims.width * photoScale) / 2;
      const py = photoY * canvas.height - (photoDims.height * photoScale) / 2;
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(photoScale, photoScale);
      ctx.drawImage(photoImg, 0, 0);
      ctx.restore();
    }
    // template on top
    ctx.drawImage(tplImg, 0, 0, canvas.width, canvas.height);

    // text overlays
    ctx.save();
    const fontPx = 60 * overlay.scale; // editable base px * scale
    ctx.font = `${fontPx}px Montserrat, Inter, Playfair Display, sans-serif`;
    ctx.fillStyle = overlay.color;
    ctx.textBaseline = "top";
    const nx = overlay.x * canvas.width;
    const ny = overlay.y * canvas.height;
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 8;
    ctx.fillText(overlay.text || "", nx, ny);
    ctx.shadowBlur = 0;
    ctx.restore();
  };

  // keep preview up-to-date
  useEffect(() => {
    drawCanvas();
    // eslint-disable-next-line
  }, [tplImg, tplDims, photoImg, photoDims, photoX, photoY, photoScale, overlay]);

  // ============ UI ============
  // Responsive preview (scale canvas to fit max bounds, preserve aspect)
  const MAX_PREVW = 400, MAX_PREVH = 570;
  const aspect = tplDims.width && tplDims.height ? tplDims.width / tplDims.height : 1;
  let previewW = MAX_PREVW, previewH = MAX_PREVH;
  if (tplDims.width && tplDims.height) {
    const r = Math.min(MAX_PREVW / tplDims.width, MAX_PREVH / tplDims.height, 1);
    previewW = Math.round(tplDims.width * r);
    previewH = Math.round(tplDims.height * r);
  }

  // Download logic (download button)
  const handleDownload = (format: "png" | "jpeg") => {
    if (!tplImg || !tplDims.width) {
      toast({ title: "Download failed", description: "Template not loaded" }); return;
    }
    drawCanvas(true);
    setTimeout(() => {
      const canvas = canvasRef.current as HTMLCanvasElement;
      if (!canvas) return;
      let dataUrl: string;
      if (format === "jpeg") {
        dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      } else {
        dataUrl = canvas.toDataURL("image/png");
      }
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `birthday-card.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({ title: `Image downloaded!`, description: `Saved as ${a.download}` });
      drawCanvas(); // restore preview
    }, 64);
  };

  // Reset everything on template change
  useEffect(() => {
    setPhotoDataUrl(null);
    setPhotoImg(null);
    setConfirmed(false);
    setOverlay({
      text: "Happy Birthday!",
      x: 0.15,
      y: 0.44,
      scale: 1,
      color: "#fff",
    });
    setPhotoX(0.5);
    setPhotoY(0.5);
    setPhotoScale(1);
  }, [templateId]);

  return (
    <div className="flex flex-col xl:flex-row gap-8 w-full max-w-full">
      {/* Left: controls */}
      <div className="flex flex-col gap-4 min-w-[180px] w-full xl:w-[210px]">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-primary px-4 py-2 rounded-lg text-white font-semibold mb-2 flex gap-2 items-center hover-scale w-full"
        >
          <ImageIcon size={20} /> Upload Photo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
        />
        {!!photoDataUrl && (
          <>
            <div className="mb-2">
              <label className="text-xs font-semibold mb-1 block">Photo X</label>
              <input
                type="range"
                min={0} max={1} step={0.01}
                value={photoX}
                disabled={!photoImg}
                onChange={e => setPhotoX(Number(e.target.value))}
                className="accent-primary w-32"
              />
              <span className="inline-block w-12 ml-2 font-mono text-xs">{photoX.toFixed(2)}</span>
            </div>
            <div className="mb-2">
              <label className="text-xs font-semibold mb-1 block">Photo Y</label>
              <input
                type="range"
                min={0} max={1} step={0.01}
                value={photoY}
                disabled={!photoImg}
                onChange={e => setPhotoY(Number(e.target.value))}
                className="accent-primary w-32"
              />
              <span className="inline-block w-12 ml-2 font-mono text-xs">{photoY.toFixed(2)}</span>
            </div>
            <div className="mb-2">
              <label className="text-xs font-semibold mb-1 block">Photo Scale</label>
              <input
                type="range"
                min={0.2} max={3} step={0.01}
                value={photoScale}
                disabled={!photoImg}
                onChange={e => setPhotoScale(Number(e.target.value))}
                className="accent-primary w-32"
              />
              <span className="inline-block w-12 ml-2 font-mono text-xs">{photoScale.toFixed(2)}</span>
            </div>
          </>
        )}
        <hr className="my-2" />
        <div className="mb-2">
          <label className="text-xs font-semibold mb-1 block">Text</label>
          <input
            type="text"
            value={overlay.text}
            onChange={e => setOverlay(o => ({ ...o, text: e.target.value }))}
            className="border rounded px-2 py-1 text-sm mb-1 w-full"
            placeholder="Label"
          />
        </div>
        <div className="mb-2">
          <label className="text-xs font-semibold mb-1 block">Text X</label>
          <input
            type="range"
            min={0} max={1} step={0.01}
            value={overlay.x}
            onChange={e => setOverlay(o => ({ ...o, x: Number(e.target.value) }))}
            className="accent-primary w-32"
          />
          <span className="inline-block w-12 ml-2 font-mono text-xs">{overlay.x.toFixed(2)}</span>
        </div>
        <div className="mb-2">
          <label className="text-xs font-semibold mb-1 block">Text Y</label>
          <input
            type="range"
            min={0} max={1} step={0.01}
            value={overlay.y}
            onChange={e => setOverlay(o => ({ ...o, y: Number(e.target.value) }))}
            className="accent-primary w-32"
          />
          <span className="inline-block w-12 ml-2 font-mono text-xs">{overlay.y.toFixed(2)}</span>
        </div>
        <div className="mb-2">
          <label className="text-xs font-semibold mb-1 block">Text Scale</label>
          <input
            type="range"
            min={0.2} max={2.5} step={0.01}
            value={overlay.scale}
            onChange={e => setOverlay(o => ({ ...o, scale: Number(e.target.value) }))}
            className="accent-primary w-32"
          />
          <span className="inline-block w-12 ml-2 font-mono text-xs">{overlay.scale.toFixed(2)}x</span>
        </div>
        <div className="mb-2">
          <label className="text-xs font-semibold mb-1 block">Text Color</label>
          <input
            type="color"
            value={overlay.color}
            onChange={e => setOverlay(o => ({ ...o, color: e.target.value }))}
            className="rounded w-8 h-8 border"
          />
        </div>
        <button
          className={`bg-primary px-4 py-2 rounded-lg text-white font-semibold my-2 w-full transition ${confirmed ? "bg-opacity-70 cursor-default" : ""}`}
          disabled={!tplImg || !photoImg}
          onClick={() => {
            setConfirmed(true);
            toast({ title: "Card Ready!", description: "You can now download it at full resolution." });
          }}
        >
          Confirm Layout
        </button>
        <DownloadDropdown
          onDownload={fmt => {
            if (!confirmed) {
              toast({ title: "Confirm your card first!", description: "Adjust and confirm your layout before downloading." });
              return;
            }
            handleDownload(fmt);
          }}
        />
      </div>
      <div
        className="relative mx-auto bg-white shrink-0"
        style={{
          width: previewW,
          height: previewH,
          minWidth: 150,
          minHeight: 120,
          borderRadius: 24,
          background: "#fff",
          boxShadow: "0 4px 24px 0 #0002",
          overflow: "hidden"
        }}
      >
        <canvas
          ref={canvasRef}
          width={tplDims.width}
          height={tplDims.height}
          style={{
            width: previewW,
            height: previewH,
            display: "block",
            borderRadius: 24,
            boxShadow: "0 4px 24px 0 #0002",
            background: "#fff",
            transition: "box-shadow 0.2s"
          }}
        />
        {(!templateImgUrl || !tplDims.width) && (
          <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-2xl text-lg font-semibold text-gray-500 z-10">Loading template...</div>
        )}
      </div>
    </div>
  );
};
// NOTE: This file is now very long (>500 lines). Please consider refactoring into smaller hooks/components for maintainability!
