# Work Console - Productivity Application

## Overview

A modern productivity workspace application inspired by Microsoft Copilot and Windows 11 design language. The application provides a comprehensive task management system with integrated calendar, project tracking, announcements, and an AI chat assistant. Built as a full-stack TypeScript application with a focus on clean architecture, modular components, and professional UI/UX.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Stack**
- **React with TypeScript**: Component-based UI using functional components and hooks
- **Wouter**: Lightweight client-side routing (no Next.js despite project requirements doc)
- **Vite**: Build tool and development server with HMR support
- **TailwindCSS + shadcn/ui**: Utility-first styling with pre-built accessible components from Radix UI primitives

**Design System**
- Microsoft Fluent Design and Google Calendar aesthetic inspiration
- Typography: Inter font family for UI, JetBrains Mono for metadata
- Color system: HSL-based theme variables supporting light/dark modes
- Component library: shadcn/ui (Radix UI primitives) for accessible, customizable components

**State Management**
- **Zustand stores**: Lightweight state management for UI state, filters, and topbar configuration
  - `ui-store`: Chat panel visibility, calendar view preferences
  - `filter-store`: Task filtering by priority, status, project, and search
  - `topbar-store`: Dynamic page title, subtitle, and action buttons
- **React Query (@tanstack/react-query)**: Server state management, caching, and data fetching
  - Custom hooks for CRUD operations on tasks, projects, announcements, and settings
  - Optimistic updates and automatic cache invalidation

**Key UI Features**
- **Calendar**: FullCalendar integration with day/week/month views, drag-and-drop task scheduling
- **Activity Heatmap**: react-calendar-heatmap for visualizing task completion patterns
- **Chat Assistant**: Collapsible side panel with simulated streaming LLM responses using ReactMarkdown
- **Theme System**: next-themes for system/light/dark theme support with CSS variable-based theming

### Backend Architecture

**Server Framework**
- **Express.js**: REST API server with TypeScript
- **Storage Layer**: Abstracted storage interface (`IStorage`) with in-memory implementation (`MemStorage`)
  - Designed for easy migration to database persistence
  - CRUD operations for tasks, projects, announcements, and settings

**API Design**
- RESTful endpoints under `/api` prefix
- Zod schema validation for all incoming data
- Standard HTTP methods (GET, POST, PATCH, DELETE)
- JSON request/response format

**Development Setup**
- Vite middleware integration for HMR during development
- Express serves both API and static frontend in production
- Request logging with response capture for debugging

### Data Models

**Schema Definition**
- **Zod schemas** in `shared/schema.ts` for type-safe validation
- Shared types between frontend and backend via `@shared` alias

**Core Entities**
1. **Tasks**: Title, description, project assignment, assignee, priority (high/medium/low), status (pending/in_progress/done), start/end dates
2. **Projects**: Name, lead, deadline, description, color (for visual identification)
3. **Announcements**: Project-linked or general notifications with type, title, body, timestamp
4. **Settings**: Theme preference, working hours, calendar density

**Data Relationships**
- Tasks belong to Projects (via `projectId`)
- Announcements optionally link to Projects
- Projects have associated colors for calendar/UI display

### Component Architecture

**Layout Structure**
- `AppLayout`: Main container with sidebar, topbar, and content area
- `AppSidebar`: Fixed navigation with main and secondary sections
- `Topbar`: Dynamic header with page context, actions, theme toggle, and chat trigger

**Page Components**
- Dashboard: Overview with statistics cards and activity heatmap
- Calendar: FullCalendar board with task events
- Tasks: Filterable task list with creation/editing
- Projects: Project overview cards with progress tracking
- Announcements: Chronological notification feed
- Settings: User preferences configuration

**Reusable Components**
- Task components: TaskCard, TaskList, TaskSheet (form), TaskFilters
- Calendar components: CalendarBoard, HeatmapStrip with custom styling
- Project components: ProjectOverview cards
- Announcement components: AnnouncementList
- Chat components: ChatDock with markdown rendering

**Form Handling**
- react-hook-form with Zod resolver for validation
- shadcn/ui Form components for consistent styling
- Sheet/Dialog patterns for modals and side panels

## External Dependencies

### UI Component Libraries
- **Radix UI**: Accessible primitive components (@radix-ui/* packages for dialogs, dropdowns, tooltips, etc.)
- **shadcn/ui**: Pre-configured Radix components with Tailwind styling
- **lucide-react**: Icon library
- **class-variance-authority & clsx**: Utility for component variant styling

### Calendar & Visualization
- **FullCalendar**: Interactive calendar with daygrid, timegrid, and interaction plugins
- **react-calendar-heatmap**: GitHub-style contribution heatmap

### Data Management
- **@tanstack/react-query**: Server state management and caching
- **Zod**: Runtime type validation and schema definition

### UI Utilities
- **sonner**: Toast notifications
- **next-themes**: Theme management system
- **react-markdown + remark-gfm**: Markdown rendering for chat assistant
- **cmdk**: Command palette component (imported but not actively used)

### Backend & Database
- **@neondatabase/serverless**: Neon PostgreSQL driver (configured but using in-memory storage)
- **Drizzle ORM**: Database toolkit (configured in `drizzle.config.ts` for future PostgreSQL migration)
  - Schema file: `shared/schema.ts`
  - Migrations directory: `./migrations`
  - Dialect: PostgreSQL

### Development Tools
- **Vite**: Build tool with React plugin
- **@replit/vite-plugin-***: Replit-specific development enhancements (runtime error overlay, cartographer, dev banner)
- **esbuild**: Server-side bundling for production
- **tsx**: TypeScript execution for development server

### Notes on Database Strategy
The application is architected for database integration but currently uses in-memory storage. The presence of Drizzle configuration and Neon database driver indicates planned migration to PostgreSQL. The `IStorage` interface abstraction allows swapping storage implementations without changing business logic.