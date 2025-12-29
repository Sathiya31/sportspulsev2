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
import {
  getCalendarEvents,
  getAvailableYears,
  getUniqueMonths,
  filterEventsByMonth,
  isEventLive,
  formatEventDate,
  type CalendarEvent
} from "@/services/calendarService";
import type { Event, MatchData, Competitor } from '@/types/archery';
import { PhaseAccordion } from '@/components/archery/PhaseAccordion';

// Helper functions
function sortCategoryCode(a: string, b: string): number {
  const order = ['RM', 'RMT', 'RW', 'RWT', 'RXT', 'CM', 'CMT', 'CW', 'CWT', 'CXT'];
  const indexA = order.indexOf(a);
  const indexB = order.indexOf(b);
  
  if (indexA === -1 && indexB === -1) return a.localeCompare(b);
  if (indexA === -1) return 1;
  if (indexB === -1) return -1;
  return indexA - indexB;
}

// Category Dropdown Component
const CategoryDropdown = ({ 
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
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 rounded-lg flex items-center justify-between transition-colors"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: activeFilter ? "var(--primary)" : "var(--foreground)"
        }}
      >
        <span className="font-medium text-sm">{selectedLabel}</span>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
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
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [month, setMonth] = useState<string>("All");
  const [months, setMonths] = useState<string[]>([]);
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

  // Initialize: Load available years
  useEffect(() => {
    async function initializeYears() {
      try {
        const years = await getAvailableYears('archery');
        setAvailableYears(years);
        
        // Default to current year if available, otherwise first year
        const currentYear = new Date().getFullYear().toString();
        const defaultYear = years.includes(currentYear) ? currentYear : years[0];
        setSelectedYear(defaultYear);
      } catch (error) {
        console.error('Error loading available years:', error);
      }
    }
    
    initializeYears();
  }, []);

  // Load events when year changes
  useEffect(() => {
    if (!selectedYear) return;

    async function loadEventsForYear() {
      try {
        const events = await getCalendarEvents('archery', selectedYear);
        setAllEvents(events as Event[]);
        
        // Extract unique months
        const uniqueMonths = getUniqueMonths(events);
        setMonths(uniqueMonths);
        
        // Reset month filter
        setMonth("All");
        
        // Clear selection when year changes
        setSelectedEvent(null);
        setGroupedMatches({});
        setAvailableCategories([]);
        setActiveFilter(null);
      } catch (error) {
        console.error('Error loading events:', error);
        setError(`No calendar found for ${selectedYear}`);
      }
    }
    
    loadEventsForYear();
  }, [selectedYear]);

  // Filter events by month
  useEffect(() => {
    const filtered = filterEventsByMonth(allEvents, month) as Event[];
    setFilteredEvents(filtered);
  }, [allEvents, month]);

  // Fetch matches for selected event
  const fetchAllMatches = async (compId: string) => {
    setLoading(true);
    setError(null);

    try {
      const matchesRef = collection(db, 'archery');
      const q = query(matchesRef, where('competition_id', '==', compId));
      const querySnapshot = await getDocs(q);

      const matchList: MatchData[] = [];
      querySnapshot.forEach((doc) => {
        matchList.push(doc.data() as MatchData);
      });

      const grouped: { [key: string]: MatchData[] } = {};
      matchList.forEach((match) => {
        const catCode = match.CategoryCode || 'UNKNOWN';
        if (!grouped[catCode]) {
          grouped[catCode] = [];
        }
        grouped[catCode].push(match);
      });

      setGroupedMatches(grouped);

      const categories = Object.keys(grouped).sort(sortCategoryCode);
      setAvailableCategories(categories);

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

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    setSelectedPlayer(null);
    setPlayerResults([]);
    setGroupedMatches({});
    setAvailableCategories([]);
    setActiveFilter(null);
    setIsMobileMenuOpen(false);
    
    fetchAllMatches(event.id.toString());
  };

  const handleFilterClick = (categoryCode: string) => {
    if (activeFilter === categoryCode) {
      setActiveFilter(null);
    } else {
      setActiveFilter(categoryCode);
    }
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

  async function handlePlayerSelect(player: any) {
    console.log("Selected player:", player);
    setSelectedPlayer(player);
    setSelectedEvent(null);
    try {
      const playerId = player.playerId;
      const results = await getArcheryAthleteResults(playerId || player.name);
      setPlayerResults(results);
    } catch (err: any) {
      console.error(err);
      setPlayerResults([]);
    }
  }

  function handlePlayerClear() {
    setSelectedPlayer(null);
    setSelectedEvent(null);
    setPlayerResults([]);
  }

  const displayMatches = activeFilter ? (groupedMatches[activeFilter] || []) : [];
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
  const liveEvents = filteredEvents.filter(e => isEventLive(e.start_date, e.end_date));

  return (
    <div className="flex flex-col md:flex-row min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-80 md:w-96
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        bg-[var(--surface)] border-r border-[var(--border)] p-4 overflow-y-auto
      `}>
        {/* Year Filter */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--muted)" }}>
            Filter by Year
          </label>
          <select
            className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]"
            style={{ color: "var(--foreground)" }}
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Month Filter */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--muted)" }}>
            Filter by Month
          </label>
          <select
            className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]"
            style={{ color: "var(--foreground)" }}
            value={month}
            onChange={e => setMonth(e.target.value)}
          >
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        
        {/* Events List */}
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: "var(--muted-2)" }}>
              No events for {selectedYear}
            </p>
          ) : (
            filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                name={event.name}
                location={event.location}
                startDate={formatEventDate(event.start_date)}
                endDate={formatEventDate(event.end_date)}
                accentColor={selectedEvent?.id === event.id ? "var(--primary)" : "var(--muted-2)"}
                isLive={isEventLive(event.start_date, event.end_date)}
                onClick={() => handleEventSelect(event)}
                className={selectedEvent?.id === event.id ? "ring-2" : ""}
              />
            ))
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8" style={{ background: "var(--background)" }}>
        <div className="mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
            <div className="flex items-center justify-between w-full md:w-auto">
              <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                Archery
              </h1>
              <button
                className="md:hidden ml-2 p-2 rounded-lg shadow-lg"
                style={{ background: "var(--surface)", color: "var(--foreground)" }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Open calendar menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
            <div className="w-full md:w-auto md:max-w-xs mt-2 md:mt-0">
              <PlayerSearchBar
                sport="Archery"
                onSelect={handlePlayerSelect}
                onClear={handlePlayerClear}
              />
            </div>
          </div>
        </div>

        {/* Live Events Badges */}
        {liveEvents.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--warning)" }}></span>
              <span className="font-semibold text-sm" style={{ color: "var(--warning)" }}>Live : </span>
              {liveEvents.map((ev, idx) => (
                <button
                  key={`${ev.id}_${idx}`}
                  onClick={() => handleEventSelect(ev)}
                  className="px-3 py-1.5 rounded-full text-xs hover:opacity-80 transition-opacity"
                  style={{ 
                    background: "var(--glass)",
                    color: "var(--foreground)",
                    border: `1px solid var(--muted-2)`
                  }}
                >
                  {ev.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Player Results */}
        {selectedPlayer && (
          <ArcheryPlayerResults
            player={selectedPlayer}
            matches={playerResults}
            onBack={handlePlayerClear}
          />
        )}

        {/* Event Results */}
        {selectedEvent && !selectedPlayer && (
          <div className="shadow-sm rounded-lg" style={{ background: "var(--surface)" }}>
            <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--primary)" }}>
                {selectedEvent.name}
              </h2>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {selectedEvent.location} • {formatEventDate(selectedEvent.start_date)} - {formatEventDate(selectedEvent.end_date)}
              </p>
            </div>

              {/* Category Filters */}
              {availableCategories.length > 0 && (
                <>
                  {/* Mobile Dropdown */}
                  <div className="p-4 lg:hidden">
                    <CategoryDropdown
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: "var(--primary)" }}></div>
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
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedEvent && !selectedPlayer && (
          <div className="shadow-sm rounded-lg" style={{ background: "var(--surface)" }}>
            <div className="p-12 text-center">
              <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--primary)" }}>
                Select an Event
              </h2>
              <p style={{ color: "var(--muted-2)" }}>
                Choose an event from the calendar or search for a player to view archery results
              </p>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden mt-6 px-6 py-3 rounded-lg font-medium transition-opacity hover:opacity-90"
                style={{ background: "var(--primary)", color: "white" }}
              >
                Open Calendar
              </button>
            </div>
          </div>
        )}

        {/* Admin Controls */}
        {userIsAdmin && selectedEvent && (
          <div className="mt-8 pt-8 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-4">
              <p className="text-sm">
                <span className="font-semibold">Selected Event:</span> {selectedEvent?.name} ({selectedEvent?.id})
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
      </main>
    </div>
  );
}