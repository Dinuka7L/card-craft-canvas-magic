import React, { useRef, useState, useEffect } from "react";
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
  x: number;
  y: number;
  font: string;
  color: string;
  size: number;
}

interface CanvasEditorProps {
  templateId: string;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({ templateId }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [profileImg, setProfileImg] = useState<string | null>(null);
  const [imgPos, setImgPos] = useState({ x: 0, y: 0, scale: 1 });
  const [imgInit, setImgInit] = useState({ x: 0, y: 0, scale: 1 }); // for reset
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([
    {
      id: "main",
      text: "Happy Birthday!",
      x: 40,
      y: 220,
      font: "Playfair Display",
      color: "#fff",
      size: 32,
    },
  ]);
  const [selectedTextId, setSelectedTextId] = useState<string>("main");

  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  useEffect(() => {
    import("../templates/templates.json").then(json => {
      setTemplates(json.default ?? json);
    });
  }, []);

  // Canvas size
  const CANVAS_W = 350, CANVAS_H = 500;
  const [dragMode, setDragMode] = useState<"move" | "none">("none");

  // Drag/move image (profile photo)
  const handleImgMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragMode("move");
    setIsDragging(true);
    setDragStart({
      x: e.clientX - imgPos.x,
      y: e.clientY - imgPos.y,
    });
  };
  const handleImgTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setDragMode("move");
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - imgPos.x,
      y: touch.clientY - imgPos.y,
    });
  };
  const handleMouseUp = () => {
    setDragMode("none");
    setIsDragging(false);
  };
  const handleMouseMove = (e: MouseEvent) => {
    if (dragMode !== "move" || !isDragging || !dragStart) return;
    setImgPos(pos => ({
      ...pos,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  };
  const handleTouchMove = (e: TouchEvent) => {
    if (dragMode !== "move" || !isDragging || !dragStart) return;
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setImgPos(pos => ({
      ...pos,
      x: touch.clientX - dragStart.x,
      y: touch.clientY - imgPos.y,
    }));
  };
  const handleTouchEnd = () => {
    setDragMode("none");
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("touchmove", handleTouchMove);
    }
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
    // eslint-disable-next-line
  }, [isDragging, dragMode, dragStart]);

  // Handle image upload
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e2 => {
      setProfileImg(e2.target?.result as string);
      // Reset position/scale so the image fills the canvas at scale 1
      setImgPos({ x: 0, y: 0, scale: 1 });
      setImgInit({ x: 0, y: 0, scale: 1 });
    };
    reader.readAsDataURL(file);
    toast({ title: "Profile image loaded!", description: "Drag to position." });
  };

  // For cropping/zooming
  const handleZoom = (delta: number) => {
    setImgPos(pos => ({
      ...pos,
      scale: Math.max(0.1, Math.min(3, +(pos.scale + delta).toFixed(2))),
    }));
  };
  const handleResetImg = () => {
    setImgPos(imgInit);
  };

  // Add new text overlay
  const handleAddText = () => {
    const newId = "txt" + Math.random().toString(36).slice(2);
    setTextOverlays(ovl => [
      ...ovl,
      {
        id: newId,
        text: "Write here",
        x: 100,
        y: 300,
        font: "Inter",
        color: "#222",
        size: 24,
      }
    ]);
    setSelectedTextId(newId);
    toast({ title: "Added new text overlay!" });
  };

  // Download/export the canvas in the selected format
  const handleDownload = (format: "png" | "jpeg") => {
    const selTpl = templates.find(tpl => tpl.id === templateId);
    const templateImgName = selTpl?.img || "";
    const templateSrc = imageMap[templateImgName] || "";

    if (!templateSrc) {
      toast({ title: "Download failed", description: "Template image not found." });
      return;
    }

    // Load template at native resolution first
    const templateImg = new window.Image();
    templateImg.crossOrigin = "anonymous";
    templateImg.src = templateSrc;

    templateImg.onload = () => {
      const ORIG_W = templateImg.naturalWidth || templateImg.width;
      const ORIG_H = templateImg.naturalHeight || templateImg.height;

      // Final export canvas matches template's native size
      const canvas = document.createElement("canvas");
      canvas.width = ORIG_W;
      canvas.height = ORIG_H;
      const ctx = canvas.getContext("2d")!;

      // Helper to draw all overlays
      function drawAllTextOverlay(ctx: CanvasRenderingContext2D) {
        textOverlays.forEach(ovl => {
          // All overlay positions/sizes are relative to preview CANVAS_W/CANVAS_H
          // To export, always use relative fractions!
          const relX = ovl.x / CANVAS_W;
          const relY = ovl.y / CANVAS_H;
          const fontSizePx = ovl.size / CANVAS_H * ORIG_H;
          ctx.save();
          ctx.font = `bold ${fontSizePx}px '${ovl.font}', sans-serif`;
          ctx.fillStyle = ovl.color;
          ctx.textBaseline = "top";
          ctx.textAlign = "left";
          ctx.shadowColor = "#000";
          ctx.shadowBlur = 8;
          ctx.fillText(
            ovl.text,
            relX * ORIG_W,
            relY * ORIG_H
          );
          ctx.shadowBlur = 0;
          ctx.restore();
        });
      }

      function finishExport() {
        // Draw user photo at *centered* position and scaled, using fractions!
        // This matches the math in the "example" provided:
        // - Center = (imgPos.x + 0.5*CANVAS_W, imgPos.y + 0.5*CANVAS_H), all in preview
        // - Scale acts as a "zoom", stretches around the center point

        if (profileImg) {
          const photo = new window.Image();
          photo.crossOrigin = "anonymous";
          photo.src = profileImg;

          photo.onload = () => {
            // Fractional center point in preview [0..1]
            const centerX = (imgPos.x + CANVAS_W / 2) / CANVAS_W;
            const centerY = (imgPos.y + CANVAS_H / 2) / CANVAS_H;

            // Exact center in *export* canvas px
            const px = centerX * ORIG_W;
            const py = centerY * ORIG_H;

            // "Unscaled" photo dimension at export size
            const exportW = ORIG_W * imgPos.scale;
            const exportH = ORIG_H * imgPos.scale;

            // For correct aspect ratio, we want to cover the area by cropping the photo)
            // To mimic the preview:
            // - Resize the photo so that it fills the card (template)
            // - The width and height used for drawing depend on imgPos.scale
            // - Draw the user photo so that its center aligns with [px, py]
            // - Place with top-left at (px - exportW / 2, py - exportH / 2)

            ctx.save();
            ctx.translate(px - exportW / 2, py - exportH / 2);
            ctx.drawImage(
              photo,
              0,
              0,
              photo.naturalWidth,
              photo.naturalHeight,
              0,
              0,
              exportW,
              exportH
            );
            ctx.restore();

            // Draw template on top
            ctx.drawImage(templateImg, 0, 0, ORIG_W, ORIG_H);

            // Draw overlays
            drawAllTextOverlay(ctx);

            // Download
            downloadExported(canvas, format);
          };
          photo.onerror = () => {
            ctx.drawImage(templateImg, 0, 0, ORIG_W, ORIG_H);
            drawAllTextOverlay(ctx);
            downloadExported(canvas, format);
          };
        } else {
          // Only template and overlays
          ctx.drawImage(templateImg, 0, 0, ORIG_W, ORIG_H);
          drawAllTextOverlay(ctx);
          downloadExported(canvas, format);
        }
      }

      function downloadExported(canvas: HTMLCanvasElement, format: "png" | "jpeg") {
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

      finishExport();
    };

    templateImg.onerror = () => {
      toast({ title: "Download failed", description: "Could not load the template image." });
    };
  };

  // onChange for text overlays
  const onChangeTextOverlay = (id: string, patch: Partial<TextOverlay>) => {
    setTextOverlays(ovl =>
      ovl.map(txt =>
        txt.id === id ? { ...txt, ...patch } : txt
      )
    );
  };

  // Load actual selected template image
  const selTpl = templates.find(tpl => tpl.id === templateId);
  const templateImgName = selTpl?.img || "";
  const templateImg = imageMap[templateImgName] || "";

  // New: Range for scale adjustment (used as progress bar)
  const MIN_SCALE = 0.3, MAX_SCALE = 2.0;

  return (
    <div className="flex flex-col xl:flex-row gap-8 w-full max-w-full">
      {/* Left: controls for uploading, cropping, overlays */}
      <div className="flex flex-col gap-4 min-w-[180px] w-full xl:w-[200px]">
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
        {/* New: Progress bar for image scale */}
        {profileImg && (
          <div className="flex flex-col gap-1">
            <label htmlFor="profile-scale" className="text-xs text-muted-foreground mb-1">Resize Photo</label>
            <div className="flex gap-2 items-center">
              <Progress
                className="h-3 w-32 bg-muted"
                value={((imgPos.scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100}
              />
              <input
                id="profile-scale"
                type="range"
                min={MIN_SCALE}
                max={MAX_SCALE}
                step={0.01}
                value={imgPos.scale}
                onChange={e =>
                  setImgPos(pos => ({
                    ...pos,
                    scale: parseFloat(e.target.value)
                  }))
                }
                className="w-16"
              />
              <span className="text-xs font-mono">{imgPos.scale.toFixed(2)}x</span>
            </div>
          </div>
        )}
        {/* Image Cropping & Resizing controls */}
        <ImageCropperControls
          onZoom={handleZoom}
          onReset={handleResetImg}
          isImageLoaded={!!profileImg}
        />
        {/* Add Text Overlay and Text Overlay Controls */}
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
      {/* Canvas area */}
      <div
        ref={canvasContainerRef}
        className="relative mx-auto"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          borderRadius: 24,
          background: "#fff",
          boxShadow: "0 4px 24px 0 #0002",
          minWidth: CANVAS_W,
          // No overflow: hidden. Let overlays & input pointer-events work.
        }}
      >
        {/* --- Render stack order: Uploaded photo (bottom, can move/scale) -> Template image (middle, always on top of photo) -> Text overlays (top, positioned absolutely) --- */}
        {/* 1. Uploaded photo bottom layer */}
        {profileImg && (
          <img
            src={profileImg}
            alt="Profile"
            draggable={false}
            className="absolute"
            style={{
              left: imgPos.x,
              top: imgPos.y,
              width: `calc(100% * ${imgPos.scale})`,
              height: `calc(100% * ${imgPos.scale})`,
              objectFit: "cover",
              pointerEvents: "auto",
              userSelect: "none",
              zIndex: 1,
              borderRadius: 0
            }}
            onMouseDown={handleImgMouseDown}
            onTouchStart={handleImgTouchStart}
            title="Drag to reposition (Photo behind card)"
          />
        )}
        {/* 2. Template image (middle layer, always covers photo) */}
        <img
          src={templateImg}
          className="absolute inset-0 w-full h-full object-cover rounded-2xl pointer-events-none"
          alt="Template"
          style={{ zIndex: 2 }}
        />
        {/* 3. Text overlays (top layer, absolutely positioned) */}
        {textOverlays.map(ovl => (
          <span
            key={ovl.id}
            onMouseDown={e => {
              e.preventDefault();
              setSelectedTextId(ovl.id);
              const startX = e.clientX,
                startY = e.clientY;
              const idx = textOverlays.findIndex(t => t.id === ovl.id);
              const orig = { x: textOverlays[idx].x, y: textOverlays[idx].y };
              const onMove = (ev: MouseEvent) => {
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;
                setTextOverlays(ovlArr =>
                  ovlArr.map(txt =>
                    txt.id === ovl.id
                      ? { ...txt, x: orig.x + dx, y: orig.y + dy }
                      : txt
                  )
                );
              };
              const onUp = () => {
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
              };
              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp);
            }}
            onTouchStart={e => {
              setSelectedTextId(ovl.id);
              if (e.touches.length !== 1) return;
              const touch = e.touches[0];
              const startX = touch.clientX,
                startY = touch.clientY;
              const idx = textOverlays.findIndex(t => t.id === ovl.id);
              const orig = { x: textOverlays[idx].x, y: textOverlays[idx].y };
              const onMove = (ev: TouchEvent) => {
                if (ev.touches.length !== 1) return;
                const t = ev.touches[0];
                const dx = t.clientX - startX;
                const dy = t.clientY - startY;
                setTextOverlays(ovlArr =>
                  ovlArr.map(txt =>
                    txt.id === ovl.id
                      ? { ...txt, x: orig.x + dx, y: orig.y + dy }
                      : txt
                  )
                );
              };
              const onUp = () => {
                window.removeEventListener("touchmove", onMove);
                window.removeEventListener("touchend", onUp);
              };
              window.addEventListener("touchmove", onMove);
              window.addEventListener("touchend", onUp);
            }}
            style={{
              position: "absolute",
              left: ovl.x,
              top: ovl.y,
              fontFamily: ovl.font,
              fontWeight: 700,
              color: ovl.color,
              fontSize: ovl.size,
              textShadow: "0 2px 10px #0005",
              cursor: "move",
              userSelect: "none",
              zIndex: 3, // overlays above photo and template
              padding: "4px 8px"
            }}
            className={`rounded transition duration-150 ${selectedTextId === ovl.id ? "bg-white/80 shadow" : ""}`}
          >
            {ovl.text}
          </span>
        ))}
      </div>
    </div>
  );
};
