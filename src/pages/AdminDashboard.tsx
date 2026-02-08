import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ImagePreviewModal } from "@/components/dashboard/ImagePreviewModal";
import { WorkerAssignmentSelect } from "@/components/dashboard/WorkerAssignmentSelect";
import { WorkerManagement } from "@/components/dashboard/WorkerManagement";
import { 
  BarChart3, FileText, Users, Clock, CheckCircle2, AlertTriangle, 
  Search, Filter, MapPin, Calendar, Camera
} from "lucide-react";

interface Report {
  id: string;
  complaint_id: string;
  reporter_name: string;
  damage_type: string;
  severity: string;
  location: string;
  ward: string;
  status: string;
  created_at: string;
  assigned_to: string | null;
  image_url: string | null;
  before_image_url: string | null;
  after_image_url: string | null;
}

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}

const AdminDashboard = () => {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [wardFilter, setWardFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) {
      navigate("/login");
    }
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (user && role === "admin") {
      fetchReports();
      fetchStats();
    }
  }, [user, role]);

  const fetchReports = async () => {
    setIsLoading(true);
    let query = supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    if (wardFilter !== "all") {
      query = query.eq("ward", wardFilter);
    }
    if (searchQuery) {
      query = query.or(`complaint_id.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%,reporter_name.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setReports(data || []);
    }
    setIsLoading(false);
  };

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from("reports")
      .select("status");
    
    if (data) {
      setStats({
        total: data.length,
        pending: data.filter(r => r.status === "pending").length,
        inProgress: data.filter(r => r.status === "in-progress").length,
        resolved: data.filter(r => r.status === "resolved").length,
      });
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    const { data: report } = await supabase
      .from("reports")
      .select("reporter_email, complaint_id")
      .eq("id", reportId)
      .single();

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
      toast({ title: "Status Updated", description: `Report status changed to ${newStatus}` });
      
      // Send email notification for status change
      if (report?.reporter_email) {
        try {
          await supabase.functions.invoke("send-status-notification", {
            body: {
              reportId,
              type: "status_change",
              newStatus,
              email: report.reporter_email,
              complaintId: report.complaint_id,
            },
          });
        } catch (e) {
          console.error("Failed to send notification:", e);
        }
      }
      
      fetchReports();
      fetchStats();
    }
  };

  const handleAssignmentChange = () => {
    fetchReports();
    fetchStats();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "destructive",
      "in-progress": "default",
      resolved: "secondary",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      low: "bg-green-100 text-green-800",
      moderate: "bg-yellow-100 text-yellow-800",
      critical: "bg-red-100 text-red-800",
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[severity] || ""}`}>{severity}</span>;
  };

  useEffect(() => {
    if (user && role === "admin") {
      fetchReports();
    }
  }, [statusFilter, wardFilter, searchQuery]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-secondary/30">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage all road damage reports</p>
              </div>
            </div>
            <Button variant="outline" onClick={signOut}>Sign Out</Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
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
                <CheckCircle2 className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{stats.resolved}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Reports and Workers */}
          <Tabs defaultValue="reports" className="space-y-6">
            <TabsList>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="workers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Workers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reports" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by ID, location, or name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={wardFilter} onValueChange={setWardFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Ward" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Wards</SelectItem>
                        {Array.from({ length: 20 }, (_, i) => (
                          <SelectItem key={i + 1} value={`ward-${i + 1}`}>
                            Ward {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

          {/* Reports Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Reports</CardTitle>
              <CardDescription>View and manage all submitted road damage reports</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading reports...</div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No reports found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Complaint ID</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Ward</TableHead>
                      <TableHead>Photos</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-mono text-sm">{report.complaint_id}</TableCell>
                        <TableCell>{report.reporter_name}</TableCell>
                        <TableCell className="capitalize">{report.damage_type.replace("-", " ")}</TableCell>
                        <TableCell>{getSeverityBadge(report.severity)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{report.location}</TableCell>
                        <TableCell>{report.ward?.replace("ward-", "Ward ")}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {report.image_url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setPreviewImage({ url: report.image_url!, title: "Damage Photo" })}
                                title="View damage photo"
                              >
                                <Camera className="h-4 w-4 text-primary" />
                              </Button>
                            )}
                            {report.before_image_url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setPreviewImage({ url: report.before_image_url!, title: "Before Repair" })}
                                title="View before photo"
                              >
                                <span className="text-xs font-medium text-warning">B</span>
                              </Button>
                            )}
                            {report.after_image_url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setPreviewImage({ url: report.after_image_url!, title: "After Repair" })}
                                title="View after photo"
                              >
                                <span className="text-xs font-medium text-success">A</span>
                              </Button>
                            )}
                            {!report.image_url && !report.before_image_url && !report.after_image_url && (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <WorkerAssignmentSelect
                            reportId={report.id}
                            currentAssignee={report.assigned_to}
                            onAssignmentChange={handleAssignmentChange}
                          />
                        </TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Select
                            value={report.status}
                            onValueChange={(value) => updateReportStatus(report.id, value)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="workers">
              <WorkerManagement />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        imageUrl={previewImage?.url || null}
        title={previewImage?.title}
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </SidebarProvider>
  );
};

export default AdminDashboard;
