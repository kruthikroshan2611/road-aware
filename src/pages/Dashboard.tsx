import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  MapPin,
  Calendar,
  BarChart3,
  Wrench,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Report {
  id: string;
  complaint_id: string;
  damage_type: string;
  location: string;
  ward: string;
  severity: string;
  status: string;
  created_at: string;
  assigned_to: string | null;
}

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}

interface WardStat {
  ward: string;
  reports: number;
  resolved: number;
  pending: number;
}

interface TypeStat {
  type: string;
  count: number;
  percentage: number;
}

const getSeverityVariant = (severity: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (severity) {
    case "critical":
      return "destructive";
    case "moderate":
      return "default";
    case "low":
      return "secondary";
    default:
      return "outline";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "resolved":
      return "text-success bg-success/10";
    case "in-progress":
      return "text-primary bg-primary/10";
    case "pending":
      return "text-warning bg-warning/10";
    default:
      return "text-muted-foreground bg-muted";
  }
};

const formatDamageType = (type: string) => {
  return type.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
};

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [wardStats, setWardStats] = useState<WardStat[]>([]);
  const [typeStats, setTypeStats] = useState<TypeStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      const { data: allReports, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const reportData = allReports || [];
      
      // Calculate stats
      setStats({
        total: reportData.length,
        pending: reportData.filter(r => r.status === "pending").length,
        inProgress: reportData.filter(r => r.status === "in-progress").length,
        resolved: reportData.filter(r => r.status === "resolved").length,
      });

      // Calculate ward stats
      const wardMap = new Map<string, { total: number; resolved: number; pending: number }>();
      reportData.forEach(r => {
        const ward = r.ward || "Unknown";
        const current = wardMap.get(ward) || { total: 0, resolved: 0, pending: 0 };
        current.total++;
        if (r.status === "resolved") current.resolved++;
        if (r.status === "pending") current.pending++;
        wardMap.set(ward, current);
      });
      
      const sortedWards = Array.from(wardMap.entries())
        .map(([ward, data]) => ({
          ward: ward.replace("ward-", "Ward "),
          reports: data.total,
          resolved: data.resolved,
          pending: data.pending,
        }))
        .sort((a, b) => b.reports - a.reports)
        .slice(0, 5);
      
      setWardStats(sortedWards);

      // Calculate type stats
      const typeMap = new Map<string, number>();
      reportData.forEach(r => {
        const type = r.damage_type || "Unknown";
        typeMap.set(type, (typeMap.get(type) || 0) + 1);
      });

      const total = reportData.length || 1;
      const sortedTypes = Array.from(typeMap.entries())
        .map(([type, count]) => ({
          type: formatDamageType(type),
          count,
          percentage: Math.round((count / total) * 100),
        }))
        .sort((a, b) => b.count - a.count);

      setTypeStats(sortedTypes);
      setReports(reportData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.complaint_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || report.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const statsCards = [
    {
      title: "Total Reports",
      value: stats.total,
      change: `${stats.total > 0 ? "Active" : "No reports"}`,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Pending",
      value: stats.pending,
      change: "Awaiting review",
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "In Progress",
      value: stats.inProgress,
      change: "Being repaired",
      icon: Wrench,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Resolved",
      value: stats.resolved,
      change: stats.total > 0 ? `${Math.round((stats.resolved / stats.total) * 100)}% resolved` : "N/A",
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-8 bg-secondary/30">
        <div className="container">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-slide-up">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <LayoutDashboard className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                  Public Dashboard
                </h1>
              </div>
              <p className="text-muted-foreground">
                Monitor road damage reports across Solapur
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Last updated: {new Date().toLocaleString()}</span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {statsCards.map((stat, index) => (
              <Card
                key={stat.title}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      {isLoading ? (
                        <Skeleton className="h-8 w-16 mt-1" />
                      ) : (
                        <p className="text-3xl font-bold text-foreground mt-1">
                          {stat.value.toLocaleString()}
                        </p>
                      )}
                      <p className={`text-xs mt-1 ${stat.color}`}>{stat.change}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content */}
          <Tabs defaultValue="reports" className="space-y-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="reports" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                All Reports
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="wards" className="gap-2">
                <MapPin className="h-4 w-4" />
                Ward Stats
              </TabsTrigger>
            </TabsList>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by ID or location..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={severityFilter} onValueChange={setSeverityFilter}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Severity</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reports Table */}
              <Card>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-8 space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : filteredReports.length === 0 ? (
                    <div className="p-12 text-center">
                      <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Reports Found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchQuery || statusFilter !== "all" || severityFilter !== "all"
                          ? "Try adjusting your filters"
                          : "Be the first to report a road issue!"}
                      </p>
                      <Link to="/report">
                        <Button>Report Damage</Button>
                      </Link>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Complaint ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="hidden md:table-cell">Location</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden lg:table-cell">Reported</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReports.slice(0, 20).map((report) => (
                          <TableRow key={report.id}>
                            <TableCell className="font-mono text-sm font-medium">
                              {report.complaint_id}
                            </TableCell>
                            <TableCell className="capitalize">{formatDamageType(report.damage_type)}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex items-center gap-2 max-w-[200px]">
                                <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
                                <span className="text-sm text-muted-foreground truncate">
                                  {report.location}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getSeverityVariant(report.severity)} className="capitalize">
                                {report.severity}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                                  report.status
                                )}`}
                              >
                                {report.status.replace("-", " ")}
                              </span>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                              {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Link to={`/track?id=${report.complaint_id}`}>
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
              {filteredReports.length > 20 && (
                <p className="text-center text-sm text-muted-foreground">
                  Showing 20 of {filteredReports.length} reports
                </p>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Reports by Type</CardTitle>
                    <CardDescription>Distribution of road damage types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <Skeleton key={i} className="h-8 w-full" />
                        ))}
                      </div>
                    ) : typeStats.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No data available</p>
                    ) : (
                      <div className="space-y-4">
                        {typeStats.map((item) => (
                          <div key={item.type} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-foreground">{item.type}</span>
                              <span className="text-muted-foreground">{item.count}</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resolution Overview</CardTitle>
                    <CardDescription>Current status distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : stats.total === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No data available</p>
                    ) : (
                      <div className="space-y-4">
                        {[
                          { label: "Pending", value: stats.pending, color: "bg-warning" },
                          { label: "In Progress", value: stats.inProgress, color: "bg-primary" },
                          { label: "Resolved", value: stats.resolved, color: "bg-success" },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${item.color}`} />
                            <span className="w-24 text-sm text-muted-foreground">{item.label}</span>
                            <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full ${item.color} rounded-full transition-all duration-500`}
                                style={{ width: `${(item.value / stats.total) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Ward Stats Tab */}
            <TabsContent value="wards">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Ward-wise Performance
                  </CardTitle>
                  <CardDescription>
                    Report statistics for top wards by volume
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : wardStats.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No data available</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ward</TableHead>
                          <TableHead>Total Reports</TableHead>
                          <TableHead>Resolved</TableHead>
                          <TableHead>Pending</TableHead>
                          <TableHead>Resolution Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {wardStats.map((ward) => (
                          <TableRow key={ward.ward}>
                            <TableCell className="font-medium">{ward.ward}</TableCell>
                            <TableCell>{ward.reports}</TableCell>
                            <TableCell className="text-success">{ward.resolved}</TableCell>
                            <TableCell className="text-warning">{ward.pending}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 max-w-24 h-2 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full bg-success rounded-full"
                                    style={{ width: `${ward.reports > 0 ? (ward.resolved / ward.reports) * 100 : 0}%` }}
                                  />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {ward.reports > 0 ? Math.round((ward.resolved / ward.reports) * 100) : 0}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
