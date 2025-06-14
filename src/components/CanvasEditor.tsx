import React, { useRef, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Image as ImageIcon } from "lucide-react";
import { TextOverlayControls } from "./TextOverlayControls";
import { DownloadDropdown } from "./DownloadDropdown";
import { ImageCropperControls } from "./ImageCropperControls";

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
  const [imgInit, setImgInit] = useState({ x: 85, y: 85, scale: 1 }); // for reset
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
      y: touch.clientY - dragStart.y,
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
      setImgPos({ x: 85, y: 85, scale: 1 });
      setImgInit({ x: 85, y: 85, scale: 1 });
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
    // Create a temporary offscreen canvas for export
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d")!;
    // Draw background (template)
    const template = new window.Image();
    template.crossOrigin = "anonymous";
    template.src = TEMPLATE_MAP[templateId].img.startsWith("/")
      ? `${window.location.origin}${TEMPLATE_MAP[templateId].img}`
      : TEMPLATE_MAP[templateId].img;
    template.onload = () => {
      ctx.drawImage(template, 0, 0, CANVAS_W, CANVAS_H);

      // Draw profile image (crop and placement applied)
      if (profileImg) {
        const img = new window.Image();
        img.src = profileImg;
        img.onload = () => {
          ctx.save();
          ctx.drawImage(
            img,
            imgPos.x,
            imgPos.y,
            150 * imgPos.scale,
            150 * imgPos.scale
          );
          ctx.restore();

          // Draw text overlays
          textOverlays.forEach(ovl => {
            ctx.font = `${ovl.size}px '${ovl.font}'`;
            ctx.fillStyle = ovl.color;
            ctx.fillText(ovl.text, ovl.x, ovl.y);
          });

          let mime = (format === "png" ? "image/png" : "image/jpeg");
          const link = document.createElement("a");
          link.download = `birthday-card.${format}`;
          link.href = canvas.toDataURL(mime, 1.0);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast({
            title: "Download started!",
            description: `Your card is downloading as ${format.toUpperCase()}.`
          });
        };
        img.onerror = () => {
          toast({ title: "Image download error", description: "Could not load your photo." });
        };
      } else {
        // If no profile image, just draw overlays
        textOverlays.forEach(ovl => {
          ctx.font = `${ovl.size}px '${ovl.font}'`;
          ctx.fillStyle = ovl.color;
          ctx.fillText(ovl.text, ovl.x, ovl.y);
        });

        let mime = (format === "png" ? "image/png" : "image/jpeg");
        const link = document.createElement("a");
        link.download = `birthday-card.${format}`;
        link.href = canvas.toDataURL(mime, 1.0);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Download started!",
          description: `Your card is downloading as ${format.toUpperCase()}.`
        });
      }
    };
    template.onerror = () => {
      toast({ title: "Template image error", description: "Could not load background." });
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

  // Load actual selected template
  const templateImg = TEMPLATE_MAP[templateId]?.img.startsWith("/")
    ? `${window.location.origin}${TEMPLATE_MAP[templateId]?.img}`
    : TEMPLATE_MAP[templateId]?.img;

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
              borderRadius: 12, // small rounding optional, or 0
              overflow: "hidden",
              boxShadow: "0 3px 12px #0005",
              zIndex: 2,
              transition: "box-shadow .2s"
            }}
            onMouseDown={handleImgMouseDown}
            onTouchStart={handleImgTouchStart}
            title="Drag to reposition"
          >
            <img
              src={profileImg}
              className="w-full h-full object-cover select-none"
              alt='Profile'
              draggable={false}
              style={{ userSelect: "none", pointerEvents: "none" }}
            />
          </div>
        )}
        {/* Drag/move text overlays */}
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
