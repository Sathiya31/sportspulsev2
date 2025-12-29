"use client";

import { useState, useEffect } from "react";
import { Menu, X } from 'lucide-react';
import Head from "next/head";
import EventCard from "@/components/ui/EventCard";
import ShootingResults from "../../components/shooting/results";
import ShootingExtractor from '../../components/shooting/ShootingExtractor';
import { useSession } from 'next-auth/react';
import { isAdmin } from "@/config/auth";
import PlayerSearchBar from "@/components/badminton/PlayerSearchBar";
import { getShootingAthleteResults } from "@/services/athleteService";
import AthleteResultsDisplay from "@/components/shooting/AthleteResults";
import {
  getCalendarEvents,
  getAvailableYears,
  getUniqueMonths,
  filterEventsByMonth,
  isEventLive,
  formatEventDate,
  type CalendarEvent
} from "@/services/calendarService";

// Shooting specific event interface
export interface ShootingEvent extends CalendarEvent {
  competition_code?: string;
  event_name: string;
}

export default function ShootingPage() {
  // Player search state
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [playerResults, setPlayerResults] = useState<any[]>([]);
  
  // Calendar state
  const [allEvents, setAllEvents] = useState<ShootingEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<ShootingEvent[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [month, setMonth] = useState<string>("All");
  const [months, setMonths] = useState<string[]>([]);
  
  // Event state
  const [selectedCompetition, setSelectedCompetition] = useState<ShootingEvent | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: session } = useSession(); 
  const userIsAdmin = isAdmin(session?.user?.email);

  // Initialize: Load available years
  useEffect(() => {
    async function initializeYears() {
      try {
        const years = await getAvailableYears('shooting');
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
        const events = await getCalendarEvents('shooting', selectedYear);
        setAllEvents(events as ShootingEvent[]);
        
        // Extract unique months
        const uniqueMonths = getUniqueMonths(events);
        setMonths(uniqueMonths);
        
        // Reset month filter
        setMonth("All");
        
        // Clear selection when year changes
        setSelectedCompetition(null);
      } catch (error) {
        console.error('Error loading events:', error);
      }
    }
    
    loadEventsForYear();
  }, [selectedYear]);

  // Filter events by month
  useEffect(() => {
    const filtered = filterEventsByMonth(allEvents, month) as ShootingEvent[];
    setFilteredEvents(filtered);
  }, [allEvents, month]);

  // Player select handler
  async function handlePlayerSelect(player: any) {
    console.log("Selected player:", player);
    setSelectedPlayer(player);
    setSelectedCompetition(null);
    try {
      const playerId = player.playerId;
      const results = await getShootingAthleteResults(playerId);
      console.log("Fetched player results:", playerId, results);
      setPlayerResults(results);
    } catch (err: any) {
      console.error(err);
      setPlayerResults([]);
    }
  }
  
  function handlePlayerClear() {
    setSelectedCompetition(null);
    setSelectedPlayer(null);
    setPlayerResults([]);
  }

  // Event selection handler
  function handleCardClick(item: ShootingEvent) {
    console.log("Selected competition:", item);
    setSelectedCompetition(item);
    setSelectedPlayer(null);
    setPlayerResults([]);
    setIsMobileMenuOpen(false);
  }

  const liveEvents = filteredEvents.filter(event => 
    isEventLive(event.start_date, event.end_date)
  );

  return (
    <>
      <Head>
        <title>Shooting Results & News | Sports Pulse</title>
        <meta name="description" content="Latest Indian Shooting results, tournament schedules, athlete stats, and news. Follow live updates and in-depth coverage on Sports Pulse." />
        <meta property="og:title" content="Shooting Results & News | Sports Pulse" />
        <meta property="og:description" content="Latest Indian Shooting results, tournament schedules, athlete stats, and news. Follow live updates and in-depth coverage on Sports Pulse." />
        <meta property="og:image" content="https://sportzpulse.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://sportzpulse.com/shooting" />
        <script type="application/ld+json">
          {`
            {"@context": "https://schema.org","@type": "WebPage","name": "Shooting Results & News | Sports Pulse","description": "Latest Indian Shooting results, tournament schedules, athlete stats, and news. Follow live updates and in-depth coverage on Sports Pulse.","url": "https://sportzpulse.com/shooting"}
          `}
        </script>
      </Head>

      <div className="flex flex-col md:flex-row min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Consistent Calendar Sidebar */}
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

          {/* Events List */}
          <div className="space-y-3">
            {filteredEvents.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: "var(--muted-2)" }}>
                No events found for {selectedYear}
              </p>
            ) : (
              filteredEvents.map((item, idx) => (
                <EventCard
                  key={item.competition_code || idx}
                  id={item.competition_code || idx}
                  name={item.event_name}
                  location={item.location}
                  startDate={formatEventDate(item.start_date)}
                  endDate={formatEventDate(item.end_date)}
                  accentColor={selectedCompetition?.competition_code === item.competition_code ? "var(--primary)" : "var(--muted-2)"}
                  isLive={isEventLive(item.start_date, item.end_date)}
                  onClick={() => handleCardClick(item)}
                  className={selectedCompetition?.competition_code === item.competition_code ? "ring-2" : ""}
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
                  Shooting
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
                  sport="Shooting"
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
                {liveEvents.map((event, idx) => (
                  <button
                    key={event.competition_code || idx}
                    onClick={() => handleCardClick(event)}
                    className="px-3 py-1.5 rounded-full text-xs hover:opacity-80 transition-opacity"
                    style={{ 
                      background: "var(--glass)",
                      color: "var(--foreground)",
                      border: `1px solid var(--muted-2)`
                    }}
                  >
                    {event.event_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Player Results */}
          {selectedPlayer && playerResults && (
            <AthleteResultsDisplay
              athlete={selectedPlayer}
              results={playerResults}
              onBack={handlePlayerClear}
            />
          )}

          {/* Event Results */}
          {selectedCompetition && !selectedPlayer && (
            <ShootingResults selectedCompetition={selectedCompetition} />
          )}

          {/* Empty State */}
          {!selectedCompetition && !selectedPlayer && (
            <div className="shadow-sm rounded-lg" style={{ background: "var(--surface)" }}>
              <div className="p-12 text-center">
                <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--primary)" }}>
                  Select an Event
                </h2>
                <p style={{ color: "var(--muted-2)" }}>
                  Choose an event from the calendar or search for a player to view shooting results
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

          {/* Admin Controls - Extractor */}
          {userIsAdmin && selectedCompetition && (
            <div className="mt-8 pt-8 border-t" style={{ borderColor: "var(--border)" }}>
              <ShootingExtractor selectedCompetition={selectedCompetition.competition_code} />
            </div>
          )}
        </main>
      </div>
    </>
  );
}