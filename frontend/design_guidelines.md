# Design Guidelines: Copilot-Style Work Console

## Design Approach

**System-Based Approach**: Microsoft Fluent Design + Google Calendar aesthetics
- Primary inspiration: Microsoft Copilot panels, Windows 11 productivity interfaces
- Calendar component: Google Calendar's clean, time-grid visual language
- Supporting reference: Linear's refined typography and spacing

## Core Design Principles

1. **Information Density with Breathing Room**: Pack functionality without overwhelming
2. **Subtle Depth**: Light shadows and borders to create hierarchy, not heavy cards
3. **Functional Color**: Color signals meaning (priority, status) not decoration
4. **Scannable Layouts**: Clear visual hierarchy for rapid information processing

## Typography System

**Font Stack**: 
- Primary: Inter (via Google Fonts CDN)
- Monospace: JetBrains Mono (for time stamps, metadata)

**Hierarchy**:
- Page titles: text-2xl font-semibold (24px)
- Section headers: text-lg font-medium (18px)
- Card titles: text-base font-medium (16px)
- Body text: text-sm (14px)
- Metadata/labels: text-xs text-muted-foreground (12px)

## Layout System

**Spacing Primitives**: Use Tailwind units of 1, 2, 3, 4, 6, 8, 12, 16
- Micro spacing (within components): p-2, gap-2, space-y-3
- Component padding: p-4, p-6
- Section spacing: gap-6, gap-8
- Page margins: p-8, p-12

**Grid Structure**:
- Sidebar: Fixed 240px (w-60)
- Main content: flex-1 with max-w-7xl container
- Calendar time slots: Hourly rows with clear demarcation
- Task cards: Grid auto-fill pattern with min-w-[280px]

## Component Design Specifications

### Sidebar Navigation
- Full-height fixed position
- Border right (border-r)
- Navigation items: Rounded corners (rounded-md), hover state with subtle background
- Active state: Light background fill + accent border-l-2
- Icons: lucide-react, 20px (w-5 h-5), positioned left of labels

### Topbar
- Height: h-16
- Border bottom (border-b)
- Contains: Page title, breadcrumbs, action buttons, theme toggle
- Sticky positioning for scroll context

### Calendar Workspace (Google Calendar Style)
- **Time Grid**: Left column with hourly markers (8am-8pm default)
- **Time Slots**: Horizontal lines at 30-min intervals (subtle border)
- **Day Columns**: Vertical divisions with date headers
- **Events/Tasks**: Colored blocks with rounded corners, show time + title
- **Current Time Indicator**: Thin red/accent line spanning width
- **View Controls**: Compact button group (Day/Week/Month) - pill style
- **Mini Calendar**: Sidebar widget with date selection
- **Density**: Comfortable row height (60px per hour slot)

### Task Cards
- Border (border), subtle shadow (shadow-sm)
- Rounded corners (rounded-lg)
- Padding: p-4
- Structure from top:
  - Priority chip (top-right corner, pill badge)
  - Title (font-medium, text-base)
  - Project tag (small chip with project color)
  - Assignee avatar (bottom-left, 24px circle)
  - Due date (bottom-right, text-xs)
  - Status indicator (colored dot or border-l-4 accent)

### Priority Chips
- High: Small pill badge, urgent indicator
- Medium: Default neutral appearance  
- Low: Subtle, de-emphasized treatment
- Size: px-2.5 py-0.5, text-xs, rounded-full

### Status Indicators
- Pending: Neutral/gray treatment
- In Progress: Accent color (blue/purple theme)
- Done: Success green with checkmark icon

### Heatmap Strip
- Position: Above calendar or in sidebar
- Cell size: 12px squares with 2px gap
- Intensity mapping: 5 levels from empty to saturated
- Hover tooltip: Date + activity count
- Month labels: Minimal, positioned top

### Announcements Panel
- List layout with dividers (divide-y)
- Each item: py-3 px-4
- Avatar + content structure
- Type badge (e.g., "Task Assigned") - small colored chip
- Timestamp: Relative format (text-xs, text-muted-foreground)
- Unread indicator: Colored dot or background tint

### Chat Assistant Dock
- Collapsible side panel (w-96 when open)
- Slide-in animation from right
- Header: Title + minimize button
- Messages: Alternating alignment (user right, assistant left)
- User messages: Accent background, rounded-2xl
- Assistant messages: Muted background, rounded-2xl, markdown rendered
- Input: Bottom-pinned with send button, rounded-full
- Streaming indicator: Subtle pulse animation on typing

### Projects Dropdown
- Trigger: Button with project name + chevron
- Menu: Popover with shadcn Select
- Items: Project name + status dot + deadline
- Recent projects section at top

### Settings Page
- Two-column layout on desktop
- Settings groups with clear section headers (text-lg, font-medium, mb-4)
- Form controls: shadcn/ui components (Switch, Select, Input)
- Labels positioned above inputs
- Dividers between sections (my-8)

## Interaction Patterns

### Hover States
- Subtle background change (hover:bg-accent/50)
- No dramatic transformations
- Cursor pointer for interactive elements

### Focus States  
- Clear focus rings using shadcn default (ring-2 ring-ring ring-offset-2)
- Keyboard navigation visible and intuitive

### Drag & Drop
- Dragging item: Slight opacity reduction + shadow increase
- Drop zones: Dashed border on hover
- Smooth transitions (transition-all duration-200)

### Loading States
- Skeleton screens using shadcn Skeleton component
- Shimmer effect for content areas
- Spinner for action buttons

## Accessibility Requirements

- All interactive elements: ARIA labels
- Keyboard shortcuts: Calendar navigation (arrow keys), task selection (enter/space)
- Focus management: Trap focus in modals, restore on close
- Color contrast: Meet WCAG AA for all text (4.5:1 minimum)
- Theme toggle accessible via keyboard

## Images

**No hero images required** - This is a utility application focused on productivity, not marketing.

**Avatar Images**: Use placeholder avatars (via UI Avatars or similar service) for assignees and announcement senders.

**Icon Usage**: Extensive use of lucide-react icons throughout:
- Navigation: Calendar, CheckSquare, Bell, MessageSquare, Settings, FolderKanban
- Actions: Plus, Edit, Trash, Send, X, ChevronDown
- Status: Circle (for status dots), Clock, AlertCircle

## Theme Implementation

Leverage shadcn/ui's CSS variable system for seamless dark/light mode:
- Let next-themes handle toggle logic
- All components use semantic color tokens
- Test both themes for contrast compliance
- Calendar events maintain visibility in both modes