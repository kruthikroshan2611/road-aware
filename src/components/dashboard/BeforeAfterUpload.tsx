import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BeforeAfterUploadProps {
  reportId: string;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  onUploadComplete: () => void;
}

export const BeforeAfterUpload = ({
  reportId,
  beforeImageUrl,
  afterImageUrl,
  onUploadComplete,
}: BeforeAfterUploadProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState<"before" | "after" | null>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File, type: "before" | "after") => {
    setIsUploading(type);
    
    try {
      const fileName = `${type}-${reportId}-${Date.now()}.jpg`;
      
      const { data, error: uploadError } = await supabase.storage
        .from("report-images")
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: "3600",
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("report-images")
        .getPublicUrl(data.path);

      const updateField = type === "before" ? "before_image_url" : "after_image_url";
      
      const { error: updateError } = await supabase
        .from("reports")
        .update({ [updateField]: urlData.publicUrl })
        .eq("id", reportId);

      if (updateError) throw updateError;

      toast({
        title: "Image Uploaded",
        description: `${type === "before" ? "Before" : "After"} repair photo saved successfully.`,
      });
      
      onUploadComplete();
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(null);
    }
  };

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "before" | "after"
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image under 5MB.",
          variant: "destructive",
        });
        return;
      }
      uploadImage(file, type);
    }
  };

  const removeImage = async (type: "before" | "after") => {
    const updateField = type === "before" ? "before_image_url" : "after_image_url";
    
    const { error } = await supabase
      .from("reports")
      .update({ [updateField]: null })
      .eq("id", reportId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Image Removed",
        description: `${type === "before" ? "Before" : "After"} repair photo removed.`,
      });
      onUploadComplete();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Before & After Photos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Before Image */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Before Repair</p>
            {beforeImageUrl ? (
              <div className="relative group">
                <img
                  src={beforeImageUrl}
                  alt="Before repair"
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage("before")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => beforeInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                {isUploading === "before" ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Upload</span>
                  </>
                )}
              </div>
            )}
            <input
              ref={beforeInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e, "before")}
            />
          </div>

          {/* After Image */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">After Repair</p>
            {afterImageUrl ? (
              <div className="relative group">
                <img
                  src={afterImageUrl}
                  alt="After repair"
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage("after")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => afterInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                {isUploading === "after" ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Upload</span>
                  </>
                )}
              </div>
            )}
            <input
              ref={afterInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e, "after")}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
