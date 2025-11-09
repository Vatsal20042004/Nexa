import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DailyUpdate, InsertDailyUpdate } from "@shared/schema";

async function fetchDailyUpdates(date?: string): Promise<DailyUpdate[]> {
  const url = date ? `/api/daily-updates?date=${date}` : "/api/daily-updates";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch daily updates");
  }
  return response.json();
}

async function createDailyUpdate(data: InsertDailyUpdate): Promise<DailyUpdate> {
  const response = await fetch("/api/daily-updates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create daily update");
  }

  return response.json();
}

async function deleteDailyUpdate(id: string): Promise<void> {
  const response = await fetch(`/api/daily-updates/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete daily update");
  }
}

export function useDailyUpdates(date?: string) {
  return useQuery({
    queryKey: ["daily-updates", date],
    queryFn: () => fetchDailyUpdates(date),
  });
}

export function useCreateDailyUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDailyUpdate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-updates"] });
    },
  });
}

export function useDeleteDailyUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDailyUpdate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-updates"] });
    },
  });
}

