import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, MapPin, CheckCircle2, AlertTriangle, RotateCcw, ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CameraCapture from "@/components/report/CameraCapture";
import { z } from "zod";

const reportSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  damageType: z.string().min(1, "Please select damage type"),
  severity: z.string().min(1, "Please select severity"),
  location: z.string().min(5, "Location must be at least 5 characters").max(200),
  landmark: z.string().max(100).optional(),
  ward: z.string().min(1, "Please select ward"),
  description: z.string().max(500).optional(),
});

const ReportDamage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<string>("");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    damageType: "",
    severity: "",
    location: "",
    landmark: "",
    ward: "",
    description: "",
  });

  const captureGPSLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          toast({
            title: "GPS Location Captured!",
            description: `Coordinates: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
          });
        },
        (error) => {
          toast({
            title: "Location Access Denied",
            description: "Please allow location access for GPS coordinates.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "GPS Not Available",
        description: "Your device doesn't support GPS location.",
        variant: "destructive",
      });
    }
  };

  const handleImageCapture = (imageData: string, quality: number) => {
    setImagePreview(imageData);
    
    const base64Length = imageData.length - "data:image/jpeg;base64,".length;
    const sizeInBytes = (base64Length * 3) / 4;
    const sizeInKB = (sizeInBytes / 1024).toFixed(1);
    setImageSize(`${sizeInKB} KB (${quality}% quality)`);
    
    captureGPSLocation();
    
    toast({
      title: "Image Captured!",
      description: `Photo saved at ${quality}% quality (${sizeInKB} KB)`,
    });
  };

  const handleRetakeImage = () => {
    setImagePreview(null);
    setImageSize("");
    setGpsCoords(null);
  };

  const validateForm = () => {
    try {
      reportSchema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    if (!imagePreview) {
      toast({
        title: "Photo Required",
        description: "Please capture a photo of the road damage",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("reports")
        .insert({
          reporter_name: formData.name.trim(),
          reporter_phone: formData.phone.trim(),
          reporter_email: formData.email.trim() || null,
          damage_type: formData.damageType,
          severity: formData.severity,
          location: formData.location.trim(),
          landmark: formData.landmark.trim() || null,
          ward: formData.ward,
          description: formData.description.trim() || null,
          gps_lat: gpsCoords?.lat || null,
          gps_lng: gpsCoords?.lng || null,
          image_url: imagePreview,
          complaint_id: "", // Will be generated by trigger
        })
        .select("complaint_id")
        .single();

      if (error) throw error;

      toast({
        title: "Report Submitted Successfully!",
        description: `Your complaint ID is ${data.complaint_id}. You can track the status using this ID.`,
      });

      // Navigate to track page with the complaint ID
      navigate(`/track?id=${data.complaint_id}`);

    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-12 bg-secondary/30">
        <div className="container max-w-4xl">
          {/* Page Header */}
          <div className="text-center mb-10 animate-slide-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-4">
              <AlertTriangle className="h-4 w-4" />
              <span>Report Road Damage</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl mb-3">
              Report a Road Issue
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Help us identify and fix road damage quickly. Provide accurate details for faster resolution.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Image Upload Card */}
              <Card className="lg:col-span-1 animate-slide-up" style={{ animationDelay: "0.1s" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Camera className="h-5 w-5 text-primary" />
                    Capture Photo *
                  </CardTitle>
                  <CardDescription>
                    Take a clear photo of the damage (required)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl bg-muted/50 ${!imagePreview ? "border-destructive/50" : "border-border"}`}>
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <Camera className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No image captured yet
                          </p>
                          <p className="text-xs text-destructive mt-1">
                            Photo is required
                          </p>
                        </div>
                      )}
                    </div>

                    {imagePreview ? (
                      <>
                        <div className="text-xs text-muted-foreground text-center">
                          <ImageIcon className="h-3 w-3 inline mr-1" />
                          {imageSize}
                        </div>
                        <Button type="button" variant="outline" className="w-full" onClick={handleRetakeImage}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Retake Image
                        </Button>
                      </>
                    ) : (
                      <Button type="button" variant="outline" className="w-full" onClick={() => setIsCameraOpen(true)}>
                        <Camera className="h-4 w-4 mr-2" />
                        Open Camera
                      </Button>
                    )}

                    {/* GPS Location Display */}
                    {gpsCoords ? (
                      <div className="flex items-center gap-2 p-3 bg-success/10 text-success rounded-lg text-sm">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="font-mono text-xs">{gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}</span>
                      </div>
                    ) : (
                      <Button type="button" variant="outline" className="w-full" onClick={captureGPSLocation}>
                        <MapPin className="h-4 w-4 mr-2" />
                        Capture GPS Location
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Main Form */}
              <Card className="lg:col-span-2 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <CardHeader>
                  <CardTitle className="text-lg">Report Details</CardTitle>
                  <CardDescription>
                    Fill in the details about the road damage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Personal Info */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className={errors.name ? "border-destructive" : ""}
                      />
                      {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className={errors.phone ? "border-destructive" : ""}
                      />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="For status updates"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  {/* Damage Details */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Type of Damage *</Label>
                      <Select
                        value={formData.damageType}
                        onValueChange={(value) => handleInputChange("damageType", value)}
                      >
                        <SelectTrigger className={errors.damageType ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select damage type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pothole">Pothole</SelectItem>
                          <SelectItem value="crack">Surface Crack</SelectItem>
                          <SelectItem value="cave-in">Road Cave-in</SelectItem>
                          <SelectItem value="erosion">Edge Erosion</SelectItem>
                          <SelectItem value="waterlogging">Waterlogging</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.damageType && <p className="text-xs text-destructive">{errors.damageType}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Severity Level *</Label>
                      <Select
                        value={formData.severity}
                        onValueChange={(value) => handleInputChange("severity", value)}
                      >
                        <SelectTrigger className={errors.severity ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - Minor inconvenience</SelectItem>
                          <SelectItem value="moderate">Moderate - Affects traffic</SelectItem>
                          <SelectItem value="critical">Critical - Safety hazard</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.severity && <p className="text-xs text-destructive">{errors.severity}</p>}
                    </div>
                  </div>

                  {/* Location Details */}
                  <div className="space-y-2">
                    <Label htmlFor="location">Location / Address *</Label>
                    <Input
                      id="location"
                      placeholder="Street name and area"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      className={errors.location ? "border-destructive" : ""}
                    />
                    {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="landmark">Nearby Landmark</Label>
                      <Input
                        id="landmark"
                        placeholder="e.g., Near City Mall"
                        value={formData.landmark}
                        onChange={(e) => handleInputChange("landmark", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ward Number *</Label>
                      <Select
                        value={formData.ward}
                        onValueChange={(value) => handleInputChange("ward", value)}
                      >
                        <SelectTrigger className={errors.ward ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select ward" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 20 }, (_, i) => (
                            <SelectItem key={i + 1} value={`ward-${i + 1}`}>
                              Ward {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.ward && <p className="text-xs text-destructive">{errors.ward}</p>}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Additional Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the damage, its size, and any other relevant details..."
                      className="min-h-[100px]"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {formData.description.length}/500 characters
                    </p>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Submitting Report...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Submit Report
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </form>
        </div>
      </main>
      <Footer />
      
      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleImageCapture}
      />
    </div>
  );
};

export default ReportDamage;
