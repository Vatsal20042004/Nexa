/**
 * Daily Sessions Hooks
 * React Query hooks for daily session management and file uploads
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import API_CONFIG from "@/lib/api-config";

interface CreateSessionData {
  date: string;
  github_username?: string;
  github_repo?: string;
}

interface UploadTranscriptData {
  date: string;
  file: File;
  uploadType: "morning" | "evening" | "general";
}

interface UploadVideoData {
  date: string;
  file: File;
  intervalSeconds: number;
}

interface UploadFileData {
  date: string;
  file: File;
}

/**
 * Hook to create a new daily session
 */
export function useCreateSession() {
  return useMutation({
    mutationFn: async (data: CreateSessionData) => {
      const token = localStorage.getItem("session_token");
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SESSIONS.CREATE}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create session");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    },
  });
}

/**
 * Hook to upload a transcript file
 */
export function useUploadTranscript() {
  return useMutation({
    mutationFn: async ({ date, file, uploadType }: UploadTranscriptData) => {
      const formData = new FormData();
      formData.append("session_date", date);
      formData.append("upload_type", uploadType);
      formData.append("file", file);

      const token = localStorage.getItem("session_token");
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SESSIONS.UPLOAD_TRANSCRIPT}`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    },
  });
}

/**
 * Hook to upload a video file
 */
export function useUploadVideo() {
  return useMutation({
    mutationFn: async ({ date, file, intervalSeconds }: UploadVideoData) => {
      const formData = new FormData();
      formData.append("session_date", date);
      formData.append("interval_seconds", intervalSeconds.toString());
      formData.append("file", file);

      const token = localStorage.getItem("session_token");
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SESSIONS.UPLOAD_VIDEO}`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    },
  });
}

/**
 * Hook to upload a generic file
 */
export function useUploadFile() {
  return useMutation({
    mutationFn: async ({ date, file }: UploadFileData) => {
      const formData = new FormData();
      formData.append("session_date", date);
      formData.append("file", file);

      const token = localStorage.getItem("session_token");
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SESSIONS.UPLOAD_FILE}`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    },
  });
}

/**
 * Hook to submit a session for processing
 */
export function useSubmitSession() {
  return useMutation({
    mutationFn: async (date: string) => {
      const token = localStorage.getItem("session_token");
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SESSIONS.SUBMIT(date)}`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Submit failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: [API_CONFIG.ENDPOINTS.TASKS.LIST] });
    },
  });
}

