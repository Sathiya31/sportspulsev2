"use client";
import { useEffect, useState, useRef } from "react";
import { Menu, X } from "lucide-react";
import EventCard from "@/components/ui/EventCard";
import { useSession } from "next-auth/react";
import { isAdmin } from "@/config/auth";
import { filterIndianResults } from "../../utils/badmintonIndianResults";
import { getTournamentResults } from "@/services/badmintonService";
import TournamentResults from "@/components/badminton/TournamentResults";
import TournamentActions from "@/components/badminton/TournamentActions";
import PlayerSearchBar from "@/components/badminton/PlayerSearchBar";
import BadmintonPlayerResults from "@/components/badminton/AthleteResults";
import { getBadmintonAthleteResults, type AthleteData } from "@/services/athleteService";
import { Match, Tournament } from "@/types/badminton";
import {
  getCalendarEvents,
  getAvailableYears,
  getUniqueMonths,
  filterEventsByMonth,
  isEventLive,
  formatEventDate
} from "@/services/calendarService";

export default function BadmintonPage() {
  // Player search state
  const [selectedPlayer, setSelectedPlayer] = useState<AthleteData | null>(null);
  const [playerResults, setPlayerResults] = useState<Match[]>([]);
  
  // Calendar state
  const [allEvents, setAllEvents] = useState<Tournament[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Tournament[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [month, setMonth] = useState<string>("All");
  const [months, setMonths] = useState<string[]>([]);
  
  // Tournament state
  const [selectedEvent, setSelectedEvent] = useState<Tournament | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [tournamentResults, setTournamentResults] = useState<any>({});
  const [indianResults, setIndianResults] = useState<Record<string, string[]>>({});
  const [copySuccess, setCopySuccess] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Ref for Indian results copy buttons
  const indianResultRefs = useRef<Record<string, HTMLPreElement | null>>({});

  // Initialize: Load available years
  useEffect(() => {
    async function initializeYears() {
      try {
        const years = await getAvailableYears('badminton');
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
        const events = await getCalendarEvents('badminton', selectedYear);
        setAllEvents(events as Tournament[]);
        
        // Extract unique months
        const uniqueMonths = getUniqueMonths(events);
        setMonths(uniqueMonths);
        
        // Reset month filter
        setMonth("All");
        
        // Preselect live event if present
        const liveEvent = events.find(e => isEventLive(e.start_date, e.end_date));
        if (liveEvent) {
          handleSelectEvent(liveEvent as Tournament);
        } else {
          // Clear selection when year changes
          setSelectedEvent(null);
          setTournamentResults({});
        }
      } catch (error) {
        console.error('Error loading events:', error);
        setFetchError(`No calendar found for ${selectedYear}`);
      }
    }
    
    loadEventsForYear();
  }, [selectedYear]);

  // Filter events by month
  useEffect(() => {
    const filtered = filterEventsByMonth(allEvents, month) as Tournament[];
    setFilteredEvents(filtered);
  }, [allEvents, month]);

  // Player select handler
  async function handlePlayerSelect(player: AthleteData) {
    console.log("Selected player:", player);
    setSelectedEvent(null);
    setSelectedPlayer(player);
    try {
      const results = await getBadmintonAthleteResults(player.playerId || player.name);
      setPlayerResults(results);
    } catch (err: any) {
      console.error(err);
      setPlayerResults([]);
    }
  }

  function handlePlayerClear() {
    setSelectedPlayer(null);
    setPlayerResults([]);
    setSelectedEvent(null);
  }

  // Helper to get all dates between start and end (inclusive)
  function getEventDates(start: string, end: string) {
    const dates = [];
    const d = new Date(start.slice(0, 10));
    const endDate = new Date(end.slice(0, 10));
    while (d <= endDate) {
      dates.push(d.toISOString().slice(0, 10));
      d.setDate(d.getDate() + 1);
    }
    return dates;
  }

  // Fetch Firebase results for a tournament
  async function fetchFirebaseResults(tournamentCode: string) {
    setFetching(true);
    setFetchError("");
    try {
      const results = await getTournamentResults(tournamentCode);
      setTournamentResults(results);
    } catch (err: any) {
      console.error(err);
      setFetchError(err.message || "Failed to fetch tournament results");
    } finally {
      setFetching(false);
    }
  }

  // Fetch BWF results for a specific date
  async function fetchBWFResults() {
    if (!selectedEvent || !selectedDate) return;

    try {
      const url = `https://extranet-lv.bwfbadminton.com/api/tournaments/day-matches?tournamentCode=${selectedEvent.code}&date=${selectedDate}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch BWF results");
      const data = await res.json();

      // Group matches by roundName first
      const roundGroups: { [round: string]: any[] } = {};
      (data || []).forEach((match: any) => {
        if (!match.roundName) return;
        if (!roundGroups[match.roundName]) roundGroups[match.roundName] = [];
        roundGroups[match.roundName].push(match);
      });

      // For each group, filter Indian results
      const grouped: { [round: string]: string[] } = {};
      Object.entries(roundGroups).forEach(([round, matches]) => {
        const results = filterIndianResults(matches as any[]);
        if (results.length > 0) grouped[round] = results;
      });
      setIndianResults(grouped);
    } catch (err: any) {
      setFetchError(err.message || "Failed to fetch BWF results");
    }
  }

  // When a tournament is clicked
  function handleSelectEvent(event: Tournament) {
    console.log('Selected event:', event);
    setSelectedEvent(event);
    setSelectedPlayer(null);
    const dates = getEventDates(event.start_date, event.end_date);
    const today = new Date().toISOString().slice(0, 10);
    setSelectedDate(dates.includes(today) ? today : dates[0]);
    setIndianResults({});
    setFetchError("");
    setIsMobileMenuOpen(false);

    // Immediately fetch Firebase results when tournament is selected
    fetchFirebaseResults(event.code);
  }

  const { data: session } = useSession();
  const userIsAdmin = isAdmin(session?.user?.email);

  const liveEvents = filteredEvents.filter(e => isEventLive(e.start_date, e.end_date));

  return (
    <div className="flex flex-col md:flex-row min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed bg-black bg-opacity-50 z-50"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Consistent Calendar Sidebar */}
      <aside className={`
        fixed md:static left-0 z-50
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
              No events found for {selectedYear}
            </p>
          ) : (
            filteredEvents.map((event: Tournament) => (
              <EventCard
                key={event.id}
                id={event.id}
                name={event.name}
                location={event.location}
                startDate={formatEventDate(event.start_date)}
                endDate={formatEventDate(event.end_date)}
                logo={event.logo}
                accentColor={selectedEvent?.id === event.id ? "var(--primary)" : "var(--muted-2)"}
                isLive={isEventLive(event.start_date, event.end_date)}
                onClick={() => handleSelectEvent(event)}
                className={selectedEvent?.id === event.id ? "ring-2" : ""}
              />
            ))
          )}
        </div>
      </aside>

      {/* Right panel: event details and results */}
      <main className="flex-1 p-4 md:p-8" style={{ background: "var(--background)" }}>
        <div className="mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
            <div className="flex items-center justify-between w-full md:w-auto">
              <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                Badminton
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
                sport="badminton"
                onSelect={handlePlayerSelect}
                onClear={handlePlayerClear}
              />
            </div>
          </div>
        </div>

        {/* Compact Live Events Badges */}
        {liveEvents.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--warning)" }}></span>
              <span className="font-semibold text-sm" style={{ color: "var(--warning)" }}>Live : </span>
              {liveEvents.map((ev, idx) => (
                <button
                  key={`${ev.id}_${idx}`}
                  onClick={() => handleSelectEvent(ev)}
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

        <div>
          <div className="mb-8">
            {fetchError && <div className="mb-4" style={{ color: "var(--danger)" }}>{fetchError}</div>}
            {selectedEvent ? (
              <>
                <div className="mb-2 text-lg font-semibold" style={{ color: "var(--primary)" }}>
                  {selectedEvent.name}
                </div>
                <div className="mb-2 text-xs" style={{ color: "var(--muted)" }}>
                  {formatEventDate(selectedEvent.start_date)} to {formatEventDate(selectedEvent.end_date)}
                </div>
                <TournamentResults results={tournamentResults} isLoading={fetching} />
              </>
            ) : (
              <p style={{ color: "var(--muted-2)" }}>
                Select an event from the calendar or search a player to see results.
              </p>
            )}
          </div>

          {selectedPlayer && (
            <BadmintonPlayerResults
              player={selectedPlayer}
              matches={playerResults}
              onBack={handlePlayerClear}
            />
          )}

          {/* Indian Players Section - Only visible to admin */}
          {userIsAdmin && selectedEvent && (
            <div className="mt-8 border-t pt-8" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--primary)" }}>
                Indian Players Results
              </h2>
              <TournamentActions
                tournament={selectedEvent}
                onFetchDaily={fetchBWFResults}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                isLoading={fetching}
              />
              {Object.keys(indianResults).length > 0 && (
                <div className="space-y-4 mt-4">
                  {Object.entries(indianResults).map(([round, results]) => {
                    if (!Array.isArray(results) || results.length === 0) return null;
                    const sortedResults = [...results].sort((a, b) => {
                      const isWin = (s: string) => /\bwin\b|\bdef\b|\bdefeated\b|\bbeat\b|\bwon\b/i.test(s);
                      const aWin = isWin(a);
                      const bWin = isWin(b);
                      if (aWin === bWin) return 0;
                      return aWin ? -1 : 1;
                    });
                    return (
                      <div key={round} className="border rounded-lg p-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold" style={{ color: "var(--primary)" }}>{round}</span>
                          <button
                            className="px-2 py-1 rounded text-xs"
                            style={{ background: "var(--primary)", color: "var(--surface)" }}
                            onClick={() => {
                              const preEl = indianResultRefs.current[round];
                              if (preEl) {
                                navigator.clipboard.writeText(preEl.innerText);
                                setCopySuccess(`Copied ${round}!`);
                                setTimeout(() => setCopySuccess(""), 1500);
                              }
                            }}
                          >
                            Copy
                          </button>
                          {copySuccess === `Copied ${round}!` && (
                            <span className="text-xs" style={{ color: "var(--success)" }}>Copied!</span>
                          )}
                        </div>
                        <pre 
                          ref={el => { indianResultRefs.current[round] = el; }} 
                          className="text-xs rounded p-2 max-h-48 overflow-auto select-all cursor-pointer whitespace-pre-wrap" 
                          style={{ background: "var(--glass)", color: "var(--muted)" }}
                        >
                          {sortedResults.join('\n')}
                        </pre>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}