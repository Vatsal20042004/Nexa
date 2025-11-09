import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), 'MMM d, yyyy');
}

export function formatDateTime(dateString: string): string {
  return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
}

export function formatTime(dateString: string): string {
  return format(parseISO(dateString), 'h:mm a');
}

export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
}

export function formatDateForInput(dateString: string): string {
  return format(parseISO(dateString), "yyyy-MM-dd'T'HH:mm");
}
