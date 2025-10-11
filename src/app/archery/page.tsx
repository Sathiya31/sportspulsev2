'use client';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import EventCard from "@/components/ui/EventCard";
import Button from "@/components/ui/Button";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

// Types
interface Event {
  id: number;
  name: string;
  level: string;
  sublevel: string;
  location: string;
  start_date: string;
  end_date: string;
}

interface Athlete {
  Id: string;
  FName: string;
  GName: string;
  WNameOrd: boolean;
  NOC: string;
}

interface Competitor {
  MatchNo: number;
  QualRank: number;
  Arr: string;
  ArrTB: string;
  Score: number;
  SP: string;
  TB: string;
  Bye: boolean;
  Irm: string;
  WinLose: boolean;
  Name?: string;
  Athlete?: Athlete;
  NOC?: string;
}

interface MatchData {
  Phase: number;
  Cat: string;
  MatchMode: number;
  TimeStamp: number;
  NumEnds: number;
  NumArrowsEnd: number;
  NumArrowsTB: number;
  IsLive: boolean;
  Competitor1: Competitor;
  Competitor2: Competitor;
  CategoryCode: string;
}

// Helper functions
function isLive(startDate: string, endDate: string) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now <= end;
}

function getPhaseName(phase: number): string {
  const matchCount = 2 * phase;

   if (matchCount >= 65 && matchCount <= 128) {
    return 'Round of 128';
  } else if (matchCount >= 33 && matchCount <= 64) {
    return 'Round of 64';
  } else if (matchCount >= 17 && matchCount <= 32) {
    return 'Round of 32';
  } else if (matchCount >= 9 && matchCount <= 16) {
    return 'Round of 16';
  } else if (matchCount >= 5 && matchCount <= 8) {
    return 'Quarter Finals';
  } else if (matchCount >= 3 && matchCount <= 4) {
    return 'Semi Finals';
  } else if (phase === 1) {
    return 'Bronze Medal Match';
  } else if (phase === 0) {
    return 'Gold Medal Match';
  }
  
  return `Phase ${phase}`;
}

type FilterType = 'RM' | 'RMT' | 'RW' | 'RWT' | 'CM' | 'CMT' | 'CW' | 'CWT' | 'RXT' | 'CXT';

// Match Card Component
const MatchCard = ({ match, isTeamMatch }: { match: MatchData; isTeamMatch: boolean }) => {
  const [showSetPoints, setShowSetPoints] = useState(false);
  
  const comp1 = match.Competitor1;
  const comp2 = match.Competitor2;
  
  // Skip if either competitor has QualRank 0 (bye)
  if (comp1.QualRank === 0 || comp2.QualRank === 0) {
    return null;
  }

  const getCompetitorName = (competitor: Competitor) => {
    if (isTeamMatch) {
      return `Team ${competitor.Name || competitor.NOC}`;
    }
    return `${competitor.Athlete?.GName} ${competitor.Athlete?.FName}`;
  };

  const getNOC = (competitor: Competitor) => {
    return isTeamMatch ? competitor.NOC : competitor.Athlete?.NOC;
  };

  return (
    <div className="p-3 shadow-sm hover:shadow-md transition-shadow" style={{ background: "var(--surface)"}}>
      {/* Competitor 1 */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm" style={{ color: "var(--muted)" }}>{getNOC(comp1)}</span>
          <span className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{getCompetitorName(comp1)}</span>
          <span className="text-xs" style={{ color: "var(--muted-2)" }}>({comp1.QualRank})</span>
        </div>
        <div className={`text-lg font-bold ml-2`} style={{ color: comp1.WinLose ? "var(--success)" : "var(--muted)" }}>
          {comp1.Score}
          {comp1.WinLose && ' ✓'}
        </div>
      </div>

      {/* Competitor 2 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm" style={{ color: "var(--muted)" }}>{getNOC(comp2)}</span>
          <span className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{getCompetitorName(comp2)}</span>
          <span className="text-xs" style={{ color: "var(--muted-2)" }}>({comp2.QualRank})</span>
        </div>
        <div className={`text-lg font-bold ml-2`} style={{ color: comp2.WinLose ? "var(--success)" : "var(--muted)" }}>
          {comp2.Score}
          {comp2.WinLose && ' ✓'}
        </div>
      </div>

      {/* Set Points Expandable */}
      {(comp1.SP || comp2.SP) && (
        <div className="mt-2 pt-2 border-t border-blue-200">
          <button
            onClick={() => setShowSetPoints(!showSetPoints)}
            className="flex items-center gap-1 text-xs hover:opacity-80"
            style={{ color: "var(--primary)" }}
          >
            {showSetPoints ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Set Points
          </button>
          {showSetPoints && (
            <div className="mt-2 text-xs space-y-1" style={{ color: "var(--muted)" }}>
              {comp1.SP && (
                <div>
                  <span className="font-medium">{getCompetitorName(comp1).split(' ')[0]}:</span> {comp1.SP.replace(/\|/g, ' | ')}
                </div>
              )}
              {comp2.SP && (
                <div>
                  <span className="font-medium">{getCompetitorName(comp2).split(' ')[0]}:</span> {comp2.SP.replace(/\|/g, ' | ')}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Phase Accordion Component
const PhaseAccordion = ({ 
  phase, 
  matches, 
  isTeamMatch 
}: { 
  phase: number; 
  matches: MatchData[]; 
  isTeamMatch: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasLiveMatch = matches.some(m => m.IsLive);
  const validMatches = matches.filter(m => m.Competitor1.QualRank !== 0 && m.Competitor2.QualRank !== 0);

  if (validMatches.length === 0) return null;

  return (
    <div className="mb-4 shadow-sm" style={{ background: "var(--surface)" }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between border-b border-blue-200 hover:opacity-90 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold" style={{ color: "var(--primary)" }}>{getPhaseName(phase)}</span>
          <span className="text-sm" style={{ color: "var(--muted)" }}>({validMatches.length} matches)</span>
          {hasLiveMatch && (
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: "var(--danger)", color: "var(--surface)" }}>
              LIVE
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      
      {isExpanded && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {validMatches.map((match, index) => (
            <MatchCard key={`${phase}-${index}`} match={match} isTeamMatch={isTeamMatch} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function ArcheryDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter chips configuration
  const filterChips = [
    { key: 'RM', label: 'Recurve Men', category: 'RM', type: 'matchind' },
    { key: 'RMT', label: 'Recurve Men Team', category: 'RM', type: 'matchteam' },
    { key: 'RW', label: 'Recurve Women', category: 'RW', type: 'matchind' },
    { key: 'RWT', label: 'Recurve Women Team', category: 'RW', type: 'matchteam' },
    { key: 'CM', label: 'Compound Men', category: 'CM', type: 'matchind' },
    { key: 'CMT', label: 'Compound Men Team', category: 'CM', type: 'matchteam' },
    { key: 'CW', label: 'Compound Women', category: 'CW', type: 'matchind' },
    { key: 'CWT', label: 'Compound Women Team', category: 'CW', type: 'matchteam' },
    { key: 'RXT', label: 'Recurve Mixed', category: 'RX', type: 'matchteam' },
    { key: 'CXT', label: 'Compound Mixed', category: 'CX', type: 'matchteam' },
  ];

  // Load events from JSON file
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch('/data/calendars/archery_2025.json');
        const eventsData = await response.json();
        setEvents(eventsData);
      } catch (err) {
        console.error('Error loading events:', err);
        setError('Failed to load events');
      }
    };

    loadEvents();
  }, []);

  // Fetch matches from Firebase
  const fetchMatches = async (compId: string, categoryCode: string) => {
    setLoading(true);
    setError(null);

    try {
      const matchesRef = collection(db, 'archery');
      const q = query(matchesRef, 
        where('competition_id', '==', compId), 
        where('CategoryCode', '==', categoryCode));
      const querySnapshot = await getDocs(q);

      console.log('Fetched matches:', querySnapshot.size);
      const matchList: MatchData[] = [];
      querySnapshot.forEach((doc) => {
        matchList.push(doc.data() as MatchData);
      });
      console.log(matchList);
      setMatches(matchList);

    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Failed to fetch match results');
    } finally {
      setLoading(false);
    }
  };

  // Handle event selection with auto-filter
  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    setMatches([]);
    
    // Auto-select first filter (Recurve Men)
    const firstFilter = filterChips[0];
    setActiveFilter(firstFilter.key as FilterType);
    fetchMatches(event.id.toString(), firstFilter.key);
  };

  // Handle filter chip click
  const handleFilterClick = (filterKey: FilterType) => {
    if (!selectedEvent) return;

    const chip = filterChips.find(c => c.key === filterKey);
    if (!chip) return;

    if (activeFilter === filterKey) {
      // Deselect current filter
      setActiveFilter(null);
      setMatches([]);
    } else {
      // Select new filter
      setActiveFilter(filterKey);
      fetchMatches(selectedEvent.id.toString(), chip.key);
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Group matches by phase (descending order)
  const groupedMatches = matches.reduce((acc, match) => {
    if (!acc[match.Phase]) {
      acc[match.Phase] = [];
    }
    acc[match.Phase].push(match);
    return acc;
  }, {} as { [key: number]: MatchData[] });

  const sortedPhases = Object.keys(groupedMatches)
    .map(Number)
    .sort((a, b) => a - b); // Ascending order

  const isTeamMatch = activeFilter?.includes('T') || false;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Events Calendar - Left Side */}
        <div className="lg:col-span-1 bg-slate-50">
          <div className="shadow-sm border-r border-slate-200 bg-slate-50">
            <div className="px-8 mt-4">
              <h2 className="text-xl font-semibold" style={{ color: "var(--primary)" }}>
                Calendar 2025
              </h2>
            </div>
            <div className="p-4 overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-center py-8" style={{ color: "var(--muted-2)" }}>Loading events...</p>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      id={event.id}
                      name={event.name}
                      location={event.location}
                      startDate={formatDate(event.start_date)}
                      endDate={formatDate(event.end_date)}
                      accentColor={selectedEvent?.id === event.id ? "var(--primary)" : "var(--muted-2)"}
                      isLive={isLive(event.start_date, event.end_date)}
                      onClick={() => handleEventSelect(event)}
                      className={selectedEvent?.id === event.id ? "ring-2" : ""}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Panel - Right Side */}
        <div className="lg:col-span-2">
          {selectedEvent ? (
            <div className="shadow-sm" style={{ background: "var(--surface)" }}>
              {/* Event Header */}
              <div className="p-6 border-b" style={{ borderColor: "var(--muted-2)" }}>
                <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--primary)" }}>
                  {selectedEvent.name}
                </h2>
                <p style={{ color: "var(--muted)" }}>
                  {selectedEvent.location} • {formatDate(selectedEvent.start_date)} - {formatDate(selectedEvent.end_date)}
                </p>
              </div>

              {/* Filter Chips */}
              <div className="px-6 py-4 border-b" style={{ background: "var(--glass)", borderColor: "var(--muted-2)" }}>
                <div className="flex flex-wrap gap-2">
                  {filterChips.map((chip) => (
                    <Button
                      key={chip.key}
                      variant={activeFilter === chip.key ? "primary" : "secondary"}
                      className="rounded-full text-xs font-medium px-4 py-2"
                      onClick={() => handleFilterClick(chip.key as FilterType)}
                    >
                      {chip.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Results */}
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: "var(--primary)" }}></div>
                    <p className="mt-2" style={{ color: "var(--muted-2)" }}>Loading results...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p style={{ color: "var(--danger)" }}>{error}</p>
                  </div>
                ) : matches.length === 0 ? (
                  <div className="text-center py-12">
                    <p style={{ color: "var(--muted-2)" }}>No Indian results found for this category</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-medium mb-4" style={{ color: "var(--primary)" }}>
                      Indian Results ({matches.length} matches)
                    </h3>
                    <div className="space-y-4">
                      {sortedPhases.map((phase) => (
                        <PhaseAccordion
                          key={phase}
                          phase={phase}
                          matches={groupedMatches[phase]}
                          isTeamMatch={isTeamMatch}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="shadow-sm" style={{ background: "var(--surface)" }}>
              <div className="p-12 text-center">
                <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--primary)" }}>
                  Select an Event
                </h2>
                <p style={{ color: "var(--muted-2)" }}>
                  Choose an event from the calendar to view archery results
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}