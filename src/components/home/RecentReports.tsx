import { MapPin, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentReports } from "@/hooks/useRecentReports";
import { formatDistanceToNow } from "date-fns";

const getSeverityVariant = (severity: string) => {
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
      return "text-success";
    case "in-progress":
      return "text-primary";
    default:
      return "text-warning";
  }
};

const formatDamageType = (type: string) => {
  return type.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
};

const RecentReports = () => {
  const { reports, isLoading } = useRecentReports(4);

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
          <div className="animate-slide-up">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-2">
              Recent Reports
            </h2>
            <p className="text-lg text-muted-foreground">
              Latest road damage reports from citizens
            </p>
          </div>
          <Link to="/dashboard">
            <Button variant="outline" className="group">
              View All Reports
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl bg-card p-5 shadow-card border border-border">
                <div className="flex justify-between mb-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-48 mb-3" />
                <div className="flex justify-between pt-3 border-t border-border">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Reports Yet</h3>
            <p className="text-muted-foreground mb-4">Be the first to report a road issue!</p>
            <Link to="/report">
              <Button>Report Damage</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reports.map((report, index) => (
              <Link
                key={report.id}
                to={`/track?id=${report.complaint_id}`}
                className="group rounded-xl bg-card p-5 shadow-card border border-border hover:shadow-card-hover hover:border-primary/20 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-mono text-primary font-medium">{report.complaint_id}</p>
                    <p className="text-lg font-semibold text-foreground mt-1">
                      {formatDamageType(report.damage_type)}
                    </p>
                  </div>
                  <Badge variant={getSeverityVariant(report.severity)} className="capitalize">
                    {report.severity}
                  </Badge>
                </div>

                <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span className="line-clamp-1">{report.location} • {report.ward.replace("ward-", "Ward ")}</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                  </div>
                  <span className={`text-sm font-medium capitalize ${getStatusColor(report.status)}`}>
                    {report.status.replace("-", " ")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentReports;
