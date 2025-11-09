import { Clock, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Task, Project } from "@shared/schema";
import { priorityColors, statusColors } from "@/lib/utils/colors";
import { formatDate } from "@/lib/utils/date";

interface TaskCardProps {
  task: Task;
  project?: Project;
  onClick?: () => void;
}

export function TaskCard({ task, project, onClick }: TaskCardProps) {
  const priorityStyle = priorityColors[task.priority];
  const statusStyle = statusColors[task.status];

  const initials = task.assignee
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card
      className="p-4 border border-card-border"
      data-testid={`card-task-${task.id}`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-base text-foreground line-clamp-2 flex-1" data-testid="text-task-title">
            {task.title}
          </h3>
          <Badge
            variant="outline"
            className={`text-xs px-2.5 py-0.5 ${priorityStyle.bg} ${priorityStyle.text} border-0`}
            data-testid={`badge-priority-${task.priority}`}
          >
            {task.priority}
          </Badge>
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2" data-testid="text-task-description">
            {task.description}
          </p>
        )}

        {project && (
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: project.color }}
            />
            <span className="text-xs text-muted-foreground" data-testid="text-project-name">
              {project.name}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs bg-muted" data-testid="text-assignee-initials">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground" data-testid="text-assignee-name">
              {task.assignee}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
              <span className="text-xs text-muted-foreground capitalize" data-testid="text-task-status">
                {task.status.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid="text-task-due-date">
              <Clock className="w-3 h-3" />
              <span>{formatDate(task.end)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
