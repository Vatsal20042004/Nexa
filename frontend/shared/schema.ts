import { z } from "zod";
import { pgTable, uuid, text, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Drizzle Enums
export const priorityPgEnum = pgEnum("priority", ["high", "medium", "low"]);
export const statusPgEnum = pgEnum("status", ["pending", "in_progress", "done"]);
export const announcementTypePgEnum = pgEnum("announcement_type", ["task_assigned", "general"]);

// Priority and Status Enums (Zod)
export const priorityEnum = z.enum(["high", "medium", "low"]);
export const statusEnum = z.enum(["pending", "in_progress", "done"]);
export const announcementTypeEnum = z.enum(["task_assigned", "general"]);

export type Priority = z.infer<typeof priorityEnum>;
export type Status = z.infer<typeof statusEnum>;
export type AnnouncementType = z.infer<typeof announcementTypeEnum>;

// Drizzle Tables - using text for dates to maintain string compatibility
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  projectId: uuid("project_id").notNull(),
  assignee: text("assignee").notNull(),
  priority: priorityPgEnum("priority").notNull().default("medium"),
  status: statusPgEnum("status").notNull().default("pending"),
  start: text("start").notNull(),
  end: text("end").notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  lead: text("lead").notNull(),
  deadline: text("deadline").notNull(),
  description: text("description"),
  color: text("color"),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true });

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  from: text("from").notNull(),
  createdAt: text("created_at").notNull(),
  type: announcementTypePgEnum("type").default("general"),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true });

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  theme: text("theme").notNull().default("system"),
  workingHoursStart: text("working_hours_start").notNull().default("09:00"),
  workingHoursEnd: text("working_hours_end").notNull().default("17:00"),
  calendarDensity: text("calendar_density").notNull().default("comfortable"),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });

// Settings validation schema for forms (without id)
export const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  workingHoursStart: z.string(),
  workingHoursEnd: z.string(),
  calendarDensity: z.enum(["comfortable", "compact"]),
});

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Daily updates enum
export const updateTypePgEnum = pgEnum("update_type", [
  "file_upload",
  "screen_recording",
  "github_update",
  "project_transcript",
  "text_note"
]);

export const updateTypeEnum = z.enum([
  "file_upload",
  "screen_recording", 
  "github_update",
  "project_transcript",
  "text_note"
]);

export type UpdateType = z.infer<typeof updateTypeEnum>;

// Daily updates table
export const dailyUpdates = pgTable("daily_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  date: text("date").notNull(),
  type: updateTypePgEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  
  // File upload fields
  fileName: text("file_name"),
  fileUrl: text("file_url"),
  fileSize: text("file_size"),
  
  // Recording fields
  recordingDuration: text("recording_duration"),
  recordingInterval: text("recording_interval"),
  recordingUrl: text("recording_url"),
  
  // GitHub fields
  githubUsername: text("github_username"),
  githubRepo: text("github_repo"),
  githubCommits: text("github_commits"),
  
  // Transcript fields
  transcriptContent: text("transcript_content"),
  
  createdAt: text("created_at").notNull(),
});

export const insertDailyUpdateSchema = createInsertSchema(dailyUpdates).omit({ 
  id: true, 
  createdAt: true 
});

export type DailyUpdate = typeof dailyUpdates.$inferSelect;
export type InsertDailyUpdate = z.infer<typeof insertDailyUpdateSchema>;
