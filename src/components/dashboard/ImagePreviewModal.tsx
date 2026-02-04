import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ImagePreviewModalProps {
  imageUrl: string | null;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ImagePreviewModal = ({
  imageUrl,
  title = "Image Preview",
  isOpen,
  onClose,
}: ImagePreviewModalProps) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleClose = () => {
    setScale(1);
    setRotation(0);
    onClose();
  };

  if (!imageUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomIn}
                disabled={scale >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleRotate}>
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="relative overflow-auto bg-muted/50 flex items-center justify-center min-h-[400px] max-h-[70vh]">
          <img
            src={imageUrl}
            alt={title}
            className="transition-transform duration-200"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              maxWidth: scale === 1 ? "100%" : "none",
              maxHeight: scale === 1 ? "70vh" : "none",
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
