import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RecentReport {
  id: string;
  complaint_id: string;
  location: string;
  ward: string;
  damage_type: string;
  severity: string;
  status: string;
  created_at: string;
}

export const useRecentReports = (limit: number = 4) => {
  const [reports, setReports] = useState<RecentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data, error } = await supabase
          .from("reports")
          .select("id, complaint_id, location, ward, damage_type, severity, status, created_at")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;

        setReports(data || []);
      } catch (error) {
        console.error("Failed to fetch recent reports:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("recent-reports")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return { reports, isLoading };
};
