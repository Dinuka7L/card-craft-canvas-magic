
import React from "react";

interface ImageCropperControlsProps {
  onZoom: (delta: number) => void;
  onReset: () => void;
  isImageLoaded: boolean;
}

export const ImageCropperControls: React.FC<ImageCropperControlsProps> = ({
  onZoom,
  onReset,
  isImageLoaded,
}) => (
  <div className="flex gap-2 items-center mb-3">
    <button
      type="button"
      className="bg-accent px-3 py-2 rounded text-foreground hover:bg-accent/70 transition text-sm"
      disabled={!isImageLoaded}
      onClick={() => onZoom(0.1)}
      title="Zoom in"
    >
      +
    </button>
    <button
      type="button"
      className="bg-accent px-3 py-2 rounded text-foreground hover:bg-accent/70 transition text-sm"
      disabled={!isImageLoaded}
      onClick={() => onZoom(-0.1)}
      title="Zoom out"
    >
      –
    </button>
    <button
      type="button"
      className="bg-muted px-3 py-2 rounded hover:bg-muted/80 transition text-xs"
      disabled={!isImageLoaded}
      onClick={onReset}
      title="Reset image position"
    >
      Reset
    </button>
  </div>
);
