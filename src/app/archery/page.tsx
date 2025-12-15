'use client';
import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Menu, X } from 'lucide-react';
import EventCard from "@/components/ui/EventCard";
import Button from "@/components/ui/Button";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useSession } from 'next-auth/react';
import { isAdmin } from "@/config/auth";
import PlayerSearchBar from '@/components/badminton/PlayerSearchBar';
import { getArcheryAthleteResults } from '@/services/athleteService';
import ArcheryPlayerResults from '@/components/archery/AthleteResults';
import { getCategoryLabel, getPhaseName } from '@/utils/archeryUtils';

// Types
export interface Event {
  id: number;
  name: string;
  level: string;
  sublevel: string;
  location: string;
  start_date: string;
  end_date: string;
}

export interface Athlete {
  Id: string;
  FName: string;
  GName: string;
  WNameOrd: boolean;
  NOC: string;
}

export interface Competitor {
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
  Members?: Athlete[];
  NOC?: string;
}

export interface MatchData {
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
  athlete_ids?: string[];
  competition_id: string;
}

// Helper functions
function isLive(startDate: string, endDate: string) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now <= end;
}

// Category ordering function
function sortCategoryCode(a: string, b: string): number {
  const order = ['RM', 'RMT', 'RW', 'RWT', 'RXT', 'CM', 'CMT', 'CW', 'CWT', 'CXT'];
  const indexA = order.indexOf(a);
  const indexB = order.indexOf(b);
  
  if (indexA === -1 && indexB === -1) return a.localeCompare(b);
  if (indexA === -1) return 1;
  if (indexB === -1) return -1;
  return indexA - indexB;
}

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
          <span className="text-sm font-medium truncate" 
             style={{ color: comp1.WinLose ? "var(--foreground)" : "var(--muted-2)" }}>
            {getCompetitorName(comp1)}
            </span>
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
          <span className="text-sm font-medium truncate" 
          style={{ color: comp2.WinLose ? "var(--foreground)" : "var(--muted-2)" }}>
            {getCompetitorName(comp2)}
            </span>
          <span className="text-xs" style={{ color: "var(--muted-2)" }}>({comp2.QualRank})</span>
        </div>
        <div className={`text-lg font-bold ml-2`} style={{ color: comp2.WinLose ? "var(--success)" : "var(--muted)" }}>
          {comp2.Score}
          {comp2.WinLose && ' ✓'}
        </div>
      </div>

      {/* Set Points Expandable */}
      {(comp1.SP || comp2.SP) && (
        <div className="mt-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
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
    <div className="mb-4 p-2 shadow-sm" 
    style={{ background: "var(--background)", borderColor: "var(--border)" }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between 
        border-b border-blue-200 hover:opacity-90 transition-opacity"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <span className="font-medium" style={{ color: "var(--foreground)" }}>{getPhaseName(phase)}</span>
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

// Mobile Calendar Overlay Component
const MobileCalendarOverlay = ({ 
  isOpen, 
  onClose, 
  events, 
  selectedEvent, 
  onEventSelect,
  formatDate
}: {
  isOpen: boolean;
  onClose: () => void;
  events: Event[];
  selectedEvent: Event | null;
  onEventSelect: (event: Event) => void;
  formatDate: (date: string) => string;
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Overlay Panel */}
      <div 
        className="fixed inset-0 z-50 lg:hidden"
        style={{ background: "var(--surface)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-xl font-semibold" style={{ color: "var(--primary)" }}>
            Calendar 2025
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:opacity-70 transition-opacity"
            style={{ color: "var(--foreground)" }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Events List */}
        <div className="overflow-y-auto p-4" style={{ height: 'calc(100vh - 73px)' }}>
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
                  onClick={() => {
                    onEventSelect(event);
                    onClose(); // Auto-close after selection
                  }}
                  className={selectedEvent?.id === event.id ? "ring-2" : ""}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Mobile Category Dropdown Component
const MobileCategoryDropdown = ({ 
  categories, 
  activeFilter, 
  onFilterClick
}: {
  categories: string[];
  activeFilter: string | null;
  onFilterClick: (category: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = activeFilter ? getCategoryLabel(activeFilter) : 'Select Category';

  return (
    <div className="relative lg:hidden" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-lg flex items-center justify-between transition-colors"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: activeFilter ? "var(--primary)" : "var(--foreground)"
        }}
      >
        <span className="font-medium">{selectedLabel}</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 rounded-lg shadow-lg z-30 max-h-80 overflow-y-auto"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          {categories.map((categoryCode: string) => (
            <button
              key={categoryCode}
              onClick={() => {
                onFilterClick(categoryCode);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:opacity-80 transition-opacity border-b last:border-b-0"
              style={{
                background: activeFilter === categoryCode ? "var(--primary)" : "transparent",
                color: activeFilter === categoryCode ? "white" : "var(--foreground)",
                borderColor: "var(--border)"
              }}
            >
              {getCategoryLabel(categoryCode)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function ArcheryDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [groupedMatches, setGroupedMatches] = useState<{ [key: string]: MatchData[] }>({});
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [playerResults, setPlayerResults] = useState<any[]>([]);

  const { data: session } = useSession(); 
  const userIsAdmin = isAdmin(session?.user?.email);

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

  // Fetch ALL matches for an event
  const fetchAllMatches = async (compId: string) => {
    setLoading(true);
    setError(null);

    try {
      const matchesRef = collection(db, 'archery');
      const q = query(matchesRef, where('competition_id', '==', compId));
      const querySnapshot = await getDocs(q);

      console.log('Fetched matches:', querySnapshot.size);
      const matchList: MatchData[] = [];
      querySnapshot.forEach((doc) => {
        matchList.push(doc.data() as MatchData);
      });

      // Group by CategoryCode
      const grouped: { [key: string]: MatchData[] } = {};
      matchList.forEach((match) => {
        const catCode = match.CategoryCode || 'UNKNOWN';
        if (!grouped[catCode]) {
          grouped[catCode] = [];
        }
        grouped[catCode].push(match);
      });

      setGroupedMatches(grouped);

      // Get sorted available categories
      const categories = Object.keys(grouped).sort(sortCategoryCode);
      console.log("Available Categories", categories)
      setAvailableCategories(categories);

      // Auto-select first category
      if (categories.length > 0) {
        setActiveFilter(categories[0]);
      }

    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Failed to fetch match results');
    } finally {
      setLoading(false);
    }
  };

  // Handle event selection
  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    setGroupedMatches({});
    setAvailableCategories([]);
    setActiveFilter(null);
    
    // Fetch all matches for this event
    fetchAllMatches(event.id.toString());
  };

  // Handle filter chip click
  const handleFilterClick = (categoryCode: string) => {
    if (activeFilter === categoryCode) {
      // Deselect current filter
      setActiveFilter(null);
    } else {
      // Select new filter
      setActiveFilter(categoryCode);
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

  function handleLoadData() {
    fetch("/api/archery-extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ event_id: selectedEvent?.id.toString() })
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  // Get matches for active filter
  const displayMatches = activeFilter ? (groupedMatches[activeFilter] || []) : [];

  // Group display matches by phase (ascending order)
  const phaseGroupedMatches = displayMatches.reduce((acc, match) => {
    if (!acc[match.Phase]) {
      acc[match.Phase] = [];
    }
    acc[match.Phase].push(match);
    return acc;
  }, {} as { [key: number]: MatchData[] });

  const sortedPhases = Object.keys(phaseGroupedMatches)
    .map(Number)
    .sort((a, b) => a - b);

  const isTeamMatch = activeFilter?.includes('T') || false;

  async function handlePlayerSelect(player: any) {
      console.log("Selected player:", player);
      setSelectedPlayer(player);
      setSelectedEvent(null);
      try {
            // Use flexible results fetcher for badminton
            const playerId = player.playerId; // Remove TT prefix if present
            const results = await getArcheryAthleteResults(playerId || player.name);
            console.log("Fetched player results:", playerId, results);
            setPlayerResults(results);
          } catch (err: any) {
            console.error(err)
            setPlayerResults([]);
          }
    }
  
    function handlePlayerClear() {
      setSelectedPlayer(null);
      setPlayerResults([]);
    }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Desktop Calendar - Left Side */}
        <div className="hidden lg:block lg:col-span-1 bg-[var(--surface)]">
          <div className="shadow-sm">
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

        {/* Mobile Calendar Overlay */}
        <MobileCalendarOverlay
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          events={events}
          selectedEvent={selectedEvent}
          onEventSelect={handleEventSelect}
          formatDate={formatDate}
        />

        {/* Results Panel - Right Side */}
        <div className="p-4 md:p-8 lg:col-span-2">
          {/* Header with Mobile Menu Toggle */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
              Archery
            </h1>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:opacity-70 transition-opacity"
              style={{ color: "var(--primary)" }}
              aria-label="Open calendar menu"
            >
              <Menu size={24} />
            </button>
            <div className="w-full md:w-auto md:max-w-xs">
              <PlayerSearchBar
                sport="Archery"
                onSelect={handlePlayerSelect}
                onClear={handlePlayerClear}
              />
            </div>
          </div>

          {/* Athlete Results */}
          {selectedPlayer && (
            <ArcheryPlayerResults
              player={selectedPlayer}
              matches={playerResults}
             onBack={handlePlayerClear} />
          )}
                  
          {selectedEvent ? (
            <div className="shadow-sm" style={{ background: "var(--surface)" }}>
              {/* Event Header */}
              <div className="p-4 border-b" style={{ borderColor: "var(--muted-2)" }}>
                <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--primary)" }}>
                  {selectedEvent.name}
                </h2>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {selectedEvent.location} • {formatDate(selectedEvent.start_date)} - {formatDate(selectedEvent.end_date)}
                </p>
              </div>

              {/* Category Filters */}
              {availableCategories.length > 0 && (
                <>
                  {/* Mobile Dropdown */}
                  <div className="p-4 lg:hidden">
                    <MobileCategoryDropdown
                      categories={availableCategories}
                      activeFilter={activeFilter}
                      onFilterClick={handleFilterClick}
                    />
                  </div>

                  {/* Desktop Chips */}
                  <div className="hidden lg:block px-6 py-4 border-b" style={{ background: "var(--glass)", borderColor: "var(--muted-2)" }}>
                    <div className="flex flex-wrap gap-2">
                      {availableCategories.map((categoryCode) => (
                        <Button
                          key={categoryCode}
                          variant={activeFilter === categoryCode ? "primary" : "secondary"}
                          className="text-xs font-medium"
                          size="sm"
                          onClick={() => handleFilterClick(categoryCode)}
                        >
                          {getCategoryLabel(categoryCode)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Results */}
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: "var(--muted-2)" }}></div>
                    <p className="mt-2" style={{ color: "var(--muted-2)" }}>Loading results...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p style={{ color: "var(--danger)" }}>{error}</p>
                  </div>
                ) : availableCategories.length === 0 ? (
                  <div className="text-center py-12">
                    <p style={{ color: "var(--muted-2)" }}>No Indian results found for this event</p>
                  </div>
                ) : !activeFilter ? (
                  <div className="text-center py-12">
                    <p style={{ color: "var(--muted-2)" }}>Select a category to view results</p>
                  </div>
                ) : displayMatches.length === 0 ? (
                  <div className="text-center py-12">
                    <p style={{ color: "var(--muted-2)" }}>No matches found for this category</p>
                  </div>
                ) : (
                  <div>
                    <div className="space-y-4">
                      {sortedPhases.map((phase) => (
                        <PhaseAccordion
                          key={phase}
                          phase={phase}
                          matches={phaseGroupedMatches[phase]}
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
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden mt-6 px-6 py-3 rounded-lg font-medium transition-opacity hover:opacity-90"
                  style={{ background: "var(--primary)", color: "white" }}
                >
                  Open Calendar
                </button>
              </div>
            </div>
          )}

          {/* Extractor for admins only */}
          {userIsAdmin && selectedEvent && (
            <div className="mt-8 pt-8 border-t" style={{ borderColor: "var(--muted-2)" }}>
              <div className="flex p-2 space-4">
                <p className="p-2 bold">
                  <label className="text-md font-semibold">Selected Event:</label> {selectedEvent?.name} ({selectedEvent?.id})
                </p>
                <Button
                  variant="primary"
                  onClick={handleLoadData}
                  className="text-xs px-3 py-1 rounded transition-colors"
                >
                  Load Data
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}