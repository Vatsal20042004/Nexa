import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { tasks, projects, announcements } from "@shared/schema";
import ws from "ws";

// Configure WebSocket for Node.js
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seed() {
  console.log("Seeding database...");

  const projectColors = [
    "#3B82F6", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B",
  ];

  const projectData = [
    {
      name: "Website Redesign",
      lead: "Sarah Johnson",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Complete overhaul of company website with modern design",
      color: projectColors[0],
    },
    {
      name: "Mobile App Development",
      lead: "Michael Chen",
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Build iOS and Android apps for customer portal",
      color: projectColors[1],
    },
    {
      name: "Marketing Campaign",
      lead: "Emily Davis",
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Q4 product launch marketing initiative",
      color: projectColors[2],
    },
    {
      name: "Infrastructure Upgrade",
      lead: "David Wilson",
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Migrate services to cloud infrastructure",
      color: projectColors[3],
    },
    {
      name: "Analytics Dashboard",
      lead: "Jessica Martinez",
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Build real-time analytics and reporting dashboard",
      color: projectColors[4],
    },
  ];

  const insertedProjects = await db.insert(projects).values(projectData).returning();
  console.log(`✓ Inserted ${insertedProjects.length} projects`);

  const assignees = ["Sarah Johnson", "Michael Chen", "Emily Davis", "David Wilson", "Jessica Martinez", "Alex Thompson"];
  const priorities: Array<"high" | "medium" | "low"> = ["high", "medium", "low"];
  const statuses: Array<"pending" | "in_progress" | "done"> = ["pending", "in_progress", "done"];

  const taskTemplates = [
    "Design homepage mockups",
    "Implement user authentication",
    "Write API documentation",
    "Set up CI/CD pipeline",
    "Conduct user research",
    "Create marketing materials",
    "Database schema design",
    "Performance optimization",
    "Security audit",
    "Mobile UI design",
    "Integration testing",
    "Content strategy planning",
    "Server configuration",
    "Bug fixes and improvements",
    "Code review",
    "Deploy to staging",
    "Client presentation",
    "Analytics implementation",
    "A/B testing setup",
    "Documentation update",
  ];

  const taskData = [];
  for (let i = 0; i < 20; i++) {
    const startDate = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + (1 + Math.random() * 4) * 60 * 60 * 1000);

    taskData.push({
      title: taskTemplates[i % taskTemplates.length],
      description: `Detailed description for ${taskTemplates[i % taskTemplates.length].toLowerCase()}`,
      projectId: insertedProjects[Math.floor(Math.random() * insertedProjects.length)].id,
      assignee: assignees[Math.floor(Math.random() * assignees.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });
  }

  const insertedTasks = await db.insert(tasks).values(taskData).returning();
  console.log(`✓ Inserted ${insertedTasks.length} tasks`);

  const announcementTemplates = [
    { title: "New team member joining", body: "Please welcome Alex Thompson to the development team!", type: "general" as const },
    { title: "Sprint planning meeting", body: "Scheduled for tomorrow at 10 AM in Conference Room A", type: "general" as const },
    { title: "Task assigned", body: "You've been assigned to complete the homepage redesign", type: "task_assigned" as const },
    { title: "Deadline reminder", body: "Mobile App Development milestone due in 3 days", type: "general" as const },
    { title: "Code review requested", body: "Please review PR #234 for authentication module", type: "general" as const },
  ];

  const announcementData = announcementTemplates.map((template, i) => ({
    projectId: i % 2 === 0 ? insertedProjects[i % insertedProjects.length].id : null,
    title: template.title,
    body: template.body,
    from: assignees[i % assignees.length],
    createdAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
    type: template.type,
  }));

  const insertedAnnouncements = await db.insert(announcements).values(announcementData).returning();
  console.log(`✓ Inserted ${insertedAnnouncements.length} announcements`);

  console.log("✅ Database seeded successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Error seeding database:", error);
  process.exit(1);
});
