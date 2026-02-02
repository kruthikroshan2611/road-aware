import { TrendingUp, Clock, Users, CheckCircle2 } from "lucide-react";
import { useReportStats } from "@/hooks/useReportStats";
import { Skeleton } from "@/components/ui/skeleton";

const StatsSection = () => {
  const { total, resolved, inProgress, pending, isLoading } = useReportStats();

  const stats = [
    {
      icon: TrendingUp,
      value: total,
      label: "Total Reports",
      change: "Active tracking",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: CheckCircle2,
      value: resolved,
      label: "Issues Resolved",
      change: total > 0 ? `${Math.round((resolved / total) * 100)}% resolution rate` : "No reports yet",
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: Clock,
      value: pending,
      label: "Pending Review",
      change: "Awaiting assessment",
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      icon: Users,
      value: inProgress,
      label: "In Progress",
      change: "Being repaired",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
            Making a Difference
          </h2>
          <p className="text-lg text-muted-foreground">
            Real-time statistics from our road repair initiative
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="group rounded-2xl bg-card p-6 shadow-card border border-border hover:shadow-card-hover hover:border-primary/20 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`inline-flex p-3 rounded-xl ${stat.bgColor} mb-4`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              {isLoading ? (
                <>
                  <Skeleton className="h-9 w-20 mb-1" />
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-4 w-28" />
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-foreground mb-1">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-sm font-medium text-foreground mb-2">{stat.label}</p>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
