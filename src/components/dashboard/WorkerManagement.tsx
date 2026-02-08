import { useState } from "react";
import { useWorkers } from "@/hooks/useWorkers";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Users, Mail, Trash2, Loader2 } from "lucide-react";

interface WorkerWithStats {
  user_id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  assignedReports?: number;
  resolvedReports?: number;
}

export const WorkerManagement = () => {
  const { workers, isLoading, refetch } = useWorkers();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWorker, setNewWorker] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  const handleCreateWorker = async () => {
    if (!newWorker.email || !newWorker.password || !newWorker.fullName) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (newWorker.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newWorker.email,
        password: newWorker.password,
        options: {
          data: {
            full_name: newWorker.fullName,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      // Add worker role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: "worker",
        });

      if (roleError) throw roleError;

      toast({
        title: "Worker Created",
        description: `Worker account for ${newWorker.fullName} has been created. They will receive a verification email.`,
      });

      setNewWorker({ email: "", password: "", fullName: "" });
      setIsDialogOpen(false);
      refetch();
    } catch (error: any) {
      console.error("Error creating worker:", error);
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create worker account",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRemoveWorker = async (userId: string, workerName: string) => {
    if (!confirm(`Are you sure you want to remove ${workerName || "this worker"} from the worker role?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "worker");

      if (error) throw error;

      toast({
        title: "Worker Removed",
        description: `${workerName || "Worker"} has been removed from the worker role.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Removal Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Worker Management
          </CardTitle>
          <CardDescription>
            Create and manage worker accounts for field operations
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Worker
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Worker Account</DialogTitle>
              <DialogDescription>
                Add a new field worker to the system. They will receive an email to verify their account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Enter worker's full name"
                  value={newWorker.fullName}
                  onChange={(e) => setNewWorker((prev) => ({ ...prev, fullName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="worker@example.com"
                  value={newWorker.email}
                  onChange={(e) => setNewWorker((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={newWorker.password}
                  onChange={(e) => setNewWorker((prev) => ({ ...prev, password: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWorker} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Worker"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading workers...</div>
        ) : workers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No workers found. Click "Add Worker" to create one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.map((worker) => (
                <TableRow key={worker.user_id}>
                  <TableCell className="font-medium">
                    {worker.full_name || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {worker.email || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">Active</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(worker.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveWorker(worker.user_id, worker.full_name || "")}
                      title="Remove worker role"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
