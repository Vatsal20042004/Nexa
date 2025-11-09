import { Calendar, CheckSquare, Bell, MessageSquare, Settings, FolderKanban, LayoutDashboard, Sparkles, FileEdit, Users, BarChart3 } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const mainNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "AI Assistant", href: "/assistant", icon: Sparkles },
  { name: "Daily Updates", href: "/daily-updates", icon: FileEdit },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Announcements", href: "/announcements", icon: Bell },
];

const teamLeaderNavigation = [
  { name: "Team Dashboard", href: "/team-leader-dashboard", icon: Users },
  { name: "Team Chat", href: "/team-leader-chat", icon: MessageSquare },
  { name: "Timeline Chart", href: "/timeline-chart", icon: BarChart3 },
];

const secondaryNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();
  
  // Get user role from localStorage
  const getUserRole = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.role;
      } catch (e) {
        return null;
      }
    }
    return null;
  };
  
  const userRole = getUserRole();
  const isTeamLeader = userRole === "team_leader";

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold text-sidebar-foreground" data-testid="text-app-title">
            Work Console
          </h1>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive} data-testid={`link-nav-${item.name.toLowerCase()}`}>
                      <Link href={item.href}>
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isTeamLeader && (
          <SidebarGroup>
            <SidebarGroupLabel>Team Leader</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {teamLeaderNavigation.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={isActive} data-testid={`link-nav-${item.name.toLowerCase()}`}>
                        <Link href={item.href}>
                          <item.icon className="w-5 h-5" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {secondaryNavigation.map((item) => {
            const isActive = location === item.href;
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={isActive} data-testid={`link-nav-${item.name.toLowerCase()}`}>
                  <Link href={item.href}>
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
