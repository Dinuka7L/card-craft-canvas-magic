import React, { useRef, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { LucideIcon, Image as ImageIcon, Text as TextIcon, Download as DownloadIcon } from "lucide-react";
import { TextOverlayControls } from "./TextOverlayControls";
import { DownloadDropdown } from "./DownloadDropdown";

// Placeholder template map
const TEMPLATE_MAP: Record<string, { name: string; img: string }> = {
  template1: { name: "Starry Night", img: "/photo-1470813740244-df37b8c1edcb" },
  template2: { name: "Sunlit Forest", img: "/photo-1500673922987-e212871fec22" },
  template3: { name: "Orange Blossoms", img: "/photo-1465146344425-f00d5f5c8f07" },
  template4: { name: "Living Room", img: "/photo-1721322800607-8c38375eef04" },
};

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
  const [imgPos, setImgPos] = useState({ x: 85, y: 85, scale: 1 });
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

  // To keep width/height configs in one place and scale everything
  const CANVAS_W = 350, CANVAS_H = 500;
  // For smooth resize/move on photo
  const [dragMode, setDragMode] = useState<"move" | "none">("none");

  // Enable drag & move image (profile photo)
  const handleImgMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragMode("move");
    setIsDragging(true);
    setDragStart({
      x: e.clientX - imgPos.x,
      y: e.clientY - imgPos.y,
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

  useEffect(() => {
    if (isDragging)
      window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    // eslint-disable-next-line
  }, [isDragging, dragMode, dragStart]);

  // Handle user uploads a profile image
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e2 => setProfileImg(e2.target?.result as string);
    reader.readAsDataURL(file);
    toast({ title: "Profile image loaded!", description: "Drag to position." });
  };

  // For cropping/zooming
  const handleZoom = (delta: number) => {
    setImgPos(pos => ({
      ...pos,
      scale: Math.max(0.1, Math.min(3, pos.scale + delta)),
    }));
  };

  // Add a new text overlay
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

  // When canvas needs to be downloaded as image
  const handleDownload = (format: "png" | "jpeg") => {
    // Create a temporary offscreen canvas for export
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d")!;
    // Draw background (template)
    const template = new window.Image();
    template.crossOrigin = "anonymous";
    template.src = TEMPLATE_MAP[templateId].img;
    template.onload = () => {
      ctx.drawImage(template, 0, 0, CANVAS_W, CANVAS_H);
      if (profileImg) {
        const img = new window.Image();
        img.src = profileImg;
        img.onload = () => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(
            imgPos.x + 75 * imgPos.scale,
            imgPos.y + 75 * imgPos.scale,
            75 * imgPos.scale, 0, 2 * Math.PI
          );
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(
            img,
            imgPos.x, imgPos.y,
            150 * imgPos.scale, 150 * imgPos.scale
          );
          ctx.restore();
          textOverlays.forEach(ovl => {
            ctx.font = `${ovl.size}px '${ovl.font}'`;
            ctx.fillStyle = ovl.color;
            ctx.fillText(ovl.text, ovl.x, ovl.y);
          });
          let mime = (format === "png" ? "image/png" : "image/jpeg");
          const link = document.createElement("a");
          link.download = `birthday-card.${format}`;
          link.href = canvas.toDataURL(mime, 1.0);
          link.click();
        };
      } else {
        textOverlays.forEach(ovl => {
          ctx.font = `${ovl.size}px '${ovl.font}'`;
          ctx.fillStyle = ovl.color;
          ctx.fillText(ovl.text, ovl.x, ovl.y);
        });
        let mime = (format === "png" ? "image/png" : "image/jpeg");
        const link = document.createElement("a");
        link.download = `birthday-card.${format}`;
        link.href = canvas.toDataURL(mime, 1.0);
        link.click();
      }
    };
  };

  // Drag/move & edit text overlays
  const onChangeTextOverlay = (id: string, patch: Partial<TextOverlay>) => {
    setTextOverlays(ovl =>
      ovl.map(txt =>
        txt.id === id ? { ...txt, ...patch } : txt
      )
    );
  };

  // Allow dragging text overlays
  const handleTextMouseDown = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedTextId(id);
    const startX = e.clientX, startY = e.clientY;
    const idx = textOverlays.findIndex(t => t.id === id);
    const orig = { x: textOverlays[idx].x, y: textOverlays[idx].y };
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      onChangeTextOverlay(id, { x: orig.x + dx, y: orig.y + dy });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Load actual selected template
  const templateImg = TEMPLATE_MAP[templateId]?.img;

  return (
    <div className="flex gap-8">
      {/* Left: controls for uploading */}
      <div className="flex flex-col gap-4 min-w-[160px]">
        <div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-primary px-4 py-2 rounded-lg text-white font-semibold mb-2 flex gap-2 items-center hover-scale"
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
        <button
          className="bg-accent px-3 py-2 rounded focus:outline-none text-foreground hover:bg-accent/70 transition text-sm"
          onClick={handleAddText}
        >
          + Add Text Overlay
        </button>
        <TextOverlayControls
          textOverlay={textOverlays.find(t => t.id === selectedTextId)!}
          onChange={patch => onChangeTextOverlay(selectedTextId, patch)}
        />
        <DownloadDropdown onDownload={handleDownload} />
      </div>
      {/* Canvas display area */}
      <div
        ref={canvasContainerRef}
        className="relative"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          borderRadius: 24,
          background: "#fff",
          boxShadow: "0 4px 24px 0 #0002",
        }}
      >
        {/* Template */}
        <img
          src={templateImg}
          className="absolute inset-0 w-full h-full object-cover rounded-2xl pointer-events-none"
          alt="Template"
        />
        {/* Profile pic */}
        {profileImg && (
          <div
            className="absolute"
            style={{
              left: imgPos.x,
              top: imgPos.y,
              width: 150 * imgPos.scale,
              height: 150 * imgPos.scale,
              cursor: dragMode === "move" ? "grabbing" : "grab",
              borderRadius: "50%",
              overflow: "hidden",
              boxShadow: "0 3px 12px #0005",
              zIndex: 2,
              transition: "box-shadow .2s"
            }}
            onMouseDown={handleImgMouseDown}
          >
            <img
              src={profileImg}
              className="w-full h-full object-cover select-none"
              alt='Profile'
              draggable={false}
              style={{ userSelect: "none", pointerEvents: "none" }}
            />
            {/* Crop/zoom controls */}
            <div className="absolute bottom-1 right-1 flex gap-2 bg-black/30 px-1 py-0.5 rounded-md z-10">
              <button className="text-white" onClick={() => handleZoom(0.1)}>+</button>
              <button className="text-white" onClick={() => handleZoom(-0.1)}>-</button>
            </div>
          </div>
        )}
        {/* Drag/move text overlays */}
        {textOverlays.map(ovl => (
          <span
            key={ovl.id}
            onMouseDown={e => handleTextMouseDown(ovl.id, e)}
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
              zIndex: 3,
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
