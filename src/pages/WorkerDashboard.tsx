import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { WorkerSidebar } from "@/components/dashboard/WorkerSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Wrench, Clock, CheckCircle2, AlertTriangle, MapPin, Calendar, 
  User, Phone, FileText, Camera
} from "lucide-react";

interface Report {
  id: string;
  complaint_id: string;
  reporter_name: string;
  reporter_phone: string;
  damage_type: string;
  severity: string;
  location: string;
  landmark: string | null;
  ward: string;
  description: string | null;
  image_url: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  status: string;
  created_at: string;
}

const WorkerDashboard = () => {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [assignedReports, setAssignedReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || role !== "worker")) {
      navigate("/login");
    }
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (user && role === "worker") {
      fetchAssignedReports();
    }
  }, [user, role]);

  const fetchAssignedReports = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("assigned_to", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setAssignedReports(data || []);
      if (data && data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
    }
    setIsLoading(false);
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    const { error } = await supabase
      .from("reports")
      .update({ 
        status: newStatus,
        resolved_at: newStatus === "resolved" ? new Date().toISOString() : null
      })
      .eq("id", reportId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status Updated", description: `Report marked as ${newStatus}` });
      fetchAssignedReports();
      if (selectedReport?.id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "destructive",
      "in-progress": "default",
      resolved: "secondary",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: "text-green-600 bg-green-100",
      moderate: "text-yellow-600 bg-yellow-100",
      critical: "text-red-600 bg-red-100",
    };
    return colors[severity] || "";
  };

  const stats = {
    total: assignedReports.length,
    pending: assignedReports.filter(r => r.status === "pending").length,
    inProgress: assignedReports.filter(r => r.status === "in-progress").length,
    resolved: assignedReports.filter(r => r.status === "resolved").length,
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-secondary/30">
        <WorkerSidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-2xl font-bold">Worker Dashboard</h1>
                <p className="text-muted-foreground">Manage your assigned tasks</p>
              </div>
            </div>
            <Button variant="outline" onClick={signOut}>Sign Out</Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <AlertTriangle className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.inProgress}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Task List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Assigned Tasks</CardTitle>
                <CardDescription>Click a task to view details</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : assignedReports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wrench className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No tasks assigned yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assignedReports.map((report) => (
                      <div
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedReport?.id === report.id 
                            ? "border-primary bg-primary/5" 
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-sm font-medium">{report.complaint_id}</span>
                          {getStatusBadge(report.status)}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{report.location}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityColor(report.severity)}`}>
                            {report.severity}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {report.damage_type.replace("-", " ")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Task Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Task Details</CardTitle>
                <CardDescription>View and update report information</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedReport ? (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold font-mono">{selectedReport.complaint_id}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(selectedReport.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(selectedReport.severity)}`}>
                          {selectedReport.severity} severity
                        </span>
                        <Select
                          value={selectedReport.status}
                          onValueChange={(value) => updateReportStatus(selectedReport.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" /> Damage Type
                        </p>
                        <p className="font-medium capitalize">{selectedReport.damage_type.replace("-", " ")}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Ward
                        </p>
                        <p className="font-medium">{selectedReport.ward?.replace("ward-", "Ward ")}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" /> Reporter
                        </p>
                        <p className="font-medium">{selectedReport.reporter_name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> Phone
                        </p>
                        <p className="font-medium">{selectedReport.reporter_phone}</p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Location
                      </p>
                      <p className="font-medium">{selectedReport.location}</p>
                      {selectedReport.landmark && (
                        <p className="text-sm text-muted-foreground">Near: {selectedReport.landmark}</p>
                      )}
                      {selectedReport.gps_lat && selectedReport.gps_lng && (
                        <p className="text-sm text-muted-foreground font-mono">
                          GPS: {selectedReport.gps_lat}, {selectedReport.gps_lng}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    {selectedReport.description && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedReport.description}</p>
                      </div>
                    )}

                    {/* Image */}
                    {selectedReport.image_url && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Camera className="h-3 w-3" /> Photo Evidence
                        </p>
                        <img 
                          src={selectedReport.image_url} 
                          alt="Damage" 
                          className="rounded-lg max-h-64 object-cover"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Select a task to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default WorkerDashboard;
