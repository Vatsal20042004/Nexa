import { create } from 'zustand';

interface TopbarState {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  setTopbar: (title: string, subtitle?: string, actions?: React.ReactNode) => void;
}

export const useTopbarStore = create<TopbarState>((set) => ({
  title: "",
  subtitle: undefined,
  actions: undefined,
  setTopbar: (title, subtitle, actions) => set({ title, subtitle, actions }),
}));
