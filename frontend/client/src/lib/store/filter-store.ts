import { create } from 'zustand';
import type { Priority, Status } from '@shared/schema';

interface FilterState {
  selectedPriorities: Priority[];
  selectedStatuses: Status[];
  selectedProject: string | null;
  searchQuery: string;
  setSelectedPriorities: (priorities: Priority[]) => void;
  setSelectedStatuses: (statuses: Status[]) => void;
  setSelectedProject: (projectId: string | null) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  selectedPriorities: [],
  selectedStatuses: [],
  selectedProject: null,
  searchQuery: '',
  setSelectedPriorities: (priorities) => set({ selectedPriorities: priorities }),
  setSelectedStatuses: (statuses) => set({ selectedStatuses: statuses }),
  setSelectedProject: (projectId) => set({ selectedProject: projectId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  clearFilters: () => set({
    selectedPriorities: [],
    selectedStatuses: [],
    selectedProject: null,
    searchQuery: '',
  }),
}));
