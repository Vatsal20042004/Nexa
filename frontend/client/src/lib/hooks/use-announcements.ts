import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Announcement, InsertAnnouncement } from "@shared/schema";
import { backendAnnouncementsToFrontend, backendAnnouncementToFrontend, frontendAnnouncementToBackend } from "@/lib/adapters/announcement-adapter";
import API_CONFIG from "@/lib/api-config";

export function useAnnouncements() {
  return useQuery<Announcement[]>({
    queryKey: [API_CONFIG.ENDPOINTS.ANNOUNCEMENTS.LIST],
    select: (data: any) => backendAnnouncementsToFrontend(data),
  });
}

export function useAnnouncement(id: string) {
  return useQuery<Announcement>({
    queryKey: [API_CONFIG.ENDPOINTS.ANNOUNCEMENTS.BY_ID(parseInt(id))],
    enabled: !!id,
    select: (data: any) => backendAnnouncementToFrontend(data),
  });
}

export function useCreateAnnouncement() {
  return useMutation({
    mutationFn: (data: InsertAnnouncement) => {
      const backendData = frontendAnnouncementToBackend(data);
      return apiRequest("POST", API_CONFIG.ENDPOINTS.ANNOUNCEMENTS.LIST, backendData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_CONFIG.ENDPOINTS.ANNOUNCEMENTS.LIST] });
    },
  });
}

export function useDeleteAnnouncement() {
  return useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", API_CONFIG.ENDPOINTS.ANNOUNCEMENTS.BY_ID(parseInt(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_CONFIG.ENDPOINTS.ANNOUNCEMENTS.LIST] });
    },
  });
}
