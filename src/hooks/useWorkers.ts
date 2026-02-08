import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Worker {
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

export const useWorkers = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get all worker user_ids with created_at
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id, created_at")
        .eq("role", "worker");

      if (roleError) throw roleError;

      if (!roleData || roleData.length === 0) {
        setWorkers([]);
        return;
      }

      // Get profile info for each worker
      const workerIds = roleData.map((r) => r.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", workerIds);

      if (profileError) throw profileError;

      // Create a map of created_at from role data
      const createdAtMap = new Map(
        roleData.map((r) => [r.user_id, r.created_at])
      );

      setWorkers(
        profileData?.map((p) => ({
          user_id: p.user_id,
          email: p.email,
          full_name: p.full_name || "Unknown Worker",
          created_at: createdAtMap.get(p.user_id) || new Date().toISOString(),
        })) || []
      );
    } catch (error) {
      console.error("Failed to fetch workers:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  return { workers, isLoading, refetch: fetchWorkers };
};
