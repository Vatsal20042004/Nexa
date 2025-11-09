import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFilterStore } from "@/lib/store/filter-store";
import type { Priority, Status } from "@shared/schema";

const priorities: Priority[] = ["high", "medium", "low"];
const statuses: Status[] = ["pending", "in_progress", "done"];

export function TaskFilters() {
  const {
    selectedPriorities,
    selectedStatuses,
    setSelectedPriorities,
    setSelectedStatuses,
    clearFilters,
  } = useFilterStore();

  const togglePriority = (priority: Priority) => {
    if (selectedPriorities.includes(priority)) {
      setSelectedPriorities(selectedPriorities.filter((p) => p !== priority));
    } else {
      setSelectedPriorities([...selectedPriorities, priority]);
    }
  };

  const toggleStatus = (status: Status) => {
    if (selectedStatuses.includes(status)) {
      setSelectedStatuses(selectedStatuses.filter((s) => s !== status));
    } else {
      setSelectedStatuses([...selectedStatuses, status]);
    }
  };

  const hasFilters = selectedPriorities.length > 0 || selectedStatuses.length > 0;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">Priority:</span>
        <div className="flex gap-1">
          {priorities.map((priority) => (
            <Badge
              key={priority}
              variant={selectedPriorities.includes(priority) ? "default" : "outline"}
              className="cursor-pointer hover-elevate capitalize"
              onClick={() => togglePriority(priority)}
              data-testid={`filter-priority-${priority}`}
            >
              {priority}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">Status:</span>
        <div className="flex gap-1">
          {statuses.map((status) => (
            <Badge
              key={status}
              variant={selectedStatuses.includes(status) ? "default" : "outline"}
              className="cursor-pointer hover-elevate capitalize"
              onClick={() => toggleStatus(status)}
              data-testid={`filter-status-${status}`}
            >
              {status.replace("_", " ")}
            </Badge>
          ))}
        </div>
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="gap-1"
          data-testid="button-clear-filters"
        >
          <X className="w-4 h-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
