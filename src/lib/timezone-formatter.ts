/**
 * Timezone-aware date and time formatting utilities
 * Uses user's timezone preference to format dates appropriately
 */

export interface DateFormatOptions {
  timezone?: string;
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  includeTime?: boolean;
}

/**
 * Format date with user's timezone
 */
export function formatDate(
  date: string | number | Date,
  options: DateFormatOptions = {}
): string {
  const {
    timezone = 'UTC',
    dateStyle = 'medium',
    timeStyle = 'short',
    includeTime = false,
  } = options;

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;

    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    const formatOptions: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      dateStyle: includeTime ? undefined : dateStyle,
    };

    if (includeTime) {
      formatOptions.dateStyle = dateStyle;
      formatOptions.timeStyle = timeStyle;
    }

    return new Intl.DateTimeFormat('en-US', formatOptions).format(dateObj);
  } catch (error) {
    console.error('Date formatting error:', error);
    return new Date(date).toLocaleDateString();
  }
}

/**
 * Format date relative to now (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(
  date: string | number | Date,
  timezone: string = 'UTC'
): string {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
    return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
  } catch (error) {
    console.error('Relative time formatting error:', error);
    return 'Unknown';
  }
}

/**
 * Format time only (no date)
 */
export function formatTime(
  date: string | number | Date,
  timezone: string = 'UTC',
  timeStyle: 'full' | 'long' | 'medium' | 'short' = 'short'
): string {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    if (isNaN(dateObj.getTime())) {
      return 'Invalid time';
    }

    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeStyle,
    }).format(dateObj);
  } catch (error) {
    console.error('Time formatting error:', error);
    return new Date(date).toLocaleTimeString();
  }
}

/**
 * Get user's timezone-aware current date/time
 */
export function getCurrentDateTime(timezone: string = 'UTC'): string {
  return formatDate(new Date(), { timezone, includeTime: true });
}

/**
 * Format month and year for chart labels
 */
export function formatMonthYear(
  date: string | number | Date,
  timezone: string = 'UTC'
): string {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
    }).format(dateObj);
  } catch (error) {
    console.error('Month/year formatting error:', error);
    return 'Unknown';
  }
}
