export interface AthleticsResult {
  position: number;
  athleteName: string;
  athleteNameLower: string;
  performance: string;
  team: string;
  bibNumber: string;
  attempts: string[];
  remarks: string;
}

export interface EventRecords {
  nationalRecord: string;
  nationalRecordHolder: string;
}

export interface AthleticsEvent {
  eventId: string;
  eventNumber: string;
  eventName: string;
  tournamentId: string;
  tournamentName: string;
  discipline: string;
  category: string;
  gender: string;
  round: string;
  records: EventRecords;
  results: AthleticsResult[];
}

// Type guard to check if an object is an AthleticsEvent
export function isAthleticsEvent(obj: any): obj is AthleticsEvent {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.eventId === 'string' &&
    typeof obj.eventName === 'string' &&
    typeof obj.discipline === 'string' &&
    Array.isArray(obj.results) &&
    obj.results.every((result: any) =>
      typeof result === 'object' &&
      result !== null &&
      typeof result.athleteName === 'string' &&
      typeof result.performance === 'string' &&
      Array.isArray(result.attempts)
    )
  );
}

// Utility function to format performance string
export function formatPerformance(performance: string): string {
  return performance.toLowerCase().replace(' ', '');
}

// Utility function to determine if a performance is better than another
// Assumes format like "35.31m" or "7:25.31"
export function comparePerformances(a: string, b: string, eventType: 'throws' | 'jumps' | 'track'): number {
  if (eventType === 'track') {
    // Convert time format (mm:ss.ms) to seconds
    const timeToSeconds = (time: string): number => {
      const parts = time.split(':');
      if (parts.length === 2) {
        return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
      }
      return parseFloat(time);
    };
    return timeToSeconds(a) - timeToSeconds(b); // Lower is better for track
  } else {
    // For throws and jumps, convert to numbers and remove 'm'
    const numA = parseFloat(a.replace('m', ''));
    const numB = parseFloat(b.replace('m', ''));
    return numB - numA; // Higher is better for throws/jumps
  }
}

// Utility function to get event type based on discipline
export function getEventType(discipline: string): 'throws' | 'jumps' | 'track' {
  const throwEvents = ['Discus Throw', 'Javelin Throw', 'Shot Put', 'Hammer Throw'];
  const jumpEvents = ['Long Jump', 'Triple Jump', 'High Jump', 'Pole Vault'];
  
  if (throwEvents.includes(discipline)) return 'throws';
  if (jumpEvents.includes(discipline)) return 'jumps';
  return 'track';
}