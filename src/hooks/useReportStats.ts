import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ReportStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  isLoading: boolean;
}

export const useReportStats = () => {
  const [stats, setStats] = useState<ReportStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    isLoading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from("reports")
          .select("status");

        if (error) throw error;

        const total = data?.length || 0;
        const pending = data?.filter(r => r.status === "pending").length || 0;
        const inProgress = data?.filter(r => r.status === "in-progress").length || 0;
        const resolved = data?.filter(r => r.status === "resolved").length || 0;

        setStats({
          total,
          pending,
          inProgress,
          resolved,
          isLoading: false,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchStats();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("reports-stats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return stats;
};
