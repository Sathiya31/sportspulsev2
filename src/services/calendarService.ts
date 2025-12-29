// services/calendarService.ts

/**
 * Common service for fetching calendar events for different sports
 */

export interface CalendarEvent {
  id: number | string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  code?: string; // For badminton tournaments
  logo?: string; // For badminton tournaments
  level?: string; // For archery events
  sublevel?: string; // For archery events
  [key: string]: any; // Allow additional properties
}

export type Sport = 'badminton' | 'archery' | 'tabletennis' | 'shooting' | 'athletics';

/**
 * Get available years for a sport by checking which calendar files exist
 */
export async function getAvailableYears(sport: Sport): Promise<string[]> {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  
  // Check for files from current year backwards and forwards
  const yearsToCheck = [
    currentYear - 1,
    currentYear,
    currentYear + 1
  ];
  
  for (const year of yearsToCheck) {
    try {
      const response = await fetch(`/data/calendars/${sport}_${year}.json`, {
        method: 'HEAD' // Just check if file exists
      });
      if (response.ok) {
        years.push(year.toString());
      }
    } catch (error) {
      // File doesn't exist, skip
      continue;
    }
  }
  
  return years.sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)
}

/**
 * Fetch calendar events for a specific sport and year
 */
export async function getCalendarEvents(
  sport: Sport,
  year: string | number
): Promise<CalendarEvent[]> {
  try {
    const response = await fetch(`/data/calendars/${sport}_${year}.json`);
    
    if (!response.ok) {
      throw new Error(`Calendar file not found for ${sport} ${year}`);
    }
    
    const events: CalendarEvent[] = await response.json();
    return events;
  } catch (error) {
    console.error(`Error fetching ${sport} calendar for ${year}:`, error);
    throw error;
  }
}

/**
 * Get unique months from events (for filtering)
 */
export function getUniqueMonths(events: CalendarEvent[]): string[] {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const uniqueMonths = Array.from(new Set(
    events.map(event => {
      const date = new Date(event.start_date || event.StartDateTime);
      return monthNames[date.getMonth()];
    })
  )).sort((a, b) => {
    return monthNames.indexOf(a) - monthNames.indexOf(b);
  });
  
  return ["All", ...uniqueMonths];
}

/**
 * Filter events by month
 */
export function filterEventsByMonth(
  events: CalendarEvent[],
  month: string
): CalendarEvent[] {
  if (month === "All") {
    return events;
  }
  
  return events.filter(event => {
    const eventMonth = new Date(event.start_date || event.StartDateTime).toLocaleString('default', { month: 'long' });
    return eventMonth === month;
  });
}

/**
 * Check if an event is currently live
 */
export function isEventLive(startDate: string, endDate: string): boolean {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now <= end;
}

/**
 * Get all live events from a list
 */
export function getLiveEvents(events: CalendarEvent[]): CalendarEvent[] {
  return events.filter(event => isEventLive(event.start_date, event.end_date));
}

/**
 * Format date for display
 */
export function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}