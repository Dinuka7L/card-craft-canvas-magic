import React, { useRef, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Image as ImageIcon, Plus, X } from "lucide-react";
import { DownloadDropdown } from "./DownloadDropdown";
import { useDraggableOverlay } from "./useDraggableOverlay";
import { TextOverlay } from "./types/TextOverlay";
import { TextOverlayEditor } from "./TextOverlayEditor";
import { DraggableTextOverlay } from "./DraggableTextOverlay";

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

interface OverlayState extends TextOverlay {
  x: number;
  y: number;
  z: number;
}

const AVAILABLE_FONTS = [
  "Playfair Display",
  "Inter"
];

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

  // -- Multiple Overlays
  const defaultOverlay: OverlayState = {
    text: "Happy Birthday!",
    x: 0.15,
    y: 0.44,
    z: 0,
    color: "#fff",
    font: "Playfair Display",
    size: 48,
  };
  const [overlays, setOverlays] = useState<OverlayState[]>([defaultOverlay]);
  const [selectedOverlay, setSelectedOverlay] = useState<number>(0);

  // Confirm/download buttons state
  const [confirmed, setConfirmed] = useState(false);

  // Mobile controls state
  const [showControls, setShowControls] = useState(false);

  // -- Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // -- Preview ref (for measuring pixel drag offset)
  const previewRef = useRef<HTMLDivElement>(null);

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
    overlays.forEach(overlay => {
      ctx.save();
      ctx.font = `${overlay.size}px ${overlay.font}, Montserrat, Inter, Playfair Display, sans-serif`;
      ctx.fillStyle = overlay.color;
      ctx.textBaseline = "top";
      const nx = overlay.x * canvas.width;
      const ny = overlay.y * canvas.height;
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 8;
      ctx.fillText(overlay.text || "", nx, ny);
      ctx.shadowBlur = 0;
      ctx.restore();
    });
  };

  // keep preview up-to-date
  useEffect(() => {
    drawCanvas();
    // eslint-disable-next-line
  }, [tplImg, tplDims, photoImg, photoDims, photoX, photoY, photoScale, overlays]);

  // ============ UI ============
  // Responsive preview (scale canvas to fit max bounds, preserve aspect)
  const MAX_PREVW = 350, MAX_PREVH = 500;
  const aspect = tplDims.width && tplDims.height ? tplDims.width / tplDims.height : 1;
  let previewW = MAX_PREVW, previewH = MAX_PREVH;
  if (tplDims.width && tplDims.height) {
    const r = Math.min(MAX_PREVW / tplDims.width, MAX_PREVH / tplDims.height, 1);
    previewW = Math.round(tplDims.width * r);
    previewH = Math.round(tplDims.height * r);
  }

  // px <-> norm helpers
  const toNorm = (px: number, total: number) => Math.max(0, Math.min(1, px / total));
  const toPx = (n: number, total: number) => n * total;

  // Drag logic for photo
  const {
    bind: photoDragBind,
    isDragging: isPhotoDragging
  } = useDraggableOverlay(
    { x: photoX, y: photoY },
    ({ x, y }) => {
      setPhotoX(x);
      setPhotoY(y);
      setConfirmed(false);
    },
    {
      minX: 0, maxX: 1,
      minY: 0, maxY: 1,
    },
    previewW // scale drag delta to preview size
  );

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
    setOverlays([defaultOverlay]);
    setSelectedOverlay(0);
    setPhotoX(0.5);
    setPhotoY(0.5);
    setPhotoScale(1);
  }, [templateId]);

  // Add new overlay
  const handleAddTextOverlay = () => {
    setOverlays(arr => [
      ...arr,
      {
        text: "New Text",
        color: "#fff",
        font: "Playfair Display",
        size: 32,
        x: 0.5, y: 0.8,
        z: arr.length,
      }
    ]);
    setSelectedOverlay(overlays.length);
    setConfirmed(false);
  };

  // Remove overlay
  const handleRemoveOverlay = (idx: number) => {
    setOverlays(arr => arr.filter((_, i) => i !== idx));
    // select previous or first
    setSelectedOverlay(prev =>
      prev === idx
        ? Math.max(0, idx - 1)
        : (prev > idx ? prev - 1 : prev)
    );
    setConfirmed(false);
  };

  // Overlay controls update
  const handleOverlayChange = (idx: number, patch: Partial<TextOverlay>) => {
    setOverlays(arr => {
      const a = [...arr];
      a[idx] = { ...a[idx], ...patch };
      return a;
    });
    setConfirmed(false);
  };

  // Preview overlay selection by clicking in list or on overlay itself
  const handleOverlayPreviewClick = (idx: number) => {
    setSelectedOverlay(idx);
  };

  // ========== RENDER ==========
  return (
    <div className="w-full max-w-full">
      {/* Mobile Layout */}
      <div className="block lg:hidden">
        {/* Preview Section */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="relative mx-auto bg-white shrink-0 select-none touch-none mb-4"
            ref={previewRef}
            style={{
              width: Math.min(previewW, window.innerWidth - 40),
              height: Math.min(previewH, window.innerHeight * 0.5),
              borderRadius: 16,
              background: "#fff",
              boxShadow: "0 4px 24px 0 #0002",
              overflow: "hidden",
              userSelect: "none"
            }}
          >
            {/* Photo drag overlay */}
            {!!photoDataUrl && photoImg && (
              <div
                {...photoDragBind}
                style={{
                  position: "absolute",
                  left: toPx(photoX, Math.min(previewW, window.innerWidth - 40)) - (photoDims.width * photoScale * Math.min(previewW, window.innerWidth - 40) / tplDims.width) / 2,
                  top: toPx(photoY, Math.min(previewH, window.innerHeight * 0.5)) - (photoDims.height * photoScale * Math.min(previewH, window.innerHeight * 0.5) / tplDims.height) / 2,
                  width: (photoDims.width * photoScale * Math.min(previewW, window.innerWidth - 40) / tplDims.width),
                  height: (photoDims.height * photoScale * Math.min(previewH, window.innerHeight * 0.5) / tplDims.height),
                  background: "transparent",
                  zIndex: 2,
                  ...photoDragBind.style,
                  touchAction: "none"
                }}
                aria-label="Drag photo"
                tabIndex={-1}
              />
            )}
            {/* Drag handles and text overlays */}
            {[...overlays]
              .map((ovl, idx) => ({...ovl, _idx: idx}))
              .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
              .map((overlay, ix) => (
                <DraggableTextOverlay
                  key={overlay._idx}
                  overlay={overlay}
                  idx={overlay._idx}
                  previewW={Math.min(previewW, window.innerWidth - 40)}
                  previewH={Math.min(previewH, window.innerHeight * 0.5)}
                  tplDims={tplDims}
                  selected={selectedOverlay === overlay._idx}
                  onDrag={(i, x, y) => {
                    setOverlays(ovr => {
                      const arr = [...ovr];
                      arr[i] = { ...arr[i], x, y };
                      return arr;
                    });
                    setConfirmed(false);
                  }}
                  onClick={setSelectedOverlay}
                />
            ))}
            <canvas
              ref={canvasRef}
              width={tplDims.width}
              height={tplDims.height}
              style={{
                width: Math.min(previewW, window.innerWidth - 40),
                height: Math.min(previewH, window.innerHeight * 0.5),
                display: "block",
                borderRadius: 16,
                boxShadow: "0 4px 24px 0 #0002",
                background: "#fff",
                transition: "box-shadow 0.2s"
              }}
            />
            {(!templateImgUrl || !tplDims.width) && (
              <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-2xl text-lg font-semibold text-gray-500 z-10">Loading template...</div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center mb-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-primary px-4 py-3 rounded-lg text-white font-semibold flex gap-2 items-center hover:bg-primary/90 transition-colors text-sm"
            >
              <ImageIcon size={18} /> Upload Photo
            </button>
            <button
              onClick={() => setShowControls(!showControls)}
              className="bg-secondary px-4 py-3 rounded-lg text-secondary-foreground font-semibold flex gap-2 items-center hover:bg-secondary/80 transition-colors text-sm"
            >
              {showControls ? <X size={18} /> : <Plus size={18} />} 
              {showControls ? 'Hide' : 'Show'} Controls
            </button>
          </div>
        </div>

        {/* Collapsible Controls */}
        {showControls && (
          <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            
            {!!photoDataUrl && (
              <div className="mb-6">
                <h3 className="font-semibold text-sm mb-3 text-gray-700">Photo Position & Scale</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block text-gray-600">Position X</label>
                    <input
                      type="range"
                      min={0} max={1} step={0.01}
                      value={photoX}
                      disabled={!photoImg}
                      onChange={e => setPhotoX(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block text-gray-600">Position Y</label>
                    <input
                      type="range"
                      min={0} max={1} step={0.01}
                      value={photoY}
                      disabled={!photoImg}
                      onChange={e => setPhotoY(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block text-gray-600">Scale</label>
                    <input
                      type="range"
                      min={0.2} max={3} step={0.01}
                      value={photoScale}
                      disabled={!photoImg}
                      onChange={e => setPhotoScale(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-gray-700">Text Overlays</h3>
                <button
                  className="p-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
                  onClick={handleAddTextOverlay}
                  type="button"
                  aria-label="Add text overlay"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-3">
                {overlays.map((ovl, idx) => (
                  <div key={idx} onClick={() => handleOverlayPreviewClick(idx)}>
                    <TextOverlayEditor
                      overlay={ovl}
                      onChange={patch => handleOverlayChange(idx, patch)}
                      onDelete={overlays.length > 1 ? () => handleRemoveOverlay(idx) : undefined}
                      isSelected={selectedOverlay === idx}
                      maxOverlays={overlays.length}
                      overlays={overlays}
                      idx={idx}
                      setOverlays={setOverlays}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                className={`bg-primary px-4 py-3 rounded-lg text-white font-semibold transition-colors ${confirmed ? "bg-opacity-70 cursor-default" : "hover:bg-primary/90"}`}
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
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex gap-8 w-full max-w-full">
        {/* Left: controls */}
        <div className="flex flex-col gap-4 min-w-[280px] w-[320px]">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-primary px-4 py-3 rounded-lg text-white font-semibold mb-2 flex gap-2 items-center hover:bg-primary/90 transition-colors w-full"
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
                <label className="text-xs font-semibold mb-1 block">Photo Position (Drag or use sliders)</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-4">X:</span>
                    <input
                      type="range"
                      min={0} max={1} step={0.01}
                      value={photoX}
                      disabled={!photoImg}
                      onChange={e => setPhotoX(Number(e.target.value))}
                      className="accent-primary flex-1"
                    />
                    <span className="text-xs font-mono w-12">{photoX.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-4">Y:</span>
                    <input
                      type="range"
                      min={0} max={1} step={0.01}
                      value={photoY}
                      disabled={!photoImg}
                      onChange={e => setPhotoY(Number(e.target.value))}
                      className="accent-primary flex-1"
                    />
                    <span className="text-xs font-mono w-12">{photoY.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="mb-2">
                <label className="text-xs font-semibold mb-1 block">Photo Scale</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0.2} max={3} step={0.01}
                    value={photoScale}
                    disabled={!photoImg}
                    onChange={e => setPhotoScale(Number(e.target.value))}
                    className="accent-primary flex-1"
                  />
                  <span className="text-xs font-mono w-12">{photoScale.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
          <hr className="my-2" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Text Overlays</span>
            <button
              className="p-1 rounded border border-primary text-primary hover:bg-primary/10 transition-colors"
              onClick={handleAddTextOverlay}
              type="button"
              aria-label="Add text overlay"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {overlays.map((ovl, idx) => (
              <div
                key={idx}
                className="cursor-pointer"
                onClick={() => handleOverlayPreviewClick(idx)}
              >
                <TextOverlayEditor
                  overlay={ovl}
                  onChange={patch => handleOverlayChange(idx, patch)}
                  onDelete={overlays.length > 1 ? () => handleRemoveOverlay(idx) : undefined}
                  isSelected={selectedOverlay === idx}
                  maxOverlays={overlays.length}
                  overlays={overlays}
                  idx={idx}
                  setOverlays={setOverlays}
                />
              </div>
            ))}
          </div>
          <button
            className={`bg-primary px-4 py-3 rounded-lg text-white font-semibold my-2 w-full transition-colors ${confirmed ? "bg-opacity-70 cursor-default" : "hover:bg-primary/90"}`}
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

        {/* Right: Preview */}
        <div
          className="relative mx-auto bg-white shrink-0 select-none touch-none"
          ref={previewRef}
          style={{
            width: previewW,
            height: previewH,
            minWidth: 150,
            minHeight: 120,
            borderRadius: 24,
            background: "#fff",
            boxShadow: "0 4px 24px 0 #0002",
            overflow: "hidden",
            userSelect: "none"
          }}
        >
          {/* Photo drag overlay */}
          {!!photoDataUrl && photoImg && (
            <div
              {...photoDragBind}
              style={{
                position: "absolute",
                left: toPx(photoX, previewW) - (photoDims.width * photoScale * previewW / tplDims.width) / 2,
                top: toPx(photoY, previewH) - (photoDims.height * photoScale * previewH / tplDims.height) / 2,
                width: (photoDims.width * photoScale * previewW / tplDims.width),
                height: (photoDims.height * photoScale * previewH / tplDims.height),
                background: "transparent",
                zIndex: 2,
                ...photoDragBind.style,
                touchAction: "none"
              }}
              aria-label="Drag photo"
              tabIndex={-1}
            />
          )}
          {/* Drag handles and text overlays */}
          {[...overlays]
            .map((ovl, idx) => ({...ovl, _idx: idx}))
            .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
            .map((overlay, ix) => (
              <DraggableTextOverlay
                key={overlay._idx}
                overlay={overlay}
                idx={overlay._idx}
                previewW={previewW}
                previewH={previewH}
                tplDims={tplDims}
                selected={selectedOverlay === overlay._idx}
                onDrag={(i, x, y) => {
                  setOverlays(ovr => {
                    const arr = [...ovr];
                    arr[i] = { ...arr[i], x, y };
                    return arr;
                  });
                  setConfirmed(false);
                }}
                onClick={setSelectedOverlay}
              />
          ))}
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
    </div>
  );
};