import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Worker {
  user_id: string;
  email: string;
  full_name: string;
}

export const useWorkers = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        // Get all worker user_ids
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("user_id")
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

        setWorkers(
          profileData?.map((p) => ({
            user_id: p.user_id,
            email: p.email || "",
            full_name: p.full_name || "Unknown Worker",
          })) || []
        );
      } catch (error) {
        console.error("Failed to fetch workers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  return { workers, isLoading };
};
