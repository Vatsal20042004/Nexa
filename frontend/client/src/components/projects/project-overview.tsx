import { Users, Calendar, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { Project, Task } from "@shared/schema";
import { formatDate } from "@/lib/utils/date";

interface ProjectOverviewProps {
  project: Project;
  tasks: Task[];
  isLoading?: boolean;
}

export function ProjectOverview({ project, tasks, isLoading }: ProjectOverviewProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card data-testid={`project-overview-${project.id}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: project.color }}
          >
            <span className="text-white font-semibold text-lg">
              {project.name[0].toUpperCase()}
            </span>
          </div>
          <div>
            <CardTitle className="text-2xl" data-testid="text-project-name">
              {project.name}
            </CardTitle>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1" data-testid="text-project-description">
                {project.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2" data-testid={`project-lead-section-${project.id}`}>
            <Users className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Lead</p>
              <p className="font-medium text-foreground" data-testid={`text-project-lead-${project.id}`}>
                {project.lead}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2" data-testid={`project-deadline-section-${project.id}`}>
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className="font-medium text-foreground" data-testid={`text-project-deadline-${project.id}`}>
                {formatDate(project.deadline)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2" data-testid={`project-tasks-section-${project.id}`}>
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Tasks</p>
              <p className="font-medium text-foreground" data-testid={`text-project-tasks-${project.id}`}>
                {completedTasks} / {totalTasks}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Progress</span>
            <span className="text-sm text-muted-foreground" data-testid={`text-project-progress-${project.id}`}>
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" data-testid={`progress-bar-${project.id}`} />
        </div>

        <div className="flex gap-2 flex-wrap">
          {tasks.filter((t) => t.status === "pending").length > 0 && (
            <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-0">
              {tasks.filter((t) => t.status === "pending").length} Pending
            </Badge>
          )}
          {tasks.filter((t) => t.status === "in_progress").length > 0 && (
            <Badge variant="outline" className="bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-0">
              {tasks.filter((t) => t.status === "in_progress").length} In Progress
            </Badge>
          )}
          {tasks.filter((t) => t.status === "done").length > 0 && (
            <Badge variant="outline" className="bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-0">
              {tasks.filter((t) => t.status === "done").length} Done
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
