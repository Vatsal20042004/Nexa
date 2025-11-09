import { TaskCard } from "./task-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList } from "lucide-react";
import type { Task, Project } from "@shared/schema";

interface TaskListProps {
  tasks: Task[];
  projects: Project[];
  isLoading?: boolean;
  onTaskClick?: (task: Task) => void;
}

export function TaskList({ tasks, projects, isLoading, onTaskClick }: TaskListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="loading-state-tasks">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-state-tasks">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <ClipboardList className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2" data-testid="text-empty-tasks-title">No tasks found</h3>
        <p className="text-sm text-muted-foreground" data-testid="text-empty-tasks-message">
          Try adjusting your filters or create a new task to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="list-tasks">
      {tasks.map((task) => {
        const project = projects.find((p) => p.id === task.projectId);
        return (
          <TaskCard
            key={task.id}
            task={task}
            project={project}
            onClick={() => onTaskClick?.(task)}
          />
        );
      })}
    </div>
  );
}
