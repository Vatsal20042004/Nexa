import {
  type Task,
  type InsertTask,
  type Project,
  type InsertProject,
  type Announcement,
  type InsertAnnouncement,
  type Settings,
  type User,
  type InsertUser,
  type DailyUpdate,
  type InsertDailyUpdate,
  tasks,
  projects,
  announcements,
  settings,
  users,
  dailyUpdates,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import ws from "ws";

// Configure WebSocket for Node.js
neonConfig.webSocketConstructor = ws;

export interface IStorage {
  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;

  getAnnouncements(): Promise<Announcement[]>;
  getAnnouncement(id: string): Promise<Announcement | undefined>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  deleteAnnouncement(id: string): Promise<boolean>;

  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<Settings>): Promise<Settings>;

  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getDailyUpdates(userId?: string, date?: string): Promise<DailyUpdate[]>;
  getDailyUpdate(id: string): Promise<DailyUpdate | undefined>;
  createDailyUpdate(update: InsertDailyUpdate): Promise<DailyUpdate>;
  deleteDailyUpdate(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private tasks: Map<string, Task>;
  private projects: Map<string, Project>;
  private announcements: Map<string, Announcement>;
  private settings: Settings;
  private users: Map<string, User>;
  private dailyUpdates: Map<string, DailyUpdate>;

  constructor() {
    this.tasks = new Map();
    this.projects = new Map();
    this.announcements = new Map();
    this.users = new Map();
    this.dailyUpdates = new Map();
    this.settings = {
      id: randomUUID(),
      theme: "system",
      workingHoursStart: "09:00",
      workingHoursEnd: "17:00",
      calendarDensity: "comfortable",
    };

    this.seedData();
  }

  private seedData() {
    // Seed demo user
    const demoUser: User = {
      id: randomUUID(),
      email: "admin@example.com",
      password: "password123", // In production, this should be hashed
      name: "Demo User",
      createdAt: new Date().toISOString(),
    };
    this.users.set(demoUser.id, demoUser);

    const projectColors = [
      "#3B82F6", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B",
    ];

    const projects: Project[] = [
      {
        id: randomUUID(),
        name: "Website Redesign",
        lead: "Sarah Johnson",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        description: "Complete overhaul of company website with modern design",
        color: projectColors[0],
      },
      {
        id: randomUUID(),
        name: "Mobile App Development",
        lead: "Michael Chen",
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        description: "Build iOS and Android apps for customer portal",
        color: projectColors[1],
      },
      {
        id: randomUUID(),
        name: "Marketing Campaign",
        lead: "Emily Davis",
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        description: "Q4 product launch marketing initiative",
        color: projectColors[2],
      },
      {
        id: randomUUID(),
        name: "Infrastructure Upgrade",
        lead: "David Wilson",
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        description: "Migrate services to cloud infrastructure",
        color: projectColors[3],
      },
      {
        id: randomUUID(),
        name: "Analytics Dashboard",
        lead: "Jessica Martinez",
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        description: "Build real-time analytics and reporting dashboard",
        color: projectColors[4],
      },
    ];

    projects.forEach((project) => this.projects.set(project.id, project));

    const projectIds = Array.from(this.projects.keys());
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

    for (let i = 0; i < 20; i++) {
      const startDate = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date(startDate.getTime() + (1 + Math.random() * 4) * 60 * 60 * 1000);

      const task: Task = {
        id: randomUUID(),
        title: taskTemplates[i % taskTemplates.length],
        description: `Detailed description for ${taskTemplates[i % taskTemplates.length].toLowerCase()}`,
        projectId: projectIds[Math.floor(Math.random() * projectIds.length)],
        assignee: assignees[Math.floor(Math.random() * assignees.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      };

      this.tasks.set(task.id, task);
    }

    const announcementTemplates = [
      { title: "New team member joining", body: "Please welcome Alex Thompson to the development team!", type: "general" },
      { title: "Sprint planning meeting", body: "Scheduled for tomorrow at 10 AM in Conference Room A", type: "general" },
      { title: "Task assigned", body: "You've been assigned to complete the homepage redesign", type: "task_assigned" },
      { title: "Deadline reminder", body: "Mobile App Development milestone due in 3 days", type: "general" },
      { title: "Code review requested", body: "Please review PR #234 for authentication module", type: "general" },
    ];

    announcementTemplates.forEach((template, i) => {
      const announcement: Announcement = {
        id: randomUUID(),
        projectId: i % 2 === 0 ? projectIds[i % projectIds.length] : null,
        title: template.title,
        body: template.body,
        from: assignees[i % assignees.length],
        createdAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        type: template.type as "task_assigned" | "general",
      };

      this.announcements.set(announcement.id, announcement);
    });
  }

  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = { 
      ...insertTask, 
      id,
      priority: insertTask.priority ?? "medium",
      status: insertTask.status ?? "pending",
      description: insertTask.description ?? null,
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask = { ...task, ...updates };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = { 
      ...insertProject, 
      id,
      description: insertProject.description ?? null,
      color: insertProject.color ?? null,
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updatedProject = { ...project, ...updates };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  async getAnnouncements(): Promise<Announcement[]> {
    return Array.from(this.announcements.values());
  }

  async getAnnouncement(id: string): Promise<Announcement | undefined> {
    return this.announcements.get(id);
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const id = randomUUID();
    const announcement: Announcement = { 
      ...insertAnnouncement, 
      id,
      projectId: insertAnnouncement.projectId ?? null,
      type: insertAnnouncement.type ?? "general",
      createdAt: new Date().toISOString(),
    };
    this.announcements.set(id, announcement);
    return announcement;
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    return this.announcements.delete(id);
  }

  async getSettings(): Promise<Settings> {
    return this.settings;
  }

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    this.settings = { ...this.settings, ...updates };
    return this.settings;
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date().toISOString(),
    };
    this.users.set(id, user);
    return user;
  }

  // Daily updates methods
  async getDailyUpdates(userId?: string, date?: string): Promise<DailyUpdate[]> {
    let updates = Array.from(this.dailyUpdates.values());
    
    if (userId) {
      updates = updates.filter(u => u.userId === userId);
    }
    
    if (date) {
      updates = updates.filter(u => u.date === date);
    }
    
    return updates.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getDailyUpdate(id: string): Promise<DailyUpdate | undefined> {
    return this.dailyUpdates.get(id);
  }

  async createDailyUpdate(insertUpdate: InsertDailyUpdate): Promise<DailyUpdate> {
    const id = randomUUID();
    const update: DailyUpdate = {
      ...insertUpdate,
      id,
      description: insertUpdate.description ?? null,
      fileName: insertUpdate.fileName ?? null,
      fileUrl: insertUpdate.fileUrl ?? null,
      fileSize: insertUpdate.fileSize ?? null,
      recordingDuration: insertUpdate.recordingDuration ?? null,
      recordingInterval: insertUpdate.recordingInterval ?? null,
      recordingUrl: insertUpdate.recordingUrl ?? null,
      githubUsername: insertUpdate.githubUsername ?? null,
      githubRepo: insertUpdate.githubRepo ?? null,
      githubCommits: insertUpdate.githubCommits ?? null,
      transcriptContent: insertUpdate.transcriptContent ?? null,
      createdAt: new Date().toISOString(),
    };
    this.dailyUpdates.set(id, update);
    return update;
  }

  async deleteDailyUpdate(id: string): Promise<boolean> {
    return this.dailyUpdates.delete(id);
  }
}

// Database Storage using PostgreSQL
export class DbStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle(pool);
  }

  async getTasks(): Promise<Task[]> {
    return await this.db.select().from(tasks);
  }

  async getTask(id: string): Promise<Task | undefined> {
    const result = await this.db.select().from(tasks).where(eq(tasks.id, id));
    return result[0];
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const result = await this.db.insert(tasks).values(insertTask).returning();
    return result[0];
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const result = await this.db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return result[0];
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await this.db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }

  async getProjects(): Promise<Project[]> {
    return await this.db.select().from(projects);
  }

  async getProject(id: string): Promise<Project | undefined> {
    const result = await this.db.select().from(projects).where(eq(projects.id, id));
    return result[0];
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const result = await this.db.insert(projects).values(insertProject).returning();
    return result[0];
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const result = await this.db.update(projects).set(updates).where(eq(projects.id, id)).returning();
    return result[0];
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await this.db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }

  async getAnnouncements(): Promise<Announcement[]> {
    return await this.db.select().from(announcements);
  }

  async getAnnouncement(id: string): Promise<Announcement | undefined> {
    const result = await this.db.select().from(announcements).where(eq(announcements.id, id));
    return result[0];
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const announcementWithTimestamp = {
      ...insertAnnouncement,
      createdAt: new Date().toISOString(),
    };
    const result = await this.db.insert(announcements).values(announcementWithTimestamp).returning();
    return result[0];
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    const result = await this.db.delete(announcements).where(eq(announcements.id, id)).returning();
    return result.length > 0;
  }

  async getSettings(): Promise<Settings> {
    const result = await this.db.select().from(settings).limit(1);
    if (result.length === 0) {
      const defaultSettings = await this.db.insert(settings).values({}).returning();
      return defaultSettings[0];
    }
    return result[0];
  }

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    const current = await this.getSettings();
    const result = await this.db.update(settings).set(updates).where(eq(settings.id, current.id)).returning();
    return result[0];
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const userWithTimestamp = {
      ...insertUser,
      createdAt: new Date().toISOString(),
    };
    const result = await this.db.insert(users).values(userWithTimestamp).returning();
    return result[0];
  }

  // Daily updates methods
  async getDailyUpdates(userId?: string, date?: string): Promise<DailyUpdate[]> {
    let query = this.db.select().from(dailyUpdates);
    
    // Note: For proper filtering with multiple conditions, you'd need to build
    // the where clause dynamically. This is a simplified version.
    const results = await query;
    
    let filtered = results;
    if (userId) {
      filtered = filtered.filter(u => u.userId === userId);
    }
    if (date) {
      filtered = filtered.filter(u => u.date === date);
    }
    
    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getDailyUpdate(id: string): Promise<DailyUpdate | undefined> {
    const result = await this.db.select().from(dailyUpdates).where(eq(dailyUpdates.id, id));
    return result[0];
  }

  async createDailyUpdate(insertUpdate: InsertDailyUpdate): Promise<DailyUpdate> {
    const updateWithTimestamp = {
      ...insertUpdate,
      createdAt: new Date().toISOString(),
    };
    const result = await this.db.insert(dailyUpdates).values(updateWithTimestamp).returning();
    return result[0];
  }

  async deleteDailyUpdate(id: string): Promise<boolean> {
    const result = await this.db.delete(dailyUpdates).where(eq(dailyUpdates.id, id)).returning();
    return result.length > 0;
  }
}

// Use in-memory storage if no DATABASE_URL is provided
export const storage = process.env.DATABASE_URL 
  ? new DbStorage() 
  : new MemStorage();
