import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { refreshPages } from "@/api/pages/refresh";
import { Project } from "@/types";

interface RefreshPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onRefreshComplete: () => void;
}

export function RefreshPagesModal({ 
  isOpen, 
  onClose, 
  projects,
  onRefreshComplete
}: RefreshPagesModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRefresh = async () => {
    if (!selectedProjectId) {
      toast({
        title: "Error",
        description: "Please select a project",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await refreshPages(selectedProjectId);
      
      toast({
        title: "Success",
        description: "Pages refreshed successfully",
      });
      
      onRefreshComplete();
      onClose();
    } catch (error: any) {
      console.error("Error refreshing pages:", error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to refresh pages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Refresh Pages</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="project" className="text-right col-span-1 text-sm font-medium">
              Project
            </label>
            <div className="col-span-3">
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleRefresh} disabled={isLoading || !selectedProjectId}>
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Refreshing...
              </>
            ) : (
              "Refresh Pages"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}