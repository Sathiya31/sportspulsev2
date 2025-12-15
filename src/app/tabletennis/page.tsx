"use client";
import CompetitionResults from "@/components/tabletennis/CompetitionResults";
import { useEffect, useState } from "react";
import EventCard from "@/components/ui/EventCard";
import Button from "@/components/ui/Button";
import { useSession } from "next-auth/react";
import { isAdmin } from "@/config/auth";
import PlayerSearchBar from "@/components/badminton/PlayerSearchBar";
import TableTennisPlayerResults from "@/components/tabletennis/AthleteResults";
import { getTableTennisAthleteResults } from "@/services/athleteService";

function isLive(start: string, end: string) {
  const now = new Date();
  const startDate = new Date(start);
  const endDate = new Date(end);
  return now >= startDate && now <= endDate;
}


export default function TableTennisPage() {
  // Player search and results state
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [playerResults, setPlayerResults] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [month, setMonth] = useState<string>("All");
  const [months, setMonths] = useState<string[]>([]);
  const [category, setCategory] = useState<string>("All");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showExtractor, setShowExtractor] = useState(false);
  // ...existing code...

  const handleCalendarClick = (event: any) => {
    console.log("clicked event", event);
    setSelectedEvent(event);
    setSelectedPlayer(null);
    setIsMobileMenuOpen(false); // Close mobile menu after selection
  };

  
  async function handlePlayerSelect(player: any) {
    console.log("Selected player:", player);
    setSelectedPlayer(player);
    setSelectedEvent(null);
    setPlayerResults(player.results || []);
    try {
          // Use flexible results fetcher for badminton
          const playerId = player.playerId.replace("TT",""); // Remove TT prefix if present
          const results = await getTableTennisAthleteResults(playerId || player.name);
          console.log("Fetched player results:", playerId, results);
          console.log(JSON.stringify(results, null, 2));
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

  function handleLoadData() {
    fetch("/api/tabletennis-extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ event_id: selectedEvent?.EventId })
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  useEffect(() => {
    async function fetchCalendar() {
      const res = await fetch("/data/calendars/tabletennis_2025.json");
      const data = await res.json();
      // sort by StartDateTime
      data.sort((a: any, b: any) => new Date(a.StartDateTime).getTime() - new Date(b.StartDateTime).getTime());
      const rows = data || [];
      setEvents(rows);
      // Extract unique months
      const monthSet = new Set<string>();
      const catSet = new Set<string>();
      rows.forEach((ev: any) => {
        const m = new Date(ev.StartDateTime).toLocaleString('default', { month: 'long' });
        monthSet.add(m);
        if (ev.Event_Tier_Name) catSet.add(ev.Event_Tier_Name);
      });
      setMonths(["All", ...Array.from(monthSet)]);
      setCategories(["All", ...Array.from(catSet)]);
    }
    fetchCalendar();
  }, []);

  // Filter events by month and category
  const filtered = events.filter(ev => {
    const eventMonth = new Date(ev.StartDateTime).toLocaleString('default', { month: 'long' });
    const monthMatch = month === "All" || eventMonth === month;
    const catMatch = category === "All" || ev.Event_Tier_Name === category;
    return monthMatch && catMatch;
  });

  // Find all live events
  const liveEvents = events.filter(ev => isLive(ev.StartDateTime, ev.EndDateTime));

  const { data: session } = useSession();
  const userIsAdmin = isAdmin(session?.user?.email);

  return (
    <div className="flex flex-col md:flex-row min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Consistent Calendar Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-80 md:w-96
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        bg-[var(--surface)] border-r border-[var(--border)] p-4 overflow-y-auto
      `}>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1" style={{ color: "var(--muted)" }}>Filter by Month</label>
          <select
            className="w-full p-2 rounded mb-2 bg-[var(--background)] border border-[var(--muted-2)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            style={{ color: "var(--foreground)" }}
            value={month}
            onChange={e => setMonth(e.target.value)}
          >
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <label className="block text-sm font-semibold mb-1" style={{ color: "var(--muted)" }}>Filter by Category</label>
          <select
            className="w-full p-2 rounded bg-[var(--background)] border border-[var(--muted-2)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            style={{ color: "var(--foreground)" }}
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="space-y-4">
          {filtered.map((event: any, idx: number) => {
            const key = event.EventId ? `${event.EventId}_${idx}` : `event_${idx}`;
            return (
              <EventCard
                key={key}
                id={event.EventId}
                name={event.EventName}
                location={`${event.City}, ${event.Country}`}
                startDate={event.StartDateTime}
                endDate={event.EndDateTime}
                accentColor={selectedEvent?.EventId === event.EventId ? "var(--primary)" : "var(--muted-2)"}
                isLive={isLive(event.StartDateTime, event.EndDateTime)}
                onClick={() => handleCalendarClick(event)}
                className={selectedEvent?.EventId === event.EventId ? "ring-2" : ""}
              />
            );
          })}
        </div>
      </aside>

      {/* Consistent Main Layout */}
      <main className="flex-1 p-4 md:p-8 flex flex-col gap-3 md:gap-4" style={{ background: "var(--background)" }}>
        {/* Mobile menu button */}
        <button
          className="md:hidden fixed top-20 right-4 z-50 p-2 rounded-lg shadow-lg"
          style={{ background: "var(--surface)", color: "var(--foreground)" }}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <div className="mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
              Table Tennis
            </h1>
            <div className="w-full md:w-auto md:max-w-xs">
              <PlayerSearchBar
                sport="Table Tennis"
                onSelect={handlePlayerSelect}
                onClear={handlePlayerClear}
              />
            </div>
          </div>
        </div>
        {/* Compact Live Events Badges */}
        {liveEvents.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--warning)" }}></span>
              <span className="font-semibold text-sm" style={{ color: "var(--warning)" }}>Live : </span>
            {/* </div>
            <div className="flex flex-wrap gap-2"> */}
              {liveEvents.map((ev, idx) => {
                const key = ev.EventId ? `${ev.EventId}_${idx}` : `live_${idx}`;
                return (
                  <button
                    key={key}
                    onClick={() => handleCalendarClick(ev)}
                    className="px-3 py-1.5 rounded-full text-xs hover:opacity-80 transition-opacity"
                    style={{ 
                      background: "var(--glass)",
                      color: "var(--foreground)",
                      border: `1px solid var(--muted-2)`
                    }}
                  >
                    {ev.EventName}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Player Search Bar and Results */}
        {selectedPlayer && (
            // <PlayerTournamentResults
            //   player={selectedPlayer}
            //   results={playerResults}
            //   calendarEvents={events}
            // />
          <TableTennisPlayerResults
            player={selectedPlayer}
            matches={playerResults}
            calendarEvents={events} />
            )}

        {/* Display selected event Results or Empty State */}
        <div>
          {selectedEvent ? (
            <CompetitionResults {...selectedEvent} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg 
                className="w-16 h-16 mb-4" 
                style={{ color: "var(--muted-2)" }} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              <p className="text-lg font-medium mb-2" style={{ color: "var(--muted)" }}>
                No Event Selected
              </p>
              <p className="text-sm" style={{ color: "var(--muted-2)" }}>
                Select an event from the calendar to view results
              </p>
            </div>
          )}
        </div>

        {/* Collapsible Extractor for Admins */}
        {userIsAdmin && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--muted-2)" }}>
            <button 
              onClick={() => setShowExtractor(!showExtractor)}
              className="flex items-center gap-2 text-lg font-semibold mb-3 hover:opacity-80 transition-opacity"
              style={{ color: "var(--primary)" }}
            >
              <svg 
                className={`w-5 h-5 transition-transform ${showExtractor ? 'rotate-90' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Indian Results Extractor
            </button>
            
            {showExtractor && (
              <div className="flex p-2 space-y-4">
                <p className="bold">
                  <label className="text-sm font-semibold">Selected Event:</label> {selectedEvent?.EventName} ({selectedEvent?.EventId})</p>
                <Button
                  variant="primary"
                  onClick={handleLoadData}
                  disabled={!selectedEvent}
                  className="text-xs px-3 py-1 rounded transition-colors"
                  >
                    Load Data
                  </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}