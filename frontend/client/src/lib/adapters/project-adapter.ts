/**
 * Project Adapter
 * Transforms project data between frontend and backend formats
 */

import type { Project, InsertProject } from "@shared/schema";

export interface BackendProject {
  id: number;
  name: string;
  description: string | null;
  lead_user_id: number | null;
  deadline: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

/**
 * Convert backend project format to frontend format
 */
export function backendProjectToFrontend(backendProject: BackendProject): Project {
  return {
    id: backendProject.id.toString(),
    name: backendProject.name,
    lead: backendProject.lead_user_id?.toString() || "Unknown", // Backend uses user_id, frontend uses name string
    deadline: backendProject.deadline || "",
    description: backendProject.description,
    color: backendProject.color,
  };
}

/**
 * Convert frontend project format to backend format
 */
export function frontendProjectToBackend(frontendProject: Partial<InsertProject>) {
  return {
    name: frontendProject.name,
    description: frontendProject.description,
    // Note: lead in frontend is a string (name), but backend expects user_id
    // This may need additional logic to look up user_id by name
    lead_user_id: null, // Default to null, should be set by backend
    deadline: frontendProject.deadline,
    color: frontendProject.color,
  };
}

/**
 * Convert array of backend projects to frontend format
 */
export function backendProjectsToFrontend(backendProjects: BackendProject[]): Project[] {
  return backendProjects.map(backendProjectToFrontend);
}

