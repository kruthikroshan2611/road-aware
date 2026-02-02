import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Clock, User, FileText, CheckCircle2, AlertCircle, Wrench, ClipboardCheck, Loader2, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ComplaintDetails {
  id: string;
  complaint_id: string;
  damage_type: string;
  severity: string;
  status: string;
  location: string;
  landmark: string | null;
  ward: string;
  reporter_name: string;
  reporter_phone: string;
  description: string | null;
  image_url: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  assigned_to: string | null;
}

interface TimelineItem {
  status: string;
  date: string;
  description: string;
  icon: typeof CheckCircle2;
  isCompleted: boolean;
}

const TrackComplaint = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [searchId, setSearchId] = useState(searchParams.get("id") || "");
  const [complaint, setComplaint] = useState<ComplaintDetails | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Auto-search if ID is in URL params
  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    if (idFromUrl) {
      setSearchId(idFromUrl);
      searchComplaint(idFromUrl);
    }
  }, [searchParams]);

  const searchComplaint = async (id: string) => {
    if (!id.trim()) return;

    setIsSearching(true);
    setNotFound(false);
    setComplaint(null);

    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("complaint_id", id.trim().toUpperCase())
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setComplaint(data);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    searchComplaint(searchId);
  };

  const generateTimeline = (complaint: ComplaintDetails): TimelineItem[] => {
    const createdDate = new Date(complaint.created_at);
    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    };

    const statusOrder = ["pending", "in-progress", "resolved"];
    const currentIndex = statusOrder.indexOf(complaint.status);

    const timeline: TimelineItem[] = [
      {
        status: "Reported",
        date: formatDate(createdDate),
        description: "Complaint submitted by citizen",
        icon: FileText,
        isCompleted: true,
      },
      {
        status: "Under Review",
        date: currentIndex >= 0 ? formatDate(new Date(createdDate.getTime() + 3600000)) : "Pending",
        description: "Complaint verified by ward officer",
        icon: ClipboardCheck,
        isCompleted: currentIndex >= 0,
      },
      {
        status: "In Progress",
        date: currentIndex >= 1 ? formatDate(new Date(complaint.updated_at)) : "Pending",
        description: complaint.assigned_to ? "Assigned to repair team" : "Awaiting assignment",
        icon: Wrench,
        isCompleted: currentIndex >= 1,
      },
      {
        status: "Resolved",
        date: complaint.resolved_at ? formatDate(new Date(complaint.resolved_at)) : "Pending",
        description: complaint.resolved_at ? "Issue has been resolved" : "Awaiting completion",
        icon: CheckCircle2,
        isCompleted: complaint.status === "resolved",
      },
    ];

    return timeline;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-success text-success-foreground";
      case "in-progress":
        return "bg-primary text-primary-foreground";
      case "pending":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-destructive text-destructive-foreground";
      case "moderate":
        return "bg-warning text-warning-foreground";
      case "low":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDamageType = (type: string) => {
    return type.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-12 bg-secondary/30">
        <div className="container max-w-4xl">
          {/* Page Header */}
          <div className="text-center mb-10 animate-slide-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-4">
              <Search className="h-4 w-4" />
              <span>Track Your Complaint</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl mb-3">
              Track Complaint Status
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Enter your complaint ID to view the current status and resolution timeline
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Enter Complaint ID (e.g., SMC-2026-000001)"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                    className="h-12 text-base font-mono"
                  />
                </div>
                <Button type="submit" size="lg" disabled={isSearching || !searchId.trim()}>
                  {isSearching ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Track
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Not Found Message */}
          {notFound && (
            <Card className="animate-slide-up border-destructive/50">
              <CardContent className="py-8 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Complaint Not Found
                </h3>
                <p className="text-muted-foreground mb-4">
                  No complaint found with ID "<span className="font-mono">{searchId}</span>". Please check the ID and try again.
                </p>
                <p className="text-sm text-muted-foreground">
                  Complaint IDs follow the format: SMC-YYYY-XXXXXX
                </p>
              </CardContent>
            </Card>
          )}

          {/* Complaint Details */}
          {complaint && (
            <div className="space-y-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              {/* Status Card */}
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl font-mono">{complaint.complaint_id}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-2 flex-wrap">
                        <span>{formatDamageType(complaint.damage_type)}</span>
                        <span>•</span>
                        <Badge className={getSeverityColor(complaint.severity)}>
                          {complaint.severity.charAt(0).toUpperCase() + complaint.severity.slice(1)} Priority
                        </Badge>
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(complaint.status)} px-4 py-1.5 text-sm capitalize`}>
                      {complaint.status.replace("-", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Location</p>
                        <p className="text-sm text-muted-foreground">
                          {complaint.location}
                          {complaint.landmark && <><br />Near: {complaint.landmark}</>}
                          <br />
                          {complaint.ward.replace("ward-", "Ward ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Reported On</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(complaint.created_at).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <User className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Reported By</p>
                        <p className="text-sm text-muted-foreground">{complaint.reporter_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Wrench className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Status</p>
                        <p className="text-sm text-muted-foreground">
                          {complaint.status === "resolved" 
                            ? "Issue has been resolved"
                            : complaint.status === "in-progress"
                            ? "Repair work in progress"
                            : "Under review by authorities"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {complaint.description && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium text-foreground mb-1">Description</p>
                      <p className="text-sm text-muted-foreground">{complaint.description}</p>
                    </div>
                  )}

                  {/* Image */}
                  {complaint.image_url && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Photo Evidence
                      </p>
                      <img 
                        src={complaint.image_url} 
                        alt="Road damage" 
                        className="rounded-lg max-h-64 object-cover"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Timeline Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resolution Timeline</CardTitle>
                  <CardDescription>
                    Track the progress of your complaint
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {generateTimeline(complaint).map((item, index, arr) => (
                      <div key={item.status} className="flex gap-4 pb-8 last:pb-0">
                        {/* Connector Line */}
                        {index < arr.length - 1 && (
                          <div
                            className={`absolute left-5 w-0.5 ${
                              item.isCompleted ? "bg-primary" : "bg-border"
                            }`}
                            style={{ 
                              top: `${index * 80 + 40}px`, 
                              height: "40px" 
                            }}
                          />
                        )}

                        {/* Icon */}
                        <div
                          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                            item.isCompleted
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <item.icon className="h-5 w-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p
                              className={`font-semibold ${
                                item.isCompleted ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {item.status}
                            </p>
                            <p className="text-sm text-muted-foreground">{item.date}</p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Empty state when no search has been made */}
          {!complaint && !notFound && !isSearching && !searchId && (
            <Card className="animate-slide-up">
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Enter Your Complaint ID
                </h3>
                <p className="text-muted-foreground">
                  Use the search box above to track the status of your complaint
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackComplaint;
