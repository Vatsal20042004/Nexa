import { useState, useMemo, useEffect } from "react";
import { Plus, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskList } from "@/components/tasks/task-list";
import { TaskSheet } from "@/components/tasks/task-sheet";
import { useTasks, useCreateTask, useUpdateTask } from "@/lib/hooks/use-tasks";
import { useProjects } from "@/lib/hooks/use-projects";
import { useAnnouncements } from "@/lib/hooks/use-announcements";
import { useFilterStore } from "@/lib/store/filter-store";
import { useTopbarStore } from "@/lib/store/topbar-store";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/utils/date";
import type { InsertTask, Task } from "@shared/schema";

export default function TasksPage() {
  const setTopbar = useTopbarStore((state) => state.setTopbar);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: projects = [] } = useProjects();
  const { data: announcements = [] } = useAnnouncements();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask(selectedTaskId || "");

  const { selectedPriorities, selectedStatuses, selectedProject, searchQuery } = useFilterStore();

  useEffect(() => {
    const actions = (
      <Button onClick={() => {
        setSelectedTaskId(null);
        setIsTaskSheetOpen(true);
      }} data-testid="button-create-task">
        <Plus className="w-4 h-4 mr-2" />
        New Task
      </Button>
    );
    setTopbar("Tasks", "Manage and organize your work", actions);
  }, [setTopbar]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (selectedPriorities.length > 0 && !selectedPriorities.includes(task.priority)) {
        return false;
      }
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(task.status)) {
        return false;
      }
      if (selectedProject && task.projectId !== selectedProject) {
        return false;
      }
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [tasks, selectedPriorities, selectedStatuses, selectedProject, searchQuery]);

  const handleTaskClick = (task: Task) => {
    // Task editing disabled - tasks cannot be altered once assigned
    return;
  };

  const handleSubmit = async (data: InsertTask) => {
    try {
      if (selectedTaskId) {
        await updateTask.mutateAsync(data);
        toast.success("Task updated successfully");
      } else {
        await createTask.mutateAsync(data);
        toast.success("Task created successfully");
      }
      setIsTaskSheetOpen(false);
      setSelectedTaskId(null);
    } catch (error) {
      toast.error(`Failed to ${selectedTaskId ? "update" : "create"} task`);
    }
  };

  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null;

  const recentAnnouncements = useMemo(() => {
    return announcements
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [announcements]);

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {recentAnnouncements.length > 0 && (
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Recent Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentAnnouncements.map((announcement) => (
                <div key={announcement.id} className="pb-3 border-b border-border last:border-0 last:pb-0" data-testid={`announcement-${announcement.id}`}>
                  <h4 className="font-medium text-sm text-foreground" data-testid="text-announcement-title">
                    {announcement.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2" data-testid="text-announcement-body">
                    {announcement.body}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span data-testid="text-announcement-from">{announcement.from}</span>
                    <span>•</span>
                    <span data-testid="text-announcement-time">{formatRelativeTime(announcement.createdAt)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        <TaskFilters />
        <TaskList
          tasks={filteredTasks}
          projects={projects}
          isLoading={tasksLoading}
          onTaskClick={handleTaskClick}
        />
      </div>

      <TaskSheet
        isOpen={isTaskSheetOpen}
        isEditing={!!selectedTaskId}
        onClose={() => {
          setIsTaskSheetOpen(false);
          setSelectedTaskId(null);
        }}
        onSubmit={handleSubmit}
        projects={projects}
        defaultValues={selectedTask || undefined}
      />
    </div>
  );
}
