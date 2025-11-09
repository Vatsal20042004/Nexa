import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarBoard } from "@/components/calendar/calendar-board";
import { TaskSheet } from "@/components/tasks/task-sheet";
import { useTasks, useCreateTask, useUpdateTask } from "@/lib/hooks/use-tasks";
import { useProjects } from "@/lib/hooks/use-projects";
import { useTopbarStore } from "@/lib/store/topbar-store";
import { toast } from "sonner";
import type { InsertTask } from "@shared/schema";

export default function CalendarPage() {
  const setTopbar = useTopbarStore((state) => state.setTopbar);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: tasks = [] } = useTasks();
  const { data: projects = [] } = useProjects();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask(selectedTaskId || "");

  useEffect(() => {
    const actions = (
      <Button onClick={() => {
        setSelectedTaskId(null);
        setSelectedDate(null);
        setIsTaskSheetOpen(true);
      }} data-testid="button-create-task">
        <Plus className="w-4 h-4 mr-2" />
        New Task
      </Button>
    );
    setTopbar("Calendar", "Manage your schedule and tasks", actions);
  }, [setTopbar]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedTaskId(null);
    setIsTaskSheetOpen(true);
  };

  const handleEventClick = (taskId: string) => {
    // Task editing disabled - tasks cannot be altered once assigned
    return;
  };

  const handleEventDrop = async (taskId: string, start: Date, end: Date) => {
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
      setSelectedDate(null);
      setSelectedTaskId(null);
    } catch (error) {
      toast.error(`Failed to ${selectedTaskId ? "update" : "create"} task`);
    }
  };

  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null;

  return (
    <div className="p-6 h-full flex flex-col overflow-auto">
      <div className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full min-h-0">
        <CalendarBoard
          tasks={tasks}
          projects={projects}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
          onEventDrop={handleEventDrop}
        />
      </div>

      <TaskSheet
        isOpen={isTaskSheetOpen}
        isEditing={!!selectedTaskId}
        onClose={() => {
          setIsTaskSheetOpen(false);
          setSelectedDate(null);
          setSelectedTaskId(null);
        }}
        onSubmit={handleSubmit}
        projects={projects}
        defaultValues={
          selectedTask
            ? selectedTask
            : selectedDate
            ? {
                title: "",
                description: "",
                projectId: projects[0]?.id || "",
                assignee: "",
                priority: "medium",
                status: "pending",
                start: selectedDate.toISOString(),
                end: new Date(selectedDate.getTime() + 3600000).toISOString(),
              }
            : {
                title: "",
                description: "",
                projectId: projects[0]?.id || "",
                assignee: "",
                priority: "medium",
                status: "pending",
                start: new Date().toISOString(),
                end: new Date(Date.now() + 3600000).toISOString(),
              }
        }
      />
    </div>
  );
}
