import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell } from "lucide-react";
import type { Announcement, Project } from "@shared/schema";
import { formatRelativeTime } from "@/lib/utils/date";

interface AnnouncementListProps {
  announcements: Announcement[];
  projects: Project[];
  isLoading?: boolean;
}

export function AnnouncementList({ announcements, projects, isLoading }: AnnouncementListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="loading-state-announcements">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-state-announcements">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Bell className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2" data-testid="text-empty-announcements-title">No announcements</h3>
        <p className="text-sm text-muted-foreground" data-testid="text-empty-announcements-message">
          You're all caught up! Check back later for updates.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border" data-testid="list-announcements">
      {announcements.map((announcement, index) => {
        const project = announcement.projectId
          ? projects.find((p) => p.id === announcement.projectId)
          : null;

        const initials = announcement.from
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return (
          <div
            key={announcement.id}
            className="py-4 first:pt-0 last:pb-0 hover-elevate px-4 -mx-4 rounded-md transition-colors"
            data-testid={`announcement-${announcement.id}`}
          >
            <div className="flex gap-4">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="text-sm bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground" data-testid={`text-announcement-from-${announcement.id}`}>
                      {announcement.from}
                    </span>
                    {announcement.type && (
                      <Badge
                        variant="outline"
                        className="text-xs"
                        data-testid={`badge-announcement-type-${announcement.id}`}
                      >
                        {announcement.type === "task_assigned" ? "Task Assigned" : "General"}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap" data-testid={`text-announcement-time-${announcement.id}`}>
                    {formatRelativeTime(announcement.createdAt)}
                  </span>
                </div>

                <h4 className="font-medium text-foreground mb-1" data-testid={`text-announcement-title-${announcement.id}`}>
                  {announcement.title}
                </h4>

                <p className="text-sm text-muted-foreground" data-testid={`text-announcement-body-${announcement.id}`}>
                  {announcement.body}
                </p>

                {project && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="text-xs text-muted-foreground" data-testid={`text-project-name-${announcement.id}`}>
                      {project.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
