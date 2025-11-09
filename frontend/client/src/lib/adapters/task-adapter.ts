/**
 * Task Adapter
 * Transforms task data between frontend and backend formats
 */

import type { Task, InsertTask } from "@shared/schema";

export interface BackendTask {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  start_time?: string | null;
  end_time?: string | null;
  project_id?: string | null;
  assignee?: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

/**
 * Convert backend task format to frontend format
 */
export function backendTaskToFrontend(backendTask: BackendTask): Task {
  // Map status: completed → done, cancelled → pending
  let status: "pending" | "in_progress" | "done" = "pending";
  if (backendTask.status === "completed" || backendTask.status === "done") {
    status = "done";
  } else if (backendTask.status === "in_progress") {
    status = "in_progress";
  } else if (backendTask.status === "cancelled") {
    status = "pending";
  }

  // Map priority: urgent → high
  let priority: "high" | "medium" | "low" = "medium";
  if (backendTask.priority === "urgent" || backendTask.priority === "high") {
    priority = "high";
  } else if (backendTask.priority === "medium") {
    priority = "medium";
  } else if (backendTask.priority === "low") {
    priority = "low";
  }

  // Use start_time and end_time if available, otherwise use due_date
  const startTime = backendTask.start_time || backendTask.due_date || new Date().toISOString();
  const endTime = backendTask.end_time || backendTask.due_date || new Date().toISOString();
  
  return {
    id: backendTask.id.toString(),
    title: backendTask.title,
    description: backendTask.description || "",
    projectId: backendTask.project_id || "0", // Use project_id from backend or default
    assignee: backendTask.assignee || "Current User",
    priority,
    status,
    start: startTime,
    end: endTime,
  };
}

/**
 * Convert frontend task format to backend format
 */
export function frontendTaskToBackend(frontendTask: Partial<InsertTask>) {
  // Map status: done → completed (backend format)
  let backendStatus: string | undefined = frontendTask.status;
  if (frontendTask.status === "done") {
    backendStatus = "completed";
  } else if (frontendTask.status === "in_progress") {
    backendStatus = "in_progress";
  } else if (frontendTask.status === "pending") {
    backendStatus = "pending";
  }

  return {
    title: frontendTask.title,
    description: frontendTask.description,
    priority: frontendTask.priority,
    status: backendStatus,
    due_date: frontendTask.start || frontendTask.end,
    start_time: frontendTask.start,
    end_time: frontendTask.end,
    project_id: frontendTask.projectId,
    assignee: frontendTask.assignee,
  };
}

/**
 * Convert array of backend tasks to frontend format
 */
export function backendTasksToFrontend(backendTasks: BackendTask[]): Task[] {
  return backendTasks.map(backendTaskToFrontend);
}


