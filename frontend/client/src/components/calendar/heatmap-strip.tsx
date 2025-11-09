import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import "./heatmap-styles.css";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate } from "@/lib/utils/date";

interface HeatmapValue {
  date: string;
  count: number;
}

interface HeatmapStripProps {
  data: HeatmapValue[];
  startDate: Date;
  endDate: Date;
}

export function HeatmapStrip({ data, startDate, endDate }: HeatmapStripProps) {
  return (
    <div className="bg-card border border-card-border rounded-lg p-6" data-testid="heatmap-strip">
      <h3 className="text-lg font-medium text-foreground mb-4">Activity Overview</h3>
      <TooltipProvider>
        <CalendarHeatmap
          startDate={startDate}
          endDate={endDate}
          values={data}
          classForValue={(value) => {
            if (!value || value.count === 0) {
              return "color-empty";
            }
            if (value.count < 3) return "color-scale-1";
            if (value.count < 6) return "color-scale-2";
            if (value.count < 9) return "color-scale-3";
            return "color-scale-4";
          }}
          tooltipDataAttrs={(value: HeatmapValue | undefined) => {
            if (!value || !value.date) {
              return { "data-tip": "No data" };
            }
            return {
              "data-tip": `${formatDate(value.date)}: ${value.count || 0} tasks completed`,
            };
          }}
          showWeekdayLabels={true}
        />
      </TooltipProvider>
      <div className="flex items-center justify-end gap-2 mt-4">
        <span className="text-xs text-muted-foreground">Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm color-empty" />
          <div className="w-3 h-3 rounded-sm color-scale-1" />
          <div className="w-3 h-3 rounded-sm color-scale-2" />
          <div className="w-3 h-3 rounded-sm color-scale-3" />
          <div className="w-3 h-3 rounded-sm color-scale-4" />
        </div>
        <span className="text-xs text-muted-foreground">More</span>
      </div>
    </div>
  );
}
