/**
 * Team Leader Module Exports
 * 
 * This file exports all team leader-related components, types, and utilities
 * Use this to import team leader functionality in other parts of the application
 */

// ============== TYPES & SCHEMAS ==============
export type {
  User,
  InsertUser,
  Team,
  InsertTeam,
  UserRole,
} from './shared/schema';

export {
  userRoleEnum,
  users,
  teams,
  insertUserSchema,
  insertTeamSchema,
} from './shared/schema';

// ============== FRONTEND PAGES ==============
export { default as LoginPage } from './client/src/pages/login-page';
export { default as TeamLeaderDashboard } from './client/src/pages/team-leader-dashboard';
export { default as TeamLeaderChatPage } from './client/src/pages/team-leader-chat-page';
export { default as TimelineChartPage } from './client/src/pages/timeline-chart-page';

// ============== LAYOUT COMPONENTS ==============
export { AppSidebar } from './client/src/components/layout/app-sidebar';

// ============== API ENDPOINTS (Documentation) ==============
/**
 * Team Leader API Endpoints:
 * 
 * Authentication:
 * - POST   /api/auth/login          - Login user
 * - POST   /api/auth/register       - Register new user
 * 
 * Team Management:
 * - GET    /api/teams               - Get all teams
 * - GET    /api/teams/:id           - Get team by ID
 * - POST   /api/teams               - Create new team
 * - GET    /api/teams/:id/members   - Get team members
 * - GET    /api/teams/:id/tasks     - Get team tasks
 * - GET    /api/teams/:id/projects  - Get team projects
 * - GET    /api/teams/:id/stats     - Get team statistics
 */

// ============== STORAGE METHODS (Documentation) ==============
/**
 * Team Leader Storage Methods:
 * 
 * User Methods:
 * - storage.getUserByEmail(email: string): Promise<User | undefined>
 * - storage.createUser(user: InsertUser): Promise<User>
 * - storage.getUser(id: string): Promise<User | undefined>
 * 
 * Team Methods:
 * - storage.getTeams(): Promise<Team[]>
 * - storage.getTeam(id: string): Promise<Team | undefined>
 * - storage.createTeam(team: InsertTeam): Promise<Team>
 * - storage.getTeamMembers(teamId: string): Promise<User[]>
 * - storage.getTeamTasks(teamId: string): Promise<Task[]>
 * - storage.getTeamProjects(teamId: string): Promise<Project[]>
 * - storage.getTeamStats(teamId: string): Promise<{
 *     totalTasks: number;
 *     activeProjects: number;
 *     thisWeekTasks: number;
 *     completionRate: number;
 *   }>
 */

// ============== ROUTES (Documentation) ==============
/**
 * Team Leader Routes:
 * 
 * Frontend Routes:
 * - /login              - Login page
 * - /team-leader        - Team leader dashboard
 * - /team-leader-chat   - Team leader chat interface
 * - /timeline-chart     - Timeline chart generator
 */

// ============== CONSTANTS ==============
export const TEAM_LEADER_ROLE = 'team_leader';
export const EMPLOYEE_ROLE = 'employee';

export const TEAM_LEADER_ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/team-leader',
  CHAT: '/team-leader-chat',
  TIMELINE: '/timeline-chart',
} as const;

// ============== UTILITY FUNCTIONS ==============

/**
 * Check if user is a team leader
 */
export const isTeamLeader = (): boolean => {
  const role = localStorage.getItem('userRole');
  return role === TEAM_LEADER_ROLE;
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = (): { email: string; name: string; role: string } | null => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

/**
 * Get current user role
 */
export const getCurrentUserRole = (): string | null => {
  return localStorage.getItem('userRole');
};

/**
 * Logout user
 */
export const logoutUser = (): void => {
  localStorage.removeItem('userRole');
  localStorage.removeItem('user');
};
