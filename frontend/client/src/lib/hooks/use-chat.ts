/**
 * Chat Hooks
 * React Query hooks for AI assistant chat functionality
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import API_CONFIG from "@/lib/api-config";

interface SendMessageData {
  message: string;
  session_id?: string;
}

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  message: string;
  created_at: string;
}

/**
 * Hook to send a chat message to the AI assistant
 */
export function useSendChatMessage() {
  return useMutation({
    mutationFn: async (data: SendMessageData) => {
      const token = localStorage.getItem("session_token");
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT.MESSAGE}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          message: data.message,
          session_id: data.session_id || "default",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to send message");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate chat history for this session
      if (variables.session_id) {
        queryClient.invalidateQueries({ 
          queryKey: [API_CONFIG.ENDPOINTS.CHAT.HISTORY(variables.session_id)] 
        });
      }
    },
  });
}

/**
 * Hook to get chat history for a session
 */
export function useChatHistory(sessionId: string) {
  return useQuery<ChatMessage[]>({
    queryKey: [API_CONFIG.ENDPOINTS.CHAT.HISTORY(sessionId)],
    enabled: !!sessionId,
  });
}

/**
 * Hook to get list of all chat sessions
 */
export function useChatSessions() {
  return useQuery({
    queryKey: [API_CONFIG.ENDPOINTS.CHAT.SESSIONS],
  });
}

