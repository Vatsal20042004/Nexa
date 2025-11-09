import { useEffect } from "react";
import { AnnouncementList } from "@/components/announcements/announcement-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnnouncements } from "@/lib/hooks/use-announcements";
import { useProjects } from "@/lib/hooks/use-projects";
import { useTopbarStore } from "@/lib/store/topbar-store";

export default function AnnouncementsPage() {
  const setTopbar = useTopbarStore((state) => state.setTopbar);
  const { data: announcements = [], isLoading } = useAnnouncements();
  const { data: projects = [] } = useProjects();

  useEffect(() => {
    setTopbar("Announcements", "Stay updated with team activities and notifications");
  }, [setTopbar]);

  const sortedAnnouncements = [...announcements].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Recent Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <AnnouncementList
              announcements={sortedAnnouncements}
              projects={projects}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
