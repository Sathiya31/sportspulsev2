"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown, ChevronUp } from 'lucide-react';
import EventCard from "@/components/ui/EventCard";
import ShootingResults from "../../components/shooting/results";
import ShootingExtractor from '../../components/shooting/ShootingExtractor';
import { useSession } from 'next-auth/react';
import { isAdmin } from "@/config/auth";
import { ShootingEvent } from "@/shootingCalendar";
import PlayerSearchBar from "@/components/badminton/PlayerSearchBar";
import { getShootingAthleteResults } from "@/services/athleteService";
import AthleteResultsDisplay from "@/components/shooting/AthleteResults";

// Utility to check if an event is live

function isLive(startDate: string, endDate: string) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now <= end;
}

// Mobile Calendar Overlay Component
const MobileCalendarOverlay = ({ 
  isOpen, 
  onClose, 
  events, 
  selectedCompetition, 
  onEventSelect,
  filter,
  setFilter
}: {
  isOpen: boolean;
  onClose: () => void;
  events: ShootingEvent[];
  selectedCompetition: ShootingEvent | null;
  onEventSelect: (event: ShootingEvent) => void;
  filter: string;
  setFilter: (filter: string) => void;
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

  const filteredEvents = events.filter((item: ShootingEvent) =>
    item.event_name.toLowerCase().includes(filter.toLowerCase()) ||
    item.location.toLowerCase().includes(filter.toLowerCase()) ||
    item.start_date.includes(filter) ||
    item.end_date.includes(filter)
  );

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
            2025 Calendar
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:opacity-70 transition-opacity"
            style={{ color: "var(--foreground)" }}
            aria-label="Close calendar"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search/Filter */}
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="relative">
            <input
              type="text"
              className="w-full p-3 pl-10 rounded-xl border transition-all duration-300"
              style={{ background: "var(--glass)", borderColor: "var(--border)", color: "var(--foreground)" }}
              placeholder="Filter events..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
            <svg className="absolute left-3 top-3.5 w-5 h-5" style={{ color: "var(--muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Events List */}
        <div className="overflow-y-auto p-4" style={{ height: 'calc(100vh - 145px)' }}>
          {filteredEvents.length === 0 ? (
            <p className="text-center py-8" style={{ color: "var(--muted-2)" }}>No events found</p>
          ) : (
            <div className="space-y-2">
              {filteredEvents.map((item: ShootingEvent, idx: number) => (
                <EventCard
                  key={item.competition_code || idx}
                  id={item.competition_code || idx}
                  name={item.event_name}
                  location={item.location}
                  startDate={item.start_date}
                  endDate={item.end_date}
                  accentColor={selectedCompetition?.competition_code === item.competition_code ? "var(--primary)" : "var(--muted-2)"}
                  isLive={isLive(item.start_date, item.end_date)}
                  onClick={() => {
                    onEventSelect(item);
                    onClose(); // Auto-close after selection
                  }}
                  className={selectedCompetition?.competition_code === item.competition_code ? "ring-2" : ""}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Mobile Live Events Dropdown Component
const MobileLiveEventsDropdown = ({ 
  liveEvents,
  onEventSelect
}: {
  liveEvents: ShootingEvent[];
  onEventSelect: (event: ShootingEvent) => void;
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

  if (liveEvents.length === 0) return null;

  return (
    <div className="relative lg:hidden mb-4" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-lg flex items-center justify-between transition-colors"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--accent)"
        }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent)" }}></span>
          <span className="font-medium">Live Events ({liveEvents.length})</span>
        </div>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 rounded-lg shadow-lg z-30 max-h-80 overflow-y-auto"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          {liveEvents.map((event, idx) => (
            <button
              key={event.competition_code || idx}
              onClick={() => {
                onEventSelect(event);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:opacity-80 transition-opacity border-b last:border-b-0"
              style={{
                color: "var(--foreground)",
                borderColor: "var(--border)"
              }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: "var(--accent)" }}></span>
                <div>
                  <div className="font-medium">{event.event_name}</div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>{event.location}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function ShootingPage() {
  const [filter, setFilter] = useState("");
  const [events, setEvents] = useState<ShootingEvent[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<ShootingEvent | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [playerResults, setPlayerResults] = useState<any[]>([]);

  const { data: session } = useSession(); 
  const userIsAdmin = isAdmin(session?.user?.email);

  useEffect(() => {
    fetch("/data/calendars/shooting_2025.json")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch(() => setEvents([]));
  }, []);

  function handleCardClick(item: ShootingEvent) {
    setSelectedCompetition(item || null);
  }

  // Find live events
  const liveEvents = events.filter(event => isLive(event.start_date, event.end_date));

  // Filtered events for sidebar
  const filteredEvents = events.filter((item: ShootingEvent) =>
    item.event_name.toLowerCase().includes(filter.toLowerCase()) ||
    item.location.toLowerCase().includes(filter.toLowerCase()) ||
    item.start_date.includes(filter) ||
    item.end_date.includes(filter)
  );

  async function handlePlayerSelect(player: any) {
    console.log("Selected player:", player);
    setSelectedPlayer(player);
    try {
      const playerId = player.playerId
      const results = await getShootingAthleteResults(playerId);
      console.log("Fetched player results:", playerId, results);
      // console.log(JSON.stringify(results));
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
          <div className="shadow-sm p-4 overflow-y-auto">
            <h2 className="text-xl font-bold my-3" style={{ color: "var(--primary)" }}>
              2025 Calendar
            </h2>
            <div className="mb-2">
              <div className="relative">
                <input
                  type="text"
                  className="w-full p-3 pl-10 rounded-xl border transition-all duration-300"
                  style={{ background: "var(--glass)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  placeholder="Filter events..."
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                />
                <svg className="absolute left-3 top-3.5 w-5 h-5" style={{ color: "var(--muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="grid gap-1">
              {filteredEvents.map((item: ShootingEvent, idx: number) => (
                <EventCard
                  key={item.competition_code || idx}
                  id={item.competition_code || idx}
                  name={item.event_name}
                  location={item.location}
                  startDate={item.start_date}
                  endDate={item.end_date}
                  accentColor={selectedCompetition?.competition_code === item.competition_code ? "var(--primary)" : "var(--muted-2)"}
                  isLive={isLive(item.start_date, item.end_date)}
                  onClick={() => handleCardClick(item)}
                  className={selectedCompetition?.competition_code === item.competition_code ? "ring-2" : ""}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Calendar Overlay */}
        <MobileCalendarOverlay
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          events={events}
          selectedCompetition={selectedCompetition}
          onEventSelect={handleCardClick}
          filter={filter}
          setFilter={setFilter}
        />

        {/* Main Content */}
        <div className="p-4 md:p-8 lg:col-span-2">
          {/* Header with Mobile Menu Toggle */}
          <div className="mb-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-3">
              <div className="flex items-center justify-between gap-2">
                <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                  Shooting
                </h1>
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden p-2 hover:opacity-70 transition-opacity"
                  style={{ color: "var(--primary)" }}
                  aria-label="Open calendar menu"
                >
                  <Menu size={28} />
                </button>
              </div>
              <div className="w-full max-w-xs mt-2 md:mt-0">
                <PlayerSearchBar
                  sport="Shooting"
                  onSelect={handlePlayerSelect}
                  onClear={handlePlayerClear}
                />
              </div>
            </div>
          </div>
          
          {/* Mobile Live Events Dropdown */}
          <MobileLiveEventsDropdown
            liveEvents={liveEvents}
            onEventSelect={handleCardClick}
          />

          {/* Desktop Live Events Chips */}
          {liveEvents.length > 0 && (
            <div className="hidden lg:block mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent)" }}></span>
                <span className="font-semibold text-lg" style={{ color: "var(--accent)" }}>Live Events</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {liveEvents.map((event, idx) => (
                  <button
                    key={event.competition_code || idx}
                    onClick={() => handleCardClick(event)}
                    className="px-3 py-1 rounded-full text-sm transition-opacity hover:opacity-80"
                    style={{ background: "var(--accent)", color: "white" }}
                  >
                    {event.event_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results Section */}
          <div>
            {selectedCompetition ? (
              <ShootingResults selectedCompetition={selectedCompetition} />
            ) : 
              (selectedPlayer && playerResults) ? (
                <div>
                  <AthleteResultsDisplay
                    athlete={selectedPlayer}
                    results={playerResults}
                    onBack={() => handlePlayerClear()} />
                </div>
              ) :
            (
              <div className="shadow-sm" style={{ background: "var(--surface)" }}>
                <div className="p-12 text-center">
                  <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--primary)" }}>
                    Select an Event
                  </h2>
                  <p style={{ color: "var(--muted-2)" }}>
                    Choose an event from the calendar to view results
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
          </div>

          {/* Extractor for admins only */}
          {userIsAdmin && (
            <div className="mt-8 pt-8 border-t" style={{ borderColor: "var(--muted-2)" }}>
              <ShootingExtractor selectedCompetition={selectedCompetition?.competition_code}/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}