import { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare, Calendar, FolderKanban, TrendingUp } from "lucide-react";
import { useTasks, useTodayTasks } from "@/lib/hooks/use-tasks";
import { useProjects } from "@/lib/hooks/use-projects";
import { useTopbarStore } from "@/lib/store/topbar-store";
import { parseISO, subDays, startOfDay, endOfDay, isWithinInterval, format } from "date-fns";
import type { Task } from "@shared/schema";

export default function Dashboard() {
  const setTopbar = useTopbarStore((state) => state.setTopbar);

  useEffect(() => {
    setTopbar("Dashboard", "Welcome back! Here's your productivity overview");
  }, [setTopbar]);

  const { data: allTasks = [], isLoading: allTasksLoading } = useTasks();
  const { data: todaysTasks = [], isLoading: todaysTasksLoading } = useTodayTasks();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  
  const tasksLoading = allTasksLoading || todaysTasksLoading;

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = subDays(now, 7);
    
    const thisWeekTasks = allTasks.filter(t => parseISO(t.start) >= weekAgo).length;
    const completedTasks = allTasks.filter(t => t.status === "done").length;
    const completionRate = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;

    return [
      {
        title: "Total Tasks",
        value: allTasks.length.toString(),
        change: "+12%",
        icon: CheckSquare,
        color: "text-blue-600 dark:text-blue-400",
      },
      {
        title: "Active Projects",
        value: projects.length.toString(),
        change: `+${projects.length}`,
        icon: FolderKanban,
        color: "text-purple-600 dark:text-purple-400",
      },
      {
        title: "This Week",
        value: thisWeekTasks.toString(),
        change: `${thisWeekTasks} tasks`,
        icon: Calendar,
        color: "text-green-600 dark:text-green-400",
      },
      {
        title: "Completion Rate",
        value: `${completionRate}%`,
        change: `${completedTasks}/${allTasks.length}`,
        icon: TrendingUp,
        color: "text-orange-600 dark:text-orange-400",
      },
    ];
  }, [allTasks, projects]);

  const todaysTasksWithProjects = useMemo(() => {
    return todaysTasks
      .map(task => {
        const project = projects.find(p => p.id === task.projectId);
        return {
          ...task,
          projectName: project?.name || "General Tasks",
        };
      })
      .sort((a, b) => {
        if (a.status === "done" && b.status !== "done") return 1;
        if (a.status !== "done" && b.status === "done") return -1;
        return parseISO(a.start).getTime() - parseISO(b.start).getTime();
      });
  }, [todaysTasks, projects]);

  const now = new Date();

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-l-red-500 dark:border-l-red-400";
      case "medium":
        return "border-l-4 border-l-yellow-500 dark:border-l-yellow-400";
      case "low":
        return "border-l-4 border-l-green-500 dark:border-l-green-400";
      default:
        return "border-l-4 border-l-gray-300 dark:border-l-gray-600";
    }
  };

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tasksLoading || projectsLoading ? (
            <div className="contents" data-testid="loading-state-dashboard-stats">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : (
            stats.map((stat) => (
              <Card key={stat.title} className="hover-elevate transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-foreground" data-testid={`stat-${stat.title.toLowerCase().replace(' ', '-')}`}>
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today's Tasks - {format(now, "MMMM d, yyyy")}</CardTitle>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-4" data-testid="loading-state-todays-tasks">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded" />
                ))}
              </div>
            ) : todaysTasksWithProjects.length === 0 ? (
              <div className="text-center py-12" data-testid="empty-state-todays-tasks">
                <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  No tasks scheduled for today. Enjoy your day!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysTasksWithProjects.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-4 p-4 rounded-lg bg-card hover-elevate transition-all ${getPriorityColor(task.priority)} ${
                      task.status === "done" ? "opacity-60" : ""
                    }`}
                    data-testid={`today-task-${task.id}`}
                  >
                    <Checkbox
                      checked={task.status === "done"}
                      disabled={true}
                      className="mt-1"
                      data-testid={`checkbox-task-${task.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`text-sm font-medium text-foreground ${
                          task.status === "done" ? "line-through" : ""
                        }`}
                        data-testid={`task-title-${task.id}`}
                      >
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2" data-testid={`task-description-${task.id}`}>
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span data-testid={`task-project-${task.id}`}>{task.projectName}</span>
                        <span data-testid={`task-time-${task.id}`}>
                          {format(parseISO(task.start), "h:mm a")} - {format(parseISO(task.end), "h:mm a")}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            task.priority === "high"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : task.priority === "medium"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          }`}
                          data-testid={`task-priority-${task.id}`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
