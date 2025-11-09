import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare, FolderKanban, TrendingUp, Users, BarChart3, ArrowRight, MessageSquare } from "lucide-react";
import { useTopbarStore } from "@/lib/store/topbar-store";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { API_CONFIG } from "@/lib/api-config";

interface DashboardData {
  team_members: Array<{
    user_id: number;
    name: string;
    username: string;
    role: string;
    total_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    recent_sessions: Array<{
      date: string;
      status: string;
    }>;
  }>;
  total_members: number;
}

export default function TeamLeaderDashboard() {
  const setTopbar = useTopbarStore((state) => state.setTopbar);
  const [, setLocation] = useLocation();

  useEffect(() => {
    setTopbar("Team Leader Dashboard", "Manage your team and track progress");
  }, [setTopbar]);

  // Fetch team dashboard data
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["team-dashboard"],
    queryFn: async () => {
      const token = localStorage.getItem("session_token") || localStorage.getItem("token");
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/team-leader/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch dashboard");
      return response.json();
    },
  });

  // Calculate stats from dashboard data
  const stats = useMemo(() => {
    if (!dashboardData) {
      return [
        { title: "Total Tasks", value: "0", change: "Loading...", icon: CheckSquare, color: "text-blue-600 dark:text-blue-400" },
        { title: "Team Members", value: "0", change: "Loading...", icon: Users, color: "text-purple-600 dark:text-purple-400" },
        { title: "In Progress", value: "0", change: "Loading...", icon: TrendingUp, color: "text-green-600 dark:text-green-400" },
        { title: "Completed", value: "0", change: "Loading...", icon: CheckSquare, color: "text-orange-600 dark:text-orange-400" },
      ];
    }

    const totalTasks = dashboardData.team_members.reduce((sum, m) => sum + m.total_tasks, 0);
    const completedTasks = dashboardData.team_members.reduce((sum, m) => sum + m.completed_tasks, 0);
    const inProgressTasks = dashboardData.team_members.reduce((sum, m) => sum + m.in_progress_tasks, 0);
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return [
      { title: "Total Tasks", value: totalTasks.toString(), change: `${completedTasks} completed`, icon: CheckSquare, color: "text-blue-600 dark:text-blue-400" },
      { title: "Team Members", value: dashboardData.total_members.toString(), change: "Active members", icon: Users, color: "text-purple-600 dark:text-purple-400" },
      { title: "In Progress", value: inProgressTasks.toString(), change: "Active tasks", icon: TrendingUp, color: "text-green-600 dark:text-green-400" },
      { title: "Completion Rate", value: `${completionRate}%`, change: `${completedTasks}/${totalTasks}`, icon: CheckSquare, color: "text-orange-600 dark:text-orange-400" },
    ];
  }, [dashboardData]);

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
                      AI-powered conversations with team context awareness
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
                      Generate visual timeline charts from project documents
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
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded" />
                ))}
              </div>
            ) : dashboardData && dashboardData.team_members.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.team_members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {member.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.role || "Team Member"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-blue-600 dark:text-blue-400">{member.total_tasks}</p>
                        <p className="text-xs text-muted-foreground">Tasks</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-green-600 dark:text-green-400">{member.completed_tasks}</p>
                        <p className="text-xs text-muted-foreground">Done</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-orange-600 dark:text-orange-400">{member.in_progress_tasks}</p>
                        <p className="text-xs text-muted-foreground">Active</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  No team members added yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
