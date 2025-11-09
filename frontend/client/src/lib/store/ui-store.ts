import { create } from 'zustand';

interface UIState {
  isChatOpen: boolean;
  calendarView: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
  setIsChatOpen: (isOpen: boolean) => void;
  setCalendarView: (view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => void;
  toggleChat: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isChatOpen: false,
  calendarView: 'timeGridWeek',
  setIsChatOpen: (isOpen) => set({ isChatOpen: isOpen }),
  setCalendarView: (view) => set({ calendarView: view }),
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
}));
