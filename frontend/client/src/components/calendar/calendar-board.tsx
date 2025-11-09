import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useUIStore } from "@/lib/store/ui-store";
import { useSettings } from "@/lib/hooks/use-settings";
import { useAnnouncements } from "@/lib/hooks/use-announcements";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Task, Project } from "@shared/schema";
import "./calendar-styles.css";

interface CalendarBoardProps {
  tasks: Task[];
  projects: Project[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (taskId: string) => void;
  onEventDrop?: (taskId: string, start: Date, end: Date) => void;
}

export function CalendarBoard({
  tasks,
  projects,
  onDateClick,
  onEventClick,
  onEventDrop,
}: CalendarBoardProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const { calendarView, setCalendarView } = useUIStore();
  const { data: settings } = useSettings();
  const { data: announcements = [] } = useAnnouncements();

  const workingHoursStart = settings?.workingHoursStart || "09:00";
  const workingHoursEnd = settings?.workingHoursEnd || "17:00";
  const isDenseView = settings?.calendarDensity === "compact";

  const taskEvents = tasks.map((task) => {
    const project = projects.find((p) => p.id === task.projectId);
    return {
      id: task.id,
      title: task.title,
      start: task.start,
      end: task.end,
      backgroundColor: project?.color || "#3B82F6",
      borderColor: project?.color || "#3B82F6",
      textColor: "#ffffff",
      extendedProps: {
        type: "task",
        priority: task.priority,
        status: task.status,
        description: task.description,
      },
    };
  });

  const announcementEvents = announcements.map((announcement) => {
    return {
      id: `announcement-${announcement.id}`,
      title: `${announcement.title}`,
      start: announcement.createdAt,
      allDay: true,
      backgroundColor: "#8B5CF6",
      borderColor: "#8B5CF6",
      textColor: "#ffffff",
      className: "announcement-event",
      extendedProps: {
        type: "announcement",
        body: announcement.body,
        from: announcement.from,
      },
    };
  });

  const events = [...taskEvents, ...announcementEvents];

  const handlePrev = () => {
    calendarRef.current?.getApi().prev();
  };

  const handleNext = () => {
    calendarRef.current?.getApi().next();
  };

  const handleToday = () => {
    calendarRef.current?.getApi().today();
  };

  const handleViewChange = (view: string) => {
    setCalendarView(view as typeof calendarView);
    calendarRef.current?.getApi().changeView(view);
  };

  const getViewLabel = () => {
    switch (calendarView) {
      case "timeGridDay":
        return "Day";
      case "timeGridWeek":
        return "Week";
      case "dayGridMonth":
        return "Month";
      default:
        return "Month";
    }
  };

  return (
    <div className="h-full flex flex-col" data-testid="calendar-board">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleToday}
            className="font-medium"
            data-testid="button-calendar-today"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              data-testid="button-calendar-prev"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              data-testid="button-calendar-next"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          <h2 className="text-xl font-medium text-foreground" data-testid="text-calendar-title">
            {calendarRef.current?.getApi().view.title || "Calendar"}
          </h2>
        </div>

        <Select value={calendarView} onValueChange={handleViewChange}>
          <SelectTrigger className="w-32" data-testid="select-calendar-view">
            <SelectValue placeholder="View" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="timeGridDay" data-testid="option-view-day">Day</SelectItem>
            <SelectItem value="timeGridWeek" data-testid="option-view-week">Week</SelectItem>
            <SelectItem value="dayGridMonth" data-testid="option-view-month">Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 bg-card border border-border rounded-lg">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={calendarView}
          headerToolbar={false}
          events={events}
          editable={false}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          slotMinTime={`${workingHoursStart}:00`}
          slotMaxTime={`${workingHoursEnd}:00`}
          allDaySlot={true}
          nowIndicator={true}
          scrollTime={`${workingHoursStart}:00`}
          slotDuration={isDenseView ? "00:15:00" : "00:30:00"}
          slotLabelInterval={isDenseView ? "00:30:00" : "01:00:00"}
          height="100%"
          contentHeight="auto"
          expandRows={true}
          stickyHeaderDates={true}
          dateClick={(info) => onDateClick?.(info.date)}
          eventClick={(info) => onEventClick?.(info.event.id)}
          eventDrop={(info) => {
            if (info.event.start && info.event.end) {
              onEventDrop?.(
                info.event.id,
                info.event.start,
                info.event.end
              );
            }
          }}
          eventResize={(info) => {
            if (info.event.start && info.event.end) {
              onEventDrop?.(
                info.event.id,
                info.event.start,
                info.event.end
              );
            }
          }}
        />
      </div>
    </div>
  );
}
