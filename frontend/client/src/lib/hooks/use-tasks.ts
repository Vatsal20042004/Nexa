import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Task, InsertTask } from "@shared/schema";
import { backendTasksToFrontend, backendTaskToFrontend, frontendTaskToBackend } from "@/lib/adapters/task-adapter";
import API_CONFIG from "@/lib/api-config";

export function useTasks() {
  return useQuery<Task[]>({
    queryKey: [API_CONFIG.ENDPOINTS.TASKS.LIST],
    select: (data: any) => backendTasksToFrontend(data),
  });
}

export function useTodayTasks() {
  return useQuery<Task[]>({
    queryKey: [API_CONFIG.ENDPOINTS.TASKS.TODAY],
    select: (data: any) => backendTasksToFrontend(data),
  });
}

export function useTask(id: string) {
  return useQuery<Task>({
    queryKey: [API_CONFIG.ENDPOINTS.TASKS.BY_ID(parseInt(id))],
    enabled: !!id,
    select: (data: any) => backendTaskToFrontend(data),
  });
}

export function useCreateTask() {
  return useMutation({
    mutationFn: (data: InsertTask) => {
      const backendData = frontendTaskToBackend(data);
      return apiRequest("POST", "/api/tasks", backendData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_CONFIG.ENDPOINTS.TASKS.LIST] });
      queryClient.invalidateQueries({ queryKey: [API_CONFIG.ENDPOINTS.TASKS.TODAY] });
    },
  });
}

export function useUpdateTask(id: string) {
  return useMutation({
    mutationFn: (data: Partial<InsertTask>) => {
      const backendData = frontendTaskToBackend(data);
      return apiRequest("PATCH", API_CONFIG.ENDPOINTS.TASKS.BY_ID(parseInt(id)), backendData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_CONFIG.ENDPOINTS.TASKS.LIST] });
      queryClient.invalidateQueries({ queryKey: [API_CONFIG.ENDPOINTS.TASKS.TODAY] });
      queryClient.invalidateQueries({ queryKey: [API_CONFIG.ENDPOINTS.TASKS.BY_ID(parseInt(id))] });
    },
  });
}

export function useDeleteTask() {
  return useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", API_CONFIG.ENDPOINTS.TASKS.BY_ID(parseInt(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_CONFIG.ENDPOINTS.TASKS.LIST] });
      queryClient.invalidateQueries({ queryKey: [API_CONFIG.ENDPOINTS.TASKS.TODAY] });
    },
  });
}
