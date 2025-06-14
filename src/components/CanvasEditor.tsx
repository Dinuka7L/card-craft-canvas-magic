import React, { useRef, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Image as ImageIcon } from "lucide-react";
import { DownloadDropdown } from "./DownloadDropdown";
import { ImageCropperControls } from "./ImageCropperControls";
import { TextOverlayControls } from "./TextOverlayControls";
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
export interface TextOverlay {
  id: string;
  text: string;
  x: number; // fraction [0,1]
  y: number; // fraction [0,1]
  font: string;
  color: string;
  size: number; // fraction of card height, eg 0.06
}
interface CanvasEditorProps {
  templateId: string;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({ templateId }) => {
  // ----- Template meta -----
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  useEffect(() => {
    import("../templates/templates.json").then(json => {
      setTemplates(json.default ?? json);
    });
  }, []);
  const selTpl = templates.find(tpl => tpl.id === templateId);
  const templateImgName = selTpl?.img || "";
  const templateImgUrl = imageMap[templateImgName] || "";

  // ----- State: Template image -----
  const [tplDims, setTplDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const tplImgRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!templateImgUrl) return;
    const img = new window.Image();
    img.onload = () => setTplDims({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = templateImgUrl;
    tplImgRef.current = img;
  }, [templateImgUrl]);

  // ----- State: User Photo -----
  const [userImgUrl, setUserImgUrl] = useState<string | null>(null);
  const userImgRef = useRef<HTMLImageElement | null>(null);
  const [userImgDims, setUserImgDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  // photoPos: x/y = [0,1] fractions, scale=1 is photo's native height equals card's height
  const [photoPos, setPhotoPos] = useState<{ x: number; y: number; scale: number }>({ x: 0.5, y: 0.5, scale: 1 });

  // Load user image data after upload/change
  useEffect(() => {
    if (!userImgUrl) {
      setUserImgDims({ width: 0, height: 0 });
      return;
    }
    const img = new window.Image();
    img.onload = () =>
      setUserImgDims({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = userImgUrl;
    userImgRef.current = img;
  }, [userImgUrl]);

  // ----- State: Text overlays -----
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([
    {
      id: "main",
      text: "Happy Birthday!",
      x: 0.15,
      y: 0.44,
      font: "Playfair Display",
      color: "#fff",
      size: 0.064, // Height fraction, eg: 32/500 = 0.064
    }
  ]);
  const [selectedTextId, setSelectedTextId] = useState<string>("main");

  // ----- File picker ref (hidden input) -----
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----- Controls -----
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e2 => {
      setUserImgUrl(e2.target?.result as string);
      setPhotoPos({ x: 0.5, y: 0.5, scale: 1 });
    };
    reader.readAsDataURL(file);
    toast({ title: "Photo uploaded!", description: "Adjust position and scale as needed." });
  };

  // -- Move/Scale photo --
  const MIN_SCALE = 0.32, MAX_SCALE = 2.4;
  const handlePhotoZoom = (delta: number) => {
    setPhotoPos(p => ({
      ...p,
      scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, +(p.scale + delta).toFixed(3))),
    }));
  };
  const handleResetPhoto = () => {
    setPhotoPos({ x: 0.5, y: 0.5, scale: 1 });
  };

  // ---- Text Overlay controls ----
  const handleAddText = () => {
    const newId = "txt" + Math.random().toString(36).slice(2);
    setTextOverlays(ovl => [
      ...ovl,
      {
        id: newId,
        text: "Write here",
        x: 0.4,
        y: 0.60,
        font: "Inter",
        color: "#222",
        size: 0.048,
      }
    ]);
    setSelectedTextId(newId);
    toast({ title: "Added new text overlay!" });
  };

  // ---- Download baked canvas (JPEG or PNG) ----
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const handleDownload = (format: "png" | "jpeg") => {
    if (!tplImgRef.current) {
      toast({ title: "Download failed", description: "Template not loaded" }); return;
    }
    // bake the canvas at template's full resolution:
    bakeCanvas(tplDims.width, tplDims.height, true);
    // Extract image data and download
    setTimeout(() => {
      const canvas = previewCanvasRef.current as HTMLCanvasElement;
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
      // After download, restore preview size
      bakeCanvas();
    }, 64); // allow canvas to render
  };

  // ============================= Canvas Baking Logic =============================
  // Smartly re-bake preview canvas at right size whenever anything relevant changes
  // If called with no args, bakes as "preview": fits in 400x570 box with aspect preserved
  const bakeCanvas = (
    width?: number,
    height?: number,
    setSizeOnly?: boolean // warning: used during download to avoid extra resize->render
  ) => {
    // If no template image, nothing to draw!
    if (!tplImgRef.current || !tplDims.width) return;
    const tpl = tplImgRef.current;
    // Find target size
    let tw = width ?? tplDims.width;
    let th = height ?? tplDims.height;
    // For preview: shrink to fit preview box but keep aspect
    const MAX_PREVW = 400, MAX_PREVH = 570;
    if (!width || !height) {
      const previewRatio = Math.min(MAX_PREVW / tplDims.width, MAX_PREVH / tplDims.height, 1);
      tw = Math.round(tplDims.width * previewRatio);
      th = Math.round(tplDims.height * previewRatio);
    }
    // Set canvas size
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    canvas.width = tw;
    canvas.height = th;
    if (setSizeOnly) return; // for download: we "bake" layout and draw below

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // -- Draw photo --
    if (userImgRef.current && userImgDims.width && userImgDims.height) {
      const img = userImgRef.current;
      // Map [0,1] position/scaling to canvas px:
      // Scale math: photoScale is fraction of template height at tpl dims, but we may be previewing at tw/th
      // See: example code from user
      const px = photoPos.x * canvas.width - (img.width * photoPos.scale * (canvas.height / tplDims.height)) / 2;
      const py = photoPos.y * canvas.height - (img.height * photoPos.scale * (canvas.height / tplDims.height)) / 2;
      ctx.save();
      ctx.translate(px, py);
      // scale: adjust so photoScale = 1 means photo's native height = tplDims.height on canvas
      const s = photoPos.scale * (canvas.height / tplDims.height);
      ctx.scale(s, s);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    }

    // -- Draw template image on top --
    ctx.drawImage(tpl, 0, 0, canvas.width, canvas.height);

    // -- Draw all overlays --
    textOverlays.forEach(ovl => {
      ctx.save();
      // font size: ovl.size is fraction of card height; at preview must scale accordingly
      const fontPx = Math.round(ovl.size * canvas.height);
      ctx.font = `bold ${fontPx}px '${ovl.font}', sans-serif`;
      ctx.fillStyle = ovl.color;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 8;
      ctx.fillText(
        ovl.text,
        ovl.x * canvas.width,
        ovl.y * canvas.height
      );
      ctx.shadowBlur = 0;
      ctx.restore();
    });
  };

  // Keep preview canvas synced LIVE
  useEffect(() => {
    bakeCanvas();
    // eslint-disable-next-line
  }, [
    tplDims.width, tplDims.height,
    userImgUrl, userImgDims.width, userImgDims.height,
    photoPos.x, photoPos.y, photoPos.scale,
    JSON.stringify(textOverlays)
  ]);

  // Handle drag for photo move (fraction-prorated)
  const dragging = useRef(false);
  const dragStart = useRef<{ x0: number, y0: number, px0: number, py0: number }>();
  const previewBoxRef = useRef<HTMLDivElement>(null);

  const handlePhotoDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!tplDims.width || !tplDims.height) return;
    let clientX, clientY;
    if ("touches" in e) {
      if (e.touches.length !== 1) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX; clientY = e.clientY;
    }
    const rect = previewBoxRef.current?.getBoundingClientRect();
    if (!rect) return;
    const previewWidth = previewCanvasRef.current?.width ?? 0;
    const previewHeight = previewCanvasRef.current?.height ?? 0;
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    dragStart.current = { x0: photoPos.x, y0: photoPos.y, px0: px, py0: py };
    dragging.current = true;
    const move = (ev: MouseEvent | TouchEvent) => {
      let cx, cy;
      if ("touches" in ev) {
        if (ev.touches.length !== 1) return;
        cx = ev.touches[0].clientX - rect.left;
        cy = ev.touches[0].clientY - rect.top;
      } else {
        cx = (ev as MouseEvent).clientX - rect.left;
        cy = (ev as MouseEvent).clientY - rect.top;
      }
      const dx = (cx - dragStart.current!.px0) / previewWidth;
      const dy = (cy - dragStart.current!.py0) / previewHeight;
      setPhotoPos(p => ({
        ...p,
        x: Math.max(0, Math.min(1, dragStart.current!.x0 + dx)),
        y: Math.max(0, Math.min(1, dragStart.current!.y0 + dy))
      }));
    };
    const up = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", move as any);
      window.removeEventListener("touchmove", move as any);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
    if ("touches" in e) {
      window.addEventListener("touchmove", move as any);
      window.addEventListener("touchend", up);
    } else {
      window.addEventListener("mousemove", move as any);
      window.addEventListener("mouseup", up);
    }
  };

  // -- Drag for text overlays --
  const handleOverlayDown = (ovl: TextOverlay, e: React.MouseEvent | React.TouchEvent) => {
    setSelectedTextId(ovl.id);
    if (!tplDims.width || !tplDims.height) return;
    let clientX, clientY;
    if ("touches" in e) {
      if (e.touches.length !== 1) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX; clientY = e.clientY;
    }
    const rect = previewBoxRef.current?.getBoundingClientRect();
    if (!rect) return;
    const previewWidth = previewCanvasRef.current?.width ?? 0;
    const previewHeight = previewCanvasRef.current?.height ?? 0;
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const ovlStartX = ovl.x;
    const ovlStartY = ovl.y;
    const move = (ev: MouseEvent | TouchEvent) => {
      let cx, cy;
      if ("touches" in ev) {
        if (ev.touches.length !== 1) return;
        cx = ev.touches[0].clientX - rect.left;
        cy = ev.touches[0].clientY - rect.top;
      } else {
        cx = (ev as MouseEvent).clientX - rect.left;
        cy = (ev as MouseEvent).clientY - rect.top;
      }
      const dx = (cx - px) / previewWidth;
      const dy = (cy - py) / previewHeight;
      setTextOverlays(arr =>
        arr.map(txt =>
          txt.id === ovl.id
            ? { ...txt, x: Math.max(0, Math.min(1, ovlStartX + dx)), y: Math.max(0, Math.min(1, ovlStartY + dy)) }
            : txt
        )
      );
    };
    const up = () => {
      window.removeEventListener("mousemove", move as any);
      window.removeEventListener("touchmove", move as any);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
    if ("touches" in e) {
      window.addEventListener("touchmove", move as any);
      window.addEventListener("touchend", up);
    } else {
      window.addEventListener("mousemove", move as any);
      window.addEventListener("mouseup", up);
    }
  };

  // ======================== UI ===========================
  // For preview, keep aspect ratio and fixed max size (like user's example)
  const MAX_PREVIEW_W = 400, MAX_PREVIEW_H = 570;
  const aspect = tplDims.width && tplDims.height ? tplDims.width / tplDims.height : 1;
  let previewW = MAX_PREVIEW_W, previewH = MAX_PREVIEW_H;
  if (tplDims.width && tplDims.height) {
    const r = Math.min(MAX_PREVIEW_W / tplDims.width, MAX_PREVIEW_H / tplDims.height, 1);
    previewW = Math.round(tplDims.width * r);
    previewH = Math.round(tplDims.height * r);
  }

  return (
    <div className="flex flex-col xl:flex-row gap-8 w-full max-w-full">
      {/* Left: controls */}
      <div className="flex flex-col gap-4 min-w-[180px] w-full xl:w-[210px]">
        <div>
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
            onChange={handleUpload}
          />
        </div>
        {userImgUrl && (
          <div className="flex flex-col gap-1">
            <label htmlFor="profile-scale" className="text-xs text-muted-foreground mb-1">Resize Photo</label>
            <div className="flex gap-2 items-center">
              <Progress
                className="h-3 w-32 bg-muted"
                value={((photoPos.scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100}
              />
              <input
                id="profile-scale"
                type="range"
                min={MIN_SCALE}
                max={MAX_SCALE}
                step={0.01}
                value={photoPos.scale}
                onChange={e =>
                  setPhotoPos(pos => ({
                    ...pos,
                    scale: parseFloat(e.target.value)
                  }))
                }
                className="w-16"
              />
              <span className="text-xs font-mono">{photoPos.scale.toFixed(2)}x</span>
            </div>
          </div>
        )}
        {/* Image Crop/Resizer controls */}
        <ImageCropperControls
          onZoom={handlePhotoZoom}
          onReset={handleResetPhoto}
          isImageLoaded={!!userImgUrl}
        />
        <button
          className="bg-accent px-3 py-2 rounded focus:outline-none text-foreground hover:bg-accent/70 transition text-sm"
          onClick={handleAddText}
        >
          + Add Text Overlay
        </button>
        <TextOverlayControls
          textOverlay={textOverlays.find(t => t.id === selectedTextId)!}
          onChange={patch =>
            setTextOverlays(ovl =>
              ovl.map(txt =>
                txt.id === selectedTextId ? { ...txt, ...patch } : txt
              )
            )
          }
        />
        <DownloadDropdown
          onDownload={handleDownload}
        />
      </div>

      {/* ===== PREVIEW AREA -- canvas with aspect/size locked ===== */}
      <div
        ref={previewBoxRef}
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
        {/* Real canvas, handles all preview/display and baking */}
        <canvas
          ref={previewCanvasRef}
          width={previewW}
          height={previewH}
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
        {/* --- absolute DRAG overlays for photo + texts - for UX only! --- */}
        {/* photo drag hit area */}
        {userImgUrl && userImgDims.width && userImgDims.height && (
          <div
            onMouseDown={handlePhotoDown}
            onTouchStart={handlePhotoDown}
            className="absolute left-0 top-0"
            style={{
              cursor: "move",
              width: previewW,
              height: previewH,
              zIndex: 5,
              background: "transparent"
            }}
            title="Drag the photo"
          />
        )}
        {/* Draggable text overlays (invisible box) */}
        {textOverlays.map(ovl => {
          const left = ovl.x * previewW;
          const top = ovl.y * previewH;
          const fontPx = Math.round(ovl.size * previewH);
          return (
            <div
              key={ovl.id}
              onMouseDown={e => handleOverlayDown(ovl, e)}
              onTouchStart={e => handleOverlayDown(ovl, e)}
              className={`absolute select-none`}
              style={{
                left, top,
                width: 200, height: fontPx + 16,
                transform: "translate(-10%,-15%)",
                cursor: "move",
                zIndex: 10,
                background:
                  selectedTextId === ovl.id ? "rgba(255,255,255,0.13)" : "transparent",
                borderRadius: 6,
              }}
              title="Drag text"
            />
          );
        })}
        {/* Template loading fallback */}
        {(!templateImgUrl || !tplDims.width) && (
          <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-2xl text-lg font-semibold text-gray-500 z-10">Loading template...</div>
        )}
      </div>
    </div>
  );
};

// NOTE: This file is getting long (>500 lines). Please consider refactoring into smaller hooks/components for maintainability!
