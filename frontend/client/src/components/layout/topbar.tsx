import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "./theme-toggle";
import { useTopbarStore } from "@/lib/store/topbar-store";

export function Topbar() {
  const { title, subtitle, actions } = useTopbarStore();

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <div>
          <h2 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">
            {title || ""}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground" data-testid="text-page-subtitle">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {actions}
        <ThemeToggle />
      </div>
    </header>
  );
}
