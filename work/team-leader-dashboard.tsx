import { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare, FolderKanban, TrendingUp, Users, BarChart3, ArrowRight, MessageSquare } from "lucide-react";
import { useTopbarStore } from "@/lib/store/topbar-store";
import { useLocation } from "wouter";

// TODO: Replace with actual API calls
// import { useTeamStats } from "@/lib/hooks/use-team-stats";
// import { useTeamTasks } from "@/lib/hooks/use-team-tasks";
// import { useTeamProjects } from "@/lib/hooks/use-team-projects";

export default function TeamLeaderDashboard() {
  const setTopbar = useTopbarStore((state) => state.setTopbar);
  const [, setLocation] = useLocation();

  useEffect(() => {
    setTopbar("Team Leader Dashboard", "Manage your team and track progress");
  }, [setTopbar]);

  // Dummy data - replace with actual API calls
  const stats = useMemo(() => {
    return [
      {
        title: "Total Tasks",
        value: "42",
        change: "+12%",
        icon: CheckSquare,
        color: "text-blue-600 dark:text-blue-400",
      },
      {
        title: "Active Projects",
        value: "5",
        change: "+2 new",
        icon: FolderKanban,
        color: "text-purple-600 dark:text-purple-400",
      },
      {
        title: "This Week",
        value: "18",
        change: "18 tasks",
        icon: TrendingUp,
        color: "text-green-600 dark:text-green-400",
      },
      {
        title: "Completion Rate",
        value: "78%",
        change: "+5%",
        icon: TrendingUp,
        color: "text-orange-600 dark:text-orange-400",
      },
    ];
  }, []);

  const isLoading = false; // TODO: Replace with actual loading state

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            <div className="contents">
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
                  <div className="text-2xl font-semibold text-foreground">
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

        {/* Team Leader Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Team Leader Chat */}
          <Card className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-background border-blue-500/20 hover-elevate transition-all">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">Team Leader Chat</h3>
                    <p className="text-sm text-muted-foreground">
                      Communicate with AI assistant and manage team conversations
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => setLocation("/team-leader-chat")}
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  Open Chat
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Chart Generator */}
          <Card className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-background border-purple-500/20 hover-elevate transition-all">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">Timeline Chart Generator</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate visual timeline charts for your team projects
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => setLocation("/timeline-chart")}
                  className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  Create Timeline
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members
              </CardTitle>
              <Button variant="outline" size="sm">
                Manage Team
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded" />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Team member management coming soon
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Team Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded" />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  No recent activity to display
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
