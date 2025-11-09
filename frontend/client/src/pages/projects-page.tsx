import { useEffect } from "react";
import { ProjectOverview } from "@/components/projects/project-overview";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderKanban } from "lucide-react";
import { useProjects } from "@/lib/hooks/use-projects";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useTopbarStore } from "@/lib/store/topbar-store";

export default function ProjectsPage() {
  const setTopbar = useTopbarStore((state) => state.setTopbar);
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: tasks = [] } = useTasks();

  useEffect(() => {
    setTopbar("Projects", "Overview of all your active projects");
  }, [setTopbar]);

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="max-w-7xl mx-auto">
        {projectsLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="loading-state-projects">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-state-projects">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FolderKanban className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2" data-testid="text-empty-projects-title">No projects yet</h3>
            <p className="text-sm text-muted-foreground" data-testid="text-empty-projects-message">
              Projects will appear here once you create tasks.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projects.map((project) => {
              const projectTasks = tasks.filter(t => t.projectId === project.id);
              return (
                <ProjectOverview
                  key={project.id}
                  project={project}
                  tasks={projectTasks}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
