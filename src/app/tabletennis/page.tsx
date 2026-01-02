"use client";
import Head from "next/head";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import EventCard from "@/components/ui/EventCard";
import Button from "@/components/ui/Button";
import { useSession } from "next-auth/react";
import { isAdmin } from "@/config/auth";
import PlayerSearchBar from "@/components/badminton/PlayerSearchBar";
import TableTennisPlayerResults from "@/components/tabletennis/AthleteResults";
import CompetitionResults from "@/components/tabletennis/CompetitionResults";
import { getTableTennisAthleteResults } from "@/services/athleteService";
import {
  getCalendarEvents,
  getAvailableYears,
  getUniqueMonths,
  filterEventsByMonth,
  isEventLive,
  formatEventDate,
  type CalendarEvent
} from "@/services/calendarService";

// SEO metadata
const pageTitle = "Table Tennis Results & News | Sports Pulse";
const pageDescription = "Latest Indian Table Tennis results, tournament schedules, athlete stats, and news. Follow live updates and in-depth coverage on Sports Pulse.";

// Table Tennis specific event interface
interface TableTennisEvent extends CalendarEvent {
  EventId: string;
  EventName: string;
  City: string;
  Country: string;
  StartDateTime: string;
  EndDateTime: string;
  Event_Tier_Name?: string;
}

export default function TableTennisPage() {
  // Player search state
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [playerResults, setPlayerResults] = useState<any[]>([]);
  
  // Calendar state
  const [allEvents, setAllEvents] = useState<TableTennisEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<TableTennisEvent[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [month, setMonth] = useState<string>("All");
  const [months, setMonths] = useState<string[]>([]);
  // const [category, setCategory] = useState<string>("All");
  // const [categories, setCategories] = useState<string[]>([]);
  
  // Event state
  const [selectedEvent, setSelectedEvent] = useState<TableTennisEvent | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showExtractor, setShowExtractor] = useState(false);

  const { data: session } = useSession();
  const userIsAdmin = isAdmin(session?.user?.email);

  // Initialize: Load available years
  useEffect(() => {
    async function initializeYears() {
      try {
        const years = await getAvailableYears('tabletennis');
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
        const events = await getCalendarEvents('tabletennis', selectedYear);
        
        // Sort by StartDateTime
        const sortedEvents = (events as TableTennisEvent[]).sort((a, b) => 
          new Date(a.StartDateTime || a.start_date).getTime() - 
          new Date(b.StartDateTime || b.start_date).getTime()
        );
        
        setAllEvents(sortedEvents);
        
        // Extract unique months
        const uniqueMonths = getUniqueMonths(sortedEvents);
        setMonths(uniqueMonths);
        
        // Extract unique categories
        const catSet = new Set<string>();
        sortedEvents.forEach((ev) => {
          if (ev.Event_Tier_Name) catSet.add(ev.Event_Tier_Name);
        });
        // setCategories(["All", ...Array.from(catSet)]);
        
        // Reset filters
        setMonth("All");
        // setCategory("All");
        
        // Clear selection when year changes
        setSelectedEvent(null);
      } catch (error) {
        console.error('Error loading events:', error);
      }
    }
    
    loadEventsForYear();
  }, [selectedYear]);

  // Filter events by month and category
  useEffect(() => {
    let filtered = allEvents;
    
    // Filter by month
    if (month !== "All") {
      filtered = filterEventsByMonth(filtered, month) as TableTennisEvent[];
    }
    
    // Filter by category
    // if (category !== "All") {
    //   filtered = filtered.filter(ev => ev.Event_Tier_Name === category);
    // }
    
    setFilteredEvents(filtered);
  }, [allEvents, month]);

  // Player select handler
  async function handlePlayerSelect(player: any) {
    console.log("Selected player:", player);
    setSelectedPlayer(player);
    setSelectedEvent(null);
    try {
      const playerId = player.playerId?.replace("TT", "") || player.playerId;
      const results = await getTableTennisAthleteResults(playerId || player.name);
      console.log("Fetched player results:", playerId, results);
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

  // Event selection handler
  function handleCalendarClick(event: TableTennisEvent) {
    console.log("clicked event", event);
    setSelectedEvent(event);
    setSelectedPlayer(null);
    setPlayerResults([]);
    setIsMobileMenuOpen(false);
  }

  // Admin data loader
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

  const liveEvents = filteredEvents.filter(ev => 
    isEventLive(ev.StartDateTime || ev.start_date, ev.EndDateTime || ev.end_date)
  );

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content="https://sportzpulse.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://sportzpulse.com/tabletennis" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "${pageTitle}",
              "description": "${pageDescription}",
              "url": "https://sportzpulse.com/tabletennis"
            }
          `}
        </script>
      </Head>
      
      <div className="flex flex-col md:flex-row min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden fixed bg-black bg-opacity-50 z-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
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
              className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
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
              className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              style={{ color: "var(--foreground)" }}
              value={month}
              onChange={e => setMonth(e.target.value)}
            >
              {months.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          {/* <div className="mb-4">
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--muted)" }}>
              Filter by Category
            </label>
            <select
              className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              style={{ color: "var(--foreground)" }}
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div> */}

          {/* Events List */}
          <div className="space-y-3">
            {filteredEvents.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: "var(--muted-2)" }}>
                No events found for {selectedYear} {month !== "All" ? `in ${month}` : ""}.
              </p>
            ) : (
              filteredEvents.map((event, idx) => {
                const key = event.EventId ? `${event.EventId}_${idx}` : `event_${idx}`;
                return (
                  <EventCard
                    key={key}
                    id={event.EventId || event.id}
                    name={event.EventName || event.name}
                    location={[event.City, event.Country].filter(Boolean).join(', ')}
                    startDate={formatEventDate(event.StartDateTime || event.start_date)}
                    endDate={formatEventDate(event.EndDateTime || event.end_date)}
                    accentColor={selectedEvent?.EventId === event.EventId ? "var(--primary)" : "var(--muted-2)"}
                    isLive={isEventLive(event.StartDateTime || event.start_date, event.EndDateTime || event.end_date)}
                    onClick={() => handleCalendarClick(event)}
                    className={selectedEvent?.EventId === event.EventId ? "ring-2" : ""}
                  />
                );
              })
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8" style={{ background: "var(--background)" }}>
          <div className="mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
              <div className="flex items-center justify-between w-full md:w-auto">
                <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                  Table Tennis
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
                  sport="Table Tennis"
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
                      {ev.EventName || ev.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Player Results */}
          {selectedPlayer && (
            <TableTennisPlayerResults
              player={selectedPlayer}
              matches={playerResults}
              calendarEvents={allEvents}
              onBack={handlePlayerClear}
            />
          )}

          {/* Event Results */}
          {selectedEvent && !selectedPlayer && (
            <CompetitionResults {...selectedEvent} />
          )}

          {/* Empty State */}
          {!selectedEvent && !selectedPlayer && (
            <div className="shadow-sm rounded-lg" style={{ background: "var(--surface)" }}>
              <div className="p-12 text-center">
                <svg 
                  className="w-16 h-16 mb-4 mx-auto" 
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
                <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--primary)" }}>
                  Select an Event
                </h2>
                <p style={{ color: "var(--muted-2)" }}>
                  Choose an event from the calendar or search for a player to view table tennis results
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

          {/* Admin Controls - Collapsible */}
          {userIsAdmin && selectedEvent && (
            <div className="mt-8 pt-8 border-t" style={{ borderColor: "var(--border)" }}>
              <button 
                onClick={() => setShowExtractor(!showExtractor)}
                className="flex items-center gap-2 text-base font-semibold mb-3 hover:opacity-80 transition-opacity"
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
                <div className="flex items-center gap-4">
                  <p className="text-sm">
                    <span className="font-semibold">Selected Event:</span> {selectedEvent?.EventName} ({selectedEvent?.EventId})
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleLoadData}
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
    </>
  );
}