import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Project, InsertProject } from "@shared/schema";
import { backendProjectsToFrontend, backendProjectToFrontend, frontendProjectToBackend } from "@/lib/adapters/project-adapter";
import API_CONFIG from "@/lib/api-config";

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: [API_CONFIG.ENDPOINTS.PROJECTS.LIST],
    select: (data: any) => backendProjectsToFrontend(data),
  });
}

export function useProject(id: string) {
  return useQuery<Project>({
    queryKey: [API_CONFIG.ENDPOINTS.PROJECTS.BY_ID(parseInt(id))],
    enabled: !!id,
    select: (data: any) => backendProjectToFrontend(data),
  });
}

export function useCreateProject() {
  return useMutation({
    mutationFn: (data: InsertProject) => {
      const backendData = frontendProjectToBackend(data);
      return apiRequest("POST", API_CONFIG.ENDPOINTS.PROJECTS.LIST, backendData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_CONFIG.ENDPOINTS.PROJECTS.LIST] });
    },
  });
}

export function useUpdateProject(id: string) {
  return useMutation({
    mutationFn: (data: Partial<InsertProject>) => {
      const backendData = frontendProjectToBackend(data);
      return apiRequest("PATCH", API_CONFIG.ENDPOINTS.PROJECTS.BY_ID(parseInt(id)), backendData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_CONFIG.ENDPOINTS.PROJECTS.LIST] });
      queryClient.invalidateQueries({ queryKey: [API_CONFIG.ENDPOINTS.PROJECTS.BY_ID(parseInt(id))] });
    },
  });
}

export function useDeleteProject() {
  return useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", API_CONFIG.ENDPOINTS.PROJECTS.BY_ID(parseInt(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_CONFIG.ENDPOINTS.PROJECTS.LIST] });
    },
  });
}
