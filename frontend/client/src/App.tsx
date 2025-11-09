import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster as SonnerToaster } from "sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLayout } from "@/components/layout/app-layout";
import Dashboard from "@/pages/dashboard";
import AssistantPage from "@/pages/assistant-page";
import CalendarPage from "@/pages/calendar-page";
import TasksPage from "@/pages/tasks-page";
import AnnouncementsPage from "@/pages/announcements-page";
import ProjectsPage from "@/pages/projects-page";
import SettingsPage from "@/pages/settings-page";
import LoginPage from "@/pages/login-page";
import DailyUpdatesPage from "@/pages/daily-updates-page";
import TeamLeaderDashboard from "@/pages/team-leader-dashboard";
import TeamLeaderChatPage from "@/pages/team-leader-chat-page";
import TimelineChartPage from "@/pages/timeline-chart-page";
import ClearStorage from "@/pages/clear-storage";
import NotFound from "@/pages/not-found";

// Protected Route Component
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  const sessionToken = localStorage.getItem("session_token") || localStorage.getItem("token");
  
  // If no token exists at all, redirect to login immediately
  if (!sessionToken) {
    // Clear any stale data
    localStorage.removeItem("session_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Redirect to="/login" />;
  }
  
  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

// Home Route with Role-Based Redirect
function HomeRoute() {
  const [, setLocation] = useLocation();
  const sessionToken = localStorage.getItem("session_token") || localStorage.getItem("token");
  
  if (!sessionToken) {
    return <Redirect to="/login" />;
  }
  
  // Check user role
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      
      // Redirect based on role
      if (user.role === "team_leader") {
        setLocation("/team-leader-dashboard");
        return null;
      } else if (user.role === "employee") {
        setLocation("/dashboard");
        return null;
      }
    } catch (e) {
      console.error("Error parsing user data:", e);
    }
  }
  
  // Default fallback
  return <ProtectedRoute component={Dashboard} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/clear-storage" component={ClearStorage} />
      <Route path="/" component={HomeRoute} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/assistant" component={() => <ProtectedRoute component={AssistantPage} />} />
      <Route path="/calendar" component={() => <ProtectedRoute component={CalendarPage} />} />
      <Route path="/tasks" component={() => <ProtectedRoute component={TasksPage} />} />
      <Route path="/daily-updates" component={() => <ProtectedRoute component={DailyUpdatesPage} />} />
      <Route path="/announcements" component={() => <ProtectedRoute component={AnnouncementsPage} />} />
      <Route path="/projects" component={() => <ProtectedRoute component={ProjectsPage} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
      <Route path="/team-leader-dashboard" component={() => <ProtectedRoute component={TeamLeaderDashboard} />} />
      <Route path="/team-leader-chat" component={() => <ProtectedRoute component={TeamLeaderChatPage} />} />
      <Route path="/timeline-chart" component={() => <ProtectedRoute component={TimelineChartPage} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="work-console-theme">
        <TooltipProvider>
          <Router />
          <Toaster />
          <SonnerToaster position="top-right" richColors />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
