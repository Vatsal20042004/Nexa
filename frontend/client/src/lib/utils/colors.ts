import type { Priority, Status } from '@shared/schema';

export const priorityColors: Record<Priority, { bg: string; text: string; border: string }> = {
  high: {
    bg: 'bg-red-100 dark:bg-red-950/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-300 dark:border-red-800',
  },
  medium: {
    bg: 'bg-amber-100 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-300 dark:border-amber-800',
  },
  low: {
    bg: 'bg-slate-100 dark:bg-slate-800/30',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-300 dark:border-slate-700',
  },
};

export const statusColors: Record<Status, { bg: string; text: string; dot: string }> = {
  pending: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    dot: 'bg-gray-400',
  },
  in_progress: {
    bg: 'bg-blue-100 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  done: {
    bg: 'bg-green-100 dark:bg-green-950/30',
    text: 'text-green-700 dark:text-green-300',
    dot: 'bg-green-500',
  },
};

export const projectColors = [
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#06B6D4', // cyan
  '#6366F1', // indigo
];

export function getProjectColor(index: number): string {
  return projectColors[index % projectColors.length];
}
