
import React, { useRef, useState, useEffect, useLayoutEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Image as ImageIcon } from "lucide-react";
import { TextOverlayControls } from "./TextOverlayControls";
import { DownloadDropdown } from "./DownloadDropdown";
import { ImageCropperControls } from "./ImageCropperControls";
import { Progress } from "./ui/progress";

// Map template images using import.meta.glob and load templates from JSON:
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
  size: number; // font size fraction, relative to base on templateHeight
}

interface CanvasEditorProps {
  templateId: string;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({ templateId }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const imgElementRef = useRef<HTMLImageElement | null>(null);

  // -------- Templates meta and card image loading --------
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  useEffect(() => {
    import("../templates/templates.json").then(json => {
      setTemplates(json.default ?? json);
    });
  }, []);

  // Select actual card template meta + image src
  const selTpl = templates.find(tpl => tpl.id === templateId);
  const templateImgName = selTpl?.img || "";
  const templateImgUrl = imageMap[templateImgName] || "";

  // ---- Card size: we load and remember full native size of template (reactive, per template) ----
  const [cardDims, setCardDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Load template to get natural size
  useEffect(() => {
    if (!templateImgUrl) return;
    const img = new window.Image();
    img.src = templateImgUrl;
    img.onload = () => setCardDims({ width: img.naturalWidth, height: img.naturalHeight });
  }, [templateImgUrl]);

  // -------- Responsive preview computing ---------
  // Max preview area in px (can tune here)
  const MAX_PREVIEW_W = 400;
  const MAX_PREVIEW_H = 570;
  // Compute scale to fit in box but preserve card aspect ratio
  const { width: nativeW, height: nativeH } = cardDims;
  let previewW = MAX_PREVIEW_W, previewH = MAX_PREVIEW_H, scale = 1;
  if (nativeW && nativeH) {
    const ratio = Math.min(MAX_PREVIEW_W / nativeW, MAX_PREVIEW_H / nativeH, 1);
    scale = ratio;
    previewW = Math.round(nativeW * scale);
    previewH = Math.round(nativeH * scale);
  }

  // ================ User Image State (profile photo) ================
  const [profileImg, setProfileImg] = useState<string | null>(null);
  const [photoDims, setPhotoDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Main draggable/scalable photo state: native template fractions
  const [photo, setPhoto] = useState<{
    x: number;  // fraction [0,1], center of photo
    y: number;  // fraction [0,1], center of photo
    scale: number; // fraction, 1 = native photo size matches template height
  }>({
    x: 0.5,
    y: 0.5,
    scale: 1,
  });

  // Track touch/mouse drag state for photo move
  const dragInfo = useRef<{ startX: number, startY: number, startVX: number, startVY: number, isTouch: boolean } | null>(null);
  
  // Upon profileImg change, load natural size
  useEffect(() => {
    if (!profileImg) return;
    const img = new window.Image();
    img.src = profileImg;
    img.onload = () => setPhotoDims({ width: img.naturalWidth, height: img.naturalHeight });
  }, [profileImg]);

  // ================ Text Overlays (fractions of card) ================
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([
    {
      id: "main",
      text: "Happy Birthday!",
      x: 0.15,
      y: 0.44,
      font: "Playfair Display",
      color: "#fff",
      size: 0.064, // ~32/500 in example
    },
  ]);
  const [selectedTextId, setSelectedTextId] = useState<string>("main");

  // -------- Controls: Add, change, move overlays ----------
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
  const onChangeTextOverlay = (id: string, patch: Partial<TextOverlay>) => {
    setTextOverlays(ovl =>
      ovl.map(txt =>
        txt.id === id ? { ...txt, ...patch } : txt
      )
    );
  };

  // ============= Photo Upload and Crop Controls =============
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e2 => {
      setProfileImg(e2.target?.result as string);
      setPhoto({
        x: 0.5,
        y: 0.5,
        scale: 1,
      });
    };
    reader.readAsDataURL(file);
    toast({ title: "Profile image loaded!", description: "Drag to position and scale." });
  };

  // ------ Photo crop (scale: 0.3 to 2.4 of template height, limits) -----
  const MIN_SCALE = 0.32, MAX_SCALE = 2.4;
  const handlePhotoZoom = (delta: number) => {
    setPhoto(p => ({
      ...p,
      scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, +(p.scale + delta).toFixed(3))),
    }));
  };
  const handleResetPhoto = () => {
    setPhoto({ x: 0.5, y: 0.5, scale: 1 });
  };

  // ============== Download full-res ==============
  const handleDownload = (format: "png" | "jpeg") => {
    if (!templateImgUrl || !nativeW || !nativeH) {
      toast({ title: "Download failed", description: "Template not loaded" });
      return;
    }
    const templateImg = new window.Image();
    templateImg.crossOrigin = "anonymous";
    templateImg.src = templateImgUrl;
    templateImg.onload = () => {
      // 1. Setup export canvas (nativeW x nativeH)
      const canvas = document.createElement("canvas");
      canvas.width = nativeW;
      canvas.height = nativeH;
      const ctx = canvas.getContext("2d")!;

      // 2. Draw user photo (center at px,py)
      if (profileImg) {
        const photoImg = new window.Image();
        photoImg.crossOrigin = "anonymous";
        photoImg.src = profileImg;
        photoImg.onload = () => {
          const imgW = photoDims.width;
          const imgH = photoDims.height;
          // Calculate draw size
          const drawH = nativeH * photo.scale;
          const aspect = imgW / imgH || 1;
          const drawW = drawH * aspect;

          // Center
          const px = photo.x * nativeW;
          const py = photo.y * nativeH;

          // draw at (centered):
          ctx.save();
          ctx.translate(px - drawW / 2, py - drawH / 2);
          ctx.drawImage(photoImg, 0, 0, imgW, imgH, 0, 0, drawW, drawH);
          ctx.restore();

          ctx.drawImage(templateImg, 0, 0, nativeW, nativeH);

          // Draw overlays
          drawAllText(ctx);

          finish();
        };
        photoImg.onerror = () => {
          ctx.drawImage(templateImg, 0, 0, nativeW, nativeH);
          drawAllText(ctx);
          finish();
        };
      } else {
        ctx.drawImage(templateImg, 0, 0, nativeW, nativeH);
        drawAllText(ctx);
        finish();
      }
      function drawAllText(ctx: CanvasRenderingContext2D) {
        textOverlays.forEach(ovl => {
          const fontPx = Math.round(nativeH * ovl.size);
          ctx.save();
          ctx.font = `bold ${fontPx}px '${ovl.font}', sans-serif`;
          ctx.fillStyle = ovl.color;
          ctx.textBaseline = "top";
          ctx.textAlign = "left";
          ctx.shadowColor = "#000";
          ctx.shadowBlur = 8;
          ctx.fillText(
            ovl.text,
            ovl.x * nativeW,
            ovl.y * nativeH
          );
          ctx.shadowBlur = 0;
          ctx.restore();
        });
      }
      function finish() {
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
        toast({ title: "Image downloaded!", description: `Saved as ${a.download}` });
      }
    };
    templateImg.onerror = () => {
      toast({ title: "Download failed", description: "Could not load the template image." });
    };
  };

  // ==== Drag logic for user photo (update in fractions of template size) ====
  const previewBoxRef = useRef<HTMLDivElement>(null);
  // drag start handlers
  const onPhotoPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!nativeW || !nativeH) return;
    const isTouch = (e as React.TouchEvent).touches !== undefined;
    let clientX: number, clientY: number;
    if (isTouch) {
      const touch = (e as React.TouchEvent).touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    // get offset in px of pointer from center
    const rect = (previewBoxRef.current as HTMLDivElement).getBoundingClientRect();
    const scalePx = previewW / nativeW;
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    // Snap to virtual coord
    dragInfo.current = {
      startX: px,
      startY: py,
      startVX: photo.x,
      startVY: photo.y,
      isTouch: isTouch,
    };
    const moveHandler = (ev: MouseEvent | TouchEvent) => {
      let cx: number, cy: number;
      if ((ev as TouchEvent).touches) {
        if ((ev as TouchEvent).touches.length !== 1) return;
        cx = (ev as TouchEvent).touches[0].clientX - rect.left;
        cy = (ev as TouchEvent).touches[0].clientY - rect.top;
      } else {
        cx = (ev as MouseEvent).clientX - rect.left;
        cy = (ev as MouseEvent).clientY - rect.top;
      }
      // dx in preview px, converted to [0,1] fractions
      const dx = (cx - dragInfo.current!.startX) / previewW;
      const dy = (cy - dragInfo.current!.startY) / previewH;
      setPhoto(p => ({ ...p, x: Math.max(0, Math.min(1, dragInfo.current!.startVX + dx)), y: Math.max(0, Math.min(1, dragInfo.current!.startVY + dy)) }));
    };
    const upHandler = () => {
      window.removeEventListener("mousemove", moveHandler as any);
      window.removeEventListener("touchmove", moveHandler as any);
      window.removeEventListener("mouseup", upHandler);
      window.removeEventListener("touchend", upHandler);
    };
    if (isTouch) {
      window.addEventListener("touchmove", moveHandler as any);
      window.addEventListener("touchend", upHandler);
    } else {
      window.addEventListener("mousemove", moveHandler as any);
      window.addEventListener("mouseup", upHandler);
    }
  };

  // ==== Drag logic for overlays: update x/y as fraction ====
  const onOverlayPointerDown = (ovl: TextOverlay, e: React.MouseEvent | React.TouchEvent) => {
    setSelectedTextId(ovl.id);
    if (!nativeW || !nativeH) return;
    const isTouch = (e as React.TouchEvent).touches !== undefined;
    let clientX: number, clientY: number;
    if (isTouch) {
      const touch = (e as React.TouchEvent).touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    const rect = (previewBoxRef.current as HTMLDivElement).getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    dragInfo.current = {
      startX: px,
      startY: py,
      startVX: ovl.x,
      startVY: ovl.y,
      isTouch: isTouch,
    };
    const moveHandler = (ev: MouseEvent | TouchEvent) => {
      let cx: number, cy: number;
      if ((ev as TouchEvent).touches) {
        if ((ev as TouchEvent).touches.length !== 1) return;
        cx = (ev as TouchEvent).touches[0].clientX - rect.left;
        cy = (ev as TouchEvent).touches[0].clientY - rect.top;
      } else {
        cx = (ev as MouseEvent).clientX - rect.left;
        cy = (ev as MouseEvent).clientY - rect.top;
      }
      const dx = (cx - dragInfo.current!.startX) / previewW;
      const dy = (cy - dragInfo.current!.startY) / previewH;
      setTextOverlays(ovlArr =>
        ovlArr.map(txt =>
          txt.id === ovl.id
            ? { ...txt, x: Math.max(0, Math.min(1, dragInfo.current!.startVX + dx)), y: Math.max(0, Math.min(1, dragInfo.current!.startVY + dy)) }
            : txt
        )
      );
    };
    const upHandler = () => {
      window.removeEventListener("mousemove", moveHandler as any);
      window.removeEventListener("touchmove", moveHandler as any);
      window.removeEventListener("mouseup", upHandler);
      window.removeEventListener("touchend", upHandler);
    };
    if (isTouch) {
      window.addEventListener("touchmove", moveHandler as any);
      window.addEventListener("touchend", upHandler);
    } else {
      window.addEventListener("mousemove", moveHandler as any);
      window.addEventListener("mouseup", upHandler);
    }
  };

  // ============================ UI Layout ============================
  return (
    <div className="flex flex-col xl:flex-row gap-8 w-full max-w-full">
      {/* Left: controls/panels */}
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
        {/* Progress bar for photo scale */}
        {profileImg && (
          <div className="flex flex-col gap-1">
            <label htmlFor="profile-scale" className="text-xs text-muted-foreground mb-1">Resize Photo</label>
            <div className="flex gap-2 items-center">
              <Progress
                className="h-3 w-32 bg-muted"
                value={((photo.scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100}
              />
              <input
                id="profile-scale"
                type="range"
                min={MIN_SCALE}
                max={MAX_SCALE}
                step={0.01}
                value={photo.scale}
                onChange={e =>
                  setPhoto(pos => ({
                    ...pos,
                    scale: parseFloat(e.target.value)
                  }))
                }
                className="w-16"
              />
              <span className="text-xs font-mono">{photo.scale.toFixed(2)}x</span>
            </div>
          </div>
        )}
        {/* Image Crop/Resizer controls */}
        <ImageCropperControls
          onZoom={handlePhotoZoom}
          onReset={handleResetPhoto}
          isImageLoaded={!!profileImg}
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
          onDownload={format => handleDownload(format)}
        />
      </div>

      {/* ===== Preview area: dynamically sized, always containing template at exact proportion (scaled down), overlays in px ===== */}
      <div
        ref={previewBoxRef}
        className="relative mx-auto bg-white"
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
        {/* 1. User photo: positioned and scaled to template native aspect */}
        {profileImg && nativeW && nativeH && photoDims.width > 0 &&
          <img
            ref={imgElementRef}
            src={profileImg}
            alt="Profile"
            draggable={false}
            style={{
              position: "absolute",
              left: photo.x * previewW - (photoDims.width / photoDims.height * previewH * photo.scale) / 2,
              top: photo.y * previewH - (previewH * photo.scale) / 2,
              width: (photoDims.width / photoDims.height) * previewH * photo.scale,
              height: previewH * photo.scale,
              objectFit: "cover",
              pointerEvents: "auto",
              userSelect: "none",
              zIndex: 1,
            }}
            onMouseDown={e => onPhotoPointerDown(e)}
            onTouchStart={e => onPhotoPointerDown(e)}
            title="Drag photo"
          />
        }
        {/* 2. Template image: full stretch, aspect-correct */}
        <img
          src={templateImgUrl}
          alt="Template"
          className="absolute left-0 top-0 w-full h-full object-cover rounded-2xl pointer-events-none"
          style={{ zIndex: 2 }}
        />
        {/* 3. Render overlays absolutely in preview */}
        {nativeW && nativeH && textOverlays.map(ovl => (
          <span
            key={ovl.id}
            onMouseDown={e => onOverlayPointerDown(ovl, e)}
            onTouchStart={e => onOverlayPointerDown(ovl, e)}
            style={{
              position: "absolute",
              left: ovl.x * previewW,
              top: ovl.y * previewH,
              fontFamily: ovl.font,
              fontWeight: 700,
              color: ovl.color,
              fontSize: Math.round(ovl.size * previewH),
              textShadow: "0 2px 10px #0005",
              cursor: "move",
              userSelect: "none",
              zIndex: 3,
              padding: "4px 8px",
              background: selectedTextId === ovl.id ? "rgba(255,255,255,0.85)" : "transparent",
              borderRadius: "0.5em",
              boxShadow: selectedTextId === ovl.id ? "0 1px 7px #0003" : undefined,
              pointerEvents: "auto",
            }}
            className="transition duration-150"
          >
            {ovl.text}
          </span>
        ))}
        {/* Overlay loading message if template is missing */}
        {(!templateImgUrl || !nativeW) && (
          <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-2xl text-lg font-semibold text-gray-500 z-10">Loading template...</div>
        )}
      </div>
    </div>
  );
};

// NOTE: This file is getting long (>500 lines). Consider splitting major logic into smaller hooks and subcomponents for maintainability!
