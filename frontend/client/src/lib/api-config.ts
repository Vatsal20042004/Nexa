/**
 * API Configuration
 * Centralized configuration for backend API endpoints
 */

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || "30000"),
  
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/api/auth/login",
      REGISTER: "/api/auth/register",
      LOGOUT: "/api/auth/logout",
      ME: "/api/auth/me",
    },
    TASKS: {
      LIST: "/api/tasks/list",
      TODAY: "/api/tasks/today",
      CALENDAR: "/api/tasks/calendar",
      PROCESS: "/api/tasks/process-session",
      BY_ID: (id: number) => `/api/tasks/${id}`,
    },
    SESSIONS: {
      CREATE: "/api/sessions/create",
      UPLOAD_TRANSCRIPT: "/api/sessions/upload-transcript",
      UPLOAD_VIDEO: "/api/sessions/upload-video",
      UPLOAD_FILE: "/api/sessions/upload-file",
      SUBMIT: (date: string) => `/api/sessions/submit/${date}`,
      SCREENSHOT: "/api/sessions/capture-screenshot",
      SCREENSHOT_SCHEDULE_START: "/api/sessions/start-screenshot-schedule",
      SCREENSHOT_SCHEDULE_STOP: "/api/sessions/stop-screenshot-schedule",
    },
    CHAT: {
      MESSAGE: "/api/chat/message",
      HISTORY: (sessionId: string) => `/api/chat/history/${sessionId}`,
      SESSIONS: "/api/chat/sessions",
    },
    PROJECTS: {
      LIST: "/api/projects",
      BY_ID: (id: number) => `/api/projects/${id}`,
    },
    ANNOUNCEMENTS: {
      LIST: "/api/announcements",
      BY_ID: (id: number) => `/api/announcements/${id}`,
    },
    SETTINGS: {
      PROFILE: "/api/settings/profile",
      WORK_HOURS: "/api/settings/work-hours",
    },
    TEAM: {
      OVERVIEW: "/api/team/overview",
    },
  },
};

export default API_CONFIG;

