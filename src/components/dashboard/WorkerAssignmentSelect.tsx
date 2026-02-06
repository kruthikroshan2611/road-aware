import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkers } from "@/hooks/useWorkers";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "lucide-react";

interface WorkerAssignmentSelectProps {
  reportId: string;
  currentAssignee: string | null;
  onAssignmentChange?: () => void;
}

export const WorkerAssignmentSelect = ({
  reportId,
  currentAssignee,
  onAssignmentChange,
}: WorkerAssignmentSelectProps) => {
  const { workers, isLoading } = useWorkers();
  const { toast } = useToast();

  const handleAssign = async (workerId: string) => {
    const assignTo = workerId === "unassigned" ? null : workerId;
    
    const { error } = await supabase
      .from("reports")
      .update({ 
        assigned_to: assignTo,
        status: assignTo ? "in-progress" : "pending"
      })
      .eq("id", reportId);

    if (error) {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const workerName = workers.find(w => w.user_id === workerId)?.full_name || "Unassigned";
    
    toast({
      title: "Report Assigned",
      description: assignTo 
        ? `Report assigned to ${workerName}` 
        : "Report unassigned",
    });

    // Send email notification
    if (assignTo) {
      try {
        await supabase.functions.invoke("send-status-notification", {
          body: {
            reportId,
            type: "assignment",
            workerId: assignTo,
          },
        });
      } catch (e) {
        console.error("Failed to send notification:", e);
      }
    }

    onAssignmentChange?.();
  };

  if (isLoading) {
    return <span className="text-xs text-muted-foreground">Loading...</span>;
  }

  return (
    <Select
      value={currentAssignee || "unassigned"}
      onValueChange={handleAssign}
    >
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="Assign worker">
          {currentAssignee ? (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {workers.find(w => w.user_id === currentAssignee)?.full_name || "Unknown"}
            </span>
          ) : (
            <span className="text-muted-foreground">Unassigned</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">
          <span className="text-muted-foreground">Unassigned</span>
        </SelectItem>
        {workers.map((worker) => (
          <SelectItem key={worker.user_id} value={worker.user_id}>
            <div className="flex flex-col">
              <span>{worker.full_name}</span>
              <span className="text-xs text-muted-foreground">{worker.email}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
