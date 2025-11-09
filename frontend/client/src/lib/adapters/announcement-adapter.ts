/**
 * Announcement Adapter
 * Transforms announcement data between frontend and backend formats
 */

import type { Announcement, InsertAnnouncement } from "@shared/schema";

export interface BackendAnnouncement {
  id: number;
  project_id: number | null;
  title: string;
  body: string;
  from_user_id: number;
  type: string;
  created_at: string;
}

/**
 * Convert backend announcement format to frontend format
 */
export function backendAnnouncementToFrontend(backendAnnouncement: BackendAnnouncement): Announcement {
  return {
    id: backendAnnouncement.id.toString(),
    projectId: backendAnnouncement.project_id?.toString() || undefined,
    title: backendAnnouncement.title,
    body: backendAnnouncement.body,
    from: backendAnnouncement.from_user_id.toString(), // Backend has user_id, frontend expects name string
    createdAt: backendAnnouncement.created_at,
    type: backendAnnouncement.type as "task_assigned" | "general",
  };
}

/**
 * Convert frontend announcement format to backend format
 */
export function frontendAnnouncementToBackend(frontendAnnouncement: Partial<InsertAnnouncement>) {
  return {
    project_id: frontendAnnouncement.projectId ? parseInt(frontendAnnouncement.projectId) : null,
    title: frontendAnnouncement.title,
    body: frontendAnnouncement.body,
    type: frontendAnnouncement.type || "general",
    // Note: from_user_id will be set by backend from authenticated user
  };
}

/**
 * Convert array of backend announcements to frontend format
 */
export function backendAnnouncementsToFrontend(backendAnnouncements: BackendAnnouncement[]): Announcement[] {
  return backendAnnouncements.map(backendAnnouncementToFrontend);
}

