import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Settings } from "@shared/schema";

export function useSettings() {
  return useQuery<Settings>({
    queryKey: ["/api/settings"],
  });
}

export function useUpdateSettings() {
  return useMutation({
    mutationFn: (data: Settings) => apiRequest("PUT", "/api/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
  });
}
